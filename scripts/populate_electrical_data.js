import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqvxqginyiwbfxkwlghz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function populateElectricalData() {
  try {
    console.log('🚀 Starting electrical data population...')
    console.log('Supabase URL:', supabaseUrl)
    console.log('Connecting to Supabase...')

    // Get existing farms
    const { data: farms, error: farmsError } = await supabase
      .from('farms')
      .select('id, farm_name')
    
    if (farmsError) {
      console.error('Error fetching farms:', farmsError)
      return
    }

    console.log(`Found ${farms.length} farms`)

    // Insert electrical components for each farm
    for (const farm of farms) {
      console.log(`Processing farm: ${farm.farm_name}`)
      
      // Check if generator already exists for this farm
      const { data: existingGenerator } = await supabase
        .from('electrical_components')
        .select('id')
        .eq('farm_id', farm.id)
        .eq('component_type', 'generator')
        .single()

      let generatorId
      
      if (!existingGenerator) {
        // Insert new generator
        const { data: generator, error: genError } = await supabase
          .from('electrical_components')
          .insert({
            farm_id: farm.id,
            component_type: 'generator',
            component_name: `Main Generator - ${farm.farm_name}`,
            manufacturer: 'Caterpillar',
            model: 'C9.3',
            serial_number: `CAT${farm.id}${Date.now().toString().slice(-6)}`,
            installation_date: '2023-01-15',
            warranty_expiry: '2026-01-15',
            status: 'active',
            location_description: 'Main electrical building'
          })
          .select()
          .single()

        if (genError) {
          console.error(`Error inserting generator for farm ${farm.id}:`, genError)
          continue
        }
        generatorId = generator.id
      } else {
        generatorId = existingGenerator.id
        console.log(`Generator already exists for farm ${farm.farm_name}`)
      }

      // Insert generator specifications (if not exists)
      const { data: existingSpecs } = await supabase
        .from('generator_specifications')
        .select('id')
        .eq('component_id', generatorId)
        .single()

      if (!existingSpecs) {
        await supabase
          .from('generator_specifications')
          .insert({
            component_id: generatorId,
            rated_power_kw: 350,
            max_power_kw: 385,
            voltage_rating: 480,
            frequency_hz: 60,
            fuel_type: 'diesel',
            fuel_tank_capacity_liters: 1000,
            engine_displacement_cc: 9300,
            cooling_system: 'water_cooled',
            starting_system: 'electric',
            noise_level_db: 75,
            weight_kg: 2500,
            efficiency_rating: 0.92
          })
      }

      // Insert current operational status
      await supabase
        .from('generator_operational_status')
        .upsert({
          component_id: generatorId,
          timestamp: new Date().toISOString(),
          operational_status: Math.random() > 0.3 ? 'running' : 'standby',
          run_hours_total: Math.floor(Math.random() * 5000) + 1000,
          run_hours_since_maintenance: Math.floor(Math.random() * 500),
          engine_temperature_celsius: Math.random() * 20 + 80,
          oil_pressure_bar: Math.random() * 2 + 3,
          oil_temperature_celsius: Math.random() * 15 + 85,
          coolant_temperature_celsius: Math.random() * 10 + 75,
          battery_voltage_v: Math.random() * 2 + 12,
          rpm: Math.random() * 200 + 1600,
          alarm_status: Math.random() > 0.9,
          maintenance_due: Math.random() > 0.8,
          auto_start_enabled: true,
          remote_start_enabled: true
        }, {
          onConflict: 'component_id,timestamp'
        })

      // Insert recent fuel consumption data (last 24 hours)
      const now = new Date()
      const fuelData = []
      for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
        fuelData.push({
          component_id: generatorId,
          timestamp: timestamp.toISOString(),
          fuel_consumed_liters: Math.random() * 50 + 20,
          fuel_rate_liters_per_hour: Math.random() * 30 + 15,
          fuel_level_percent: Math.random() * 40 + 60,
          operating_hours: Math.random() * 1,
          load_percentage: Math.random() * 40 + 40,
          fuel_efficiency_kwh_per_liter: Math.random() * 2 + 3,
          fuel_cost_per_liter: 1.25,
          total_fuel_cost: (Math.random() * 50 + 20) * 1.25
        })
      }
      
      await supabase
        .from('fuel_consumption_data')
        .upsert(fuelData, {
          onConflict: 'component_id,timestamp'
        })

      // Insert recent energy consumption data (last 24 hours)
      const energyData = []
      for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
        energyData.push({
          component_id: generatorId,
          timestamp: timestamp.toISOString(),
          voltage_l1_v: Math.random() * 20 + 470,
          voltage_l2_v: Math.random() * 20 + 470,
          voltage_l3_v: Math.random() * 20 + 470,
          current_l1_a: Math.random() * 100 + 200,
          current_l2_a: Math.random() * 100 + 200,
          current_l3_a: Math.random() * 100 + 200,
          power_factor: Math.random() * 0.2 + 0.8,
          active_power_kw: Math.random() * 100 + 250,
          frequency_hz: Math.random() * 2 + 59,
          energy_consumed_kwh: Math.random() * 300 + 200,
          energy_generated_kwh: Math.random() * 350 + 250,
          load_percentage: Math.random() * 40 + 40,
          efficiency_percent: Math.random() * 10 + 85
        })
      }
      
      await supabase
        .from('energy_consumption_data')
        .upsert(energyData, {
          onConflict: 'component_id,timestamp'
        })

      // Insert maintenance records
      const maintenanceRecords = [
        {
          component_id: generatorId,
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
          component_id: generatorId,
          maintenance_type: 'inspection',
          maintenance_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          technician_name: 'Mike Johnson',
          description: 'Weekly inspection and fluid level check',
          labor_hours: 1,
          cost_labor: 100.00,
          total_cost: 100.00,
          status: 'completed',
          notes: 'All fluid levels normal, no issues detected'
        }
      ]

      await supabase
        .from('maintenance_records')
        .upsert(maintenanceRecords, {
          onConflict: 'component_id,maintenance_date,maintenance_type'
        })

      console.log(`Completed data insertion for farm: ${farm.farm_name}`)
    }

    console.log('\n✅ Electrical data population completed successfully!')
    console.log('\nSummary:')
    console.log(`- Processed ${farms.length} farms`)
    console.log('- Added/updated electrical components')
    console.log('- Populated generator specifications')
    console.log('- Added 24 hours of fuel consumption data per farm')
    console.log('- Added 24 hours of energy consumption data per farm')
    console.log('- Added maintenance records')
    console.log('- Updated operational status')
    
  } catch (error) {
    console.error('❌ Error populating electrical data:', error)
  }
}

populateElectricalData()