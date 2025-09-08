import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqvxqginyiwbfxkwlghz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugGenerators() {
  console.log('🔍 Debugging generator counts...')
  
  try {
    // Get all generators
    const { data: allGenerators, error: genError } = await supabase
      .from('electrical_components')
      .select('id, farm_id, component_name, component_type')
      .eq('component_type', 'generator')
      .order('farm_id', { ascending: true })
      .order('id', { ascending: true })
    
    if (genError) {
      console.error('Error fetching generators:', genError)
      return
    }
    
    console.log(`\n📊 Total generators found: ${allGenerators.length}`)
    console.log('\n📋 All generators by farm:')
    
    const generatorsByFarm = {}
    allGenerators.forEach(gen => {
      if (!generatorsByFarm[gen.farm_id]) {
        generatorsByFarm[gen.farm_id] = []
      }
      generatorsByFarm[gen.farm_id].push(gen)
    })
    
    Object.keys(generatorsByFarm).sort((a, b) => parseInt(a) - parseInt(b)).forEach(farmId => {
      const generators = generatorsByFarm[farmId]
      console.log(`   Farm ${farmId}: ${generators.length} generator(s)`)
      generators.forEach(gen => {
        console.log(`      - ID ${gen.id}: ${gen.component_name}`)
      })
    })
    
    // Check farms table
    const { data: farms, error: farmError } = await supabase
      .from('farms')
      .select('id, name')
      .order('id')
    
    if (farmError) {
      console.error('Error fetching farms:', farmError)
      return
    }
    
    console.log(`\n🏭 Total farms: ${farms.length}`)
    
  } catch (error) {
    console.error('❌ Error debugging generators:', error)
  }
}

debugGenerators()