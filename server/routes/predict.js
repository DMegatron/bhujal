const express = require('express');
const axios = require('axios');
const router = express.Router();

const PREDICTION_SERVICE_URL = process.env.PREDICTION_SERVICE_URL || 'http://localhost:5002';

// @route   POST /api/predict-groundwater
// @desc    Predict groundwater level for a given location and year
// @access  Private (you may want to add auth middleware)
router.post('/predict-groundwater', async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      year,
      previous_level,
      rainfall,
      temperature
    } = req.body;

    // Validate required fields
    if (!latitude || !longitude || !year) {
      return res.status(400).json({
        success: false,
        message: 'Latitude, longitude, and year are required'
      });
    }

    // Validate data types and ranges
    if (isNaN(latitude) || isNaN(longitude) || isNaN(year)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data types for coordinates or year'
      });
    }

    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180'
      });
    }

    const currentYear = new Date().getFullYear();
    if (year < currentYear || year > currentYear + 50) {
      return res.status(400).json({
        success: false,
        message: `Year must be between ${currentYear} and ${currentYear + 50}`
      });
    }

    // Prepare data for prediction service
    const predictionData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      year: parseInt(year),
      ...(previous_level && { previous_level: parseFloat(previous_level) }),
      ...(rainfall && { rainfall: parseFloat(rainfall) }),
      ...(temperature && { temperature: parseFloat(temperature) })
    };

    console.log('Sending prediction request:', predictionData);

    // Call Flask prediction service
    const response = await axios.post(`${PREDICTION_SERVICE_URL}/predict`, predictionData, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Return successful prediction
    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Prediction error:', error.message);

    // Handle different types of errors
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Prediction service is currently unavailable',
        error: 'Service connection failed'
      });
    }

    if (error.response) {
      // Error response from prediction service
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || 'Prediction failed',
        error: error.response.data.error || 'Unknown error'
      });
    }

    if (error.request) {
      // Request timeout or network error
      return res.status(503).json({
        success: false,
        message: 'Prediction service is not responding',
        error: 'Request timeout'
      });
    }

    // Other errors
    res.status(500).json({
      success: false,
      message: 'Internal server error during prediction',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error'
    });
  }
});

// @route   GET /api/predict-groundwater/health
// @desc    Check if prediction service is available
// @access  Public
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${PREDICTION_SERVICE_URL}/health`, {
      timeout: 5000
    });

    res.json({
      success: true,
      message: 'Prediction service is healthy',
      service_status: response.data
    });

  } catch (error) {
    console.error('Health check error:', error.message);

    res.status(503).json({
      success: false,
      message: 'Prediction service is unavailable',
      error: error.code || 'Service check failed'
    });
  }
});

// @route   GET /api/predict-groundwater/model-info
// @desc    Get information about the ML model
// @access  Public
router.get('/model-info', async (req, res) => {
  try {
    const response = await axios.get(`${PREDICTION_SERVICE_URL}/model-info`, {
      timeout: 5000
    });

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Model info error:', error.message);

    if (error.response) {
      return res.status(error.response.status).json({
        success: false,
        message: error.response.data.message || 'Could not get model info',
        error: error.response.data.error || 'Unknown error'
      });
    }

    res.status(503).json({
      success: false,
      message: 'Prediction service is unavailable',
      error: 'Service connection failed'
    });
  }
});

module.exports = router;
