# 🐟 Fish Farm Dashboard

A modern, real-time monitoring dashboard for fish farm operations built with Next.js, React, TypeScript, and Tailwind CSS.

## 🚀 Features

### 📊 Real-time Monitoring
- **Live Data Visualization**: Interactive charts showing sensor readings over time
- **Multi-farm Support**: Monitor up to 15 fish farms simultaneously
- **Farm Selection**: Filter data by specific farm or view all farms
- **Responsive Design**: Works on desktop, tablet, and mobile devices

### 🌡️ Sensor Data Tracking
- **Water Quality Metrics**:
  - Temperature (°C)
  - pH levels
  - Dissolved Oxygen (mg/L)
  - Conductivity (μS/cm)
  - PAR (μmol/m²s)
  - Ammonia levels (mg/L)
  - Nitrite levels (mg/L)
  - Turbidity (NTU)
  - Chlorophyll (μg/L)

### 🌤️ Weather Monitoring
- **Environmental Conditions**:
  - Air pressure (hPa)
  - Wind speed (m/s)
  - Rainfall (mm)
- **Weather Alerts**: Automatic notifications for extreme conditions
- **Condition Summary**: Visual weather status indicators

### ⚙️ Operational Management
- **Equipment Status**:
  - Flow rate monitoring (m³/h)
  - Aerator system status (ON/OFF)
  - Lirio coverage percentage
- **System Efficiency**: Real-time aerator efficiency calculations
- **Operational Alerts**: Notifications for system issues

### 📈 Dashboard Components

1. **Farm Overview**: Geographic and status information for all farms
2. **Sensor Charts**: Time-series visualization of water quality data
3. **Weather Widget**: Current weather conditions and alerts
4. **Operational Status**: Equipment monitoring and system health
5. **Data Tables**: Detailed recent readings in tabular format

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with react-chartjs-2
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ installed
- Supabase database with fish farm data
- Database tables created (see `create_tables.sql`)

### Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Open Dashboard**:
   Navigate to `http://localhost:3000` (or the port shown in terminal)

### Database Configuration

The dashboard connects to your Supabase database using the configuration in `lib/supabase.ts`. Make sure your database contains:

- `farms` table with farm information
- `sensor_readings` table with water quality data
- `weather_data` table with environmental conditions
- `operational_data` table with equipment status

## 🎯 Usage

### Navigation
- **Farm Selection**: Use the dropdown to filter data by specific farm
- **Real-time Updates**: Data refreshes automatically
- **Interactive Charts**: Hover over chart points for detailed values

### Key Metrics
- **Header Stats**: Quick overview of system-wide metrics
- **Farm Status**: Individual farm operational status
- **Alerts**: Color-coded warnings for attention-needed conditions

### Data Interpretation

#### Water Quality Indicators
- **Temperature**: Optimal range 20-28°C
- **pH**: Ideal range 6.5-8.5
- **Dissolved Oxygen**: Minimum 5 mg/L recommended
- **Ammonia**: Should be < 0.02 mg/L

#### Weather Alerts
- **High Wind**: > 15 m/s (amber alert)
- **Heavy Rain**: > 10 mm (blue alert)
- **Low Pressure**: < 1000 hPa (red alert)

#### Operational Alerts
- **Low Flow**: < 5 m³/h (red alert)
- **High Lirio Coverage**: > 80% (amber alert)
- **Aerator Efficiency**: < 50% (red alert)

## 🔧 Customization

### Adding New Metrics
1. Update database schema
2. Modify TypeScript interfaces in `lib/supabase.ts`
3. Add new components or update existing ones
4. Update chart configurations

### Styling Changes
- Modify `tailwind.config.js` for theme customization
- Update component styles in individual `.tsx` files
- Add custom CSS in `app/globals.css`

### Alert Thresholds
Update alert conditions in component files:
- `WeatherWidget.tsx` for weather alerts
- `OperationalStatus.tsx` for operational alerts
- `SensorChart.tsx` for sensor alerts

## 📱 Responsive Design

The dashboard is fully responsive and optimized for:
- **Desktop**: Full feature set with multi-column layouts
- **Tablet**: Adapted grid layouts for medium screens
- **Mobile**: Single-column layout with touch-friendly controls

## 🔒 Security

- Uses Supabase Row Level Security (RLS)
- Environment variables for sensitive configuration
- Client-side data validation
- Secure API connections

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy to Vercel
```

### Other Platforms
```bash
npm run build
npm start
```

## 📊 Performance

- **Data Pagination**: Limits data queries for optimal performance
- **Lazy Loading**: Components load as needed
- **Optimized Charts**: Efficient rendering with Chart.js
- **Responsive Images**: Optimized for different screen sizes

## 🐛 Troubleshooting

### Common Issues

1. **"No data available"**:
   - Check Supabase connection
   - Verify database tables exist
   - Ensure data has been uploaded

2. **Charts not displaying**:
   - Check browser console for errors
   - Verify Chart.js dependencies
   - Ensure data format is correct

3. **Slow loading**:
   - Check network connection
   - Verify Supabase performance
   - Consider data pagination

### Debug Mode
Check browser developer tools console for detailed error messages.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for fish farm monitoring and management purposes.

---

**🎉 Your fish farm dashboard is ready!** 

Monitor your farms in real-time with beautiful visualizations and intelligent alerts.