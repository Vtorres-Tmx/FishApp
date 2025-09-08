import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqvxqginyiwbfxkwlghz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixGranja1Generators() {
  console.log('🔧 Fixing Granja 1 generators to have exactly 1...')
  
  try {
    // Get all generators for Farm ID 1 (Granja 1)
    const { data: granja1Generators, error: genError } = await supabase
      .from('electrical_components')
      .select('id, component_name')
      .eq('farm_id', 1)
      .eq('component_type', 'generator')
      .order('id')
    
    if (genError) {
      console.error('Error fetching Granja 1 generators:', genError)
      return
    }
    
    console.log(`Found ${granja1Generators.length} generators for Granja 1:`)
    granja1Generators.forEach((gen, index) => {
      console.log(`   ${index + 1}. ID ${gen.id}: ${gen.component_name}`)
    })
    
    if (granja1Generators.length <= 1) {
      console.log('✅ Granja 1 already has 1 or fewer generators. No action needed.')
      return
    }
    
    // Keep the first generator, remove the rest
    const keepGenerator = granja1Generators[0]
    const removeGenerators = granja1Generators.slice(1)
    
    console.log(`\n📌 Keeping: ID ${keepGenerator.id} - ${keepGenerator.component_name}`)
    console.log(`🗑️ Removing ${removeGenerators.length} extra generators:`)
    
    for (const generator of removeGenerators) {
      console.log(`   Removing ID ${generator.id}: ${generator.component_name}`)
      
      // Delete related data first (foreign key constraints)
      
      // Delete maintenance records
      await supabase
        .from('maintenance_records')
        .delete()
        .eq('component_id', generator.id)
      
      // Delete fuel consumption data
      await supabase
        .from('fuel_consumption_data')
        .delete()
        .eq('component_id', generator.id)
      
      // Delete energy consumption data
      await supabase
        .from('energy_consumption_data')
        .delete()
        .eq('component_id', generator.id)
      
      // Delete operational status
      await supabase
        .from('generator_operational_status')
        .delete()
        .eq('component_id', generator.id)
      
      // Delete generator specifications
      await supabase
        .from('generator_specifications')
        .delete()
        .eq('component_id', generator.id)
      
      // Finally delete the generator itself
      const { error: deleteError } = await supabase
        .from('electrical_components')
        .delete()
        .eq('id', generator.id)
      
      if (deleteError) {
        console.error(`Error deleting generator ${generator.id}:`, deleteError)
      } else {
        console.log(`   ✅ Successfully deleted generator ID ${generator.id}`)
      }
    }
    
    console.log(`\n🎉 Granja 1 now has exactly 1 generator!`)
    
  } catch (error) {
    console.error('❌ Error fixing Granja 1 generators:', error)
  }
}

fixGranja1Generators()