-- Fish Farm Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor before uploading data

-- 1. Create farms catalog table
CREATE TABLE IF NOT EXISTS farms (
    id SERIAL PRIMARY KEY,
    farm_name VARCHAR(50) UNIQUE NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create sensor readings table
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

-- 3. Create weather data table
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

-- 4. Create operational data table
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

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sensor_readings_farm_timestamp ON sensor_readings(farm_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_weather_data_farm_timestamp ON weather_data(farm_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_operational_data_farm_timestamp ON operational_data(farm_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_farms_name ON farms(farm_name);

-- 6. Enable Row Level Security (RLS) - Optional but recommended
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_data ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Enable read access for all users" ON farms FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON farms FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON farms FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON sensor_readings FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON sensor_readings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON sensor_readings FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON weather_data FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON weather_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON weather_data FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON operational_data FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON operational_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON operational_data FOR UPDATE USING (true);

-- Verification queries (run these after table creation to verify)
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('farms', 'sensor_readings', 'weather_data', 'operational_data');
-- SELECT * FROM farms LIMIT 5;
-- SELECT COUNT(*) FROM sensor_readings;
-- SELECT COUNT(*) FROM weather_data;
-- SELECT COUNT(*) FROM operational_data;