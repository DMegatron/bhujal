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

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Weather API key not configured'
      });
    }

    // Call OpenWeatherMap API
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

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'Weather API key not configured'
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
