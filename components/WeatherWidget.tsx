'use client'

import { WeatherData } from '../lib/supabase'
import { Cloud, Wind, Droplets, Gauge } from 'lucide-react'

interface WeatherWidgetProps {
  weatherData: (WeatherData & { farm_name: string })[]
  selectedFarm: string
}

export default function WeatherWidget({ weatherData, selectedFarm }: WeatherWidgetProps) {
  const filteredData = selectedFarm === 'all' 
    ? weatherData
    : weatherData.filter(item => item.farm_name === selectedFarm)

  // Calculate averages for the selected farm(s)
  const avgAirPressure = filteredData.length > 0 
    ? (filteredData.reduce((sum, item) => sum + item.air_pressure, 0) / filteredData.length).toFixed(1)
    : '0'
  
  const avgWindSpeed = filteredData.length > 0
    ? (filteredData.reduce((sum, item) => sum + item.wind_speed, 0) / filteredData.length).toFixed(1)
    : '0'
  
  const totalRainfall = filteredData.length > 0
    ? filteredData.reduce((sum, item) => sum + item.rainfall, 0).toFixed(2)
    : '0'

  const latestReading = filteredData.length > 0 
    ? filteredData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    : null

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Weather Conditions</h3>
      
      {filteredData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No weather data available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Conditions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Gauge className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{avgAirPressure}</div>
                <div className="text-sm text-gray-500">hPa</div>
                <div className="text-xs text-gray-400">Air Pressure</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Wind className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{avgWindSpeed}</div>
                <div className="text-sm text-gray-500">m/s</div>
                <div className="text-xs text-gray-400">Wind Speed</div>
              </div>
            </div>
          </div>

          {/* Rainfall */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Droplets className="h-8 w-8 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline space-x-2">
                  <div className="text-2xl font-bold text-gray-900">{totalRainfall}</div>
                  <div className="text-sm text-gray-500">mm</div>
                </div>
                <div className="text-xs text-gray-400">Total Rainfall</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {parseFloat(totalRainfall) > 0 ? '🌧️' : '☀️'}
                </div>
              </div>
            </div>
          </div>

          {/* Weather Summary */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Conditions</div>
                <div className="text-xs text-gray-500">
                  {parseFloat(totalRainfall) > 5 ? 'Heavy Rain' : 
                   parseFloat(totalRainfall) > 1 ? 'Light Rain' : 
                   parseFloat(avgWindSpeed) > 10 ? 'Windy' : 'Clear'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-700">Last Update</div>
                <div className="text-xs text-gray-500">
                  {latestReading ? new Date(latestReading.timestamp).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Weather Alerts */}
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2">
              {parseFloat(avgWindSpeed) > 15 && (
                <div className="flex items-center space-x-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                  <Wind className="h-4 w-4" />
                  <span>High wind speed detected</span>
                </div>
              )}
              {parseFloat(totalRainfall) > 10 && (
                <div className="flex items-center space-x-2 text-sm text-blue-700 bg-blue-50 p-2 rounded">
                  <Droplets className="h-4 w-4" />
                  <span>Heavy rainfall detected</span>
                </div>
              )}
              {parseFloat(avgAirPressure) < 1000 && (
                <div className="flex items-center space-x-2 text-sm text-red-700 bg-red-50 p-2 rounded">
                  <Gauge className="h-4 w-4" />
                  <span>Low air pressure</span>
                </div>
              )}
              {parseFloat(avgWindSpeed) <= 15 && parseFloat(totalRainfall) <= 10 && parseFloat(avgAirPressure) >= 1000 && (
                <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                  <Cloud className="h-4 w-4" />
                  <span>Weather conditions normal</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}