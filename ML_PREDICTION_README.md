# Bhujal ML Prediction Integration

This document explains how to set up and use the groundwater level prediction feature in the Bhujal application.

## Overview

The ML prediction system consists of:

1. **Flask Microservice** (`predict_service.py`) - Loads the trained ML model and provides predictions
2. **Express API Route** (`/api/predict/predict-groundwater`) - Handles requests from frontend
3. **Interactive Map Interface** - Allows users to select locations and get predictions
4. **Trained Model** (`groundwater_model.pkl`) - Pre-trained scikit-learn model

## Architecture

```
Frontend (map.ejs) 
    ↓ AJAX Request
Express Server (/api/predict/predict-groundwater)
    ↓ HTTP Request  
Flask Service (localhost:5001/predict)
    ↓ Model Inference
Trained ML Model (groundwater_model.pkl)
    ↓ Prediction
Response Chain Back to User
```

## Quick Setup

### Windows Setup
```bash
# Run the automated setup script
setup_ml.bat

# Or manual setup:
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
npm install
```

### Linux/Mac Setup
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
npm install
```

## Running the Application

### Option 1: Run Both Services Together
```bash
npm run dev:full
```

### Option 2: Run Services Separately

**Terminal 1 - Node.js Server:**
```bash
npm run dev
```

**Terminal 2 - Python ML Service:**
```bash
# Windows
venv\Scripts\activate
python predict_service.py

# Linux/Mac
source venv/bin/activate
python predict_service.py
```

## Using the Prediction Feature

1. **Access the Map Page**: Navigate to `/map` in your application
2. **Click "Predict Levels"**: This opens the prediction modal
3. **Select Location**: 
   - Use "Select Location on Map" button and click on the map
   - Or manually enter latitude/longitude coordinates
4. **Set Parameters**:
   - **Target Year**: Future year for prediction (2024-2074)
   - **Previous Water Level**: Optional, helps improve accuracy
   - **Expected Rainfall**: Optional, in millimeters
   - **Expected Temperature**: Optional, in Celsius
5. **Get Prediction**: Click "Predict Water Level" to get results

## API Endpoints

### Predict Groundwater Level
- **URL**: `POST /api/predict/predict-groundwater`
- **Body**:
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "year": 2025,
  "previous_level": 12.5,  // optional
  "rainfall": 650.0,       // optional
  "temperature": 26.5      // optional
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "prediction": 11.75,
    "unit": "meters",
    "interpretation": "Moderate - Normal groundwater level",
    "confidence": 0.85,
    "input_data": { ... },
    "prediction_date": "2025-07-26T..."
  }
}
```

### Health Check
- **URL**: `GET /api/predict/health`
- **Response**: Status of the ML service

### Model Information
- **URL**: `GET /api/predict/model-info`
- **Response**: Details about the loaded ML model

## Model Requirements

The ML model (`groundwater_model.pkl`) should be a trained scikit-learn model that expects these features:

1. **latitude** (float): Geographic latitude
2. **longitude** (float): Geographic longitude  
3. **year** (int): Target prediction year
4. **previous_level** (float): Previous groundwater level in meters
5. **rainfall** (float): Expected rainfall in millimeters
6. **temperature** (float): Expected temperature in Celsius
7. **years_since_baseline** (float): Calculated as (year - 2020)
8. **lat_lng_interaction** (float): Calculated as (latitude * longitude)

## Model Training Notes

If you need to train your own model, ensure it:

- Uses the feature structure described above
- Is saved using `joblib.dump(model, 'groundwater_model.pkl')`
- Returns predictions in meters (depth below surface)
- Has been trained on groundwater level data

## Troubleshooting

### Common Issues

1. **"Prediction service is unavailable"**
   - Check if Python Flask service is running on port 5001
   - Verify virtual environment is activated
   - Check Python dependencies are installed

2. **"Model not loaded"**
   - Ensure `groundwater_model.pkl` exists in the root directory
   - Check model file is valid and compatible with joblib
   - Review Python service logs for loading errors

3. **"Invalid input data"**
   - Verify latitude is between -90 and 90
   - Verify longitude is between -180 and 180
   - Check that year is reasonable (2024-2074)

4. **Port conflicts**
   - Flask service runs on port 5001 by default
   - Change port in `predict_service.py` if needed
   - Update `PREDICTION_SERVICE_URL` in environment variables

### Debug Mode

Enable debug logging in Flask service:
```python
app.run(host='0.0.0.0', port=5001, debug=True)
```

### Environment Variables

Create a `.env` file with:
```env
NODE_ENV=development
PREDICTION_SERVICE_URL=http://localhost:5001
MONGODB_URI=mongodb://localhost:27017/bhujal
CLIENT_URL=http://localhost:3000
```

## Features

### Interactive Map Integration
- Click-to-select location functionality
- Visual markers for prediction points
- Popup displays with prediction results

### Responsive Design
- Works on desktop and mobile devices
- Modal-based interface for predictions
- Progress indicators during processing

### Error Handling
- Graceful handling of service unavailability
- User-friendly error messages
- Fallback options when service is down

### Data Validation
- Input validation on both frontend and backend
- Reasonable bounds checking for coordinates and years
- Optional parameter handling

## Production Deployment

For production deployment:

1. **Use Process Managers**:
   ```bash
   # PM2 for Node.js
   pm2 start simple-app.js --name bhujal-app
   
   # PM2 for Python service
   pm2 start predict_service.py --name ml-service --interpreter python3
   ```

2. **Environment Configuration**:
   - Set production URLs in environment variables
   - Use production MongoDB instance
   - Configure proper CORS origins

3. **Security Considerations**:
   - Add authentication to prediction endpoints if needed
   - Rate limiting for prediction requests
   - Input sanitization and validation

4. **Monitoring**:
   - Log prediction requests and results
   - Monitor service health endpoints
   - Set up alerts for service failures

## Future Enhancements

- Batch prediction for multiple locations
- Prediction result caching
- Historical prediction tracking
- Model retraining capabilities
- Advanced visualization with charts
- Export prediction results to PDF/Excel
