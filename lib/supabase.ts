import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqvxqginyiwbfxkwlghz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface Farm {
  id: number
  farm_name: string
  latitude: number
  longitude: number
  created_at: string
  updated_at: string
}

export interface SensorReading {
  id: number
  farm_id: number
  timestamp: string
  dissolved_oxygen: number
  temperature: number
  ph: number
  conductivity: number
  par: number
  ammonia: number
  nitrite: number
  turbidity: number
  chlorophyll: number
  created_at: string
}

export interface WeatherData {
  id: number
  farm_id: number
  timestamp: string
  air_pressure: number
  wind_speed: number
  rainfall: number
  created_at: string
}

export interface OperationalData {
  id: number
  farm_id: number
  timestamp: string
  flow_rate: number
  lirio_coverage: number
  aerator_status: number
  created_at: string
}

// Combined data type for dashboard
export interface DashboardData {
  farm: Farm
  sensor: SensorReading
  weather: WeatherData
  operational: OperationalData
}