import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqvxqginyiwbfxkwlghz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function forceFixGranja1() {
  console.log('🔧 Force fixing Granja 1 generators...')
  
  try {
    // Target specific generator IDs to remove (2 and 3)
    const generatorsToRemove = [2, 3]
    
    for (const generatorId of generatorsToRemove) {
      console.log(`\n🗑️ Removing generator ID ${generatorId}...`)
      
      // Delete all related data step by step
      
      console.log('   Deleting maintenance records...')
      const { error: maintenanceError } = await supabase
        .from('maintenance_records')
        .delete()
        .eq('component_id', generatorId)
      
      if (maintenanceError) {
        console.log('   Maintenance records error:', maintenanceError.message)
      }
      
      console.log('   Deleting fuel consumption data...')
      const { error: fuelError } = await supabase
        .from('fuel_consumption_data')
        .delete()
        .eq('component_id', generatorId)
      
      if (fuelError) {
        console.log('   Fuel consumption error:', fuelError.message)
      }
      
      console.log('   Deleting energy consumption data...')
      const { error: energyError } = await supabase
        .from('energy_consumption_data')
        .delete()
        .eq('component_id', generatorId)
      
      if (energyError) {
        console.log('   Energy consumption error:', energyError.message)
      }
      
      console.log('   Deleting operational status...')
      const { error: statusError } = await supabase
        .from('generator_operational_status')
        .delete()
        .eq('component_id', generatorId)
      
      if (statusError) {
        console.log('   Operational status error:', statusError.message)
      }
      
      console.log('   Deleting generator specifications...')
      const { error: specError } = await supabase
        .from('generator_specifications')
        .delete()
        .eq('component_id', generatorId)
      
      if (specError) {
        console.log('   Generator specifications error:', specError.message)
      }
      
      console.log('   Deleting electrical component...')
      const { error: componentError } = await supabase
        .from('electrical_components')
        .delete()
        .eq('id', generatorId)
      
      if (componentError) {
        console.error(`   ❌ Failed to delete generator ${generatorId}:`, componentError)
      } else {
        console.log(`   ✅ Successfully deleted generator ID ${generatorId}`)
      }
    }
    
    // Verify the result
    console.log('\n🔍 Verifying results...')
    const { data: remainingGenerators, error: verifyError } = await supabase
      .from('electrical_components')
      .select('id, component_name')
      .eq('farm_id', 1)
      .eq('component_type', 'generator')
    
    if (verifyError) {
      console.error('Verification error:', verifyError)
    } else {
      console.log(`Farm 1 now has ${remainingGenerators.length} generator(s):`)
      remainingGenerators.forEach(gen => {
        console.log(`   - ID ${gen.id}: ${gen.component_name}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error in force fix:', error)
  }
}

forceFixGranja1()