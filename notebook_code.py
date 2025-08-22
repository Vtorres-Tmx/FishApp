# Code to use in your Jupyter notebook to load the expanded dataset

import pandas as pd

# Load the expanded dataset with 15 ponds (A-O)
data = pd.read_csv('Datos_Ficticios_Granjas_Expandido.csv')

print(f"Dataset loaded successfully!")
print(f"Shape: {data.shape}")
print(f"Number of ponds: {len(data['pond_id'].unique())}")
print(f"Ponds: {sorted(data['pond_id'].unique())}")
print(f"Time range: {data['timestamp'].min()} to {data['timestamp'].max()}")
print(f"\nColumns: {list(data.columns)}")

# Display basic statistics
print("\n=== BASIC STATISTICS ===")
print(data.describe())

# Show data distribution by pond
print("\n=== DATA POINTS PER POND ===")
print(data['pond_id'].value_counts().sort_index())

# Sample data from new ponds
print("\n=== SAMPLE FROM NEW PONDS ===")
for pond in ['Pond_D', 'Pond_E', 'Pond_F']:
    print(f"\n{pond} sample:")
    print(data[data['pond_id'] == pond].head(3)[['timestamp', 'pond_id', 'OD_mg_L', 'Temp_C', 'pH']].to_string(index=False))