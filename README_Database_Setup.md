# Fish Farm Data - Supabase Relational Database Setup

This guide will help you upload your `FishAppData.csv` to Supabase using a proper relational database structure.

## 📊 Database Schema Overview

Your data will be organized into 4 normalized tables:

### 1. `farms` (Catalog Table)
- **Purpose**: Master catalog of all fish farms
- **Fields**: `id`, `farm_name`, `latitude`, `longitude`, `created_at`, `updated_at`
- **Records**: 15 farms (Granja 1 to Granja 15)

### 2. `sensor_readings` (Water Quality Data)
- **Purpose**: Water quality measurements from sensors
- **Fields**: `farm_id`, `timestamp`, `dissolved_oxygen`, `temperature`, `ph`, `conductivity`, `par`, `ammonia`, `nitrite`, `turbidity`, `chlorophyll`
- **Records**: ~3,744 sensor readings

### 3. `weather_data` (Environmental Data)
- **Purpose**: Weather and environmental conditions
- **Fields**: `farm_id`, `timestamp`, `air_pressure`, `wind_speed`, `rainfall`
- **Records**: ~3,744 weather readings

### 4. `operational_data` (Equipment & Operations)
- **Purpose**: Equipment status and operational metrics
- **Fields**: `farm_id`, `timestamp`, `flow_rate`, `lirio_coverage`, `aerator_status`
- **Records**: ~3,744 operational readings

## 🚀 Setup Instructions

### Step 1: Create Tables in Supabase

1. Go to your Supabase dashboard: https://dqvxqginyiwbfxkwlghz.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `create_tables.sql`
4. Click **Run** to create all tables and indexes

### Step 2: Upload Your Data

1. Make sure `FishAppData.csv` is in the same directory as the Python scripts
2. Install required dependencies:
   ```bash
   pip install supabase pandas
   ```
3. Run the upload script:
   ```bash
   python upload_data_only.py
   ```

## 📁 Files Included

- **`create_tables.sql`**: SQL script to create all database tables
- **`upload_data_only.py`**: Python script to upload data to Supabase
- **`supabase_relational_upload.py`**: Complete script with table creation (backup)
- **`FishAppData.csv`**: Your source data file

## 🔍 Data Verification

After upload, you can verify your data in Supabase:

```sql
-- Check farm catalog
SELECT * FROM farms;

-- Count records in each table
SELECT 'farms' as table_name, COUNT(*) as record_count FROM farms
UNION ALL
SELECT 'sensor_readings', COUNT(*) FROM sensor_readings
UNION ALL
SELECT 'weather_data', COUNT(*) FROM weather_data
UNION ALL
SELECT 'operational_data', COUNT(*) FROM operational_data;

-- Sample joined query
SELECT 
    f.farm_name,
    s.timestamp,
    s.temperature,
    s.ph,
    w.air_pressure,
    o.aerator_status
FROM farms f
JOIN sensor_readings s ON f.id = s.farm_id
JOIN weather_data w ON f.id = w.farm_id AND s.timestamp = w.timestamp
JOIN operational_data o ON f.id = o.farm_id AND s.timestamp = o.timestamp
LIMIT 10;
```

## 📈 Benefits of This Structure

1. **Normalized Design**: Eliminates data redundancy
2. **Referential Integrity**: Foreign key relationships ensure data consistency
3. **Scalability**: Easy to add new farms or data types
4. **Query Flexibility**: Join tables for complex analytics
5. **Performance**: Indexes on key fields for fast queries

## 🔧 Troubleshooting

### Common Issues:

1. **"Table not found" error**:
   - Make sure you ran `create_tables.sql` first
   - Check that tables were created in the `public` schema

2. **Permission errors**:
   - Verify your Supabase API keys are correct
   - Check Row Level Security policies if enabled

3. **Data type errors**:
   - Ensure your CSV has the expected column names
   - Check for null values or invalid data formats

### Support:
If you encounter issues, check the console output for detailed error messages.

## 📊 Example Queries for Analysis

```sql
-- Average temperature by farm
SELECT 
    f.farm_name,
    AVG(s.temperature) as avg_temp,
    COUNT(*) as readings
FROM farms f
JOIN sensor_readings s ON f.id = s.farm_id
GROUP BY f.farm_name
ORDER BY avg_temp DESC;

-- Farms with highest rainfall
SELECT 
    f.farm_name,
    SUM(w.rainfall) as total_rainfall
FROM farms f
JOIN weather_data w ON f.id = w.farm_id
GROUP BY f.farm_name
ORDER BY total_rainfall DESC;

-- Aerator usage by farm
SELECT 
    f.farm_name,
    AVG(o.aerator_status::float) * 100 as aerator_usage_percent
FROM farms f
JOIN operational_data o ON f.id = o.farm_id
GROUP BY f.farm_name
ORDER BY aerator_usage_percent DESC;
```

Your data is now ready for advanced analytics and dashboard creation! 🎉