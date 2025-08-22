'use client'

import { OperationalData } from '../lib/supabase'
import { Settings, Waves, Leaf, Power } from 'lucide-react'

interface OperationalStatusProps {
  operationalData: (OperationalData & { farm_name: string })[]
  selectedFarm: string
}

export default function OperationalStatus({ operationalData, selectedFarm }: OperationalStatusProps) {
  const filteredData = selectedFarm === 'all' 
    ? operationalData
    : operationalData.filter(item => item.farm_name === selectedFarm)

  // Calculate operational metrics
  const avgFlowRate = filteredData.length > 0 
    ? (filteredData.reduce((sum, item) => sum + item.flow_rate, 0) / filteredData.length).toFixed(2)
    : '0'
  
  const avgLirioCoverage = filteredData.length > 0
    ? (filteredData.reduce((sum, item) => sum + item.lirio_coverage, 0) / filteredData.length).toFixed(1)
    : '0'
  
  const activeAerators = filteredData.filter(item => item.aerator_status === 1).length
  const totalAerators = filteredData.length
  const aeratorEfficiency = totalAerators > 0 ? ((activeAerators / totalAerators) * 100).toFixed(1) : '0'

  const latestReading = filteredData.length > 0 
    ? filteredData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
    : null

  // Group by farm for detailed view
  const farmGroups = filteredData.reduce((groups, item) => {
    const farmName = item.farm_name
    if (!groups[farmName]) {
      groups[farmName] = []
    }
    groups[farmName].push(item)
    return groups
  }, {} as Record<string, typeof filteredData>)

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Operational Status</h3>
      
      {filteredData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No operational data available</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Waves className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{avgFlowRate}</div>
                <div className="text-sm text-gray-500">m³/h</div>
                <div className="text-xs text-gray-400">Avg Flow Rate</div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{avgLirioCoverage}%</div>
                <div className="text-sm text-gray-500">Coverage</div>
                <div className="text-xs text-gray-400">Lirio Coverage</div>
              </div>
            </div>
          </div>

          {/* Aerator Status */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Power className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Aerator Systems</span>
              </div>
              <div className="text-sm text-gray-500">
                {activeAerators}/{totalAerators} Active
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${aeratorEfficiency}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>Efficiency: {aeratorEfficiency}%</span>
              <span className={`font-medium ${
                parseFloat(aeratorEfficiency) > 80 ? 'text-green-600' :
                parseFloat(aeratorEfficiency) > 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {parseFloat(aeratorEfficiency) > 80 ? 'Excellent' :
                 parseFloat(aeratorEfficiency) > 50 ? 'Good' : 'Needs Attention'}
              </span>
            </div>
          </div>

          {/* Farm Details (if single farm selected) */}
          {selectedFarm !== 'all' && Object.keys(farmGroups).length === 1 && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Operations</h4>
              <div className="space-y-2">
                {farmGroups[selectedFarm]?.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="text-gray-600">
                      {new Date(item.timestamp).toLocaleString()}
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-900">{item.flow_rate.toFixed(1)} m³/h</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.aerator_status === 1 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {item.aerator_status === 1 ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Alerts */}
          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2">
              {parseFloat(avgFlowRate) < 5 && (
                <div className="flex items-center space-x-2 text-sm text-red-700 bg-red-50 p-2 rounded">
                  <Waves className="h-4 w-4" />
                  <span>Low flow rate detected</span>
                </div>
              )}
              {parseFloat(avgLirioCoverage) > 80 && (
                <div className="flex items-center space-x-2 text-sm text-amber-700 bg-amber-50 p-2 rounded">
                  <Leaf className="h-4 w-4" />
                  <span>High lirio coverage - maintenance recommended</span>
                </div>
              )}
              {parseFloat(aeratorEfficiency) < 50 && (
                <div className="flex items-center space-x-2 text-sm text-red-700 bg-red-50 p-2 rounded">
                  <Power className="h-4 w-4" />
                  <span>Multiple aerators offline</span>
                </div>
              )}
              {parseFloat(avgFlowRate) >= 5 && parseFloat(avgLirioCoverage) <= 80 && parseFloat(aeratorEfficiency) >= 50 && (
                <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                  <Settings className="h-4 w-4" />
                  <span>All systems operating normally</span>
                </div>
              )}
            </div>
          </div>

          {/* Last Update */}
          <div className="border-t border-gray-200 pt-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700">Last System Check</div>
              <div className="text-xs text-gray-500">
                {latestReading ? new Date(latestReading.timestamp).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}