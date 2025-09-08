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

// Electrical component types
export interface ElectricalComponent {
  id: number
  farm_id: number
  component_type: string
  component_name: string
  status: string
  installation_date: string
  last_maintenance: string | null
  created_at: string
}

export interface MaintenanceRecord {
  id: number
  component_id: number
  maintenance_date: string
  maintenance_type: string
  description: string
  technician_name: string
  cost: number | null
  next_maintenance_date: string | null
  created_at: string
}

export interface GeneratorSpecification {
  id: number
  component_id: number
  power_rating_kw: number
  fuel_type: string
  efficiency_percentage: number
  manufacturer: string
  model: string
  year_manufactured: number
  created_at: string
}

export interface EnergyConsumptionData {
  id: number
  component_id: number
  timestamp: string
  voltage_l1_v: number
  voltage_l2_v: number
  voltage_l3_v: number
  current_l1_a: number
  current_l2_a: number
  current_l3_a: number
  power_factor: number
  active_power_kw: number
  frequency_hz: number
  energy_consumed_kwh: number
  energy_generated_kwh: number
  load_percentage: number
  efficiency_percent: number
  created_at: string
}

export interface FuelConsumptionData {
  id: number
  component_id: number
  timestamp: string
  fuel_consumed_liters: number
  fuel_rate_liters_per_hour: number
  fuel_level_percent: number
  operating_hours: number
  load_percentage: number
  fuel_efficiency_kwh_per_liter: number
  fuel_cost_per_liter: number
  total_fuel_cost: number
  created_at: string
}

export interface GeneratorOperationalStatus {
  id: number
  component_id: number
  timestamp: string
  is_running: boolean
  load_percentage: number
  oil_pressure_bar: number
  oil_temperature_celsius: number
  coolant_temperature_celsius: number
  battery_voltage_v: number
  rpm: number
  alarm_status: boolean
  maintenance_due: boolean
  auto_start_enabled: boolean
  remote_start_enabled: boolean
  created_at: string
}

// Combined data type for dashboard
export interface DashboardData {
  farm: Farm
  sensor: SensorReading
  weather: WeatherData
  operational: OperationalData
}