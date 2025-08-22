from supabase import create_client
import pandas as pd

# Initialize Supabase client
url = "https://dqvxqginyiwbfxkwlghz.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxdnhxZ2lueWl3YmZ4a3dsZ2h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NDYxMzUsImV4cCI6MjA3MTQyMjEzNX0.gpoywYO884CdQikXvJ1PRR9IJc0frTO75msKuEPaSns"
supabase = create_client(url, key)

# Load the expanded pond data
data = pd.read_csv('Datos_Ficticios_Granjas_Expandido.csv')
print(f"Loaded {len(data)} rows of pond data")

# Load coordinates data
coords_df = pd.read_excel('Coordenadas_Granjas.xlsx')
print(f"Loaded {len(coords_df)} coordinate entries")

# Parse coordinates and create mapping
coord_mapping = {}
for idx, row in coords_df.iterrows():
    granja_name = row['Nombre granja']
    coords_str = row['Coordenadas']
    
    # Parse latitude and longitude from string
    lat, lon = coords_str.split(', ')
    lat = float(lat)
    lon = float(lon)
    
    # Map granja names to pond IDs
    if 'Granja 1' in granja_name:
        pond_id = 'Pond_A'
    elif 'Granja 2' in granja_name:
        pond_id = 'Pond_B'
    elif 'Granja 3' in granja_name:
        pond_id = 'Pond_C'
    elif 'Granja 4' in granja_name:
        pond_id = 'Pond_D'
    elif 'Granja 5' in granja_name:
        pond_id = 'Pond_E'
    elif 'Granja 6' in granja_name:
        pond_id = 'Pond_F'
    elif 'Granja 7' in granja_name:
        pond_id = 'Pond_G'
    elif 'Granja 8' in granja_name:
        pond_id = 'Pond_H'
    elif 'Granja 9' in granja_name:
        pond_id = 'Pond_I'
    elif 'Granja 10' in granja_name:
        pond_id = 'Pond_J'
    elif 'Granja 11' in granja_name:
        pond_id = 'Pond_K'
    elif 'Granja 12' in granja_name:
        pond_id = 'Pond_L'
    elif 'Granja 13' in granja_name:
        pond_id = 'Pond_M'
    elif 'Granja 14' in granja_name:
        pond_id = 'Pond_N'
    elif 'Granja 15' in granja_name:
        pond_id = 'Pond_O'
    else:
        continue
    
    coord_mapping[pond_id] = {'latitude': lat, 'longitude': lon}

print(f"Created coordinate mapping for {len(coord_mapping)} ponds")
print("Coordinate mapping:", coord_mapping)

# Add coordinates to the data
data['latitude'] = data['pond_id'].map(lambda x: coord_mapping.get(x, {}).get('latitude', 0.0))
data['longitude'] = data['pond_id'].map(lambda x: coord_mapping.get(x, {}).get('longitude', 0.0))

print("\nSample data with coordinates:")
print(data[['timestamp', 'pond_id', 'latitude', 'longitude', 'OD_mg_L', 'Temp_C']].head())

# Create tables in Supabase and upload data
try:
    print("\nStarting Supabase upload...")
    
    # Note: You may need to create these RPC functions in Supabase first
    # For now, we'll try to insert directly into tables
    
    # Prepare data for environmental measurements table
    environmental_data = []
    for _, row in data.iterrows():
        environmental_data.append({
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
        })
    
    # Prepare data for weather conditions table
    weather_data = []
    for _, row in data.iterrows():
        weather_data.append({
            'timestamp': row['timestamp'],
            'pond_id': row['pond_id'],
            'air_pressure': row['AirPressure_hPa'],
            'wind_speed': row['Wind_m_s'],
            'rainfall': row['Rain_mm']
        })
    
    # Prepare data for operational data table
    operational_data = []
    for _, row in data.iterrows():
        operational_data.append({
            'timestamp': row['timestamp'],
            'pond_id': row['pond_id'],
            'flow_rate': row['Flow_m3_h'],
            'lirio_coverage': row['Lirio_Coverage_pct'],
            'aerator_status': row['Aerator_Status']
        })
    
    print(f"Prepared {len(environmental_data)} environmental records")
    print(f"Prepared {len(weather_data)} weather records")
    print(f"Prepared {len(operational_data)} operational records")
    
    # Upload in batches to avoid timeout
    batch_size = 100
    
    # Upload environmental data
    print("\nUploading environmental data...")
    for i in range(0, len(environmental_data), batch_size):
        batch = environmental_data[i:i+batch_size]
        result = supabase.table('environmental_data').insert(batch).execute()
        print(f"Uploaded environmental batch {i//batch_size + 1}/{(len(environmental_data)-1)//batch_size + 1}")
    
    # Upload weather data
    print("\nUploading weather data...")
    for i in range(0, len(weather_data), batch_size):
        batch = weather_data[i:i+batch_size]
        result = supabase.table('weather_data').insert(batch).execute()
        print(f"Uploaded weather batch {i//batch_size + 1}/{(len(weather_data)-1)//batch_size + 1}")
    
    # Upload operational data
    print("\nUploading operational data...")
    for i in range(0, len(operational_data), batch_size):
        batch = operational_data[i:i+batch_size]
        result = supabase.table('operational_data').insert(batch).execute()
        print(f"Uploaded operational batch {i//batch_size + 1}/{(len(operational_data)-1)//batch_size + 1}")
    
    print("\n✅ All data successfully uploaded to Supabase!")
    print(f"Total records uploaded:")
    print(f"- Environmental data: {len(environmental_data)} records")
    print(f"- Weather data: {len(weather_data)} records")
    print(f"- Operational data: {len(operational_data)} records")
    print(f"- Total: {len(environmental_data) + len(weather_data) + len(operational_data)} records")

except Exception as e:
    print(f"❌ Error uploading to Supabase: {str(e)}")
    print("\nMake sure your Supabase tables exist with the correct schema:")
    print("1. environmental_data table")
    print("2. weather_data table")
    print("3. operational_data table")
    print("\nAlso ensure your Supabase credentials are correct and you have write permissions.")