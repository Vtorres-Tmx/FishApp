'use client'

import { useEffect, useState } from 'react'
import { supabase, EnergyConsumptionData, FuelConsumptionData, GeneratorOperationalStatus, ElectricalComponent } from '../lib/supabase'
import { Zap, Gauge, Battery, Fuel, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface ElectricalMonitoringProps {
  selectedFarm: string
}

interface ElectricalData {
  component: ElectricalComponent
  energyData: EnergyConsumptionData | null
  fuelData: FuelConsumptionData | null
  operationalStatus: GeneratorOperationalStatus | null
}

export default function ElectricalMonitoring({ selectedFarm }: ElectricalMonitoringProps) {
  const [electricalData, setElectricalData] = useState<ElectricalData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchElectricalData()
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchElectricalData, 30000)
    return () => clearInterval(interval)
  }, [selectedFarm])

  const fetchElectricalData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch electrical components
      let componentsQuery = supabase
        .from('electrical_components')
        .select('*')
        .eq('component_type', 'generator')

      if (selectedFarm !== 'all') {
        // Get farm ID from farm name
        const { data: farms } = await supabase
          .from('farms')
          .select('id')
          .eq('farm_name', selectedFarm)
          .single()
        
        if (farms) {
          componentsQuery = componentsQuery.eq('farm_id', farms.id)
        }
      }

      const { data: components, error: compError } = await componentsQuery
      if (compError) throw compError

      if (!components || components.length === 0) {
        setElectricalData([])
        setLoading(false)
        return
      }

      // Fetch latest data for each component
      const electricalDataPromises = components.map(async (component) => {
        // Get latest energy consumption data
        const { data: energyData } = await supabase
          .from('energy_consumption_data')
          .select('*')
          .eq('component_id', component.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()

        // Get latest fuel consumption data
        const { data: fuelData } = await supabase
          .from('fuel_consumption_data')
          .select('*')
          .eq('component_id', component.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()

        // Get latest operational status
        const { data: operationalStatus } = await supabase
          .from('generator_operational_status')
          .select('*')
          .eq('component_id', component.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()

        return {
          component,
          energyData: energyData || null,
          fuelData: fuelData || null,
          operationalStatus: operationalStatus || null
        }
      })

      const results = await Promise.all(electricalDataPromises)
      setElectricalData(results)
    } catch (err) {
      console.error('Error fetching electrical data:', err)
      setError('Failed to load electrical monitoring data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string, isRunning?: boolean) => {
    if (isRunning === false) {
      return <XCircle className="w-5 h-5 text-red-500" />
    }
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'maintenance':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />
    }
  }

  const formatValue = (value: number | null | undefined, decimals: number = 1, unit: string = '') => {
    if (value === null || value === undefined) return 'N/A'
    return `${value.toFixed(decimals)}${unit}`
  }

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Real-time Electrical Monitoring</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading electrical data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Real-time Electrical Monitoring</h3>
        <div className="text-center py-8">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchElectricalData}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (electricalData.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Real-time Electrical Monitoring</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No electrical monitoring data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">⚡ Real-time Electrical Monitoring</h3>
        <div className="flex items-center text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Live Data
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {electricalData.map(({ component, energyData, fuelData, operationalStatus }) => (
          <div key={component.id} className="bg-gray-50 rounded-lg p-4 border">
            {/* Generator Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{component.component_name}</h4>
                <p className="text-sm text-gray-600">{component.component_type}</p>
              </div>
              {getStatusIcon(component.status, operationalStatus?.is_running)}
            </div>

            {/* Electrical Metrics */}
            {energyData && (
              <div className="space-y-3">
                <div className="bg-white rounded p-3">
                  <div className="flex items-center mb-2">
                    <Zap className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Voltage (3-Phase)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{formatValue(energyData.voltage_l1_v, 0, 'V')}</div>
                      <div className="text-gray-500">L1</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{formatValue(energyData.voltage_l2_v, 0, 'V')}</div>
                      <div className="text-gray-500">L2</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">{formatValue(energyData.voltage_l3_v, 0, 'V')}</div>
                      <div className="text-gray-500">L3</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded p-3">
                  <div className="flex items-center mb-2">
                    <Gauge className="w-4 h-4 text-orange-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Current (3-Phase)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-semibold text-orange-600">{formatValue(energyData.current_l1_a, 0, 'A')}</div>
                      <div className="text-gray-500">L1</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-orange-600">{formatValue(energyData.current_l2_a, 0, 'A')}</div>
                      <div className="text-gray-500">L2</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-orange-600">{formatValue(energyData.current_l3_a, 0, 'A')}</div>
                      <div className="text-gray-500">L3</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">Power Factor</div>
                    <div className="font-semibold text-purple-600">{formatValue(energyData.power_factor, 2)}</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">Frequency</div>
                    <div className="font-semibold text-green-600">{formatValue(energyData.frequency_hz, 1, ' Hz')}</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">Active Power</div>
                    <div className="font-semibold text-red-600">{formatValue(energyData.active_power_kw, 0, ' kW')}</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-xs text-gray-500 mb-1">Load</div>
                    <div className="font-semibold text-yellow-600">{formatValue(energyData.load_percentage, 0, '%')}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Fuel Data */}
            {fuelData && (
              <div className="mt-4">
                <div className="bg-white rounded p-3">
                  <div className="flex items-center mb-2">
                    <Fuel className="w-4 h-4 text-amber-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Fuel Status</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">Level</div>
                      <div className="font-semibold text-amber-600">{formatValue(fuelData.fuel_level_percent, 0, '%')}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Rate</div>
                      <div className="font-semibold text-amber-600">{formatValue(fuelData.fuel_rate_liters_per_hour, 1, ' L/h')}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Operational Status */}
            {operationalStatus && (
              <div className="mt-4">
                <div className="bg-white rounded p-3">
                  <div className="flex items-center mb-2">
                    <Battery className="w-4 h-4 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-gray-700">Engine Status</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-gray-500">RPM</div>
                      <div className="font-semibold text-green-600">{formatValue(operationalStatus.rpm, 0)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Oil Pressure</div>
                      <div className="font-semibold text-green-600">{formatValue(operationalStatus.oil_pressure_bar, 1, ' bar')}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Oil Temp</div>
                      <div className="font-semibold text-green-600">{formatValue(operationalStatus.oil_temperature_celsius, 0, '°C')}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Battery</div>
                      <div className="font-semibold text-green-600">{formatValue(operationalStatus.battery_voltage_v, 1, 'V')}</div>
                    </div>
                  </div>
                  
                  {operationalStatus.alarm_status && (
                    <div className="mt-2 flex items-center text-red-600">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      <span className="text-xs">Alarm Active</span>
                    </div>
                  )}
                  
                  {operationalStatus.maintenance_due && (
                    <div className="mt-1 flex items-center text-yellow-600">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      <span className="text-xs">Maintenance Due</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="mt-3 text-xs text-gray-400 text-center">
              Last updated: {energyData ? new Date(energyData.timestamp).toLocaleTimeString() : 'N/A'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}