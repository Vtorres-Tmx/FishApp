import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqvxqginyiwbfxkwlghz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkAndDelete() {
  console.log('🔍 Checking RLS and attempting deletion...')
  
  try {
    // First, let's see what generators exist for farm 1
    console.log('\n📋 Current generators for Farm 1:')
    const { data: beforeGenerators, error: beforeError } = await supabase
      .from('electrical_components')
      .select('id, component_name, created_at')
      .eq('farm_id', 1)
      .eq('component_type', 'generator')
      .order('id')
    
    if (beforeError) {
      console.error('Error fetching generators:', beforeError)
      return
    }
    
    beforeGenerators.forEach(gen => {
      console.log(`   ID ${gen.id}: ${gen.component_name} (created: ${gen.created_at})`)
    })
    
    if (beforeGenerators.length <= 1) {
      console.log('✅ Farm 1 already has 1 or fewer generators.')
      return
    }
    
    // Try to delete using a transaction approach
    console.log('\n🗑️ Attempting to delete extra generators using transaction...')
    
    // Keep the first one, delete the rest
    const keepId = beforeGenerators[0].id
    const deleteIds = beforeGenerators.slice(1).map(g => g.id)
    
    console.log(`Keeping generator ID ${keepId}`)
    console.log(`Deleting generator IDs: ${deleteIds.join(', ')}`)
    
    for (const deleteId of deleteIds) {
      console.log(`\nDeleting generator ID ${deleteId}...`)
      
      // Try direct deletion with more specific error handling
      const { data: deleteResult, error: deleteError } = await supabase
        .from('electrical_components')
        .delete()
        .eq('id', deleteId)
        .eq('farm_id', 1)
        .eq('component_type', 'generator')
        .select()
      
      if (deleteError) {
        console.error(`❌ Delete error for ID ${deleteId}:`, deleteError)
        
        // Try to get more info about the error
        if (deleteError.code) {
          console.log(`Error code: ${deleteError.code}`)
        }
        if (deleteError.details) {
          console.log(`Error details: ${deleteError.details}`)
        }
      } else {
        console.log(`✅ Delete result for ID ${deleteId}:`, deleteResult)
      }
    }
    
    // Check the result
    console.log('\n🔍 Checking result...')
    const { data: afterGenerators, error: afterError } = await supabase
      .from('electrical_components')
      .select('id, component_name')
      .eq('farm_id', 1)
      .eq('component_type', 'generator')
      .order('id')
    
    if (afterError) {
      console.error('Error checking result:', afterError)
    } else {
      console.log(`Farm 1 now has ${afterGenerators.length} generator(s):`)
      afterGenerators.forEach(gen => {
        console.log(`   ID ${gen.id}: ${gen.component_name}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkAndDelete()