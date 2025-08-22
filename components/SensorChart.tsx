'use client'

import { useEffect, useRef } from 'react'
import { SensorReading } from '../lib/supabase'
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

interface SensorChartProps {
  sensorData: (SensorReading & { farm_name: string })[]
  selectedFarm: string
}

export default function SensorChart({ sensorData, selectedFarm }: SensorChartProps) {
  const filteredData = selectedFarm === 'all' 
    ? sensorData.slice(0, 50) // Limit to 50 points for all farms
    : sensorData.filter(item => item.farm_name === selectedFarm).slice(0, 20)

  // Sort by timestamp
  const sortedData = filteredData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const chartData = {
    labels: sortedData.map(item => new Date(item.timestamp)),
    datasets: [
      {
        label: 'Temperature (°C)',
        data: sortedData.map(item => item.temperature),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        yAxisID: 'y',
      },
      {
        label: 'pH',
        data: sortedData.map(item => item.ph),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        yAxisID: 'y1',
      },
      {
        label: 'Dissolved Oxygen (mg/L)',
        data: sortedData.map(item => item.dissolved_oxygen),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        yAxisID: 'y2',
      },
    ],
  }

  const options = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: selectedFarm === 'all' ? 'Sensor Readings - All Farms' : `Sensor Readings - ${selectedFarm}`,
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
            hour: 'HH:mm',
            day: 'MMM dd',
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
          text: 'Temperature (°C)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'pH',
        },
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

  if (sortedData.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sensor Readings</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No sensor data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sensor Readings</h3>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
      
      {/* Latest Values */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Latest Values</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {sortedData[sortedData.length - 1]?.temperature.toFixed(1) || 'N/A'}°C
            </div>
            <div className="text-gray-500">Temperature</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {sortedData[sortedData.length - 1]?.ph.toFixed(1) || 'N/A'}
            </div>
            <div className="text-gray-500">pH</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {sortedData[sortedData.length - 1]?.dissolved_oxygen.toFixed(2) || 'N/A'}
            </div>
            <div className="text-gray-500">DO (mg/L)</div>
          </div>
        </div>
      </div>
    </div>
  )
}