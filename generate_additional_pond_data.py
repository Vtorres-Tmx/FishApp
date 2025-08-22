import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Read the existing data
df = pd.read_csv('Datos_Ficticios_Granjas.csv')

# Set random seed for reproducibility
np.random.seed(42)
random.seed(42)

# Define the new pond IDs
new_ponds = ['Pond_D', 'Pond_E', 'Pond_F', 'Pond_G', 'Pond_H', 'Pond_I', 
             'Pond_J', 'Pond_K', 'Pond_L', 'Pond_M', 'Pond_N', 'Pond_O']

# Get unique timestamps from existing data
timestamps = df['timestamp'].unique()

# Analyze existing data ranges for realistic generation
data_stats = {
    'OD_mg_L': (df['OD_mg_L'].min(), df['OD_mg_L'].max()),
    'Temp_C': (df['Temp_C'].min(), df['Temp_C'].max()),
    'pH': (df['pH'].min(), df['pH'].max()),
    'Conductivity_uScm': (df['Conductivity_uScm'].min(), df['Conductivity_uScm'].max()),
    'PAR_umol_m2s': (df['PAR_umol_m2s'].min(), df['PAR_umol_m2s'].max()),
    'Ammonia_mg_L': (df['Ammonia_mg_L'].min(), df['Ammonia_mg_L'].max()),
    'Nitrite_mg_L': (df['Nitrite_mg_L'].min(), df['Nitrite_mg_L'].max()),
    'Turbidity_NTU': (df['Turbidity_NTU'].min(), df['Turbidity_NTU'].max()),
    'Chlorophyll_ug_L': (df['Chlorophyll_ug_L'].min(), df['Chlorophyll_ug_L'].max()),
    'AirPressure_hPa': (df['AirPressure_hPa'].min(), df['AirPressure_hPa'].max()),
    'Wind_m_s': (df['Wind_m_s'].min(), df['Wind_m_s'].max()),
    'Rain_mm': (df['Rain_mm'].min(), df['Rain_mm'].max()),
    'Flow_m3_h': (df['Flow_m3_h'].min(), df['Flow_m3_h'].max()),
    'Lirio_Coverage_pct': (df['Lirio_Coverage_pct'].min(), df['Lirio_Coverage_pct'].max())
}

def generate_realistic_value(param, base_value, variation_factor=0.1):
    """Generate realistic values with some variation from base"""
    min_val, max_val = data_stats[param]
    
    # Add some random variation
    variation = np.random.normal(0, variation_factor * base_value)
    new_value = base_value + variation
    
    # Ensure values stay within realistic bounds
    new_value = max(min_val, min(max_val, new_value))
    
    return new_value

def generate_time_based_variation(hour, param, base_value):
    """Add time-based patterns similar to existing data"""
    if param == 'Temp_C':
        # Temperature varies with time of day
        temp_variation = 2 * np.sin(2 * np.pi * (hour - 6) / 24)
        return base_value + temp_variation
    elif param == 'PAR_umol_m2s':
        # PAR (light) is 0 at night, peaks during day
        if 6 <= hour <= 18:
            return base_value * (1 + 0.5 * np.sin(np.pi * (hour - 6) / 12))
        else:
            return 0
    elif param == 'pH':
        # pH varies slightly with photosynthesis cycles
        ph_variation = 0.1 * np.sin(2 * np.pi * (hour - 12) / 24)
        return base_value + ph_variation
    else:
        return base_value

# Create new data for additional ponds
new_data = []

for pond_id in new_ponds:
    # Create base characteristics for each pond (slight variations from existing ponds)
    pond_characteristics = {
        'OD_mg_L': np.random.uniform(6.5, 8.5),
        'Temp_C': np.random.uniform(24, 29),
        'pH': np.random.uniform(7.3, 7.9),
        'Conductivity_uScm': np.random.uniform(490, 560),
        'PAR_umol_m2s': np.random.uniform(200, 800),
        'Ammonia_mg_L': np.random.uniform(0.3, 0.8),
        'Nitrite_mg_L': np.random.uniform(0.01, 0.25),
        'Turbidity_NTU': np.random.uniform(5, 35),
        'Chlorophyll_ug_L': np.random.uniform(15, 40),
        'AirPressure_hPa': np.random.uniform(1005, 1020),
        'Wind_m_s': np.random.uniform(0, 5),
        'Rain_mm': 0,  # Most readings are 0
        'Flow_m3_h': np.random.uniform(80, 130),
        'Lirio_Coverage_pct': np.random.uniform(7, 15)
    }
    
    for timestamp in timestamps:
        # Parse hour from timestamp for time-based variations
        try:
            dt = datetime.strptime(timestamp, '%d/%m/%y %H:%M')
            hour = dt.hour
        except:
            hour = 12  # Default if parsing fails
        
        row_data = {'timestamp': timestamp, 'pond_id': pond_id}
        
        for param, base_value in pond_characteristics.items():
            if param == 'Rain_mm':
                # Rain is occasional
                row_data[param] = np.random.choice([0, 0, 0, 0, 0, 0, 0, 0, 1, 2], p=[0.8, 0.05, 0.05, 0.03, 0.02, 0.02, 0.01, 0.01, 0.005, 0.005])
            else:
                # Apply time-based variation first
                time_varied_value = generate_time_based_variation(hour, param, base_value)
                # Then add random variation
                final_value = generate_realistic_value(param, time_varied_value, 0.05)
                row_data[param] = final_value
        
        # Aerator status (0 or 1)
        row_data['Aerator_Status'] = np.random.choice([0, 1])
        
        new_data.append(row_data)

# Create DataFrame with new data
new_df = pd.DataFrame(new_data)

# Combine with existing data
combined_df = pd.concat([df, new_df], ignore_index=True)

# Sort by timestamp and pond_id
combined_df = combined_df.sort_values(['timestamp', 'pond_id'])

# Save the expanded dataset
combined_df.to_csv('Datos_Ficticios_Granjas_Expandido.csv', index=False)

print(f"Original data: {len(df)} rows")
print(f"New data added: {len(new_df)} rows")
print(f"Total data: {len(combined_df)} rows")
print(f"\nPonds in dataset: {sorted(combined_df['pond_id'].unique())}")
print(f"\nData saved to: Datos_Ficticios_Granjas_Expandido.csv")

# Display sample of new data
print("\nSample of new data:")
print(new_df.head(10))