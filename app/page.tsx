'use client'

import { useEffect, useState } from 'react'
import { supabase, type Farm, type SensorReading, type WeatherData, type OperationalData } from '../lib/supabase'
import FarmOverview from '../components/FarmOverview'
import SensorChart from '../components/SensorChart'
import WeatherWidget from '../components/WeatherWidget'
import OperationalStatus from '../components/OperationalStatus'
import InteractiveMap from '../components/InteractiveMap'
import DynamicChart from '../components/DynamicChart'
import { Activity, Thermometer, Droplets, Wind, Map, BarChart3 } from 'lucide-react'

interface DashboardData {
  farms: Farm[]
  latestSensorData: (SensorReading & { farm_name: string })[]
  latestWeatherData: (WeatherData & { farm_name: string })[]
  latestOperationalData: (OperationalData & { farm_name: string })[]
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedFarm, setSelectedFarm] = useState<string>('all')
  const [hoveredFarm, setHoveredFarm] = useState<string | null>(null)
  const [activeChartType, setActiveChartType] = useState<'sensor' | 'weather' | 'operational'>('sensor')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch farms
      const { data: farms, error: farmsError } = await supabase
        .from('farms')
        .select('*')
        .order('farm_name')

      if (farmsError) throw farmsError

      // Fetch latest sensor data with farm names
      const { data: sensorData, error: sensorError } = await supabase
        .from('sensor_readings')
        .select(`
          *,
          farms!inner(farm_name)
        `)
        .order('timestamp', { ascending: false })
        .limit(100)

      if (sensorError) throw sensorError

      // Fetch latest weather data with farm names
      const { data: weatherData, error: weatherError } = await supabase
        .from('weather_data')
        .select(`
          *,
          farms!inner(farm_name)
        `)
        .order('timestamp', { ascending: false })
        .limit(100)

      if (weatherError) throw weatherError

      // Fetch latest operational data with farm names
      const { data: operationalData, error: operationalError } = await supabase
        .from('operational_data')
        .select(`
          *,
          farms!inner(farm_name)
        `)
        .order('timestamp', { ascending: false })
        .limit(100)

      if (operationalError) throw operationalError

      // Transform data to include farm_name at the top level
      const transformedSensorData = sensorData?.map(item => ({
        ...item,
        farm_name: (item.farms as any).farm_name
      })) || []

      const transformedWeatherData = weatherData?.map(item => ({
        ...item,
        farm_name: (item.farms as any).farm_name
      })) || []

      const transformedOperationalData = operationalData?.map(item => ({
        ...item,
        farm_name: (item.farms as any).farm_name
      })) || []

      setData({
        farms: farms || [],
        latestSensorData: transformedSensorData,
        latestWeatherData: transformedWeatherData,
        latestOperationalData: transformedOperationalData
      })
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
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

  // Calculate summary statistics
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
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="metric-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="stat-number">{totalFarms}</div>
              <div className="stat-label">Active Farms</div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Thermometer className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <div className="stat-number">{avgTemperature}°C</div>
              <div className="stat-label">Avg Temperature</div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Droplets className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <div className="stat-number">{avgPH}</div>
              <div className="stat-label">Avg pH Level</div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Wind className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <div className="stat-number">{activeAerators}</div>
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

      {/* Data Tables */}
      <div className="grid grid-cols-1 gap-6">
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