# 🌤️ Weather API Configuration Guide

## Get Real Weather Data for Your Exact Locations

Currently, your application is showing **"Weather unavailable"** because it's using demo weather data. To get precise, real-time weather data for the exact coordinates on your map, follow these steps:

## Step 1: Get Your Free API Key

1. **Visit OpenWeatherMap**: Go to [https://openweathermap.org/api](https://openweathermap.org/api)
2. **Sign Up**: Create a free account (takes 2 minutes)
3. **Generate API Key**: 
   - Go to your account dashboard
   - Navigate to "API keys" section
   - Copy your free API key (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

## Step 2: Configure Your Application

1. **Open the .env file**: `c:\Users\Nabhajit\bhujal\server\.env`
2. **Replace the placeholder**:
   ```bash
   # Change this line:
   WEATHER_API_KEY=GET_YOUR_FREE_API_KEY_FROM_OPENWEATHERMAP_ORG
   
   # To your actual API key:
   WEATHER_API_KEY=your_actual_api_key_here
   ```
3. **Save the file**

## Step 3: Restart Your Application

```bash
# Stop the server (Ctrl+C in the terminal)
# Then restart:
cd c:\Users\Nabhajit\bhujal
npm start
```

## Step 4: Test Real Weather Data

1. Open your map: [http://localhost:3000/map](http://localhost:3000/map)
2. Click anywhere on the map
3. You should now see real weather data for that exact location!

## What You'll Get

✅ **Precise Location Weather**: Real data for exact coordinates  
✅ **Current Conditions**: Temperature, humidity, pressure  
✅ **Weather Description**: Clear sky, cloudy, rainy, etc.  
✅ **Wind Information**: Speed and direction  
✅ **Visibility & More**: Complete meteorological data  

## API Limits (Free Tier)

- **1,000 calls per day** (more than enough for testing)
- **60 calls per minute** 
- **Current weather data** (upgrade for forecasts)

## Troubleshooting

### Still Seeing "Demo Data"?
- Check that your API key is correctly pasted in the .env file
- Ensure there are no extra spaces or quotes around the key
- Restart the server after making changes

### API Key Not Working?
- New API keys can take up to 2 hours to activate
- Verify your key is correct in your OpenWeatherMap dashboard
- Check the console for any error messages

### Location Not Found?
- Make sure you're clicking on land areas (not deep ocean)
- Some remote locations might not have weather stations nearby

## Current Status

🔄 **Demo Mode Active**: Your app currently shows realistic demo weather data  
🎯 **Ready for Real Data**: Just add your API key to get live weather!

---

**Need Help?** 
- OpenWeatherMap Documentation: [https://openweathermap.org/api/one-call-api](https://openweathermap.org/api/one-call-api)
- Check server logs for detailed error messages
