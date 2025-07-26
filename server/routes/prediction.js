const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const router = express.Router();

// Middleware to validate prediction request
const validatePredictionRequest = (req, res, next) => {
  const { latitude, longitude } = req.body;
  
  if (!latitude || !longitude) {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude are required'
    });
  }
  
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({
      success: false,
      message: 'Latitude and longitude must be numbers'
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
  
  next();
};

// Groundwater level prediction endpoint
router.post('/groundwater', validatePredictionRequest, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    console.log(`Predicting groundwater for coordinates: ${latitude}, ${longitude}`);
    
    // Path to the Python script
    const pythonScriptPath = path.join(__dirname, '..', 'ml_model', 'groundwater_predictor.py');
    const modelPath = path.join(__dirname, '..', '..', '..', 'groundwater_model.pkl');
    
    // Create a promise to handle the Python script execution
    const prediction = await new Promise((resolve, reject) => {
      // Spawn Python process
      const pythonProcess = spawn('python', [
        '-c',
        `
import sys
import json
import os
sys.path.append('${path.dirname(pythonScriptPath).replace(/\\/g, '\\\\')}')
from groundwater_predictor import predict_groundwater

try:
    result = predict_groundwater(${latitude}, ${longitude}, '${modelPath.replace(/\\/g, '\\\\')}')
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))
        `
      ]);
      
      let output = '';
      let errorOutput = '';
      
      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python script error:', errorOutput);
          reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
          return;
        }
        
        try {
          // Parse the last line of output (should be JSON)
          const lines = output.trim().split('\n');
          const jsonOutput = lines[lines.length - 1];
          const result = JSON.parse(jsonOutput);
          resolve(result);
        } catch (parseError) {
          console.error('Failed to parse Python output:', output);
          reject(new Error('Failed to parse prediction result'));
        }
      });
      
      pythonProcess.on('error', (error) => {
        console.error('Failed to start Python process:', error);
        reject(new Error('Failed to start prediction process'));
      });
      
      // Set a timeout for the prediction (30 seconds)
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Prediction timeout'));
      }, 30000);
    });
    
    if (prediction.success) {
      res.json({
        success: true,
        data: prediction.data,
        message: 'Groundwater prediction completed successfully'
      });
    } else {
      console.error('Prediction failed:', prediction.error);
      res.status(500).json({
        success: false,
        message: prediction.message || 'Prediction failed',
        error: prediction.error
      });
    }
    
  } catch (error) {
    console.error('Prediction endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during prediction',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check for prediction service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Prediction service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
