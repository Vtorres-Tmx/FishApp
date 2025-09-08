'use client'

import { useEffect, useState } from 'react'
import { supabase, type Farm, type SensorReading, type WeatherData, type OperationalData, type ElectricalComponent, type EnergyConsumptionData, type FuelConsumptionData, type GeneratorOperationalStatus } from '../lib/supabase'
import FarmOverview from '../components/FarmOverview'
import SensorChart from '../components/SensorChart'
import WeatherWidget from '../components/WeatherWidget'
import OperationalStatus from '../components/OperationalStatus'
import InteractiveMap from '../components/InteractiveMap'
import DynamicChart from '../components/DynamicChart'
import ElectricalMonitoring from '../components/ElectricalMonitoring'
import ElectricalChart from '../components/ElectricalChart'
import { Activity, Thermometer, Droplets, Wind, Map, BarChart3 } from 'lucide-react'

interface DashboardData {
  farms: Farm[]
  latestSensorData: (SensorReading & { farm_name: string })[]
  latestWeatherData: (WeatherData & { farm_name: string })[]
  latestOperationalData: (OperationalData & { farm_name: string })[]
  latestElectricalData: (ElectricalComponent & { farm_name: string })[]
  latestEnergyData: (EnergyConsumptionData & { farm_name: string })[]
  latestFuelData: (FuelConsumptionData & { farm_name: string })[]
  latestGeneratorStatus: (GeneratorOperationalStatus & { farm_name: string })[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFarm, setSelectedFarm] = useState<string>('all')
  const [hoveredFarm, setHoveredFarm] = useState<string | null>(null)
  const [activeChartType, setActiveChartType] = useState<'sensor' | 'weather' | 'operational' | 'electrical'>('sensor')
  const [error, setError] = useState<string | null>(null)
  const [allData, setAllData] = useState<{
    sensorData: (SensorReading & { farm_name: string })[]
    weatherData: (WeatherData & { farm_name: string })[]
    operationalData: (OperationalData & { farm_name: string })[]
    electricalData: (ElectricalComponent & { farm_name: string })[]
    energyData: (EnergyConsumptionData & { farm_name: string })[]
    fuelData: (FuelConsumptionData & { farm_name: string })[]
    generatorStatus: (GeneratorOperationalStatus & { farm_name: string })[]
  } | null>(null)
  const [currentDataIndex, setCurrentDataIndex] = useState(0)
  const [isRealTimeActive, setIsRealTimeActive] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRealTimeActive && allData) {
      interval = setInterval(() => {
        cycleData()
      }, 3000) // Update every 3 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRealTimeActive, allData, currentDataIndex])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch farms
      const { data: farms, error: farmsError } = await supabase
        .from('farms')
        .select('*')
        .order('farm_name')

      if (farmsError) throw farmsError

      // Fetch ALL sensor data with farm names (more records for cycling)
      const { data: sensorData, error: sensorError } = await supabase
        .from('sensor_readings')
        .select(`
          *,
          farms!inner(farm_name)
        `)
        .order('timestamp', { ascending: false })
        .limit(500) // Increased limit for more data to cycle through

      if (sensorError) throw sensorError

      // Fetch ALL weather data with farm names
      const { data: weatherData, error: weatherError } = await supabase
        .from('weather_data')
        .select(`
          *,
          farms!inner(farm_name)
        `)
        .order('timestamp', { ascending: false })
        .limit(500)

      if (weatherError) throw weatherError

      // Fetch ALL operational data with farm names
      const { data: operationalData, error: operationalError } = await supabase
        .from('operational_data')
        .select(`
          *,
          farms!inner(farm_name)
        `)
        .order('timestamp', { ascending: false })
        .limit(500)

      if (operationalError) throw operationalError

      // Fetch ALL electrical data with farm names (manual join)
      const { data: electricalData, error: electricalError } = await supabase
        .from('electrical_components')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (electricalError) throw electricalError

      // Fetch energy consumption data
      const { data: energyData, error: energyError } = await supabase
        .from('energy_consumption_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500)

      if (energyError) throw energyError

      // Fetch fuel consumption data
      const { data: fuelData, error: fuelError } = await supabase
        .from('fuel_consumption_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500)

      if (fuelError) throw fuelError

      // Fetch generator operational status
      const { data: generatorStatus, error: generatorError } = await supabase
        .from('generator_operational_status')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(500)

      if (generatorError) throw generatorError

      // Fetch farms for manual join
      const { data: farmsForJoin, error: farmsJoinError } = await supabase
        .from('farms')
        .select('id, farm_name')

      if (farmsJoinError) throw farmsJoinError

      // Transform data to include farm_name at the top level
      const transformedSensorData = sensorData?.map(item => ({
        ...item,
        farm_name: item.farms.farm_name
      })) || []

      const transformedWeatherData = weatherData?.map(item => ({
        ...item,
        farm_name: item.farms.farm_name
      })) || []

      const transformedOperationalData = operationalData?.map(item => ({
        ...item,
        farm_name: item.farms.farm_name
      })) || []

      // Create a farm lookup map for efficient joining
      const farmLookup = farmsForJoin?.reduce((acc, farm) => {
        acc[farm.id] = farm.farm_name
        return acc
      }, {} as Record<number, string>) || {}

      const transformedElectricalData = electricalData?.map(item => ({
        ...item,
        farm_name: farmLookup[item.farm_id] || 'Unknown Farm'
      })) || []

      // Create component to farm lookup map
      const componentToFarmLookup = electricalData?.reduce((acc, comp) => {
        acc[comp.id] = comp.farm_id
        return acc
      }, {} as Record<number, number>) || {}

      const transformedEnergyData = energyData?.map(item => ({
        ...item,
        farm_name: farmLookup[componentToFarmLookup[item.component_id]] || 'Unknown Farm'
      })) || []

      const transformedFuelData = fuelData?.map(item => ({
        ...item,
        farm_name: farmLookup[componentToFarmLookup[item.component_id]] || 'Unknown Farm'
      })) || []

      const transformedGeneratorStatus = generatorStatus?.map(item => ({
        ...item,
        farm_name: farmLookup[componentToFarmLookup[item.component_id]] || 'Unknown Farm'
      })) || []

      // Store all data for cycling
      setAllData({
        sensorData: transformedSensorData,
        weatherData: transformedWeatherData,
        operationalData: transformedOperationalData,
        electricalData: transformedElectricalData,
        energyData: transformedEnergyData,
        fuelData: transformedFuelData,
        generatorStatus: transformedGeneratorStatus
      })

      // Set initial display data
      setData({
        farms: farms || [],
        latestSensorData: transformedSensorData.slice(0, 20),
        latestWeatherData: transformedWeatherData.slice(0, 20),
        latestOperationalData: transformedOperationalData.slice(0, 20),
        latestElectricalData: transformedElectricalData.slice(0, 20),
        latestEnergyData: transformedEnergyData.slice(0, 20),
        latestFuelData: transformedFuelData.slice(0, 20),
        latestGeneratorStatus: transformedGeneratorStatus.slice(0, 20)
      })
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const cycleData = () => {
    if (!allData || !data) return

    const batchSize = 20
    const maxIndex = Math.max(
      Math.floor(allData.sensorData.length / batchSize),
      Math.floor(allData.weatherData.length / batchSize),
      Math.floor(allData.operationalData.length / batchSize),
      Math.floor(allData.electricalData.length / batchSize),
      Math.floor(allData.energyData.length / batchSize),
      Math.floor(allData.fuelData.length / batchSize),
      Math.floor(allData.generatorStatus.length / batchSize)
    )

    const nextIndex = (currentDataIndex + 1) % maxIndex
    setCurrentDataIndex(nextIndex)

    const startIdx = nextIndex * batchSize
    const endIdx = startIdx + batchSize

    setData({
      farms: data.farms,
      latestSensorData: allData.sensorData.slice(startIdx, endIdx),
      latestWeatherData: allData.weatherData.slice(startIdx, endIdx),
      latestOperationalData: allData.operationalData.slice(startIdx, endIdx),
      latestElectricalData: allData.electricalData.slice(startIdx, endIdx),
      latestEnergyData: allData.energyData.slice(startIdx, endIdx),
      latestFuelData: allData.fuelData.slice(startIdx, endIdx),
      latestGeneratorStatus: allData.generatorStatus.slice(startIdx, endIdx)
    })
    
    setLastUpdateTime(new Date())
  }

  const toggleRealTime = () => {
    setIsRealTimeActive(!isRealTimeActive)
  }

  const fetchDashboardData = () => {
    fetchAllData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error Loading Data</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">No Data Available</div>
          <p className="text-gray-500">Please check your database connection.</p>
        </div>
      </div>
    )
  }

  // Calculate summary statistics (these will update in real-time)
  const totalFarms = data.farms.length
  const avgTemperature = data.latestSensorData.length > 0 
    ? (data.latestSensorData.reduce((sum, item) => sum + item.temperature, 0) / data.latestSensorData.length).toFixed(1)
    : '0'
  const avgPH = data.latestSensorData.length > 0
    ? (data.latestSensorData.reduce((sum, item) => sum + item.ph, 0) / data.latestSensorData.length).toFixed(1)
    : '0'
  const activeAerators = data.latestOperationalData.filter(item => item.aerator_status === 1).length

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Real-time Status Banner */}
      {isRealTimeActive && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-800 font-medium">Live Data Mode Active</span>
            <span className="text-green-600 text-sm">Updates every 3 seconds</span>
          </div>
          <span className="text-green-600 text-sm">
             Last updated: {lastUpdateTime.toLocaleTimeString()}
           </span>
        </div>
      )}
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className={`metric-card transition-all duration-500 ${isRealTimeActive ? 'ring-2 ring-green-200 bg-green-50' : ''}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className={`stat-number transition-all duration-300 ${isRealTimeActive ? 'text-green-700' : ''}`}>{totalFarms}</div>
              <div className="stat-label">Active Farms</div>
            </div>
          </div>
        </div>

        <div className={`metric-card transition-all duration-500 ${isRealTimeActive ? 'ring-2 ring-green-200 bg-green-50' : ''}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Thermometer className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <div className={`stat-number transition-all duration-300 ${isRealTimeActive ? 'text-green-700' : ''}`}>{avgTemperature}°C</div>
              <div className="stat-label">Avg Temperature</div>
            </div>
          </div>
        </div>

        <div className={`metric-card transition-all duration-500 ${isRealTimeActive ? 'ring-2 ring-green-200 bg-green-50' : ''}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Droplets className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <div className={`stat-number transition-all duration-300 ${isRealTimeActive ? 'text-green-700' : ''}`}>{avgPH}</div>
              <div className="stat-label">Avg pH Level</div>
            </div>
          </div>
        </div>

        <div className={`metric-card transition-all duration-500 ${isRealTimeActive ? 'ring-2 ring-green-200 bg-green-50' : ''}`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Wind className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <div className={`stat-number transition-all duration-300 ${isRealTimeActive ? 'text-green-700' : ''}`}>{activeAerators}</div>
              <div className="stat-label">Active Aerators</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Map and Dynamic Charts Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Map className="w-6 h-6 text-blue-600" />
            Interactive Farm Map
          </h2>
          <div className="flex gap-2">
            <button
              onClick={toggleRealTime}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                isRealTimeActive
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                isRealTimeActive ? 'bg-white animate-pulse' : 'bg-gray-400'
              }`}></div>
              {isRealTimeActive ? 'Live Data' : 'Start Live'}
            </button>
            <div className="w-px bg-gray-300 mx-1"></div>
            <button
              onClick={() => setActiveChartType('sensor')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChartType === 'sensor'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Sensor Data
            </button>
            <button
              onClick={() => setActiveChartType('weather')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChartType === 'weather'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Weather
            </button>
            <button
              onClick={() => setActiveChartType('operational')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChartType === 'operational'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Operational
            </button>
            <button
              onClick={() => setActiveChartType('electrical')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChartType === 'electrical'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Electrical
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interactive Map */}
          <div>
            <InteractiveMap
                farms={data?.farms || []}
                sensorData={data?.latestSensorData || []}
                weatherData={data?.latestWeatherData || []}
                operationalData={data?.latestOperationalData || []}
                onFarmHover={setHoveredFarm}
                hoveredFarm={hoveredFarm}
              />
          </div>
          
          {/* Dynamic Chart */}
          <div>
            <DynamicChart
                farmName={hoveredFarm}
                sensorData={data?.latestSensorData || []}
                weatherData={data?.latestWeatherData || []}
                operationalData={data?.latestOperationalData || []}
                electricalData={data?.latestElectricalData || []}
                energyData={data?.latestEnergyData || []}
                fuelData={data?.latestFuelData || []}
                generatorStatus={data?.latestGeneratorStatus || []}
                chartType={activeChartType}
              />
          </div>
        </div>
      </div>

      {/* Farm Filter */}
      <div className="mb-6">
        <label htmlFor="farm-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Farm:
        </label>
        <select
          id="farm-select"
          value={selectedFarm}
          onChange={(e) => setSelectedFarm(e.target.value)}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Farms</option>
          {data.farms.map((farm) => (
            <option key={farm.id} value={farm.farm_name}>
              {farm.farm_name}
            </option>
          ))}
        </select>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <FarmOverview 
          farms={data.farms} 
          selectedFarm={selectedFarm}
        />
        <WeatherWidget 
          weatherData={data.latestWeatherData}
          selectedFarm={selectedFarm}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SensorChart 
          sensorData={data.latestSensorData}
          selectedFarm={selectedFarm}
        />
        <OperationalStatus 
          operationalData={data.latestOperationalData}
          selectedFarm={selectedFarm}
        />
      </div>

      {/* Real-time Electrical Monitoring */}
      <ElectricalMonitoring selectedFarm={selectedFarm} />

      {/* Electrical Trends Chart */}
      <ElectricalChart selectedFarm={selectedFarm} />

      {/* Data Tables */}
      <div className="grid grid-cols-1 gap-6">
        {/* Electrical Components Summary Table */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Electrical Components Summary</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installation Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Maintenance</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.latestElectricalData
                  .filter(item => selectedFarm === 'all' || item.farm_name === selectedFarm)
                  .slice(0, 10)
                  .map((component) => (
                    <tr key={`${component.farm_id}-${component.id}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {component.farm_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {component.component_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {component.component_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          component.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : component.status === 'maintenance'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {component.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(component.installation_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {component.last_maintenance 
                          ? new Date(component.last_maintenance).toLocaleDateString()
                          : 'N/A'
                        }
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sensor Readings</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temp (°C)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pH</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DO (mg/L)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ammonia</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.latestSensorData
                  .filter(item => selectedFarm === 'all' || item.farm_name === selectedFarm)
                  .slice(0, 10)
                  .map((reading) => (
                    <tr key={`${reading.farm_id}-${reading.timestamp}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {reading.farm_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(reading.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reading.temperature.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reading.ph.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reading.dissolved_oxygen.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {reading.ammonia.toFixed(3)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}