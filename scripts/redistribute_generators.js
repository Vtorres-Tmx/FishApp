import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqvxqginyiwbfxkwlghz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function redistributeGenerators() {
  console.log('🔄 Redistributing generators to achieve 1:1 ratio...')
  
  try {
    // Get all farms
    const { data: farms, error: farmError } = await supabase
      .from('farms')
      .select('id')
      .order('id')
    
    if (farmError) {
      console.error('Error fetching farms:', farmError)
      return
    }
    
    console.log(`Found ${farms.length} farms`)
    
    // Get all generators grouped by farm
    const { data: generators, error: genError } = await supabase
      .from('electrical_components')
      .select('id, farm_id, component_name')
      .eq('component_type', 'generator')
      .order('farm_id')
      .order('id')
    
    if (genError) {
      console.error('Error fetching generators:', genError)
      return
    }
    
    console.log(`Found ${generators.length} generators`)
    
    // Group generators by farm
    const generatorsByFarm = {}
    generators.forEach(gen => {
      if (!generatorsByFarm[gen.farm_id]) {
        generatorsByFarm[gen.farm_id] = []
      }
      generatorsByFarm[gen.farm_id].push(gen)
    })
    
    // Find farms without generators
    const farmsWithoutGenerators = farms.filter(farm => !generatorsByFarm[farm.id])
    console.log(`Farms without generators: ${farmsWithoutGenerators.map(f => f.id).join(', ')}`)
    
    // Find farms with multiple generators
    const farmsWithMultipleGenerators = Object.keys(generatorsByFarm)
      .filter(farmId => generatorsByFarm[farmId].length > 1)
      .map(farmId => ({ farmId: parseInt(farmId), generators: generatorsByFarm[farmId] }))
    
    console.log('Farms with multiple generators:')
    farmsWithMultipleGenerators.forEach(farm => {
      console.log(`   Farm ${farm.farmId}: ${farm.generators.length} generators`)
    })
    
    // Redistribute excess generators
    let targetFarmIndex = 0
    
    for (const farm of farmsWithMultipleGenerators) {
      const excessGenerators = farm.generators.slice(1) // Keep the first one
      
      for (const excessGen of excessGenerators) {
        if (targetFarmIndex >= farmsWithoutGenerators.length) {
          console.log('⚠️ No more farms available for redistribution')
          break
        }
        
        const targetFarm = farmsWithoutGenerators[targetFarmIndex]
        console.log(`Moving generator ID ${excessGen.id} from Farm ${farm.farmId} to Farm ${targetFarm.id}`)
        
        // Update the generator's farm_id
        const { error: updateError } = await supabase
          .from('electrical_components')
          .update({ 
            farm_id: targetFarm.id,
            component_name: `Main Generator - Granja ${targetFarm.id}`
          })
          .eq('id', excessGen.id)
        
        if (updateError) {
          console.error(`❌ Error moving generator ${excessGen.id}:`, updateError)
        } else {
          console.log(`✅ Successfully moved generator ${excessGen.id} to Farm ${targetFarm.id}`)
          
          // Update related records
          await supabase
            .from('generator_specifications')
            .update({ component_id: excessGen.id })
            .eq('component_id', excessGen.id)
          
          await supabase
            .from('fuel_consumption_data')
            .update({ component_id: excessGen.id })
            .eq('component_id', excessGen.id)
          
          await supabase
            .from('energy_consumption_data')
            .update({ component_id: excessGen.id })
            .eq('component_id', excessGen.id)
          
          await supabase
            .from('maintenance_records')
            .update({ component_id: excessGen.id })
            .eq('component_id', excessGen.id)
          
          await supabase
            .from('generator_operational_status')
            .update({ component_id: excessGen.id })
            .eq('component_id', excessGen.id)
        }
        
        targetFarmIndex++
      }
    }
    
    // Final verification
    console.log('\n🔍 Final verification...')
    const { data: finalGenerators, error: finalError } = await supabase
      .from('electrical_components')
      .select('id, farm_id, component_name')
      .eq('component_type', 'generator')
      .order('farm_id')
    
    if (finalError) {
      console.error('Error in final verification:', finalError)
    } else {
      const finalByFarm = {}
      finalGenerators.forEach(gen => {
        if (!finalByFarm[gen.farm_id]) {
          finalByFarm[gen.farm_id] = []
        }
        finalByFarm[gen.farm_id].push(gen)
      })
      
      console.log('\n📊 Final distribution:')
      Object.keys(finalByFarm).sort((a, b) => parseInt(a) - parseInt(b)).forEach(farmId => {
        const gens = finalByFarm[farmId]
        console.log(`   Farm ${farmId}: ${gens.length} generator(s)`)
      })
      
      console.log(`\n🎉 Total: ${finalGenerators.length} generators for ${farms.length} farms`)
    }
    
  } catch (error) {
    console.error('❌ Error redistributing generators:', error)
  }
}

redistributeGenerators()