'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { Map, Marker, Popup } from 'react-map-gl/mapbox'
import { Farm, SensorReading, WeatherData, OperationalData, ElectricalComponent, MaintenanceRecord, EnergyConsumptionData, FuelConsumptionData, GeneratorOperationalStatus, supabase } from '../lib/supabase'

interface InteractiveMapProps {
  farms: Farm[]
  sensorData: SensorReading[]
  weatherData: WeatherData[]
  operationalData: OperationalData[]
  onFarmHover: (farmId: string | null) => void
  hoveredFarm: string | null
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  farms,
  sensorData,
  weatherData,
  operationalData,
  onFarmHover,
  hoveredFarm
}) => {
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null)
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceRecord[]>([])
  const [electricalComponents, setElectricalComponents] = useState<ElectricalComponent[]>([])
  const [energyData, setEnergyData] = useState<EnergyConsumptionData[]>([])
  const [fuelData, setFuelData] = useState<FuelConsumptionData[]>([])
  const [generatorStatus, setGeneratorStatus] = useState<GeneratorOperationalStatus[]>([])

  // Fetch maintenance and electrical data
  useEffect(() => {
    const fetchMaintenanceData = async () => {
      try {
        // Fetch electrical components (generators)
        const { data: components, error: componentsError } = await supabase
          .from('electrical_components')
          .select('*')
          .eq('component_type', 'generator')
        
        if (componentsError) {
          console.error('Error fetching electrical components:', componentsError)
          return
        }
        
        setElectricalComponents(components || [])
        
        // Fetch maintenance records for these components
        if (components && components.length > 0) {
          const componentIds = components.map(c => c.id)
          
          // Fetch maintenance records
          const { data: maintenance, error: maintenanceError } = await supabase
            .from('maintenance_records')
            .select('*')
            .in('component_id', componentIds)
            .order('maintenance_date', { ascending: false })
          
          if (maintenanceError) {
            console.error('Error fetching maintenance records:', maintenanceError)
          } else {
            setMaintenanceData(maintenance || [])
          }
          
          // Fetch latest energy consumption data
          const { data: energy, error: energyError } = await supabase
            .from('energy_consumption_data')
            .select('*')
            .in('component_id', componentIds)
            .order('timestamp', { ascending: false })
            .limit(componentIds.length)
          
          if (energyError) {
            console.error('Error fetching energy data:', energyError)
          } else {
            setEnergyData(energy || [])
          }
          
          // Fetch latest fuel consumption data
          const { data: fuel, error: fuelError } = await supabase
            .from('fuel_consumption_data')
            .select('*')
            .in('component_id', componentIds)
            .order('timestamp', { ascending: false })
            .limit(componentIds.length)
          
          if (fuelError) {
            console.error('Error fetching fuel data:', fuelError)
          } else {
            setFuelData(fuel || [])
          }
          
          // Fetch latest generator operational status
          const { data: status, error: statusError } = await supabase
            .from('generator_operational_status')
            .select('*')
            .in('component_id', componentIds)
            .order('timestamp', { ascending: false })
            .limit(componentIds.length)
          
          if (statusError) {
            console.error('Error fetching generator status:', statusError)
          } else {
            setGeneratorStatus(status || [])
          }
        }
      } catch (error) {
        console.error('Error in fetchMaintenanceData:', error)
      }
    }
    
    fetchMaintenanceData()
    
    // Set up periodic refresh for real-time data
    const interval = setInterval(fetchMaintenanceData, 30000) // Refresh every 30 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  // Calculate center and zoom based on farms
  const mapCenter = useMemo(() => {
    if (farms.length === 0) return { longitude: -74.006, latitude: 40.7128, zoom: 10 }
    
    const avgLat = farms.reduce((sum, farm) => sum + farm.latitude, 0) / farms.length
    const avgLng = farms.reduce((sum, farm) => sum + farm.longitude, 0) / farms.length
    
    // Calculate zoom based on the spread of farms
    const latitudes = farms.map(farm => farm.latitude)
    const longitudes = farms.map(farm => farm.longitude)
    const latSpread = Math.max(...latitudes) - Math.min(...latitudes)
    const lngSpread = Math.max(...longitudes) - Math.min(...longitudes)
    const maxSpread = Math.max(latSpread, lngSpread)
    
    // Adjust zoom based on spread - closer zoom for tighter clusters
    let zoom = 13
    if (maxSpread < 0.01) zoom = 15      // Very close farms
    else if (maxSpread < 0.05) zoom = 13  // Close farms
    else if (maxSpread < 0.1) zoom = 11   // Medium spread
    else if (maxSpread < 0.5) zoom = 9    // Wide spread
    else zoom = 7                         // Very wide spread
    
    return {
      longitude: avgLng,
      latitude: avgLat,
      zoom: zoom
    }
  }, [farms])

  const [viewState, setViewState] = useState(mapCenter)

  // Update viewState when mapCenter changes (when farms data loads)
  useEffect(() => {
    setViewState(mapCenter)
  }, [mapCenter])

  // Get farm health status
  const getFarmHealth = useCallback((farm: Farm) => {
    const latestSensor = sensorData
      .filter(reading => reading.farm_id === farm.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    
    if (!latestSensor) return 'unknown'
    
    const temp = latestSensor.temperature
    const ph = latestSensor.ph
    const oxygen = latestSensor.dissolved_oxygen
    
    if (temp >= 20 && temp <= 25 && ph >= 6.5 && ph <= 8.5 && oxygen >= 5) {
      return 'healthy'
    } else if (temp >= 18 && temp <= 28 && ph >= 6.0 && ph <= 9.0 && oxygen >= 4) {
      return 'warning'
    } else {
      return 'critical'
    }
  }, [sensorData])

  // Get marker color based on health
  const getMarkerColor = useCallback((health: string, isHovered: boolean) => {
    const colors = {
      healthy: isHovered ? '#059669' : '#10b981',
      warning: isHovered ? '#d97706' : '#f59e0b', 
      critical: isHovered ? '#dc2626' : '#ef4444',
      unknown: isHovered ? '#6b7280' : '#9ca3af'
    }
    return colors[health as keyof typeof colors] || colors.unknown
  }, [])



  // Handle marker hover
  const handleMarkerHover = useCallback((farm: Farm | null, event?: React.MouseEvent) => {
    onFarmHover(farm ? farm.farm_name : null)
  }, [onFarmHover])

  // Get popup content
  const getPopupContent = useCallback((farm: Farm) => {
    const latestSensor = sensorData
      .filter(reading => reading.farm_id === farm.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    
    // Get generator and related data for this farm
    const farmGenerator = electricalComponents.find(comp => comp.farm_id === farm.id)
    const latestMaintenance = farmGenerator 
      ? maintenanceData
          .filter(record => record.component_id === farmGenerator.id)
          .sort((a, b) => new Date(b.maintenance_date).getTime() - new Date(a.maintenance_date).getTime())[0]
      : null
    
    // Get latest electrical data for this generator
    const latestEnergyData = farmGenerator 
      ? energyData.find(data => data.component_id === farmGenerator.id)
      : null
    const latestFuelData = farmGenerator 
      ? fuelData.find(data => data.component_id === farmGenerator.id)
      : null
    const latestGeneratorStatus = farmGenerator 
      ? generatorStatus.find(status => status.component_id === farmGenerator.id)
      : null
    
    const health = getFarmHealth(farm)
    const healthEmoji = {
      healthy: '🟢',
      warning: '🟡', 
      critical: '🔴',
      unknown: '⚪'
    }[health]

    return (
      <div className="p-2 min-w-[200px] max-w-[220px]">
        <div className="flex items-center gap-1 mb-2">
          <span className="text-sm">{healthEmoji}</span>
          <h3 className="font-semibold text-sm truncate">{farm.farm_name}</h3>
        </div>
        
        <div className="text-xs text-gray-600 mb-2">
          <div className="truncate">📍 {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}</div>
        </div>
        
        {latestSensor ? (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>🌡️ Temperature:</span>
              <span className="font-medium">{latestSensor.temperature.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between">
              <span>🧪 pH Level:</span>
              <span className="font-medium">{latestSensor.ph.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span>💧 Dissolved O₂:</span>
              <span className="font-medium">{latestSensor.dissolved_oxygen.toFixed(1)} mg/L</span>
            </div>
            <div className="text-xs text-gray-500 mt-2 pt-1 border-t">
              Last updated: {new Date(latestSensor.timestamp).toLocaleString()}
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500">No sensor data available</p>
        )}
        
        {/* Generator and Electrical Data */}
        {farmGenerator && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-1">⚡ Generator Status</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`font-medium ${
                  latestGeneratorStatus?.is_running ? 'text-green-600' :
                  farmGenerator.status === 'maintenance' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {latestGeneratorStatus?.is_running ? 'Running' : 'Stopped'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Name:</span>
                <span className="font-medium truncate">{farmGenerator.component_name}</span>
              </div>
              
              {/* Real-time Electrical Data */}
              {latestEnergyData && (
                <>
                  <div className="mt-2 pt-1 border-t border-gray-100">
                    <div className="text-xs font-medium text-blue-600 mb-1">📊 Live Electrical Data</div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="flex justify-between">
                        <span>Voltage L1:</span>
                        <span className="font-medium text-blue-600">{latestEnergyData.voltage_l1_v.toFixed(0)}V</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Current L1:</span>
                        <span className="font-medium text-orange-600">{latestEnergyData.current_l1_a.toFixed(0)}A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Power:</span>
                        <span className="font-medium text-red-600">{latestEnergyData.active_power_kw.toFixed(0)}kW</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frequency:</span>
                        <span className="font-medium text-green-600">{latestEnergyData.frequency_hz.toFixed(1)}Hz</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Load:</span>
                        <span className="font-medium text-purple-600">{latestEnergyData.load_percentage.toFixed(0)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>PF:</span>
                        <span className="font-medium text-indigo-600">{latestEnergyData.power_factor.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              {/* Fuel Data */}
              {latestFuelData && (
                <div className="mt-1 pt-1 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span>⛽ Fuel Level:</span>
                    <span className="font-medium text-amber-600">{latestFuelData.fuel_level_percent.toFixed(0)}%</span>
                  </div>
                </div>
              )}
              
              {/* Maintenance Info */}
              {latestMaintenance && (
                <div className="mt-1 pt-1 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span>🔧 Last Service:</span>
                    <span className="font-medium">
                      {new Date(latestMaintenance.maintenance_date).toLocaleDateString()}
                    </span>
                  </div>
                  {latestMaintenance.next_maintenance_date && (
                    <div className="flex justify-between">
                      <span>📅 Next Due:</span>
                      <span className="font-medium">
                        {new Date(latestMaintenance.next_maintenance_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }, [sensorData, getFarmHealth, electricalComponents, maintenanceData, energyData, fuelData, generatorStatus])

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-200">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN_HERE'}
      >
        {farms.map((farm) => {
          const health = getFarmHealth(farm)
          const isHovered = hoveredFarm === farm.farm_name
          const markerColor = getMarkerColor(health, isHovered)
          
          return (
            <Marker
              key={farm.id}
              longitude={farm.longitude}
              latitude={farm.latitude}
            >
              <div
                className={`cursor-pointer transition-all duration-200 ${
                  isHovered ? 'scale-125' : 'scale-100'
                }`}
                onMouseEnter={(e) => {
                  handleMarkerHover(farm, e)
                  setSelectedFarm(farm)
                }}
                onMouseLeave={() => {
                  handleMarkerHover(null)
                  setSelectedFarm(null)
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: markerColor,
                  border: '3px solid white',
                  boxShadow: isHovered 
                    ? '0 8px 16px rgba(0,0,0,0.3)' 
                    : '0 4px 8px rgba(0,0,0,0.2)',
                  transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                  transition: 'all 0.2s ease'
                }}

              />
            </Marker>
          )
        })}
        



        {selectedFarm && (
          <Popup
            longitude={selectedFarm.longitude}
            latitude={selectedFarm.latitude}
            onClose={() => setSelectedFarm(null)}
            closeButton={true}
            closeOnClick={false}
            className="farm-popup"
          >
            {getPopupContent(selectedFarm)}
          </Popup>
        )}
      </Map>
    </div>
  )
}

export default InteractiveMap