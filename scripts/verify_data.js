import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqvxqginyiwbfxkwlghz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyData() {
  console.log('🔍 Verifying electrical data...')
  
  try {
    // Check electrical components
    const { data: components, error: compError } = await supabase
      .from('electrical_components')
      .select('*')
    
    console.log(`📊 Electrical components: ${components?.length || 0} records`)
    
    // Check generator specifications
    const { data: specs, error: specsError } = await supabase
      .from('generator_specifications')
      .select('*')
    
    console.log(`⚙️ Generator specifications: ${specs?.length || 0} records`)
    
    // Check fuel consumption data
    const { data: fuel, error: fuelError } = await supabase
      .from('fuel_consumption_data')
      .select('*')
    
    console.log(`⛽ Fuel consumption data: ${fuel?.length || 0} records`)
    
    // Check energy consumption data
    const { data: energy, error: energyError } = await supabase
      .from('energy_consumption_data')
      .select('*')
    
    console.log(`⚡ Energy consumption data: ${energy?.length || 0} records`)
    
    // Check maintenance records
    const { data: maintenance, error: mainError } = await supabase
      .from('maintenance_records')
      .select('*')
    
    console.log(`🔧 Maintenance records: ${maintenance?.length || 0} records`)
    
    // Check operational status
    const { data: status, error: statusError } = await supabase
      .from('generator_operational_status')
      .select('*')
    
    console.log(`📈 Operational status: ${status?.length || 0} records`)
    
    if (components?.length > 0) {
      console.log('\n✅ Sample electrical component:')
      console.log(components[0])
    }
    
  } catch (error) {
    console.error('❌ Error verifying data:', error)
  }
}

verifyData()