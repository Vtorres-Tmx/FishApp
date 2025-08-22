from supabase import create_client
import pandas as pd
from datetime import datetime
import json

# Initialize Supabase client
url = "https://dqvxqginyiwbfxkwlghz.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns"
supabase = create_client(url, key)

# Load the data
print("Loading FishAppData.csv...")
df = pd.read_csv('FishAppData.csv')
print(f"Loaded {len(df)} rows with {len(df['pond_id'].unique())} unique farms")

# Create SQL statements for table creation
table_creation_sql = {
    'farms': """
    CREATE TABLE IF NOT EXISTS farms (
        id SERIAL PRIMARY KEY,
        farm_name VARCHAR(50) UNIQUE NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    """,
    
    'sensor_readings': """
    CREATE TABLE IF NOT EXISTS sensor_readings (
        id SERIAL PRIMARY KEY,
        farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        dissolved_oxygen DECIMAL(8, 6),
        temperature DECIMAL(6, 3),
        ph DECIMAL(5, 3),
        conductivity DECIMAL(8, 3),
        par DECIMAL(8, 3),
        ammonia DECIMAL(8, 6),
        nitrite DECIMAL(8, 6),
        turbidity DECIMAL(8, 3),
        chlorophyll DECIMAL(8, 3),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(farm_id, timestamp)
    );
    """,
    
    'weather_data': """
    CREATE TABLE IF NOT EXISTS weather_data (
        id SERIAL PRIMARY KEY,
        farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        air_pressure DECIMAL(8, 3),
        wind_speed DECIMAL(6, 3),
        rainfall DECIMAL(6, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(farm_id, timestamp)
    );
    """,
    
    'operational_data': """
    CREATE TABLE IF NOT EXISTS operational_data (
        id SERIAL PRIMARY KEY,
        farm_id INTEGER REFERENCES farms(id) ON DELETE CASCADE,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        flow_rate DECIMAL(8, 3),
        lirio_coverage DECIMAL(6, 3),
        aerator_status INTEGER CHECK (aerator_status IN (0, 1)),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(farm_id, timestamp)
    );
    """
}

# Create indexes for better performance
index_creation_sql = [
    "CREATE INDEX IF NOT EXISTS idx_sensor_readings_farm_timestamp ON sensor_readings(farm_id, timestamp);",
    "CREATE INDEX IF NOT EXISTS idx_weather_data_farm_timestamp ON weather_data(farm_id, timestamp);",
    "CREATE INDEX IF NOT EXISTS idx_operational_data_farm_timestamp ON operational_data(farm_id, timestamp);",
    "CREATE INDEX IF NOT EXISTS idx_farms_name ON farms(farm_name);"
]

def create_tables():
    """Create all tables in Supabase"""
    print("\nCreating database tables...")
    
    try:
        for table_name, sql in table_creation_sql.items():
            print(f"Creating table: {table_name}")
            result = supabase.rpc('exec_sql', {'sql': sql}).execute()
            print(f"✅ Table {table_name} created successfully")
        
        # Create indexes
        print("\nCreating indexes...")
        for sql in index_creation_sql:
            result = supabase.rpc('exec_sql', {'sql': sql}).execute()
        print("✅ Indexes created successfully")
        
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {str(e)}")
        print("Note: You may need to create an 'exec_sql' RPC function in Supabase first.")
        return False

def prepare_farm_data():
    """Prepare unique farm data"""
    print("\nPreparing farm catalog data...")
    
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
    
    print(f"Prepared {len(farms_list)} farm records")
    return farms_list

def upload_farms(farms_data):
    """Upload farm catalog data"""
    print("\nUploading farm catalog...")
    
    try:
        # Insert farms data
        result = supabase.table('farms').upsert(farms_data, on_conflict='farm_name').execute()
        print(f"✅ Uploaded {len(farms_data)} farm records")
        
        # Get farm IDs for reference
        farms_result = supabase.table('farms').select('id, farm_name').execute()
        farm_id_map = {farm['farm_name']: farm['id'] for farm in farms_result.data}
        
        return farm_id_map
    except Exception as e:
        print(f"❌ Error uploading farms: {str(e)}")
        return None

def prepare_sensor_data(farm_id_map):
    """Prepare sensor readings data"""
    print("\nPreparing sensor readings data...")
    
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
    
    print(f"Prepared {len(sensor_data)} sensor reading records")
    return sensor_data

def prepare_weather_data(farm_id_map):
    """Prepare weather data"""
    print("\nPreparing weather data...")
    
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
    
    print(f"Prepared {len(weather_data)} weather records")
    return weather_data

def prepare_operational_data(farm_id_map):
    """Prepare operational data"""
    print("\nPreparing operational data...")
    
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
    
    print(f"Prepared {len(operational_data)} operational records")
    return operational_data

def upload_data_in_batches(table_name, data, batch_size=100):
    """Upload data in batches to avoid timeouts"""
    print(f"\nUploading {table_name} data in batches...")
    
    total_batches = (len(data) - 1) // batch_size + 1
    
    try:
        for i in range(0, len(data), batch_size):
            batch = data[i:i+batch_size]
            batch_num = i // batch_size + 1
            
            result = supabase.table(table_name).upsert(batch).execute()
            print(f"  ✅ Batch {batch_num}/{total_batches} uploaded ({len(batch)} records)")
        
        print(f"✅ All {table_name} data uploaded successfully")
        return True
    except Exception as e:
        print(f"❌ Error uploading {table_name}: {str(e)}")
        return False

def main():
    """Main execution function"""
    print("=== Fish Farm Data Upload to Supabase ===")
    print(f"Data source: FishAppData.csv ({len(df)} records)")
    
    # Step 1: Create tables (optional - may need manual setup)
    print("\n📋 Note: Table creation via RPC may require manual setup in Supabase.")
    print("If tables don't exist, please create them manually using the SQL provided.")
    
    # Step 2: Prepare and upload farm catalog
    farms_data = prepare_farm_data()
    farm_id_map = upload_farms(farms_data)
    
    if not farm_id_map:
        print("❌ Failed to upload farms. Aborting.")
        return
    
    print(f"\n📊 Farm ID mapping: {farm_id_map}")
    
    # Step 3: Prepare all data
    sensor_data = prepare_sensor_data(farm_id_map)
    weather_data = prepare_weather_data(farm_id_map)
    operational_data = prepare_operational_data(farm_id_map)
    
    # Step 4: Upload all data
    success_count = 0
    
    if upload_data_in_batches('sensor_readings', sensor_data):
        success_count += 1
    
    if upload_data_in_batches('weather_data', weather_data):
        success_count += 1
    
    if upload_data_in_batches('operational_data', operational_data):
        success_count += 1
    
    # Summary
    print("\n" + "="*50)
    print("📈 UPLOAD SUMMARY")
    print("="*50)
    print(f"✅ Farms uploaded: {len(farms_data)} records")
    print(f"✅ Tables successfully uploaded: {success_count}/3")
    print(f"📊 Total data points: {len(sensor_data) + len(weather_data) + len(operational_data)}")
    
    if success_count == 3:
        print("\n🎉 All data uploaded successfully to Supabase!")
        print("\n📋 Database Schema:")
        print("   • farms (catalog): farm_name, latitude, longitude")
        print("   • sensor_readings: water quality measurements")
        print("   • weather_data: environmental conditions")
        print("   • operational_data: equipment and coverage data")
    else:
        print(f"\n⚠️  Some uploads failed. Please check the errors above.")

# Print SQL for manual table creation
print("\n" + "="*60)
print("📋 SQL FOR MANUAL TABLE CREATION (if needed)")
print("="*60)
for table_name, sql in table_creation_sql.items():
    print(f"\n-- {table_name.upper()} TABLE")
    print(sql)

print("\n-- INDEXES")
for sql in index_creation_sql:
    print(sql)

if __name__ == "__main__":
    main()