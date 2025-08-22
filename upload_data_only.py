from supabase import create_client
import pandas as pd
from datetime import datetime

# Initialize Supabase client
url = "https://dqvxqginyiwbfxkwlghz.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns"
supabase = create_client(url, key)

print("=== Fish Farm Data Upload to Supabase ===")
print("⚠️  IMPORTANT: Make sure you have run the create_tables.sql file in Supabase first!")
print("\nLoading FishAppData.csv...")

# Load the data
df = pd.read_csv('FishAppData.csv')
print(f"Loaded {len(df)} rows with {len(df['pond_id'].unique())} unique farms")
print(f"Farms: {', '.join(df['pond_id'].unique())}")

def upload_farms():
    """Upload farm catalog data"""
    print("\n🏭 Step 1: Uploading farm catalog...")
    
    # Get unique farms with their coordinates
    farms_data = df.groupby('pond_id').agg({
        'latitude': 'first',
        'longitude': 'first'
    }).reset_index()
    
    farms_list = []
    for _, row in farms_data.iterrows():
        farms_list.append({
            'farm_name': row['pond_id'],
            'latitude': float(row['latitude']),
            'longitude': float(row['longitude'])
        })
    
    try:
        # Insert farms data (upsert to handle duplicates)
        result = supabase.table('farms').upsert(farms_list, on_conflict='farm_name').execute()
        print(f"✅ Uploaded {len(farms_list)} farm records")
        
        # Get farm IDs for reference
        farms_result = supabase.table('farms').select('id, farm_name').execute()
        farm_id_map = {farm['farm_name']: farm['id'] for farm in farms_result.data}
        print(f"📊 Farm ID mapping: {farm_id_map}")
        
        return farm_id_map
    except Exception as e:
        print(f"❌ Error uploading farms: {str(e)}")
        return None

def upload_data_in_batches(table_name, data, batch_size=50):
    """Upload data in batches to avoid timeouts"""
    print(f"\n📊 Uploading {len(data)} records to {table_name}...")
    
    total_batches = (len(data) - 1) // batch_size + 1
    successful_batches = 0
    
    try:
        for i in range(0, len(data), batch_size):
            batch = data[i:i+batch_size]
            batch_num = i // batch_size + 1
            
            try:
                result = supabase.table(table_name).upsert(batch).execute()
                successful_batches += 1
                print(f"  ✅ Batch {batch_num}/{total_batches} uploaded ({len(batch)} records)")
            except Exception as batch_error:
                print(f"  ❌ Batch {batch_num}/{total_batches} failed: {str(batch_error)}")
                # Continue with next batch
                continue
        
        print(f"✅ {table_name}: {successful_batches}/{total_batches} batches uploaded successfully")
        return successful_batches == total_batches
    except Exception as e:
        print(f"❌ Error uploading {table_name}: {str(e)}")
        return False

def main():
    """Main execution function"""
    
    # Step 1: Upload farms
    farm_id_map = upload_farms()
    
    if not farm_id_map:
        print("❌ Failed to upload farms. Please check if tables exist and try again.")
        print("💡 Run the create_tables.sql file in Supabase SQL Editor first.")
        return
    
    # Step 2: Prepare sensor readings data
    print("\n🌡️  Step 2: Preparing sensor readings data...")
    sensor_data = []
    for _, row in df.iterrows():
        farm_id = farm_id_map.get(row['pond_id'])
        if farm_id:
            sensor_data.append({
                'farm_id': farm_id,
                'timestamp': row['timestamp'],
                'dissolved_oxygen': float(row['OD_mg_L']),
                'temperature': float(row['Temp_C']),
                'ph': float(row['pH']),
                'conductivity': float(row['Conductivity_uScm']),
                'par': float(row['PAR_umol_m2s']),
                'ammonia': float(row['Ammonia_mg_L']),
                'nitrite': float(row['Nitrite_mg_L']),
                'turbidity': float(row['Turbidity_NTU']),
                'chlorophyll': float(row['Chlorophyll_ug_L'])
            })
    
    # Step 3: Prepare weather data
    print("\n🌤️  Step 3: Preparing weather data...")
    weather_data = []
    for _, row in df.iterrows():
        farm_id = farm_id_map.get(row['pond_id'])
        if farm_id:
            weather_data.append({
                'farm_id': farm_id,
                'timestamp': row['timestamp'],
                'air_pressure': float(row['AirPressure_hPa']),
                'wind_speed': float(row['Wind_m_s']),
                'rainfall': float(row['Rain_mm'])
            })
    
    # Step 4: Prepare operational data
    print("\n⚙️  Step 4: Preparing operational data...")
    operational_data = []
    for _, row in df.iterrows():
        farm_id = farm_id_map.get(row['pond_id'])
        if farm_id:
            operational_data.append({
                'farm_id': farm_id,
                'timestamp': row['timestamp'],
                'flow_rate': float(row['Flow_m3_h']),
                'lirio_coverage': float(row['Lirio_Coverage_pct']),
                'aerator_status': int(row['Aerator_Status'])
            })
    
    print(f"\n📋 Data Summary:")
    print(f"   • Sensor readings: {len(sensor_data)} records")
    print(f"   • Weather data: {len(weather_data)} records")
    print(f"   • Operational data: {len(operational_data)} records")
    
    # Step 5: Upload all data
    print("\n🚀 Starting data upload...")
    
    results = {
        'sensor_readings': upload_data_in_batches('sensor_readings', sensor_data),
        'weather_data': upload_data_in_batches('weather_data', weather_data),
        'operational_data': upload_data_in_batches('operational_data', operational_data)
    }
    
    # Final summary
    print("\n" + "="*60)
    print("📈 FINAL UPLOAD SUMMARY")
    print("="*60)
    print(f"✅ Farms uploaded: {len(farm_id_map)} records")
    
    success_count = sum(1 for success in results.values() if success)
    print(f"✅ Data tables successfully uploaded: {success_count}/3")
    
    for table, success in results.items():
        status = "✅ Success" if success else "❌ Failed"
        print(f"   • {table}: {status}")
    
    total_records = len(sensor_data) + len(weather_data) + len(operational_data)
    print(f"📊 Total data points processed: {total_records}")
    
    if success_count == 3:
        print("\n🎉 All data uploaded successfully to Supabase!")
        print("\n📋 Your relational database structure:")
        print("   • farms (catalog): 15 farms with coordinates")
        print("   • sensor_readings: water quality measurements")
        print("   • weather_data: environmental conditions")
        print("   • operational_data: equipment and coverage data")
        print("\n💡 You can now query your data using joins between tables!")
        print("\nExample queries:")
        print("   SELECT f.farm_name, s.temperature, s.ph FROM farms f JOIN sensor_readings s ON f.id = s.farm_id;")
        print("   SELECT f.farm_name, AVG(s.temperature) FROM farms f JOIN sensor_readings s ON f.id = s.farm_id GROUP BY f.farm_name;")
    else:
        print(f"\n⚠️  Some uploads failed. Please check the errors above and retry if needed.")

if __name__ == "__main__":
    main()