import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqvxqginyiwbfxkwlghz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function convertExcessGenerators() {
  console.log('🔄 Converting excess generators to other component types...')
  
  try {
    // Get generators for Farm 1
    const { data: farm1Generators, error: genError } = await supabase
      .from('electrical_components')
      .select('id, component_name')
      .eq('farm_id', 1)
      .eq('component_type', 'generator')
      .order('id')
    
    if (genError) {
      console.error('Error fetching Farm 1 generators:', genError)
      return
    }
    
    console.log(`Found ${farm1Generators.length} generators for Farm 1:`)
    farm1Generators.forEach(gen => {
      console.log(`   ID ${gen.id}: ${gen.component_name}`)
    })
    
    if (farm1Generators.length <= 1) {
      console.log('✅ Farm 1 already has 1 or fewer generators.')
      return
    }
    
    // Convert the extra generators (keep the first one as generator)
    const keepGenerator = farm1Generators[0]
    const convertGenerators = farm1Generators.slice(1)
    
    console.log(`\n📌 Keeping as generator: ID ${keepGenerator.id} - ${keepGenerator.component_name}`)
    console.log(`🔄 Converting to other components: ${convertGenerators.length} generators`)
    
    for (let i = 0; i < convertGenerators.length; i++) {
      const generator = convertGenerators[i]
      const newType = i === 0 ? 'transformer' : 'control_panel'
      const newName = i === 0 ? 'Main Transformer - Granja 1' : 'Control Panel - Granja 1'
      
      console.log(`\nConverting ID ${generator.id} to ${newType}...`)
      
      // Update the component type and name
      const { error: updateError } = await supabase
        .from('electrical_components')
        .update({ 
          component_type: newType,
          component_name: newName
        })
        .eq('id', generator.id)
      
      if (updateError) {
        console.error(`❌ Error converting generator ${generator.id}:`, updateError)
      } else {
        console.log(`✅ Successfully converted ID ${generator.id} to ${newType}: ${newName}`)
      }
    }
    
    // Verify the result
    console.log('\n🔍 Verification...')
    
    // Count total generators
    const { data: allGenerators, error: allGenError } = await supabase
      .from('electrical_components')
      .select('id, farm_id, component_name')
      .eq('component_type', 'generator')
      .order('farm_id')
    
    if (allGenError) {
      console.error('Error counting all generators:', allGenError)
    } else {
      console.log(`\n📊 Total generators now: ${allGenerators.length}`)
      
      const gensByFarm = {}
      allGenerators.forEach(gen => {
        if (!gensByFarm[gen.farm_id]) {
          gensByFarm[gen.farm_id] = 0
        }
        gensByFarm[gen.farm_id]++
      })
      
      console.log('\nGenerators per farm:')
      Object.keys(gensByFarm).sort((a, b) => parseInt(a) - parseInt(b)).forEach(farmId => {
        console.log(`   Farm ${farmId}: ${gensByFarm[farmId]} generator(s)`)
      })
      
      // Count farms
      const { data: farms, error: farmError } = await supabase
        .from('farms')
        .select('id')
      
      if (!farmError) {
        console.log(`\n🎉 Result: ${allGenerators.length} generators for ${farms.length} farms`)
        if (allGenerators.length === farms.length) {
          console.log('✅ Perfect 1:1 ratio achieved!')
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error converting excess generators:', error)
  }
}

convertExcessGenerators()