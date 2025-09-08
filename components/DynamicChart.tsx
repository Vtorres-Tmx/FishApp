'use client'

import { useEffect, useRef } from 'react'
import { SensorReading, WeatherData, OperationalData, ElectricalComponent, EnergyConsumptionData, FuelConsumptionData, GeneratorOperationalStatus } from '../lib/supabase'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale } from 'chart.js'
import { Line } from 'react-chartjs-2'
import 'chartjs-adapter-date-fns'

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

interface DynamicChartProps {
  farmName: string | null
  sensorData: SensorReading[]
  weatherData: WeatherData[]
  operationalData: OperationalData[]
  electricalData: ElectricalComponent[]
  energyData: EnergyConsumptionData[]
  fuelData: FuelConsumptionData[]
  generatorStatus: GeneratorOperationalStatus[]
  chartType: 'sensor' | 'weather' | 'operational' | 'electrical'
}

const DynamicChart: React.FC<DynamicChartProps> = ({
  farmName,
  sensorData,
  weatherData,
  operationalData,
  electricalData,
  energyData,
  fuelData,
  generatorStatus,
  chartType
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null)

  // Filter data based on selected farm
  const getFilteredData = () => {
    if (!farmName) return []
    
    switch (chartType) {
      case 'sensor':
        return sensorData
          .filter(reading => {
            // Check if reading has farm_name property or find by farm_id
            if ('farm_name' in reading) {
              return (reading as any).farm_name === farmName
            }
            return false
          })
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .slice(-20) // Last 20 readings
      
      case 'weather':
        return weatherData
          .filter(reading => {
            if ('farm_name' in reading) {
              return (reading as any).farm_name === farmName
            }
            return false
          })
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .slice(-20)
      
      case 'operational':
        return operationalData
          .filter(reading => {
            if ('farm_name' in reading) {
              return (reading as any).farm_name === farmName
            }
            return false
          })
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .slice(-20)
      
      case 'electrical':
        // Get generator components for this farm by name
        const farmGenerators = electricalData.filter(comp => {
          if ('farm_name' in comp) {
            return (comp as any).farm_name === farmName && comp.component_type === 'generator'
          }
          return false
        })
        const generatorIds = farmGenerators.map(gen => gen.id)
        
        // Filter electrical measurement data by generator IDs
        const filteredEnergyData = energyData.filter(data => {
          if ('farm_name' in data) {
            return (data as any).farm_name === farmName
          }
          return generatorIds.includes(data.component_id)
        })
        
        // Return the most recent energy data for charting
        return filteredEnergyData
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .slice(-20)
      
      default:
        return []
    }
  }

  const filteredData = getFilteredData()

  const getChartData = () => {
    if (!filteredData.length) {
      return {
        labels: [],
        datasets: []
      }
    }

    const labels = filteredData.map(item => {
      if (chartType === 'electrical') {
        return new Date((item as EnergyConsumptionData).timestamp)
      }
      return new Date((item as any).timestamp)
    })

    switch (chartType) {
      case 'sensor':
        const sensorReadings = filteredData as SensorReading[]
        return {
          labels,
          datasets: [
            {
              label: 'Temperature (°C)',
              data: sensorReadings.map(reading => reading.temperature),
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.1,
              yAxisID: 'y'
            },
            {
              label: 'pH',
              data: sensorReadings.map(reading => reading.ph),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.1,
              yAxisID: 'y1'
            },
            {
              label: 'Dissolved Oxygen (mg/L)',
              data: sensorReadings.map(reading => reading.dissolved_oxygen),
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.1,
              yAxisID: 'y2'
            }
          ]
        }

      case 'weather':
        const weatherReadings = filteredData as WeatherData[]
        return {
          labels,
          datasets: [
            {
              label: 'Air Pressure (hPa)',
              data: weatherReadings.map(reading => reading.air_pressure),
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              tension: 0.1,
              yAxisID: 'y'
            },
            {
              label: 'Wind Speed (m/s)',
              data: weatherReadings.map(reading => reading.wind_speed),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.1,
              yAxisID: 'y1'
            },
            {
              label: 'Rainfall (mm)',
              data: weatherReadings.map(reading => reading.rainfall),
              borderColor: 'rgb(6, 182, 212)',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              tension: 0.1,
              yAxisID: 'y2'
            }
          ]
        }

      case 'operational':
        const operationalReadings = filteredData as OperationalData[]
        return {
          labels,
          datasets: [
            {
              label: 'Flow Rate (m³/h)',
              data: operationalReadings.map(reading => reading.flow_rate),
              borderColor: 'rgb(245, 158, 11)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              tension: 0.1,
              yAxisID: 'y'
            },
            {
              label: 'Lirio Coverage (%)',
              data: operationalReadings.map(reading => reading.lirio_coverage),
              borderColor: 'rgb(139, 69, 19)',
              backgroundColor: 'rgba(139, 69, 19, 0.1)',
              tension: 0.1,
              yAxisID: 'y1'
            },
            {
              label: 'Aerator Status',
              data: operationalReadings.map(reading => reading.aerator_status),
              borderColor: 'rgb(99, 102, 241)',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              tension: 0.1,
              yAxisID: 'y2'
            }
          ]
        }

      case 'electrical':
        const energyReadings = filteredData as EnergyConsumptionData[]
        return {
          labels,
          datasets: [
            {
              label: 'Active Power (kW)',
              data: energyReadings.map(reading => reading.active_power_kw),
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              tension: 0.1,
              yAxisID: 'y'
            },
            {
              label: 'Energy Generated (kWh)',
              data: energyReadings.map(reading => reading.energy_generated_kwh),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.1,
              yAxisID: 'y1'
            },
            {
              label: 'Load Percentage (%)',
              data: energyReadings.map(reading => reading.load_percentage),
              borderColor: 'rgb(245, 158, 11)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              tension: 0.1,
              yAxisID: 'y2'
            },
            {
              label: 'Efficiency (%)',
              data: energyReadings.map(reading => reading.efficiency_percent),
              borderColor: 'rgb(168, 85, 247)',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
              tension: 0.1,
              yAxisID: 'y2'
            }
          ]
        }

      default:
        return { labels: [], datasets: [] }
    }
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: farmName ? `${farmName} - ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Data` : `Select a farm to view ${chartType} data`,
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            hour: 'MMM dd HH:mm'
          }
        },
        title: {
          display: true,
          text: 'Time'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
      y2: {
        type: 'linear' as const,
        display: false,
        position: 'right' as const,
      },
    },
  }

  if (!farmName) {
    return (
      <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg font-medium">Hover over a farm marker</p>
          <p className="text-gray-400 text-sm">to view {chartType} data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-96 bg-white rounded-lg border border-gray-200 p-4">
      <Line ref={chartRef} data={getChartData()} options={options} />
    </div>
  )
}

export default DynamicChart