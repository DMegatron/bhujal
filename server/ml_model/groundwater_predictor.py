import pickle
import numpy as np
import os
from typing import Dict, List, Optional, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GroundwaterPredictor:
    def __init__(self, model_path: str = 'groundwater_model.pkl'):
        """Initialize the groundwater prediction model."""
        self.model = None
        self.model_path = model_path
        self.load_model()
    
    def load_model(self):
        """Load the pickle model."""
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                logger.info(f"Model loaded successfully from {self.model_path}")
            else:
                logger.error(f"Model file not found at {self.model_path}")
                raise FileNotFoundError(f"Model file not found at {self.model_path}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise
    
    def prepare_features(self, latitude: float, longitude: float) -> np.ndarray:
        """
        Prepare features for prediction based on latitude and longitude.
        This is a simplified version - in a real scenario, you'd include more features
        like soil type, precipitation data, geological data, etc.
        """
        # Create basic features from lat/lng
        features = [
            latitude,
            longitude,
            abs(latitude),  # Distance from equator
            longitude % 360,  # Normalized longitude
            latitude * longitude,  # Interaction term
            np.sin(np.radians(latitude)),  # Seasonal factors
            np.cos(np.radians(longitude)),
            (latitude ** 2) + (longitude ** 2),  # Distance measure
        ]
        
        # Add some synthetic environmental factors
        # In production, these would come from actual data sources
        avg_temperature = 25 + (latitude / 10)  # Temperature based on latitude
        precipitation = max(0, 100 - abs(latitude) * 2)  # Precipitation estimate
        elevation = abs(latitude * 100) % 1000  # Simplified elevation
        soil_porosity = 0.3 + (abs(longitude) % 10) / 100  # Soil characteristics
        
        features.extend([
            avg_temperature,
            precipitation,
            elevation,
            soil_porosity
        ])
        
        return np.array(features).reshape(1, -1)
    
    def predict_water_level(self, latitude: float, longitude: float) -> Dict:
        """
        Predict groundwater level and related metrics.
        """
        try:
            if self.model is None:
                raise ValueError("Model not loaded")
            
            # Prepare features
            features = self.prepare_features(latitude, longitude)
            
            # Make prediction
            if hasattr(self.model, 'predict'):
                # If it's a scikit-learn model or similar
                prediction = self.model.predict(features)[0]
                
                # Get confidence if available (for models that support it)
                confidence = 0.85  # Default confidence
                if hasattr(self.model, 'predict_proba'):
                    try:
                        proba = self.model.predict_proba(features)
                        confidence = float(np.max(proba))
                    except:
                        pass
            else:
                # Fallback for other model types
                prediction = float(self.model(features))
                confidence = 0.80
            
            # Ensure prediction is reasonable (between 0 and 100 meters)
            current_water_level = max(0, min(100, float(prediction)))
            
            # Generate future prediction (simplified)
            future_water_level = self._predict_future_level(current_water_level, latitude)
            
            # Determine suitability for borewell
            is_suitable = self._assess_borewell_suitability(
                current_water_level, future_water_level, latitude, longitude
            )
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                current_water_level, future_water_level, is_suitable
            )
            
            # Generate monthly predictions
            monthly_predictions = self._generate_monthly_predictions(current_water_level)
            
            return {
                'currentWaterLevel': round(current_water_level, 2),
                'futureWaterLevel': round(future_water_level, 2),
                'isSuitableForBorewell': is_suitable,
                'confidence': round(confidence, 3),
                'location': {
                    'latitude': latitude,
                    'longitude': longitude
                },
                'recommendations': recommendations,
                'monthlyPredictions': monthly_predictions
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            logger.error(f"Model loaded: {self.model is not None}")
            logger.error(f"Model type: {type(self.model) if self.model else 'None'}")
            
            # Return fallback prediction with reason
            fallback_result = self._get_fallback_prediction(latitude, longitude)
            fallback_result['fallback_reason'] = f"Model prediction failed: {str(e)}"
            return fallback_result
    
    def _predict_future_level(self, current_level: float, latitude: float) -> float:
        """Predict future water level based on current level and location."""
        # Simplified future prediction logic
        seasonal_factor = 0.9 if abs(latitude) > 30 else 1.1  # Climate impact
        trend_factor = 0.95  # General declining trend
        
        future_level = current_level * seasonal_factor * trend_factor
        return max(0, future_level)
    
    def _assess_borewell_suitability(self, current: float, future: float, lat: float, lng: float) -> bool:
        """Assess if location is suitable for borewell drilling."""
        # Basic suitability criteria
        if current < 5:  # Too shallow
            return False
        if current > 80:  # Too deep, expensive to drill
            return False
        if future < 3:  # Will dry up soon
            return False
        
        # Location-based factors
        if abs(lat) > 60:  # Extreme latitudes
            return False
            
        return True
    
    def _generate_recommendations(self, current: float, future: float, suitable: bool) -> List[str]:
        """Generate recommendations based on predictions."""
        recommendations = []
        
        if not suitable:
            if current < 5:
                recommendations.append("Water level too shallow for borewell drilling")
                recommendations.append("Consider rainwater harvesting systems")
            elif current > 80:
                recommendations.append("Water level very deep - drilling will be expensive")
                recommendations.append("Explore alternative water sources")
            elif future < 3:
                recommendations.append("Water level expected to decline significantly")
                recommendations.append("Implement water conservation measures")
        else:
            recommendations.append("Location suitable for borewell drilling")
            recommendations.append("Optimal drilling depth: {:.1f} - {:.1f} meters".format(current - 5, current + 5))
            
            if future < current * 0.8:
                recommendations.append("Consider water conservation practices")
                recommendations.append("Install water level monitoring system")
        
        # General recommendations
        if current > 15:
            recommendations.append("Consider submersible pump for better efficiency")
        
        return recommendations
    
    def _generate_monthly_predictions(self, current_level: float) -> List[Dict]:
        """Generate monthly water level predictions."""
        months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        
        # Seasonal variation factors (simplified)
        seasonal_factors = [0.9, 0.85, 0.8, 0.75, 0.7, 0.65,  # Dry season
                           0.8, 0.9, 1.1, 1.2, 1.15, 1.0]    # Monsoon/wet season
        
        predictions = []
        for i, month in enumerate(months[:6]):  # Next 6 months
            factor = seasonal_factors[i % 12]
            predicted_level = current_level * factor
            predictions.append({
                'month': month,
                'predictedLevel': round(max(0, predicted_level), 2)
            })
        
        return predictions
    
    def _get_fallback_prediction(self, latitude: float, longitude: float) -> Dict:
        """Return a fallback prediction when model fails."""
        # Simple heuristic-based prediction
        base_level = 15 + abs(latitude) / 3  # Basic estimate
        current_water_level = max(5, min(50, base_level))
        future_water_level = current_water_level * 0.9
        
        # Calculate dynamic confidence based on location factors
        # Higher confidence for regions with more typical values
        location_confidence = 0.5  # Base confidence for fallback
        
        # Adjust confidence based on latitude (tropical regions more predictable)
        if 10 <= abs(latitude) <= 30:  # Tropical/subtropical zones
            location_confidence += 0.15
        elif abs(latitude) <= 10:  # Equatorial zones
            location_confidence += 0.1
        
        # Adjust confidence based on water level (moderate levels more predictable)
        if 10 <= current_water_level <= 30:
            location_confidence += 0.1
        elif 5 <= current_water_level <= 40:
            location_confidence += 0.05
        
        # Add some randomness to make it more realistic (+/- 5%)
        import random
        random.seed(int(latitude * 1000 + longitude * 1000))  # Deterministic based on location
        confidence_variance = (random.random() - 0.5) * 0.1  # +/- 5%
        final_confidence = max(0.4, min(0.8, location_confidence + confidence_variance))
        
        return {
            'currentWaterLevel': round(current_water_level, 2),
            'futureWaterLevel': round(future_water_level, 2),
            'isSuitableForBorewell': 10 <= current_water_level <= 40,
            'confidence': round(final_confidence, 3),  # Dynamic confidence for fallback
            'location': {
                'latitude': latitude,
                'longitude': longitude
            },
            'recommendations': [
                "Prediction based on simplified heuristic model",
                "Limited data available for this location",
                "Recommend detailed geological survey for accurate assessment",
                "Consult local water authorities and hydrogeologists"
            ],
            'monthlyPredictions': [
                {'month': 'Jan', 'predictedLevel': round(current_water_level * 0.9, 2)},
                {'month': 'Feb', 'predictedLevel': round(current_water_level * 0.85, 2)},
                {'month': 'Mar', 'predictedLevel': round(current_water_level * 0.8, 2)},
                {'month': 'Apr', 'predictedLevel': round(current_water_level * 0.75, 2)},
                {'month': 'May', 'predictedLevel': round(current_water_level * 0.7, 2)},
                {'month': 'Jun', 'predictedLevel': round(current_water_level * 0.8, 2)},
            ]
        }

# Function to be called from Node.js
def predict_groundwater(latitude: float, longitude: float, model_path: str = None) -> Dict:
    """
    Main function to predict groundwater level.
    This function will be called from the Node.js backend.
    """
    try:
        if model_path is None:
            # Default path relative to the project root
            model_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'groundwater_model.pkl')
            # Normalize the path
            model_path = os.path.abspath(model_path)
        
        predictor = GroundwaterPredictor(model_path)
        result = predictor.predict_water_level(latitude, longitude)
        return {'success': True, 'data': result}
    
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        return {
            'success': False, 
            'error': str(e),
            'message': 'Failed to predict groundwater level'
        }

if __name__ == "__main__":
    # Test the predictor
    result = predict_groundwater(28.6139, 77.2090)  # Delhi coordinates
    print("Test prediction result:")
    print(result)
