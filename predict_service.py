"""
Flask microservice for groundwater level prediction using the trained ML model.
This service loads the .pkl model and provides a REST API endpoint for predictions.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
import logging
import os
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['http://localhost:5000', 'http://localhost:3000'])

# Global variable to store the loaded model
model = None

def load_model():
    """Load the groundwater prediction model"""
    global model
    model_path = 'groundwater_model.pkl'
    
    try:
        if os.path.exists(model_path):
            model = joblib.load(model_path)
            logger.info(f"Model loaded successfully from {model_path}")
            return True
        else:
            logger.error(f"Model file not found at {model_path}")
            return False
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        return False

def preprocess_features(data):
    """
    Preprocess input features for prediction.
    Expected input format:
    {
        "latitude": float,
        "longitude": float,
        "year": int,
        "previous_level": float (optional),
        "rainfall": float (optional),
        "temperature": float (optional)
    }
    """
    try:
        # Extract features from input data
        latitude = float(data.get('latitude', 0))
        longitude = float(data.get('longitude', 0))
        year = int(data.get('year', datetime.now().year))
        previous_level = float(data.get('previous_level', 10.0))  # Default 10m
        rainfall = float(data.get('rainfall', 800.0))  # Default 800mm
        temperature = float(data.get('temperature', 25.0))  # Default 25°C
        
        # Create comprehensive feature vector to match the model's 54 features
        # This is a generic feature expansion - adjust based on your actual model training
        feature_vector = []
        
        # Basic features
        feature_vector.extend([
            latitude, longitude, year, previous_level, rainfall, temperature
        ])
        
        # Derived features
        feature_vector.extend([
            year - 2020,  # Years since baseline
            latitude * longitude,  # Coordinate interaction
            latitude ** 2,  # Latitude squared
            longitude ** 2,  # Longitude squared
            temperature * rainfall / 1000,  # Climate interaction
            abs(latitude),  # Absolute latitude
            abs(longitude),  # Absolute longitude
        ])
        
        # Additional engineered features to reach 54 total
        # Seasonal and geographic features
        season_factor = np.sin(2 * np.pi * (year % 4) / 4)  # 4-year cycle
        lat_zone = int(latitude / 10)  # Latitude zone
        lng_zone = int(longitude / 10)  # Longitude zone
        
        feature_vector.extend([
            season_factor,
            lat_zone,
            lng_zone,
            temperature - 25,  # Temperature deviation from standard
            rainfall - 800,  # Rainfall deviation from standard
            previous_level - 10,  # Water level deviation from standard
            np.sqrt(abs(latitude)),  # Square root of absolute latitude
            np.sqrt(abs(longitude)),  # Square root of absolute longitude
            np.log(max(1, rainfall)),  # Log of rainfall
            np.log(max(1, temperature + 273.15)),  # Log of temperature in Kelvin
        ])
        
        # Fill remaining features with polynomial combinations and transformations
        remaining_features_needed = 54 - len(feature_vector)
        
        # Generate polynomial features from the base features
        base_features = [latitude, longitude, year, previous_level, rainfall, temperature]
        
        for i in range(min(remaining_features_needed, len(base_features))):
            for j in range(i + 1, len(base_features)):
                if len(feature_vector) < 54:
                    feature_vector.append(base_features[i] * base_features[j])
        
        # Add more features if still needed
        while len(feature_vector) < 54:
            # Add combinations and transformations
            if len(feature_vector) < 54:
                feature_vector.append(latitude + longitude)
            if len(feature_vector) < 54:
                feature_vector.append(latitude - longitude)
            if len(feature_vector) < 54:
                feature_vector.append(year / 100)
            if len(feature_vector) < 54:
                feature_vector.append(temperature / rainfall if rainfall > 0 else 0)
            if len(feature_vector) < 54:
                feature_vector.append(previous_level * 2)
            if len(feature_vector) < 54:
                feature_vector.append(np.sin(latitude * np.pi / 180))
            if len(feature_vector) < 54:
                feature_vector.append(np.cos(longitude * np.pi / 180))
            if len(feature_vector) < 54:
                feature_vector.append((latitude + longitude) / 2)
            if len(feature_vector) < 54:
                feature_vector.append(abs(latitude - longitude))
            if len(feature_vector) < 54:
                # Fill remaining with zero or small variations
                feature_vector.append(0.0)
        
        # Ensure exactly 54 features
        feature_vector = feature_vector[:54]
        
        return np.array(feature_vector).reshape(1, -1)
        
    except Exception as e:
        logger.error(f"Error preprocessing features: {str(e)}")
        raise ValueError(f"Invalid input data: {str(e)}")

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with service information"""
    return jsonify({
        'service': 'Bhujal Groundwater Prediction Service',
        'version': '1.0.0',
        'status': 'running',
        'model_loaded': model is not None,
        'endpoints': {
            'health': '/health - GET - Check service health',
            'predict': '/predict - POST - Make groundwater prediction',
            'model_info': '/model-info - GET - Get model information'
        },
        'usage': {
            'predict': {
                'method': 'POST',
                'content_type': 'application/json',
                'required_fields': ['latitude', 'longitude', 'year'],
                'optional_fields': ['previous_level', 'rainfall', 'temperature'],
                'example': {
                    'latitude': 28.6139,
                    'longitude': 77.209,
                    'year': 2025,
                    'previous_level': 12.5,
                    'rainfall': 650,
                    'temperature': 26
                }
            }
        },
        'timestamp': datetime.now().isoformat()
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict_groundwater():
    """
    Predict groundwater level based on input features.
    
    Expected JSON payload:
    {
        "latitude": 28.6139,
        "longitude": 77.2090,
        "year": 2025,
        "previous_level": 12.5,
        "rainfall": 650.0,
        "temperature": 26.5
    }
    """
    try:
        # Check if model is loaded
        if model is None:
            return jsonify({
                'error': 'Model not loaded',
                'message': 'The prediction model is not available'
            }), 500
        
        # Get input data
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'No input data',
                'message': 'Please provide prediction parameters'
            }), 400
        
        # Validate required fields
        required_fields = ['latitude', 'longitude', 'year']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing_fields': missing_fields
            }), 400
        
        # Preprocess features
        features = preprocess_features(data)
        
        # Make prediction
        prediction = model.predict(features)[0]
        
        # Get prediction confidence (if model supports it)
        confidence = None
        if hasattr(model, 'predict_proba'):
            try:
                proba = model.predict_proba(features)
                confidence = float(np.max(proba))
            except:
                pass
        
        # Ensure prediction is reasonable (groundwater level should be positive)
        prediction = max(0.1, float(prediction))
        
        # Prepare response
        response = {
            'prediction': round(prediction, 2),
            'unit': 'meters',
            'input_data': data,
            'prediction_date': datetime.now().isoformat(),
            'confidence': round(confidence, 3) if confidence else None,
            'interpretation': get_interpretation(prediction)
        }
        
        logger.info(f"Prediction made: {prediction:.2f}m for location ({data['latitude']}, {data['longitude']})")
        
        return jsonify(response)
        
    except ValueError as e:
        return jsonify({
            'error': 'Invalid input',
            'message': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({
            'error': 'Prediction failed',
            'message': 'An error occurred during prediction'
        }), 500

def get_interpretation(level):
    """Provide interpretation of groundwater level"""
    if level < 5:
        return "Critical - Very shallow groundwater, potential water scarcity risk"
    elif level < 10:
        return "Low - Shallow groundwater, monitor closely"
    elif level < 20:
        return "Moderate - Normal groundwater level"
    elif level < 30:
        return "Good - Adequate groundwater level"
    else:
        return "Excellent - Deep groundwater, good water availability"

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get information about the loaded model"""
    if model is None:
        return jsonify({
            'error': 'Model not loaded'
        }), 500
    
    try:
        info = {
            'model_type': type(model).__name__,
            'loaded': True,
            'features_expected': getattr(model, 'n_features_in_', 'Unknown'),
            'model_params': getattr(model, 'get_params', lambda: {})(),
        }
        return jsonify(info)
    except Exception as e:
        return jsonify({
            'error': 'Could not get model info',
            'message': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'The requested endpoint does not exist',
        'available_endpoints': {
            '/': 'GET - Service information',
            '/health': 'GET - Health check',
            '/predict': 'POST - Make prediction',
            '/model-info': 'GET - Model information'
        }
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500

if __name__ == '__main__':
    # Load the model on startup
    if load_model():
        logger.info("Starting Flask prediction service on port 5002")
        app.run(host='0.0.0.0', port=5002, debug=False)
    else:
        logger.error("Failed to load model. Exiting.")
        exit(1)
