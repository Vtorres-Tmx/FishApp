# Corrected code for your Jupyter notebook
# Copy and paste this into your notebook cell

from supabase import create_client
import pandas as pd

# Initialize Supabase client
url = "https://dqvxqginyiwbfxkwlghz.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns"
supabase = create_client(url, key)

# Load the expanded pond data (this replaces your 'data' variable)
data = pd.read_csv('Datos_Ficticios_Granjas_Expandido.csv')
print(f"Loaded {len(data)} rows of pond data with {len(data['pond_id'].unique())} ponds")

# Load coordinates data
coords_df = pd.read_excel('Coordenadas_Granjas.xlsx')

# Create coordinate mapping
coord_mapping = {}
for idx, row in coords_df.iterrows():
    granja_name = row['Nombre granja']
    coords_str = row['Coordenadas']
    
    # Parse latitude and longitude
    lat, lon = coords_str.split(', ')
    lat, lon = float(lat), float(lon)
    
    # Map granja numbers to pond IDs
    granja_num = int(granja_name.split()[-1])  # Extract number from "Granja X"
    pond_letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O']
    if granja_num <= len(pond_letters):
        pond_id = f'Pond_{pond_letters[granja_num-1]}'
        coord_mapping[pond_id] = {'latitude': lat, 'longitude': lon}

# Add coordinates to the data
data['latitude'] = data['pond_id'].map(lambda x: coord_mapping.get(x, {}).get('latitude', 0.0))
data['longitude'] = data['pond_id'].map(lambda x: coord_mapping.get(x, {}).get('longitude', 0.0))

# Now use 'data' instead of 'ponds' in your original code
ponds = data  # This creates the variable your original code was expecting

print(f"Data ready for upload: {len(ponds)} rows")
print(f"Sample data:")
print(ponds[['timestamp', 'pond_id', 'latitude', 'longitude', 'OD_mg_L', 'Temp_C']].head())

# Create tables in Supabase
try:
    # Create environmental measurements table
    # Note: You may need to create these RPC functions in Supabase first
    # supabase.rpc('create_environmental_data_table').execute()
    # supabase.rpc('create_weather_data_table').execute()
    # supabase.rpc('create_operational_data_table').execute()

    # Upload data in batches to avoid timeout
    batch_size = 100
    total_rows = len(ponds)
    
    print(f"\nStarting upload of {total_rows} rows in batches of {batch_size}...")
    
    # Environmental measurements table
    print("Uploading environmental data...")
    for i in range(0, total_rows, batch_size):
        batch_data = ponds.iloc[i:i+batch_size]
        env_batch = [{
            'timestamp': row['timestamp'],
            'pond_id': row['pond_id'],
            'latitude': row['latitude'],
            'longitude': row['longitude'],
            'dissolved_oxygen': row['OD_mg_L'],
            'temperature': row['Temp_C'],
            'ph': row['pH'],
            'conductivity': row['Conductivity_uScm'],
            'par': row['PAR_umol_m2s'],
            'ammonia': row['Ammonia_mg_L'],
            'nitrite': row['Nitrite_mg_L'],
            'turbidity': row['Turbidity_NTU'],
            'chlorophyll': row['Chlorophyll_ug_L']
        } for _, row in batch_data.iterrows()]
        
        supabase.table('environmental_data').insert(env_batch).execute()
        print(f"  Environmental batch {i//batch_size + 1}/{(total_rows-1)//batch_size + 1} uploaded")

    # Weather conditions table
    print("Uploading weather data...")
    for i in range(0, total_rows, batch_size):
        batch_data = ponds.iloc[i:i+batch_size]
        weather_batch = [{
            'timestamp': row['timestamp'],
            'pond_id': row['pond_id'],
            'air_pressure': row['AirPressure_hPa'],
            'wind_speed': row['Wind_m_s'],
            'rainfall': row['Rain_mm']
        } for _, row in batch_data.iterrows()]
        
        supabase.table('weather_data').insert(weather_batch).execute()
        print(f"  Weather batch {i//batch_size + 1}/{(total_rows-1)//batch_size + 1} uploaded")

    # Operational data table
    print("Uploading operational data...")
    for i in range(0, total_rows, batch_size):
        batch_data = ponds.iloc[i:i+batch_size]
        ops_batch = [{
            'timestamp': row['timestamp'],
            'pond_id': row['pond_id'],
            'flow_rate': row['Flow_m3_h'],
            'lirio_coverage': row['Lirio_Coverage_pct'],
            'aerator_status': row['Aerator_Status']
        } for _, row in batch_data.iterrows()]
        
        supabase.table('operational_data').insert(ops_batch).execute()
        print(f"  Operational batch {i//batch_size + 1}/{(total_rows-1)//batch_size + 1} uploaded")

    print("\n✅ Tables created and data successfully uploaded to Supabase")
    print(f"Total records uploaded: {total_rows * 3} (across 3 tables)")
    print(f"Ponds included: {sorted(ponds['pond_id'].unique())}")

except Exception as e:
    print(f"❌ Error: {str(e)}")
    print("\nTroubleshooting tips:")
    print("1. Make sure your Supabase tables exist with correct column names")
    print("2. Check your Supabase credentials and permissions")
    print("3. Verify your internet connection")
    print("4. Consider creating the RPC functions for table creation first")