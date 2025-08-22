import pandas as pd

# Load the expanded dataset
data = pd.read_csv('Datos_Ficticios_Granjas_Expandido.csv')

print("Dataset loaded successfully!")
print(f"Shape: {data.shape}")
print(f"\nColumns: {list(data.columns)}")
print(f"\nPonds in dataset: {sorted(data['pond_id'].unique())}")
print(f"\nData types:")
print(data.dtypes)
print(f"\nFirst few rows:")
print(data.head())
print(f"\nSummary statistics:")
print(data.describe())

# You can now use the 'data' variable in your analysis
# Example: data.groupby('pond_id').mean()
# Example: data[data['pond_id'] == 'Pond_D'].head()