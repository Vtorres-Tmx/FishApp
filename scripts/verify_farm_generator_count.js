import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqvxqginyiwbfxkwlghz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyFarmGeneratorCount() {
  console.log('🔍 Verifying farm and generator counts...')
  
  try {
    // Count total farms
    const { data: farms, error: farmsError } = await supabase
      .from('farms')
      .select('id, farm_name')
    
    if (farmsError) {
      console.error('Error fetching farms:', farmsError)
      return
    }
    
    // Count total generators
    const { data: generators, error: genError } = await supabase
      .from('electrical_components')
      .select('id, farm_id, component_name')
      .eq('component_type', 'generator')
    
    if (genError) {
      console.error('Error fetching generators:', genError)
      return
    }
    
    console.log(`\n📊 COUNT VERIFICATION:`)
    console.log(`🏭 Total Farms: ${farms.length}`)
    console.log(`⚡ Total Generators: ${generators.length}`)
    
    if (farms.length === generators.length) {
      console.log(`\n✅ MATCH CONFIRMED: ${farms.length} farms have ${generators.length} generators (1:1 ratio)`)
    } else {
      console.log(`\n❌ MISMATCH DETECTED: ${farms.length} farms but ${generators.length} generators`)
      
      // Find farms without generators
      const farmIds = farms.map(f => f.id)
      const generatorFarmIds = generators.map(g => g.farm_id)
      const farmsWithoutGenerators = farmIds.filter(id => !generatorFarmIds.includes(id))
      const farmsWithGenerators = farmIds.filter(id => generatorFarmIds.includes(id))
      
      if (farmsWithoutGenerators.length > 0) {
        console.log(`\n🚨 Farms WITHOUT generators (${farmsWithoutGenerators.length}):`);
        farmsWithoutGenerators.forEach(farmId => {
          const farm = farms.find(f => f.id === farmId)
          console.log(`   - Farm ID ${farmId}: ${farm?.farm_name}`)
        })
      }
      
      if (farmsWithGenerators.length > 0) {
        console.log(`\n✅ Farms WITH generators (${farmsWithGenerators.length}):`);
        farmsWithGenerators.forEach(farmId => {
          const farm = farms.find(f => f.id === farmId)
          const farmGenerators = generators.filter(g => g.farm_id === farmId)
          console.log(`   - Farm ID ${farmId}: ${farm?.farm_name} (${farmGenerators.length} generator(s))`)
        })
      }
    }
    
    console.log(`\n📋 DETAILED BREAKDOWN:`)
    console.log('Farms:')
    farms.forEach(farm => {
      const farmGenerators = generators.filter(g => g.farm_id === farm.id)
      console.log(`   ${farm.id}: ${farm.farm_name} - ${farmGenerators.length} generator(s)`)
    })
    
  } catch (error) {
    console.error('❌ Error during verification:', error)
  }
}

verifyFarmGeneratorCount()