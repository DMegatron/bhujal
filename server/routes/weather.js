const express = require('express');
const axios = require('axios');
const { query, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/weather/current
// @desc    Get current weather data for given coordinates
// @access  Public
router.get('/current', [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { lat, lng } = req.query;
    const apiKey = process.env.WEATHER_API_KEY;

    // If no API key or placeholder key, use enhanced location-based mock data
    if (!apiKey || apiKey === 'your-openweathermap-api-key' || apiKey === '78f70e3de05c9c5e7d5f9bc4d1b0e5b4' || apiKey === 'GET_YOUR_FREE_API_KEY_FROM_OPENWEATHERMAP_ORG') {
      
      // Enhanced location-based weather simulation
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      
      // Determine region-specific weather patterns
      let baseTemp, humidity, pressure, weatherTypes, cityName, country;
      
      // India/South Asia region
      if (latNum >= 6 && latNum <= 37 && lngNum >= 68 && lngNum <= 97) {
        baseTemp = 28; // Warmer climate
        humidity = 65;
        pressure = 1010;
        weatherTypes = ['clear sky', 'few clouds', 'haze', 'partly cloudy'];
        country = 'IN';
        
        // Approximate city names based on coordinates
        if (latNum >= 28 && latNum <= 29 && lngNum >= 77 && lngNum <= 78) {
          cityName = 'Delhi';
        } else if (latNum >= 19 && latNum <= 20 && lngNum >= 72 && lngNum <= 73) {
          cityName = 'Mumbai';
        } else if (latNum >= 12 && latNum <= 13 && lngNum >= 77 && lngNum <= 78) {
          cityName = 'Bangalore';
        } else if (latNum >= 13 && latNum <= 14 && lngNum >= 80 && lngNum <= 81) {
          cityName = 'Chennai';
        } else {
          cityName = 'Regional Location';
        }
      } 
      // Europe
      else if (latNum >= 35 && latNum <= 70 && lngNum >= -10 && lngNum <= 40) {
        baseTemp = 15;
        humidity = 70;
        pressure = 1015;
        weatherTypes = ['overcast clouds', 'light rain', 'clear sky', 'few clouds'];
        country = 'EU';
        cityName = 'European Location';
      }
      // North America
      else if (latNum >= 25 && latNum <= 70 && lngNum >= -130 && lngNum <= -70) {
        baseTemp = 20;
        humidity = 60;
        pressure = 1013;
        weatherTypes = ['clear sky', 'scattered clouds', 'partly cloudy'];
        country = 'US';
        cityName = 'US Location';
      }
      // Default (global)
      else {
        baseTemp = 22;
        humidity = 65;
        pressure = 1013;
        weatherTypes = ['clear sky', 'few clouds', 'partly cloudy'];
        country = '--';
        cityName = 'Unknown Location';
      }
      
      // Time-based temperature variation
      const hour = new Date().getHours();
      let tempVariation = 0;
      if (hour >= 6 && hour < 12) tempVariation = -2; // Morning cooler
      else if (hour >= 12 && hour < 16) tempVariation = 5; // Afternoon hotter
      else if (hour >= 16 && hour < 20) tempVariation = 2; // Evening warm
      else tempVariation = -5; // Night cooler
      
      const mockWeatherData = {
        name: cityName,
        sys: { country: country },
        coord: { lat: latNum, lon: lngNum },
        main: {
          temp: baseTemp + tempVariation + (Math.random() * 6 - 3), // ±3°C variation
          feels_like: baseTemp + tempVariation + (Math.random() * 4 - 2),
          humidity: humidity + (Math.random() * 20 - 10), // ±10% variation
          pressure: pressure + (Math.random() * 20 - 10)
        },
        weather: [{
          description: weatherTypes[Math.floor(Math.random() * weatherTypes.length)],
          icon: ['01d', '02d', '03d', '04d', '01n', '02n'][Math.floor(Math.random() * 6)]
        }],
        wind: {
          speed: 2 + Math.random() * 8,
          deg: Math.random() * 360
        },
        clouds: {
          all: Math.random() * 80
        },
        visibility: 8000 + Math.random() * 2000
      };

      const result = {
        city: mockWeatherData.name,
        country: mockWeatherData.sys.country,
        temperature: Math.round(mockWeatherData.main.temp),
        feelsLike: Math.round(mockWeatherData.main.feels_like),
        humidity: Math.round(mockWeatherData.main.humidity),
        pressure: Math.round(mockWeatherData.main.pressure),
        description: mockWeatherData.weather[0].description,
        icon: mockWeatherData.weather[0].icon,
        windSpeed: Math.round(mockWeatherData.wind.speed * 100) / 100,
        windDirection: Math.round(mockWeatherData.wind.deg),
        cloudiness: Math.round(mockWeatherData.clouds.all),
        visibility: Math.round(mockWeatherData.visibility),
        coordinates: {
          lat: mockWeatherData.coord.lat,
          lng: mockWeatherData.coord.lon
        },
        timestamp: new Date().toISOString(),
        demo: true // Flag to indicate this is demo data
      };

      return res.json({
        success: true,
        data: result
      });
    }

    // Call OpenWeatherMap API with real key
    try {
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
      );

      const weatherData = weatherResponse.data;

      // Extract relevant weather information
      const result = {
        city: weatherData.name || 'Unknown',
        country: weatherData.sys.country || '',
        temperature: Math.round(weatherData.main.temp),
        feelsLike: Math.round(weatherData.main.feels_like),
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        windSpeed: weatherData.wind?.speed || 0,
        windDirection: weatherData.wind?.deg || 0,
        cloudiness: weatherData.clouds?.all || 0,
        visibility: weatherData.visibility || 0,
        coordinates: {
          lat: weatherData.coord.lat,
          lng: weatherData.coord.lon
        },
        timestamp: new Date().toISOString()
      };

      // Add precipitation data if available
      if (weatherData.rain) {
        result.precipitation = {
          rain_1h: weatherData.rain['1h'] || 0,
          rain_3h: weatherData.rain['3h'] || 0
        };
      }

      if (weatherData.snow) {
        result.precipitation = {
          ...result.precipitation,
          snow_1h: weatherData.snow['1h'] || 0,
          snow_3h: weatherData.snow['3h'] || 0
        };
      }

      res.json({
        success: true,
        data: result
      });

      } catch (error) {
      console.error('Weather API error:', error);
      
      if (error.response?.status === 401) {
        return res.status(500).json({
          success: false,
          message: 'Invalid weather API key'
        });
      }
      
      if (error.response?.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch weather data'
      });
    }
  } catch (error) {
    console.error('Weather route error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/weather/forecast
// @desc    Get weather forecast for given coordinates
// @access  Public
router.get('/forecast', [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required'),
  query('days')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Days must be between 1 and 5')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { lat, lng, days = 5 } = req.query;
    const apiKey = process.env.WEATHER_API_KEY;

    // If no API key or invalid key, use mock data
    if (!apiKey || apiKey === 'your-openweathermap-api-key' || apiKey === '78f70e3de05c9c5e7d5f9bc4d1b0e5b4') {
      // Generate mock 5-day forecast
      const mockForecast = [];
      for (let i = 0; i < parseInt(days); i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        const minTemp = 20 + Math.random() * 8;
        const maxTemp = minTemp + 5 + Math.random() * 10;
        
        mockForecast.push({
          date: date.toISOString().split('T')[0],
          temperature: {
            min: Math.round(minTemp),
            max: Math.round(maxTemp),
            avg: Math.round((minTemp + maxTemp) / 2)
          },
          humidity: Math.round(50 + Math.random() * 40),
          pressure: Math.round(1010 + Math.random() * 20),
          precipitation: Math.round(Math.random() * 5 * 100) / 100,
          windSpeed: Math.round((2 + Math.random() * 8) * 100) / 100,
          description: ['clear sky', 'few clouds', 'scattered clouds', 'partly cloudy', 'light rain'][Math.floor(Math.random() * 5)]
        });
      }

      return res.json({
        success: true,
        city: 'Demo Location',
        country: 'IN',
        coordinates: {
          lat: parseFloat(lat),
          lng: parseFloat(lng)
        },
        forecast: mockForecast,
        timestamp: new Date().toISOString(),
        demo: true
      });
    }

    // Call OpenWeatherMap 5-day forecast API
    const forecastResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`
    );

    const forecastData = forecastResponse.data;

    // Process forecast data
    const dailyForecasts = {};
    
    forecastData.list.forEach(item => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      
      if (!dailyForecasts[date]) {
        dailyForecasts[date] = {
          date,
          temperatures: [],
          humidity: [],
          pressure: [],
          descriptions: [],
          precipitation: 0,
          windSpeeds: []
        };
      }
      
      dailyForecasts[date].temperatures.push(item.main.temp);
      dailyForecasts[date].humidity.push(item.main.humidity);
      dailyForecasts[date].pressure.push(item.main.pressure);
      dailyForecasts[date].descriptions.push(item.weather[0].description);
      dailyForecasts[date].windSpeeds.push(item.wind?.speed || 0);
      
      // Add precipitation if available
      if (item.rain) {
        dailyForecasts[date].precipitation += item.rain['3h'] || 0;
      }
      if (item.snow) {
        dailyForecasts[date].precipitation += item.snow['3h'] || 0;
      }
    });

    // Calculate daily averages and take requested number of days
    const result = Object.values(dailyForecasts)
      .slice(0, parseInt(days))
      .map(day => ({
        date: day.date,
        temperature: {
          min: Math.round(Math.min(...day.temperatures)),
          max: Math.round(Math.max(...day.temperatures)),
          avg: Math.round(day.temperatures.reduce((a, b) => a + b, 0) / day.temperatures.length)
        },
        humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
        pressure: Math.round(day.pressure.reduce((a, b) => a + b, 0) / day.pressure.length),
        precipitation: Math.round(day.precipitation * 100) / 100, // Round to 2 decimal places
        windSpeed: Math.round((day.windSpeeds.reduce((a, b) => a + b, 0) / day.windSpeeds.length) * 100) / 100,
        description: day.descriptions[0] // Take first description of the day
      }));

    res.json({
      success: true,
      city: forecastData.city.name,
      country: forecastData.city.country,
      coordinates: {
        lat: forecastData.city.coord.lat,
        lng: forecastData.city.coord.lon
      },
      forecast: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Weather forecast API error:', error);
    
    if (error.response?.status === 401) {
      return res.status(500).json({
        success: false,
        message: 'Invalid weather API key'
      });
    }
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to fetch weather forecast'
    });
  }
});

// @route   POST /api/weather/predict-water-level
// @desc    Predict water level based on weather data
// @access  Public
router.post('/predict-water-level', [
  query('temperature')
    .isFloat({ min: -50, max: 60 })
    .withMessage('Temperature must be between -50 and 60 degrees Celsius'),
  query('precipitation')
    .isFloat({ min: 0 })
    .withMessage('Precipitation must be a positive number'),
  query('humidity')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Humidity must be between 0 and 100'),
  query('pressure')
    .optional()
    .isFloat({ min: 800, max: 1200 })
    .withMessage('Pressure must be between 800 and 1200 hPa')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { temperature, precipitation, humidity = 50, pressure = 1013 } = req.query;

    // Simple water level prediction algorithm
    // This would be replaced with actual ML model in production
    let baseLevel = 15; // Base water level in feet
    
    // Temperature effect (higher temp = lower water level due to evaporation)
    const tempEffect = (30 - parseFloat(temperature)) * 0.1;
    
    // Precipitation effect (more rain = higher water level)
    const precipEffect = parseFloat(precipitation) * 2;
    
    // Humidity effect (higher humidity = less evaporation)
    const humidityEffect = (parseFloat(humidity) - 50) * 0.05;
    
    // Pressure effect (higher pressure = slightly higher water level)
    const pressureEffect = (parseFloat(pressure) - 1013) * 0.01;
    
    // Calculate predicted water level
    let predictedLevel = baseLevel + tempEffect + precipEffect + humidityEffect + pressureEffect;
    
    // Ensure realistic bounds
    predictedLevel = Math.max(5, Math.min(50, predictedLevel));
    predictedLevel = Math.round(predictedLevel * 100) / 100; // Round to 2 decimal places

    // Determine confidence level based on data quality
    let confidence = 0.75; // Base confidence
    if (parseFloat(precipitation) > 0) confidence += 0.1;
    if (parseFloat(humidity) !== 50) confidence += 0.05;
    if (parseFloat(pressure) !== 1013) confidence += 0.05;
    confidence = Math.min(0.95, confidence);

    // If ML API is configured, try to use it
    const mlApiUrl = process.env.ML_API_URL;
    const mlApiKey = process.env.ML_API_KEY;

    if (mlApiUrl && mlApiKey) {
      try {
        const mlResponse = await axios.post(mlApiUrl, {
          features: {
            temperature: parseFloat(temperature),
            precipitation: parseFloat(precipitation),
            humidity: parseFloat(humidity),
            pressure: parseFloat(pressure)
          }
        }, {
          headers: {
            'Authorization': `Bearer ${mlApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 second timeout
        });

        if (mlResponse.data && mlResponse.data.prediction) {
          predictedLevel = mlResponse.data.prediction;
          confidence = mlResponse.data.confidence || confidence;
        }
      } catch (mlError) {
        console.error('ML API error, falling back to simple prediction:', mlError.message);
        // Continue with simple prediction
      }
    }

    res.json({
      success: true,
      prediction: {
        waterLevel: predictedLevel,
        unit: 'feet',
        confidence: Math.round(confidence * 100) / 100,
        factors: {
          temperature: parseFloat(temperature),
          precipitation: parseFloat(precipitation),
          humidity: parseFloat(humidity),
          pressure: parseFloat(pressure)
        },
        timestamp: new Date().toISOString(),
        method: mlApiUrl ? 'ml_model' : 'simple_algorithm'
      }
    });

  } catch (error) {
    console.error('Water level prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict water level'
    });
  }
});

module.exports = router;
