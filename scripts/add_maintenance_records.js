import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqvxqginyiwbfxkwlghz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function addMaintenanceRecords() {
  console.log('🔧 Adding maintenance records...')
  
  try {
    // Get all electrical components
    const { data: components, error: compError } = await supabase
      .from('electrical_components')
      .select('id, component_name')
    
    if (compError) {
      console.error('Error fetching components:', compError)
      return
    }
    
    console.log(`Found ${components.length} components`)
    
    for (const component of components) {
      console.log(`Adding maintenance records for: ${component.component_name}`)
      
      const maintenanceRecords = [
        {
          component_id: component.id,
          maintenance_type: 'preventive',
          maintenance_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          technician_name: 'John Smith',
          description: 'Regular 500-hour maintenance service',
          parts_replaced: ['oil_filter', 'air_filter', 'fuel_filter'],
          labor_hours: 4,
          cost_parts: 250.00,
          cost_labor: 400.00,
          total_cost: 650.00,
          next_maintenance_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          next_maintenance_hours: 500,
          status: 'completed',
          notes: 'All systems operating normally'
        },
        {
          component_id: component.id,
          maintenance_type: 'inspection',
          maintenance_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          technician_name: 'Mike Johnson',
          description: 'Weekly inspection and fluid level check',
          labor_hours: 1,
          cost_labor: 100.00,
          total_cost: 100.00,
          status: 'completed',
          notes: 'All fluid levels normal, no issues detected'
        },
        {
          component_id: component.id,
          maintenance_type: 'corrective',
          maintenance_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          technician_name: 'Sarah Wilson',
          description: 'Replaced faulty temperature sensor',
          parts_replaced: ['temperature_sensor'],
          labor_hours: 2,
          cost_parts: 150.00,
          cost_labor: 200.00,
          total_cost: 350.00,
          status: 'completed',
          notes: 'Temperature sensor was giving incorrect readings'
        }
      ]
      
      const { error: insertError } = await supabase
        .from('maintenance_records')
        .insert(maintenanceRecords)
      
      if (insertError) {
        console.error(`Error inserting maintenance records for component ${component.id}:`, insertError)
      } else {
        console.log(`✅ Added 3 maintenance records for ${component.component_name}`)
      }
    }
    
    console.log('\n🎉 Maintenance records added successfully!')
    
  } catch (error) {
    console.error('❌ Error adding maintenance records:', error)
  }
}

addMaintenanceRecords()