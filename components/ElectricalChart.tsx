'use client'

import { useEffect, useState } from 'react'
import { supabase, EnergyConsumptionData, ElectricalComponent } from '../lib/supabase'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js'
import { Line } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'
import { Zap, TrendingUp, Activity } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
)

interface ElectricalChartProps {
  selectedFarm: string
}

interface ChartData {
  timestamp: string
  voltage_avg: number
  current_avg: number
  active_power_kw: number
  power_factor: number
  frequency_hz: number
  load_percentage: number
  component_name: string
}

export default function ElectricalChart({ selectedFarm }: ElectricalChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('6h')

  useEffect(() => {
    fetchElectricalChartData()
    // Set up real-time updates every 60 seconds
    const interval = setInterval(fetchElectricalChartData, 60000)
    return () => clearInterval(interval)
  }, [selectedFarm, timeRange])

  const fetchElectricalChartData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Calculate time range
      const now = new Date()
      const hoursBack = timeRange === '1h' ? 1 : timeRange === '6h' ? 6 : 24
      const startTime = new Date(now.getTime() - hoursBack * 60 * 60 * 1000)

      // Get electrical components first
      let componentsQuery = supabase
        .from('electrical_components')
        .select('id, component_name, farm_id')
        .eq('component_type', 'generator')

      if (selectedFarm !== 'all') {
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
        setChartData([])
        setLoading(false)
        return
      }

      // Get energy consumption data for all components
      const componentIds = components.map(c => c.id)
      const { data: energyData, error: energyError } = await supabase
        .from('energy_consumption_data')
        .select('*')
        .in('component_id', componentIds)
        .gte('timestamp', startTime.toISOString())
        .order('timestamp', { ascending: true })

      if (energyError) throw energyError

      if (!energyData || energyData.length === 0) {
        setChartData([])
        setLoading(false)
        return
      }

      // Process data for chart
      const processedData: ChartData[] = energyData.map(item => {
        const component = components.find(c => c.id === item.component_id)
        return {
          timestamp: item.timestamp,
          voltage_avg: (item.voltage_l1_v + item.voltage_l2_v + item.voltage_l3_v) / 3,
          current_avg: (item.current_l1_a + item.current_l2_a + item.current_l3_a) / 3,
          active_power_kw: item.active_power_kw,
          power_factor: item.power_factor,
          frequency_hz: item.frequency_hz,
          load_percentage: item.load_percentage,
          component_name: component?.component_name || 'Unknown'
        }
      })

      setChartData(processedData)
    } catch (err) {
      console.error('Error fetching electrical chart data:', err)
      setError('Failed to load electrical chart data')
    } finally {
      setLoading(false)
    }
  }

  const getChartConfig = () => {
    if (chartData.length === 0) {
      return {
        labels: [],
        datasets: []
      }
    }

    const labels = chartData.map(item => new Date(item.timestamp))

    return {
      labels,
      datasets: [
        {
          label: 'Voltage (V)',
          data: chartData.map(item => item.voltage_avg),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1,
          yAxisID: 'y'
        },
        {
          label: 'Current (A)',
          data: chartData.map(item => item.current_avg),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.1,
          yAxisID: 'y1'
        },
        {
          label: 'Active Power (kW)',
          data: chartData.map(item => item.active_power_kw),
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.1,
          yAxisID: 'y2'
        },
        {
          label: 'Load (%)',
          data: chartData.map(item => item.load_percentage),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.1,
          yAxisID: 'y3'
        }
      ]
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: `Electrical Monitoring - ${selectedFarm === 'all' ? 'All Farms' : selectedFarm} (${timeRange})`,
        font: {
          size: 16
        }
      },
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          title: function(context: any) {
            return new Date(context[0].parsed.x).toLocaleString()
          },
          label: function(context: any) {
            const label = context.dataset.label || ''
            const value = context.parsed.y
            if (label.includes('Voltage')) return `${label}: ${value.toFixed(1)} V`
            if (label.includes('Current')) return `${label}: ${value.toFixed(1)} A`
            if (label.includes('Power')) return `${label}: ${value.toFixed(1)} kW`
            if (label.includes('Load')) return `${label}: ${value.toFixed(1)}%`
            return `${label}: ${value.toFixed(2)}`
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM dd HH:mm',
          },
        },
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Voltage (V)',
          color: 'rgb(59, 130, 246)'
        },
        grid: {
          color: 'rgba(59, 130, 246, 0.1)'
        },
        ticks: {
          color: 'rgb(59, 130, 246)'
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Current (A)',
          color: 'rgb(245, 158, 11)'
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'rgb(245, 158, 11)'
        }
      },
      y2: {
        type: 'linear' as const,
        display: false,
        position: 'right' as const,
      },
      y3: {
        type: 'linear' as const,
        display: false,
        position: 'right' as const,
      },
    },
  }

  const getLatestValues = () => {
    if (chartData.length === 0) return null
    const latest = chartData[chartData.length - 1]
    return {
      voltage: latest.voltage_avg,
      current: latest.current_avg,
      power: latest.active_power_kw,
      load: latest.load_percentage,
      powerFactor: latest.power_factor,
      frequency: latest.frequency_hz
    }
  }

  const latestValues = getLatestValues()

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Electrical Trends</h3>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading electrical trends...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Electrical Trends</h3>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchElectricalChartData}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Electrical Trends</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No electrical trend data available for the selected time range</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">📊 Electrical Trends</h3>
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['1h', '6h', '24h'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Activity className="w-4 h-4 mr-1" />
            {chartData.length} data points
          </div>
        </div>
      </div>

      {/* Latest Values Summary */}
      {latestValues && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xs text-blue-600 font-medium">Voltage</div>
            <div className="text-lg font-bold text-blue-700">{latestValues.voltage.toFixed(0)}V</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-xs text-yellow-600 font-medium">Current</div>
            <div className="text-lg font-bold text-yellow-700">{latestValues.current.toFixed(0)}A</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-xs text-red-600 font-medium">Power</div>
            <div className="text-lg font-bold text-red-700">{latestValues.power.toFixed(0)}kW</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xs text-green-600 font-medium">Load</div>
            <div className="text-lg font-bold text-green-700">{latestValues.load.toFixed(0)}%</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-xs text-purple-600 font-medium">Power Factor</div>
            <div className="text-lg font-bold text-purple-700">{latestValues.powerFactor.toFixed(2)}</div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3 text-center">
            <div className="text-xs text-indigo-600 font-medium">Frequency</div>
            <div className="text-lg font-bold text-indigo-700">{latestValues.frequency.toFixed(1)}Hz</div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-96">
        <Line data={getChartConfig()} options={chartOptions} />
      </div>
    </div>
  )
}