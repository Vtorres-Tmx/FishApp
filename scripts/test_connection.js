import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqvxqginyiwbfxkwlghz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns'

console.log('Testing Supabase connection...')

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('Fetching farms...')
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Success! Found farms:', data.length)
      console.log('First farm:', data[0])
    }
  } catch (err) {
    console.error('Caught error:', err)
  }
}

testConnection()