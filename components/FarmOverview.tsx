'use client'

import { Farm } from '../lib/supabase'
import { MapPin } from 'lucide-react'

interface FarmOverviewProps {
  farms: Farm[]
  selectedFarm: string
}

export default function FarmOverview({ farms, selectedFarm }: FarmOverviewProps) {
  const filteredFarms = selectedFarm === 'all' ? farms : farms.filter(farm => farm.farm_name === selectedFarm)

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Farm Overview</h3>
      
      {filteredFarms.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No farms found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFarms.map((farm) => (
            <div key={farm.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">{farm.farm_name}</h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>Lat: {farm.latitude.toFixed(6)}, Lng: {farm.longitude.toFixed(6)}</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 text-green-600 font-medium">Active</span>
                </div>
                <div>
                  <span className="text-gray-500">Last Update:</span>
                  <span className="ml-2 text-gray-900">{new Date(farm.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedFarm === 'all' && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{farms.length}</div>
              <div className="text-gray-500">Total Farms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{farms.length}</div>
              <div className="text-gray-500">Active</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}