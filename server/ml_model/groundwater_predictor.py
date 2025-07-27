import pickle
import numpy as np
import os
import datetime
import math
import random
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
        Updated to generate the exact 72 features that the XGBoost model expects.
        """
        import datetime
        import math
        
        # Get current date for temporal features
        current_date = datetime.datetime.now()
        year = current_date.year
        month = current_date.month
        day_of_year = current_date.timetuple().tm_yday
        week_of_year = current_date.isocalendar()[1]
        quarter = (month - 1) // 3 + 1
        
        # Calculate temporal features
        years_since_1994 = year - 1994
        days_since_start = (current_date - datetime.datetime(1994, 1, 1)).days
        year_progress = day_of_year / 366.0 if current_date.year % 4 == 0 else day_of_year / 365.0
        
        # Cyclical temporal features
        month_sin = math.sin(2 * math.pi * month / 12)
        month_cos = math.cos(2 * math.pi * month / 12)
        day_sin = math.sin(2 * math.pi * day_of_year / 365)
        day_cos = math.cos(2 * math.pi * day_of_year / 365)
        
        # Seasonal patterns (Indian monsoon calendar)
        is_monsoon = 1 if month in [6, 7, 8, 9] else 0
        is_post_monsoon = 1 if month in [10, 11] else 0
        is_pre_monsoon = 1 if month in [3, 4, 5] else 0
        is_winter = 1 if month in [12, 1, 2] else 0
        is_peak_monsoon = 1 if month in [7, 8] else 0
        is_early_monsoon = 1 if month == 6 else 0
        is_late_monsoon = 1 if month == 9 else 0
        
        # Monsoon intensity (based on month)
        monsoon_intensity = {6: 0.3, 7: 0.9, 8: 1.0, 9: 0.7}.get(month, 0.0)
        
        # Temporal transitions
        season_transition = 1 if month in [3, 6, 10, 12] else 0
        extreme_weather = 1 if month in [4, 5, 7, 8] else 0
        drought_prone_months = 1 if month in [3, 4, 5] else 0
        flood_prone_months = 1 if month in [7, 8, 9] else 0
        
        # Long-term patterns
        decade = year // 10
        year_mod_5 = year % 5
        is_leap_year = 1 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 0
        climate_era = 0 if year < 2000 else (1 if year < 2010 else 2)
        
        # Enhanced coordinates
        lat_lon_product = latitude * longitude
        lat_squared = latitude * latitude
        lon_squared = longitude * longitude
        coordinate_distance = math.sqrt(lat_squared + lon_squared)
        
        # Regional zones (India-specific)
        north_india = 1 if latitude > 24 else 0
        south_india = 1 if latitude < 20 else 0
        west_india = 1 if longitude < 76 else 0
        east_india = 1 if longitude > 84 else 0
        
        # Climate zones
        arid_zone = 1 if (latitude > 20 and latitude < 30 and longitude > 68 and longitude < 78) else 0
        coastal_zone = 1 if (longitude < 73 or longitude > 88 or latitude < 12) else 0
        humid_zone = 1 if (latitude > 20 and longitude > 85) else 0
        semi_arid_zone = 1 if (latitude > 15 and latitude < 25 and longitude > 72 and longitude < 82) else 0
        
        # Geological terrain
        alluvial_plains = 1 if (latitude > 24 and latitude < 32 and longitude > 72 and longitude < 88) else 0
        hard_rock_terrain = 1 if (latitude > 12 and latitude < 20 and longitude > 74 and longitude < 80) else 0
        peninsular_india = 1 if latitude < 24 else 0
        
        # Elevation features (approximated from lat/lng)
        elevation_proxy = abs(latitude - 20) * 50 + abs(longitude - 78) * 30
        high_elevation = 1 if elevation_proxy > 300 else 0
        medium_elevation = 1 if 100 <= elevation_proxy <= 300 else 0
        low_elevation = 1 if elevation_proxy < 100 else 0
        
        # Geographic features
        western_ghats = 1 if (latitude > 8 and latitude < 24 and longitude > 72 and longitude < 78) else 0
        gangetic_plain = 1 if (latitude > 24 and latitude < 32 and longitude > 75 and longitude < 88) else 0
        deccan_plateau = 1 if (latitude > 12 and latitude < 20 and longitude > 74 and longitude < 82) else 0
        coastal_plain = 1 if coastal_zone else 0
        
        # Monsoon-Geography interactions
        monsoon_coastal = is_monsoon * coastal_zone
        monsoon_arid = is_monsoon * arid_zone
        monsoon_western_ghats = is_monsoon * western_ghats
        peak_monsoon_coastal = is_peak_monsoon * coastal_zone
        pre_monsoon_arid = is_pre_monsoon * arid_zone
        
        # Temporal-Elevation interactions
        summer_high_elevation = (1 if month in [4, 5] else 0) * high_elevation
        winter_high_elevation = is_winter * high_elevation
        monsoon_low_elevation = is_monsoon * low_elevation
        seasonal_elevation = (is_monsoon + is_winter) * elevation_proxy / 1000
        year_elevation = (year - 2000) * elevation_proxy / 10000
        
        # Regional-Temporal interactions
        north_winter = north_india * is_winter
        south_summer = south_india * (1 if month in [4, 5] else 0)
        west_monsoon = west_india * is_monsoon
        east_flood_season = east_india * flood_prone_months
        regional_temporal = (north_india + south_india) * (is_monsoon + is_winter)
        
        # Complex interactions
        climate_era_monsoon = climate_era * monsoon_intensity
        decade_coastal = (decade % 10) * coastal_zone
        geology_climate = (alluvial_plains + hard_rock_terrain) * (arid_zone + humid_zone)
        terrain_temporal = (high_elevation + low_elevation) * year_progress
        coordinate_seasonal = coordinate_distance * monsoon_intensity
        
        # Compile all 72 features in the exact order expected by the model
        features = [
            latitude,                           # 1
            longitude,                          # 2
            year,                              # 3
            month,                             # 4
            day_of_year,                       # 5
            week_of_year,                      # 6
            quarter,                           # 7
            years_since_1994,                  # 8
            days_since_start,                  # 9
            year_progress,                     # 10
            month_sin,                         # 11
            month_cos,                         # 12
            day_sin,                           # 13
            day_cos,                           # 14
            is_monsoon,                        # 15
            is_post_monsoon,                   # 16
            is_pre_monsoon,                    # 17
            is_winter,                         # 18
            is_peak_monsoon,                   # 19
            is_early_monsoon,                  # 20
            is_late_monsoon,                   # 21
            monsoon_intensity,                 # 22
            season_transition,                 # 23
            extreme_weather,                   # 24
            drought_prone_months,              # 25
            flood_prone_months,                # 26
            decade,                            # 27
            year_mod_5,                        # 28
            is_leap_year,                      # 29
            climate_era,                       # 30
            lat_lon_product,                   # 31
            lat_squared,                       # 32
            lon_squared,                       # 33
            coordinate_distance,               # 34
            north_india,                       # 35
            south_india,                       # 36
            west_india,                        # 37
            east_india,                        # 38
            arid_zone,                         # 39
            coastal_zone,                      # 40
            humid_zone,                        # 41
            semi_arid_zone,                    # 42
            alluvial_plains,                   # 43
            hard_rock_terrain,                 # 44
            peninsular_india,                  # 45
            high_elevation,                    # 46
            medium_elevation,                  # 47
            low_elevation,                     # 48
            western_ghats,                     # 49
            gangetic_plain,                    # 50
            deccan_plateau,                    # 51
            coastal_plain,                     # 52
            monsoon_coastal,                   # 53
            monsoon_arid,                      # 54
            monsoon_western_ghats,             # 55
            peak_monsoon_coastal,              # 56
            pre_monsoon_arid,                  # 57
            summer_high_elevation,             # 58
            winter_high_elevation,             # 59
            monsoon_low_elevation,             # 60
            seasonal_elevation,                # 61
            year_elevation,                    # 62
            north_winter,                      # 63
            south_summer,                      # 64
            west_monsoon,                      # 65
            east_flood_season,                 # 66
            regional_temporal,                 # 67
            climate_era_monsoon,               # 68
            decade_coastal,                    # 69
            geology_climate,                   # 70
            terrain_temporal,                  # 71
            coordinate_seasonal                # 72
        ]
        
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
                
                # Calculate more accurate confidence based on model type and prediction quality
                confidence = self._calculate_confidence(features, prediction, latitude, longitude)
                
            else:
                # Fallback for other model types
                prediction = float(self.model(features))
                confidence = 0.75  # Default confidence for non-sklearn models
            
            # Ensure prediction is reasonable (between 0 and 100 meters)
            current_water_level = max(0, min(100, float(prediction)))
            
            # Generate future prediction (simplified)
            future_water_level = self._predict_future_level(current_water_level, latitude, longitude)
            
            # Determine suitability for borewell
            is_suitable = self._assess_borewell_suitability(
                current_water_level, future_water_level, latitude, longitude
            )
            
            # Generate suitability advisory note
            suitability_note = self._generate_suitability_note(current_water_level, future_water_level, is_suitable)
            
            # Generate recommendations
            recommendations = self._generate_recommendations(
                current_water_level, future_water_level, is_suitable
            )
            
            # Generate seasonal analysis and drilling recommendations
            seasonal_analysis = self._generate_seasonal_analysis(current_water_level, latitude, longitude)
            drilling_timeline = self._generate_drilling_timeline(current_water_level, future_water_level, latitude, longitude)
            yearly_predictions = self._generate_yearly_predictions(current_water_level)
            
            return {
                'currentWaterLevel': round(current_water_level, 2),
                'futureWaterLevel': round(future_water_level, 2),
                'isSuitableForBorewell': is_suitable,
                'location': {
                    'latitude': latitude,
                    'longitude': longitude
                },
                'yearlyPredictions': yearly_predictions,
                'suitabilityNote': suitability_note,
                'seasonalAnalysis': seasonal_analysis,
                'drillingTimeline': drilling_timeline,
                'bestDrillingTime': self._get_best_drilling_time(latitude, longitude),
                'confidence': round(confidence, 3),  # Keep for internal use but de-emphasize
                'confidenceBreakdown': self._get_confidence_breakdown(features, prediction, latitude, longitude),
                'confidenceExplanation': self._get_confidence_explanation(features, prediction, latitude, longitude)
            }
            
        except Exception as e:
            logger.error(f"Prediction error: {str(e)}")
            logger.error(f"Model loaded: {self.model is not None}")
            logger.error(f"Model type: {type(self.model) if self.model else 'None'}")
            
            # Return fallback prediction with reason
            fallback_result = self._get_fallback_prediction(latitude, longitude)
            fallback_result['fallback_reason'] = f"Model prediction failed: {str(e)}"
            return fallback_result
    
    def _calculate_confidence(self, features: np.ndarray, prediction: float, latitude: float, longitude: float) -> float:
        """
        Calculate prediction confidence based on comprehensive factors:
        1. Data Quality & Density
        2. Model Certainty & Predictive Strength  
        3. Environmental & Contextual Factors
        """
        # Enhanced base confidence - reduced for locations outside India
        if self._is_outside_india(latitude, longitude):
            base_confidence = 0.40  # Reduced confidence for out-of-bounds locations
        else:
            base_confidence = 0.60  # Standard confidence for Indian locations
        
        # =================================================================
        # 1. DATA QUALITY & DENSITY (Max +0.20)
        # =================================================================
        
        # 1.1 Spatial Data Density (simulated based on location characteristics)
        spatial_density_score = self._calculate_spatial_density(latitude, longitude)
        
        # 1.2 Temporal Frequency (simulated based on region development)
        temporal_frequency_score = self._calculate_temporal_frequency(latitude, longitude)
        
        # 1.3 Data Recentness (current prediction is "recent")
        recentness_score = 0.05  # Assume current prediction is recent
        
        data_quality_score = spatial_density_score + temporal_frequency_score + recentness_score
        
        # =================================================================
        # 2. MODEL CERTAINTY & PREDICTIVE STRENGTH (Max +0.15)
        # =================================================================
        
        # 2.1 Prediction Reasonableness (narrower range = higher confidence)
        prediction_certainty = self._calculate_prediction_certainty(prediction)
        
        # 2.2 Feature Quality & Completeness
        feature_quality = self._calculate_feature_quality(features)
        
        # 2.3 Distance from Training Distribution (enhanced spatial generalization)
        training_similarity = self._calculate_training_similarity(latitude, longitude, prediction)
        
        # Additional penalty for locations >300km from nearest training point
        distance_penalty = self._calculate_distance_penalty(latitude, longitude)
        
        model_certainty_score = prediction_certainty + feature_quality + training_similarity + distance_penalty
        
        # =================================================================
        # 3. ENVIRONMENTAL & CONTEXTUAL FACTORS (Max +0.15)
        # =================================================================
        
        # 3.1 Aquifer Type & Geological Predictability (enhanced scoring)
        aquifer_confidence = self._calculate_enhanced_aquifer_confidence(latitude, longitude)
        
        # 3.2 Seasonal Stability (with arid zone penalties)
        seasonal_confidence = self._calculate_enhanced_seasonal_confidence(latitude, longitude)
        
        # 3.3 Land Use & Human Impact
        landuse_confidence = self._calculate_landuse_confidence(latitude, longitude)
        
        # 3.4 Hydrogeological Context
        hydrogeo_confidence = self._calculate_hydrogeological_confidence(latitude, longitude)
        
        environmental_score = aquifer_confidence + seasonal_confidence + landuse_confidence + hydrogeo_confidence
        
        # Cap environmental total at 10% unless high recharge structures or low variance detected
        environmental_cap = 0.10  # Base cap
        
        # Increase cap for favorable conditions
        if self._has_high_recharge_structures(latitude, longitude):
            environmental_cap = 0.12  # Allow up to 12% for high recharge areas
        elif self._has_low_variance_conditions(latitude, longitude):
            environmental_cap = 0.11  # Allow up to 11% for low variance conditions
            
        environmental_score = min(environmental_score, environmental_cap)
        
        # =================================================================
        # FINAL CONFIDENCE CALCULATION
        # =================================================================
        
        final_confidence = base_confidence + data_quality_score + model_certainty_score + environmental_score
        
        # Ensure confidence is within reasonable bounds (40% - 95%)
        final_confidence = max(0.40, min(0.95, final_confidence))
        
        return final_confidence
    
    def _get_confidence_breakdown(self, features: np.ndarray, prediction: float, latitude: float, longitude: float) -> Dict:
        """
        Provide detailed breakdown of confidence calculation for transparency.
        """
        # Enhanced base confidence calculation
        if self._is_outside_india(latitude, longitude):
            base_confidence = 0.40
        else:
            base_confidence = 0.60
        
        # Calculate individual components
        spatial_density = self._calculate_spatial_density(latitude, longitude)
        temporal_frequency = self._calculate_temporal_frequency(latitude, longitude)
        recentness = 0.05
        data_quality_total = spatial_density + temporal_frequency + recentness
        
        prediction_certainty = self._calculate_prediction_certainty(prediction)
        feature_quality = self._calculate_feature_quality(features)
        training_similarity = self._calculate_training_similarity(latitude, longitude, prediction)
        distance_penalty = self._calculate_distance_penalty(latitude, longitude)
        model_certainty_total = prediction_certainty + feature_quality + training_similarity + distance_penalty
        
        aquifer_confidence = self._calculate_enhanced_aquifer_confidence(latitude, longitude)
        seasonal_confidence = self._calculate_enhanced_seasonal_confidence(latitude, longitude)
        landuse_confidence = self._calculate_landuse_confidence(latitude, longitude)
        hydrogeo_confidence = self._calculate_hydrogeological_confidence(latitude, longitude)
        
        # Calculate environmental total with capping
        environmental_raw = aquifer_confidence + seasonal_confidence + landuse_confidence + hydrogeo_confidence
        environmental_cap = 0.10  # Base cap
        
        if self._has_high_recharge_structures(latitude, longitude):
            environmental_cap = 0.12
        elif self._has_low_variance_conditions(latitude, longitude):
            environmental_cap = 0.11
            
        environmental_total = min(environmental_raw, environmental_cap)
        
        # Determine location characteristics
        location_type = self._get_location_characteristics(latitude, longitude)
        
        return {
            'baseConfidence': round(base_confidence * 100, 1),
            'dataQuality': {
                'spatialDensity': round(spatial_density * 100, 1),
                'temporalFrequency': round(temporal_frequency * 100, 1),
                'dataRecentness': round(recentness * 100, 1),
                'total': round(data_quality_total * 100, 1)
            },
            'modelCertainty': {
                'predictionReasonableness': round(prediction_certainty * 100, 1),
                'featureQuality': round(feature_quality * 100, 1),
                'trainingSimilarity': round(training_similarity * 100, 1),
                'distancePenalty': round(distance_penalty * 100, 1),
                'total': round(model_certainty_total * 100, 1)
            },
            'environmentalFactors': {
                'aquiferType': round(aquifer_confidence * 100, 1),
                'seasonalStability': round(seasonal_confidence * 100, 1),
                'landUseImpact': round(landuse_confidence * 100, 1),
                'hydrogeological': round(hydrogeo_confidence * 100, 1),
                'rawTotal': round(environmental_raw * 100, 1),
                'appliedCap': round(environmental_cap * 100, 1),
                'total': round(environmental_total * 100, 1)
            },
            'locationCharacteristics': location_type,
            'finalConfidence': round(min(95.0, max(40.0, (base_confidence + data_quality_total + model_certainty_total + environmental_total) * 100)), 1)
        }
    
    def _get_location_characteristics(self, latitude: float, longitude: float) -> Dict:
        """Get human-readable location characteristics."""
        characteristics = {
            'region': 'Unknown',
            'urbanization': 'Rural',
            'aquiferType': 'Mixed',
            'climateZone': 'Temperate',
            'dataAvailability': 'Limited'
        }
        
        # Determine region
        if self._is_major_city(latitude, longitude):
            characteristics['region'] = 'Major City'
            characteristics['urbanization'] = 'Highly Urban'
            characteristics['dataAvailability'] = 'Excellent'
        elif 24 <= latitude <= 32 and 75 <= longitude <= 88:
            characteristics['region'] = 'Gangetic Plains'
            characteristics['aquiferType'] = 'Alluvial'
        elif 12 <= latitude <= 20 and 74 <= longitude <= 82:
            characteristics['region'] = 'Deccan Plateau'
            characteristics['aquiferType'] = 'Hard Rock'
        elif 20 <= latitude <= 30 and 68 <= longitude <= 78:
            characteristics['region'] = 'Arid Zone'
            characteristics['climateZone'] = 'Arid'
        elif latitude < 73 or longitude > 88:
            characteristics['region'] = 'Coastal Zone'
            characteristics['aquiferType'] = 'Coastal Alluvium'
        
        # Climate zone
        if 6 <= latitude <= 23:
            characteristics['climateZone'] = 'Tropical'
        elif latitude > 30:
            characteristics['climateZone'] = 'Subtropical'
            
        return characteristics
    
    def _get_confidence_explanation(self, features: np.ndarray, prediction: float, latitude: float, longitude: float) -> Dict:
        """
        Provide human-readable explanations for confidence components.
        """
        # Calculate individual components for explanations
        spatial_density = self._calculate_spatial_density(latitude, longitude)
        temporal_frequency = self._calculate_temporal_frequency(latitude, longitude)
        distance_penalty = self._calculate_distance_penalty(latitude, longitude)
        aquifer_confidence = self._calculate_enhanced_aquifer_confidence(latitude, longitude)
        seasonal_confidence = self._calculate_enhanced_seasonal_confidence(latitude, longitude)
        
        # Data Quality explanation
        if spatial_density >= 0.06:
            data_quality_text = "Excellent: Dense network of observation wells and frequent monitoring."
        elif spatial_density >= 0.04:
            data_quality_text = "Good: Adequate observation data with regular monitoring."
        elif spatial_density >= 0.02:
            data_quality_text = "Moderate: Limited observation data, irregular monitoring."
        else:
            data_quality_text = "Poor: Sparse observation network, infrequent data collection."
        
        # Model Certainty explanation
        if self._is_outside_india(latitude, longitude):
            model_certainty_text = "Low: Location outside primary training region (India)."
        elif distance_penalty < -0.03:
            model_certainty_text = "Moderate: Location distant from training data points."
        elif 5 <= prediction <= 30:
            model_certainty_text = "High: Prediction within typical groundwater range."
        else:
            model_certainty_text = "Moderate: Prediction at edge of typical range."
        
        # Environmental Factors explanation
        aquifer_type = "Unknown"
        seasonal_desc = ""
        
        if self._is_alluvial_plain(latitude, longitude):
            aquifer_type = "Alluvial"
            env_base = "Excellent: Highly predictable alluvial aquifer"
        elif self._is_coastal_area(latitude, longitude):
            aquifer_type = "Coastal"
            env_base = "Good: Coastal aquifer with moderate predictability"
        elif self._is_hard_rock_terrain(latitude, longitude):
            aquifer_type = "Hard Rock"
            env_base = "Moderate: Hard rock terrain with variable permeability"
        else:
            aquifer_type = "Mixed"
            env_base = "Moderate: Mixed geological formations"
        
        # Add seasonal context
        if self._is_arid_region(latitude, longitude):
            seasonal_desc = " in arid zone with high seasonal variability"
        elif self._is_semi_arid_region(latitude, longitude):
            seasonal_desc = " in semi-arid zone with moderate seasonal variation"
        elif seasonal_confidence >= 0.03:
            seasonal_desc = " with stable seasonal patterns"
        else:
            seasonal_desc = " with variable seasonal conditions"
        
        environmental_text = env_base + seasonal_desc + "."
        
        return {
            "dataQuality": data_quality_text,
            "modelCertainty": model_certainty_text,
            "environmentalFactors": environmental_text
        }
    
    def _calculate_spatial_density(self, latitude: float, longitude: float) -> float:
        """Calculate confidence boost based on spatial data density."""
        # Simulate observation well density based on region characteristics
        density_score = 0.0
        
        # High density regions (major cities, developed areas)
        if self._is_major_city(latitude, longitude):
            density_score = 0.08  # Many observation wells
        elif self._is_urban_area(latitude, longitude):
            density_score = 0.06  # Moderate observation wells
        elif self._is_rural_developed(latitude, longitude):
            density_score = 0.04  # Some observation wells
        else:
            density_score = 0.02  # Few observation wells
        
        return density_score
    
    def _calculate_temporal_frequency(self, latitude: float, longitude: float) -> float:
        """Calculate confidence based on temporal data frequency."""
        # Simulate based on region development and monitoring infrastructure
        frequency_score = 0.0
        
        if self._is_major_city(latitude, longitude):
            frequency_score = 0.05  # Regular monthly monitoring
        elif self._is_urban_area(latitude, longitude):
            frequency_score = 0.04  # Seasonal monitoring
        else:
            frequency_score = 0.02  # Irregular monitoring
            
        return frequency_score
    
    def _calculate_prediction_certainty(self, prediction: float) -> float:
        """Calculate model certainty based on prediction characteristics."""
        certainty_score = 0.0
        
        # Predictions in typical groundwater ranges are more certain
        if 5 <= prediction <= 30:  # Most common range
            certainty_score = 0.06
        elif 3 <= prediction <= 50:  # Reasonable range
            certainty_score = 0.04
        elif 1 <= prediction <= 80:  # Acceptable range
            certainty_score = 0.02
        else:
            certainty_score = -0.02  # Unusual predictions
            
        return certainty_score
    
    def _calculate_feature_quality(self, features: np.ndarray) -> float:
        """Calculate confidence based on feature quality."""
        quality_score = 0.0
        
        # Check for valid features (no NaN, Inf, or extreme values)
        if not np.isnan(features).any() and not np.isinf(features).any():
            quality_score += 0.03
            
            # Check feature value ranges are reasonable
            if np.all(np.abs(features) < 1000):  # No extreme values
                quality_score += 0.02
                
        return quality_score
    
    def _calculate_training_similarity(self, latitude: float, longitude: float, prediction: float) -> float:
        """Calculate confidence based on similarity to training data."""
        similarity_score = 0.0
        
        # Indian locations are within training distribution
        if 6 <= latitude <= 37 and 68 <= longitude <= 97:
            similarity_score += 0.04
            
            # Core training regions
            if 15 <= latitude <= 30 and 72 <= longitude <= 88:
                similarity_score += 0.02
                
        return similarity_score
    
    def _calculate_distance_penalty(self, latitude: float, longitude: float) -> float:
        """Calculate penalty for locations far from training data points."""
        penalty = 0.0
        
        # If outside India bounds, apply penalty
        if self._is_outside_india(latitude, longitude):
            penalty = -0.05  # 5% penalty for out-of-bounds locations
        else:
            # Calculate approximate distance from major training regions
            min_distance = self._calculate_min_distance_to_training_regions(latitude, longitude)
            
            # Apply penalty for locations >300km from nearest training point
            if min_distance > 300:  # >300km
                penalty = -0.05
            elif min_distance > 200:  # 200-300km
                penalty = -0.03
            elif min_distance > 100:  # 100-200km
                penalty = -0.01
                
        return penalty
    
    def _calculate_enhanced_aquifer_confidence(self, latitude: float, longitude: float) -> float:
        """Enhanced aquifer confidence with specific type weights."""
        aquifer_score = 0.0
        
        # Alluvial aquifers (highest predictability) - +5%
        if self._is_alluvial_plain(latitude, longitude):
            aquifer_score = 0.05
        # Mixed aquifers (moderate predictability) - +3%
        elif self._is_coastal_area(latitude, longitude) or self._is_transitional_zone(latitude, longitude):
            aquifer_score = 0.03
        # Hard rock terrain (lower predictability) - +1-2%
        elif self._is_hard_rock_terrain(latitude, longitude):
            aquifer_score = 0.015
        # Complex geological areas - +1%
        else:
            aquifer_score = 0.01
            
        return aquifer_score
    
    def _calculate_enhanced_seasonal_confidence(self, latitude: float, longitude: float) -> float:
        """Enhanced seasonal confidence with arid zone penalties."""
        import datetime
        current_month = datetime.datetime.now().month
        seasonal_score = 0.0
        
        # Post-monsoon period (most stable)
        if current_month in [10, 11, 12]:
            seasonal_score = 0.04
        # Winter (stable)
        elif current_month in [1, 2]:
            seasonal_score = 0.03
        # Pre-monsoon (less stable)
        elif current_month in [3, 4, 5]:
            seasonal_score = 0.02
        # Monsoon (least stable)
        elif current_month in [6, 7, 8, 9]:
            seasonal_score = 0.01
            
        # Apply penalties for arid/semi-arid zones with high seasonal variability
        if self._is_arid_region(latitude, longitude):
            seasonal_score -= 0.03  # 3% penalty for arid zones (e.g., Rajasthan, Jaipur)
        elif self._is_semi_arid_region(latitude, longitude):
            seasonal_score -= 0.02  # 2% penalty for semi-arid zones
            
        # Additional penalty for known high-variability regions (Rajasthan specifically)
        if self._is_rajasthan_region(latitude, longitude):
            seasonal_score -= 0.01  # Additional 1% penalty for Rajasthan's extreme variability
            
        # Adjust for regional stability
        if self._is_flood_prone(latitude, longitude):
            seasonal_score -= 0.01  # Additional penalty for flood-prone areas
            
        return max(-0.05, seasonal_score)  # Ensure minimum penalty doesn't exceed -5%
    
    def _calculate_aquifer_confidence(self, latitude: float, longitude: float) -> float:
        """Calculate confidence based on aquifer type and geological predictability."""
        aquifer_score = 0.0
        
        # Alluvial plains (high predictability)
        if self._is_alluvial_plain(latitude, longitude):
            aquifer_score = 0.05
        # Coastal alluvium (moderate predictability)
        elif self._is_coastal_area(latitude, longitude):
            aquifer_score = 0.03
        # Hard rock terrain (lower predictability)
        elif self._is_hard_rock_terrain(latitude, longitude):
            aquifer_score = 0.01
        # Complex geological areas (lowest predictability)
        else:
            aquifer_score = 0.02
            
        return aquifer_score
    
    def _calculate_seasonal_confidence(self, latitude: float, longitude: float) -> float:
        """Calculate confidence based on seasonal stability."""
        import datetime
        current_month = datetime.datetime.now().month
        seasonal_score = 0.0
        
        # Post-monsoon period (most stable)
        if current_month in [10, 11, 12]:
            seasonal_score = 0.04
        # Winter (stable)
        elif current_month in [1, 2]:
            seasonal_score = 0.03
        # Pre-monsoon (less stable)
        elif current_month in [3, 4, 5]:
            seasonal_score = 0.02
        # Monsoon (least stable)
        elif current_month in [6, 7, 8, 9]:
            seasonal_score = 0.01
            
        # Adjust for regional stability
        if self._is_arid_region(latitude, longitude):
            seasonal_score *= 1.2  # More stable in arid regions
        elif self._is_flood_prone(latitude, longitude):
            seasonal_score *= 0.8  # Less stable in flood-prone areas
            
        return seasonal_score
    
    def _calculate_landuse_confidence(self, latitude: float, longitude: float) -> float:
        """Calculate confidence based on land use and human impact."""
        landuse_score = 0.0
        
        if self._is_major_city(latitude, longitude):
            landuse_score = 0.01  # Urban areas - unpredictable abstraction
        elif self._is_agricultural_area(latitude, longitude):
            landuse_score = 0.02  # Agricultural - moderate predictability
        elif self._is_forest_area(latitude, longitude):
            landuse_score = 0.04  # Forest - high natural stability
        else:
            landuse_score = 0.03  # Other land uses
            
        return landuse_score
    
    def _calculate_hydrogeological_confidence(self, latitude: float, longitude: float) -> float:
        """Calculate confidence based on hydrogeological context."""
        hydrogeo_score = 0.0
        
        # Presence of recharge structures (simulated)
        if self._has_recharge_structures(latitude, longitude):
            hydrogeo_score += 0.02
            
        # Regional groundwater management
        if self._has_groundwater_management(latitude, longitude):
            hydrogeo_score += 0.02
            
        # Natural recharge conditions
        if self._has_good_natural_recharge(latitude, longitude):
            hydrogeo_score += 0.01
            
        return hydrogeo_score
    
    # Helper methods for regional classification
    def _is_major_city(self, lat: float, lng: float) -> bool:
        """Check if location is a major city."""
        major_cities = [
            (28.6, 77.2),    # Delhi
            (19.1, 72.9),    # Mumbai  
            (13.1, 80.3),    # Chennai
            (12.9, 77.6),    # Bangalore
            (22.6, 88.4),    # Kolkata
            (17.4, 78.5),    # Hyderabad
            (23.0, 72.6),    # Ahmedabad
            (26.9, 75.8),    # Jaipur
        ]
        
        for city_lat, city_lng in major_cities:
            if abs(lat - city_lat) < 0.5 and abs(lng - city_lng) < 0.5:
                return True
        return False
    
    def _is_urban_area(self, lat: float, lng: float) -> bool:
        """Check if location is urban area."""
        # Simplified: areas near major cities or state capitals
        return (self._is_major_city(lat, lng) or 
                (lat > 20 and lng > 75 and lng < 85))  # Urban corridor
    
    def _is_rural_developed(self, lat: float, lng: float) -> bool:
        """Check if location is developed rural area."""
        # Areas with moderate development
        return (15 <= lat <= 30 and 70 <= lng <= 88)
    
    def _is_alluvial_plain(self, lat: float, lng: float) -> bool:
        """Check if location is in alluvial plains."""
        # Gangetic plains and coastal plains
        return ((24 <= lat <= 32 and 75 <= lng <= 88) or  # Gangetic plains
                (lat < 15 and 75 <= lng <= 85))  # Southern coastal plains
    
    def _is_coastal_area(self, lat: float, lng: float) -> bool:
        """Check if location is coastal."""
        return (lng < 73 or lng > 88 or lat < 12)
    
    def _is_hard_rock_terrain(self, lat: float, lng: float) -> bool:
        """Check if location is in hard rock terrain."""
        # Deccan plateau and peninsular shield
        return (12 <= lat <= 20 and 74 <= lng <= 82)
    
    def _is_arid_region(self, lat: float, lng: float) -> bool:
        """Check if location is in arid region."""
        # Rajasthan and parts of Gujarat
        return (20 <= lat <= 30 and 68 <= lng <= 78)
    
    def _is_semi_arid_region(self, lat: float, lng: float) -> bool:
        """Check if location is in semi-arid region."""
        # Parts of Maharashtra, Karnataka, Andhra Pradesh
        return ((15 <= lat <= 20 and 74 <= lng <= 80) or  # Deccan semi-arid
                (20 <= lat <= 25 and 78 <= lng <= 82))     # Central semi-arid
    
    def _is_transitional_zone(self, lat: float, lng: float) -> bool:
        """Check if location is in transitional geological zone."""
        # Areas between major geological formations
        return ((18 <= lat <= 24 and 76 <= lng <= 82) or  # Central transition
                (22 <= lat <= 26 and 70 <= lng <= 76))     # Western transition
    
    def _is_outside_india(self, lat: float, lng: float) -> bool:
        """Check if location is outside India's geographical bounds."""
        return lat < 6 or lat > 37 or lng < 66 or lng > 98
    
    def _calculate_min_distance_to_training_regions(self, lat: float, lng: float) -> float:
        """Calculate minimum distance to major training data regions (in km)."""
        import math
        
        # Major training regions (approximate centers)
        training_regions = [
            (28.6, 77.2),   # Delhi NCR
            (19.1, 72.9),   # Mumbai region
            (13.1, 80.3),   # Chennai region
            (12.9, 77.6),   # Bangalore region
            (22.6, 88.4),   # Kolkata region
            (23.2, 77.4),   # Central India
            (26.0, 73.0),   # Rajasthan
            (21.1, 79.1),   # Nagpur region
        ]
        
        min_distance = float('inf')
        
        for region_lat, region_lng in training_regions:
            # Haversine distance calculation (simplified)
            dlat = math.radians(lat - region_lat)
            dlng = math.radians(lng - region_lng)
            a = (math.sin(dlat/2)**2 + 
                 math.cos(math.radians(region_lat)) * math.cos(math.radians(lat)) * 
                 math.sin(dlng/2)**2)
            distance = 6371 * 2 * math.asin(math.sqrt(a))  # Earth radius = 6371 km
            min_distance = min(min_distance, distance)
            
        return min_distance
    
    def _is_rajasthan_region(self, lat: float, lng: float) -> bool:
        """Check if location is specifically in Rajasthan (high seasonal variability)."""
        # Rajasthan boundaries (approximate)
        return (23 <= lat <= 30 and 69 <= lng <= 78)
    
    def _has_high_recharge_structures(self, lat: float, lng: float) -> bool:
        """Check if area has high density of artificial recharge structures."""
        # Areas with intensive water conservation projects
        return (self._is_rajasthan_region(lat, lng) or  # Rajasthan has many check dams
                self._is_gujarat_region(lat, lng) or     # Gujarat has extensive recharge programs
                self._is_maharashtra_drought_prone(lat, lng))  # Maharashtra watershed programs
    
    def _has_low_variance_conditions(self, lat: float, lng: float) -> bool:
        """Check if area has naturally low groundwater variability."""
        # Stable geological and climatic conditions
        return (self._is_alluvial_plain(lat, lng) and  # Stable alluvial aquifers
                not self._is_flood_prone(lat, lng) and  # Not flood-prone
                not self._is_arid_region(lat, lng))     # Not in arid zone
    
    def _is_gujarat_region(self, lat: float, lng: float) -> bool:
        """Check if location is in Gujarat."""
        return (20 <= lat <= 24.5 and 68 <= lng <= 74.5)
    
    def _is_maharashtra_drought_prone(self, lat: float, lng: float) -> bool:
        """Check if location is in drought-prone Maharashtra regions."""
        return (17 <= lat <= 21 and 74 <= lng <= 80)
    
    def _generate_suitability_note(self, current_level: float, future_level: float, is_suitable: bool) -> str:
        """
        Generate suitability advisory note based on water levels.
        Note: Values represent depth below ground level (mbgl) - higher values = deeper water table.
        """
        if not is_suitable:
            if current_level < 3:
                return "Very shallow water table - high contamination risk, consider surface water sources or rainwater harvesting."
            elif current_level > 80:
                return "Very deep water table - drilling costs will be high, consider alternative sources."
            elif future_level > 100:
                return "Water table expected to deepen significantly - implement conservation measures urgently."
            else:
                return "Location not recommended for borewell due to geological or climatic factors."
        
        # For suitable locations, provide depth-based advisory
        if current_level > 10:
            if current_level > 20:
                return "Deep water table - borewell may require deeper drilling and seasonal backup systems."
            else:
                return "Moderate depth - borewell may require deeper drilling or seasonal backup."
        elif current_level < 3:
            return "Very shallow water table - easier drilling but ensure proper casing to prevent contamination."
        elif current_level < 5:
            return "Shallow water table - easier drilling but ensure proper casing to prevent contamination."
        else:
            return "Optimal depth for borewell drilling with good long-term prospects."
    
    def _is_flood_prone(self, lat: float, lng: float) -> bool:
        """Check if location is flood-prone."""
        # Gangetic plains and eastern India
        return (22 <= lat <= 28 and 85 <= lng <= 92)
    
    def _is_agricultural_area(self, lat: float, lng: float) -> bool:
        """Check if location is primarily agricultural."""
        # Most of rural India
        return (15 <= lat <= 30 and 72 <= lng <= 88 and 
                not self._is_major_city(lat, lng))
    
    def _is_forest_area(self, lat: float, lng: float) -> bool:
        """Check if location is forested."""
        # Central India forests, Western Ghats
        return ((20 <= lat <= 25 and 78 <= lng <= 85) or  # Central forests
                (8 <= lat <= 24 and 72 <= lng <= 78))     # Western Ghats
    
    def _has_recharge_structures(self, lat: float, lng: float) -> bool:
        """Check if area likely has artificial recharge structures."""
        # More likely in water-stressed regions
        return self._is_arid_region(lat, lng) or self._is_urban_area(lat, lng)
    
    def _has_groundwater_management(self, lat: float, lng: float) -> bool:
        """Check if area has active groundwater management."""
        # More likely in developed states and urban areas
        return (self._is_urban_area(lat, lng) or 
                (lat > 23 and lng > 70 and lng < 80))  # Developed states
    
    def _has_good_natural_recharge(self, lat: float, lng: float) -> bool:
        """Check if area has good natural recharge conditions."""
        # Higher rainfall areas and permeable geology
        return (self._is_forest_area(lat, lng) or 
                (lat > 20 and lng > 85))  # High rainfall regions
    
    def _predict_future_level(self, current_level: float, latitude: float, longitude: float) -> float:
        """
        Predict future water level based on current level and location.
        Note: Values represent depth below ground level (mbgl) - increasing values mean declining water table.
        """
        # Realistic future prediction logic for groundwater depletion
        # Most regions show increasing depth (declining water table) over time
        seasonal_factor = 1.1 if abs(latitude) > 30 else 1.05  # Climate impact - deeper in extreme climates
        trend_factor = 1.03  # General deepening trend (3% per year average depletion)
        
        # Adjust based on regional characteristics
        if self._is_arid_region(latitude, longitude):
            trend_factor = 1.05  # Faster depletion in arid regions
        elif self._is_alluvial_plain(latitude, longitude):
            trend_factor = 1.02  # Slower depletion in alluvial areas with better recharge
        elif self._has_high_recharge_structures(latitude, longitude):
            trend_factor = 1.01  # Much slower depletion with recharge structures
            
        future_level = current_level * seasonal_factor * trend_factor
        return min(100, future_level)  # Cap at 100m depth
    
    def _assess_borewell_suitability(self, current: float, future: float, lat: float, lng: float) -> bool:
        """
        Assess if location is suitable for borewell drilling.
        Note: Values represent depth below ground level (mbgl) - higher values = deeper water table.
        """
        # Basic suitability criteria for mbgl (depth below ground)
        if current < 3:  # Too shallow - contamination risk
            return False
        if current > 80:  # Too deep, expensive to drill
            return False
        if future > 100:  # Will become too deep to access affordably
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
    
    def _generate_yearly_predictions(self, current_level: float) -> List[Dict]:
        """
        Generate yearly water level predictions for the next 5 years.
        Note: Values represent depth below ground level (mbgl) - increasing values mean declining water table.
        """
        predictions = []
        level = current_level
        
        for year in range(1, 6):  # Next 5 years
            # Apply yearly deepening factor (water table going deeper = increasing mbgl values)
            # Most groundwater systems show 2-5% per year deepening due to over-extraction
            deepening_factor = 1.02 + (year * 0.005)  # Accelerating deepening trend
            level = level * deepening_factor
            
            predictions.append({
                'year': f"Year {year}",
                'predictedLevel': round(min(100, level), 2)  # Cap at 100m depth
            })
        
        return predictions
    
    def _generate_seasonal_analysis(self, current_level: float, latitude: float, longitude: float) -> Dict:
        """
        Generate detailed seasonal water level analysis based on Indian regional patterns.
        """
        region_type = self._get_region_type(latitude, longitude)
        climate_zone = self._get_climate_zone(latitude, longitude)
        
        # Define seasonal patterns based on region and climate
        seasonal_patterns = self._get_regional_seasonal_patterns(region_type, climate_zone, current_level)
        
        return {
            'regionType': region_type,
            'climateZone': climate_zone,
            'seasonalPatterns': seasonal_patterns,
            'criticalMonths': self._get_critical_months(region_type, climate_zone),
            'rechargePeriod': self._get_recharge_period(region_type, climate_zone),
            'stressedPeriod': self._get_stressed_period(region_type, climate_zone)
        }
    
    def _generate_drilling_timeline(self, current_level: float, future_level: float, latitude: float, longitude: float) -> Dict:
        """
        Generate drilling timeline recommendations based on seasonal patterns and water levels.
        """
        region_type = self._get_region_type(latitude, longitude)
        climate_zone = self._get_climate_zone(latitude, longitude)
        
        # Determine urgency based on current and future levels
        urgency = self._assess_drilling_urgency(current_level, future_level)
        
        # Get best drilling windows
        optimal_months = self._get_optimal_drilling_months(region_type, climate_zone)
        avoid_months = self._get_avoid_drilling_months(region_type, climate_zone)
        
        # Generate timeline with specific recommendations
        timeline = self._create_drilling_timeline(urgency, optimal_months, avoid_months, current_level)
        
        return {
            'urgency': urgency,
            'optimalMonths': optimal_months,
            'avoidMonths': avoid_months,
            'timeline': timeline,
            'reasoning': self._get_drilling_reasoning(region_type, climate_zone, urgency)
        }
    
    def _get_best_drilling_time(self, latitude: float, longitude: float) -> Dict:
        """
        Get the single best time to start drilling based on region and current date.
        """
        region_type = self._get_region_type(latitude, longitude)
        climate_zone = self._get_climate_zone(latitude, longitude)
        current_month = datetime.datetime.now().month
        
        optimal_months = self._get_optimal_drilling_months(region_type, climate_zone)
        
        # Find next optimal month
        next_optimal = None
        months_ahead = 0
        
        for i in range(12):
            check_month = ((current_month + i - 1) % 12) + 1
            if check_month in optimal_months:
                next_optimal = check_month
                months_ahead = i
                break
        
        if next_optimal:
            month_names = {
                1: 'January', 2: 'February', 3: 'March', 4: 'April',
                5: 'May', 6: 'June', 7: 'July', 8: 'August',
                9: 'September', 10: 'October', 11: 'November', 12: 'December'
            }
            
            return {
                'month': next_optimal,
                'monthName': month_names[next_optimal],
                'monthsFromNow': months_ahead,
                'recommendation': self._get_timing_recommendation(months_ahead, region_type, climate_zone)
            }
        
        return {
            'month': current_month,
            'monthName': 'Current month',
            'monthsFromNow': 0,
            'recommendation': 'Proceed with caution - not ideal season but acceptable'
        }
    
    def _get_region_type(self, latitude: float, longitude: float) -> str:
        """Classify region type based on geographical and geological characteristics."""
        # Check Thar Desert first (most specific)
        if self._is_thar_desert_region(latitude, longitude):
            return "Thar Desert"
        elif self._is_western_ghats_region(latitude, longitude):
            return "Western Ghats"
        elif self._is_northeast_hills(latitude, longitude):
            return "Northeast Hills"
        elif self._is_gangetic_plains(latitude, longitude):
            return "Gangetic Plains"
        elif self._is_deccan_plateau_region(latitude, longitude):
            return "Deccan Plateau"
        elif self._is_coastal_plains(latitude, longitude):
            return "Coastal Plains"
        elif self._is_central_highlands(latitude, longitude):
            return "Central Highlands"
        else:
            return "Mixed Terrain"
    
    def _get_climate_zone(self, latitude: float, longitude: float) -> str:
        """Classify climate zone based on Indian climate patterns."""
        if self._is_arid_climate(latitude, longitude):
            return "Arid"
        elif self._is_semi_arid_climate(latitude, longitude):
            return "Semi-Arid"
        elif self._is_tropical_wet(latitude, longitude):
            return "Tropical Wet"
        elif self._is_tropical_wet_dry(latitude, longitude):
            return "Tropical Wet-Dry"
        elif self._is_subtropical_humid(latitude, longitude):
            return "Subtropical Humid"
        elif self._is_mountain_climate(latitude, longitude):
            return "Mountain"
        else:
            return "Temperate"
    
    def _get_regional_seasonal_patterns(self, region_type: str, climate_zone: str, current_level: float) -> List[Dict]:
        """Generate month-wise water level patterns for specific region and climate."""
        patterns = []
        
        # Base seasonal multipliers for different regions
        if region_type == "Thar Desert":
            # Strong monsoon influence, winter stability
            base_pattern = [1.02, 1.0, 0.95, 0.85, 0.70, 0.65, 0.60, 0.65, 0.75, 0.85, 0.95, 1.0]
        elif region_type == "Gangetic Plains":
            # Strong monsoon influence, winter stability  
            base_pattern = [0.95, 0.92, 0.90, 0.88, 0.85, 0.82, 0.75, 0.78, 0.85, 0.92, 0.98, 1.0]
        elif region_type == "Deccan Plateau":
            # Moderate monsoon, high summer stress
            base_pattern = [0.98, 0.95, 0.88, 0.82, 0.75, 0.70, 0.65, 0.70, 0.80, 0.90, 0.95, 1.0]
        elif region_type == "Coastal Plains":
            # Monsoon + retreating monsoon, less extreme variation
            base_pattern = [0.95, 0.92, 0.88, 0.85, 0.80, 0.75, 0.70, 0.75, 0.82, 0.88, 0.92, 0.95]
        elif region_type == "Thar Desert":
            # Extreme variation, minimal monsoon benefit
            base_pattern = [1.05, 1.0, 0.92, 0.82, 0.70, 0.65, 0.60, 0.65, 0.75, 0.85, 0.95, 1.02]
        elif region_type == "Western Ghats":
            # Heavy monsoon, stable winter
            base_pattern = [0.98, 0.95, 0.90, 0.85, 0.80, 0.70, 0.60, 0.65, 0.75, 0.85, 0.92, 0.95]
        elif region_type == "Northeast Hills":
            # Pre-monsoon rain, heavy monsoon
            base_pattern = [0.92, 0.88, 0.85, 0.80, 0.75, 0.65, 0.55, 0.60, 0.70, 0.80, 0.88, 0.90]
        else:
            # Mixed terrain - moderate pattern
            base_pattern = [0.95, 0.92, 0.88, 0.85, 0.80, 0.75, 0.70, 0.75, 0.82, 0.88, 0.92, 0.95]
        
        # Adjust for climate zone
        climate_adjustments = self._get_climate_adjustments(climate_zone)
        
        month_names = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ]
        
        for i, (month_name, multiplier) in enumerate(zip(month_names, base_pattern)):
            adjusted_multiplier = multiplier * climate_adjustments[i]
            predicted_level = current_level / adjusted_multiplier  # Convert to actual mbgl
            
            # Determine status
            if adjusted_multiplier < 0.75:
                status = "Critical Low (Summer Stress)"
            elif adjusted_multiplier < 0.85:
                status = "Low (Pre/Post Monsoon)"
            elif adjusted_multiplier < 0.95:
                status = "Moderate"
            else:
                status = "Good (Winter/Post-Monsoon)"
            
            patterns.append({
                'month': month_name,
                'monthNumber': i + 1,
                'waterLevel': round(predicted_level, 2),
                'relativeLevel': round(adjusted_multiplier * 100, 1),
                'status': status,
                'description': self._get_monthly_description(i + 1, region_type, climate_zone)
            })
        
        return patterns
    
    def _get_climate_adjustments(self, climate_zone: str) -> List[float]:
        """Get climate-specific adjustments to seasonal patterns."""
        if climate_zone == "Arid":
            # More extreme variations
            return [1.02, 1.0, 0.95, 0.88, 0.80, 0.75, 0.70, 0.75, 0.85, 0.92, 0.98, 1.05]
        elif climate_zone == "Semi-Arid":
            # Moderate variations
            return [1.0, 0.98, 0.92, 0.88, 0.82, 0.78, 0.75, 0.78, 0.85, 0.90, 0.95, 1.0]
        elif climate_zone == "Tropical Wet":
            # Less variation, strong monsoon
            return [0.98, 0.95, 0.92, 0.88, 0.85, 0.75, 0.65, 0.70, 0.80, 0.88, 0.92, 0.95]
        elif climate_zone == "Subtropical Humid":
            # Moderate variation, good winter recharge
            return [1.0, 0.98, 0.92, 0.88, 0.82, 0.78, 0.72, 0.75, 0.82, 0.88, 0.95, 1.0]
        else:
            # Default temperate pattern
            return [0.98, 0.95, 0.90, 0.85, 0.80, 0.75, 0.70, 0.75, 0.82, 0.88, 0.92, 0.95]
    
    def _get_monthly_description(self, month: int, region_type: str, climate_zone: str) -> str:
        """Get descriptive text for each month's water level status."""
        descriptions = {
            1: "Post-winter stability, good for drilling",
            2: "Winter end, stable conditions",
            3: "Pre-summer, water levels start declining",
            4: "Summer onset, increasing demand",
            5: "Peak summer, maximum stress",
            6: "Pre-monsoon, lowest levels",
            7: "Early monsoon, recharge begins",
            8: "Monsoon peak, active recharge",
            9: "Late monsoon, continued recharge",
            10: "Post-monsoon, levels stabilizing",
            11: "Winter approach, good recovery",
            12: "Winter, stable high levels"
        }
        
        base_desc = descriptions.get(month, "Unknown month")
        
        # Add region-specific context
        if region_type == "Thar Desert" and month in [5, 6]:
            base_desc += " (Extreme stress in desert region)"
        elif region_type == "Gangetic Plains" and month in [7, 8, 9]:
            base_desc += " (Strong monsoon recharge)"
        elif region_type == "Western Ghats" and month in [6, 7, 8]:
            base_desc += " (Heavy monsoon impact)"
        elif region_type == "Coastal Plains" and month in [10, 11]:
            base_desc += " (Retreating monsoon benefit)"
        
        return base_desc
    
    def _get_critical_months(self, region_type: str, climate_zone: str) -> List[str]:
        """Get months when water levels are critically low."""
        if region_type == "Thar Desert":
            return ["April", "May", "June", "July"]
        elif region_type == "Deccan Plateau":
            return ["April", "May", "June"]
        elif region_type == "Gangetic Plains":
            return ["May", "June"]
        elif region_type == "Western Ghats":
            return ["March", "April", "May"]
        else:
            return ["April", "May", "June"]
    
    def _get_recharge_period(self, region_type: str, climate_zone: str) -> Dict:
        """Get the main groundwater recharge period."""
        if region_type == "Thar Desert":
            return {"months": ["July", "August"], "description": "Limited monsoon recharge"}
        elif region_type == "Western Ghats":
            return {"months": ["June", "July", "August", "September"], "description": "Heavy monsoon recharge"}
        elif region_type == "Northeast Hills":
            return {"months": ["May", "June", "July", "August", "September"], "description": "Extended monsoon recharge"}
        elif region_type == "Coastal Plains":
            return {"months": ["June", "July", "August", "September", "October"], "description": "Monsoon + retreating monsoon"}
        else:
            return {"months": ["July", "August", "September"], "description": "Monsoon recharge period"}
    
    def _get_stressed_period(self, region_type: str, climate_zone: str) -> Dict:
        """Get the period when groundwater is most stressed."""
        if region_type == "Thar Desert":
            return {"months": ["April", "May", "June", "July"], "description": "Extreme summer stress"}
        elif region_type == "Deccan Plateau":
            return {"months": ["March", "April", "May", "June"], "description": "Summer water stress"}
        elif region_type == "Gangetic Plains":
            return {"months": ["April", "May", "June"], "description": "Pre-monsoon stress"}
        else:
            return {"months": ["April", "May", "June"], "description": "Summer stress period"}
    
    def _assess_drilling_urgency(self, current_level: float, future_level: float) -> str:
        """Assess urgency of drilling based on water levels."""
        if current_level < 5 or future_level > 80:
            return "Immediate"
        elif current_level < 10 or future_level > 60:
            return "High"
        elif current_level < 20 or future_level > 40:
            return "Moderate"
        else:
            return "Low"
    
    def _get_optimal_drilling_months(self, region_type: str, climate_zone: str) -> List[int]:
        """Get optimal months for drilling in specific region."""
        # Generally avoid monsoon (June-September) and peak summer (April-May)
        if region_type == "Thar Desert":
            return [10, 11, 12, 1, 2]  # Oct to Feb (avoid extreme summer and minimal monsoon)
        elif region_type == "Western Ghats":
            return [11, 12, 1, 2, 3]  # Nov to Mar (post-monsoon stability)
        elif region_type == "Gangetic Plains":
            return [10, 11, 12, 1, 2, 3]  # Oct to Mar (post-monsoon to pre-summer)
        elif region_type == "Coastal Plains":
            return [12, 1, 2, 3]  # Dec to Mar (winter stability)
        elif region_type == "Northeast Hills":
            return [11, 12, 1, 2]  # Nov to Feb (post-monsoon)
        else:
            return [11, 12, 1, 2, 3]  # General recommendation
    
    def _get_avoid_drilling_months(self, region_type: str, climate_zone: str) -> List[int]:
        """Get months to avoid drilling."""
        if region_type == "Thar Desert":
            return [4, 5, 6, 7, 8, 9]  # Extreme summer + limited monsoon
        elif region_type == "Western Ghats":
            return [6, 7, 8, 9]  # Heavy monsoon period
        elif region_type == "Gangetic Plains":
            return [6, 7, 8, 9]  # Monsoon period
        elif region_type == "Northeast Hills":
            return [5, 6, 7, 8, 9]  # Extended monsoon
        else:
            return [6, 7, 8, 9]  # General monsoon avoidance
    
    def _create_drilling_timeline(self, urgency: str, optimal_months: List[int], avoid_months: List[int], current_level: float) -> List[Dict]:
        """Create detailed drilling timeline with recommendations."""
        timeline = []
        current_month = datetime.datetime.now().month
        
        month_names = {
            1: 'January', 2: 'February', 3: 'March', 4: 'April',
            5: 'May', 6: 'June', 7: 'July', 8: 'August',
            9: 'September', 10: 'October', 11: 'November', 12: 'December'
        }
        
        for i in range(12):
            month_num = ((current_month + i - 1) % 12) + 1
            month_name = month_names[month_num]
            
            if month_num in optimal_months:
                recommendation = "Excellent"
                action = "Proceed with drilling"
                reasoning = "Optimal weather and ground conditions"
            elif month_num in avoid_months:
                recommendation = "Avoid"
                action = "Postpone drilling"
                reasoning = "Monsoon/extreme weather conditions"
            else:
                recommendation = "Acceptable"
                action = "Proceed with caution"
                reasoning = "Moderate conditions, not ideal but workable"
            
            # Adjust for urgency
            if urgency == "Immediate" and month_num in avoid_months:
                recommendation = "Conditional"
                action = "Proceed if absolutely necessary"
                reasoning = "Emergency drilling despite poor conditions"
            
            timeline.append({
                'month': month_name,
                'monthNumber': month_num,
                'monthsFromNow': i,
                'recommendation': recommendation,
                'action': action,
                'reasoning': reasoning
            })
        
        return timeline
    
    def _get_drilling_reasoning(self, region_type: str, climate_zone: str, urgency: str) -> str:
        """Get detailed reasoning for drilling recommendations."""
        base_reasoning = f"For {region_type} in {climate_zone} climate zone: "
        
        if region_type == "Thar Desert":
            base_reasoning += "Avoid extreme summer heat (Apr-Jul) and work during cooler months. Limited monsoon impact allows longer drilling window in winter."
        elif region_type == "Western Ghats":
            base_reasoning += "Avoid heavy monsoon period (Jun-Sep). Post-monsoon stability provides excellent conditions."
        elif region_type == "Gangetic Plains":
            base_reasoning += "Avoid monsoon flooding (Jun-Sep). Winter months offer stable, dry conditions."
        elif region_type == "Coastal Plains":
            base_reasoning += "Avoid monsoon and cyclone seasons. Winter offers most stable conditions."
        else:
            base_reasoning += "Follow general Indian climate patterns - avoid monsoon, prefer winter/post-winter."
        
        if urgency == "Immediate":
            base_reasoning += " URGENT: Consider proceeding even in suboptimal conditions due to critical water needs."
        elif urgency == "High":
            base_reasoning += " HIGH PRIORITY: Start planning immediately for next optimal window."
        
        return base_reasoning
    
    def _get_timing_recommendation(self, months_ahead: int, region_type: str, climate_zone: str) -> str:
        """Get specific timing recommendation."""
        if months_ahead == 0:
            return "Start immediately - you're in an optimal drilling window!"
        elif months_ahead <= 2:
            return f"Wait {months_ahead} month(s) for optimal conditions - preparation time available."
        elif months_ahead <= 4:
            return f"Plan for {months_ahead} months ahead - use time for permits and site preparation."
        else:
            return f"Next optimal window in {months_ahead} months - consider if immediate action needed."
    
    # Regional classification helper methods
    def _is_gangetic_plains(self, lat: float, lng: float) -> bool:
        """Check if location is in Gangetic Plains."""
        return 24 <= lat <= 32 and 75 <= lng <= 88
    
    def _is_deccan_plateau_region(self, lat: float, lng: float) -> bool:
        """Check if location is in Deccan Plateau."""
        return 12 <= lat <= 22 and 74 <= lng <= 84
    
    def _is_coastal_plains(self, lat: float, lng: float) -> bool:
        """Check if location is in coastal plains."""
        return ((lng < 73 and lat > 8) or  # West coast
                (lng > 88 and lat > 12) or  # East coast
                (lat < 12))  # Southern tip
    
    def _is_western_ghats_region(self, lat: float, lng: float) -> bool:
        """Check if location is in Western Ghats."""
        return 8 <= lat <= 24 and 72 <= lng <= 78
    
    def _is_thar_desert_region(self, lat: float, lng: float) -> bool:
        """Check if location is in Thar Desert."""
        return 24 <= lat <= 30 and 69 <= lng <= 76
    
    def _is_northeast_hills(self, lat: float, lng: float) -> bool:
        """Check if location is in Northeast Hills."""
        return lat > 23 and lng > 88
    
    def _is_central_highlands(self, lat: float, lng: float) -> bool:
        """Check if location is in Central Highlands."""
        return 20 <= lat <= 26 and 76 <= lng <= 84
    
    # Climate classification helper methods
    def _is_arid_climate(self, lat: float, lng: float) -> bool:
        """Check if location has arid climate."""
        return self._is_thar_desert_region(lat, lng)
    
    def _is_semi_arid_climate(self, lat: float, lng: float) -> bool:
        """Check if location has semi-arid climate."""
        return ((15 <= lat <= 20 and 74 <= lng <= 80) or  # Deccan semi-arid
                (20 <= lat <= 24 and 78 <= lng <= 82))     # Central semi-arid
    
    def _is_tropical_wet(self, lat: float, lng: float) -> bool:
        """Check if location has tropical wet climate."""
        return (self._is_western_ghats_region(lat, lng) or
                self._is_northeast_hills(lat, lng) or
                (lat < 15 and lng > 75))  # Southern wet regions
    
    def _is_tropical_wet_dry(self, lat: float, lng: float) -> bool:
        """Check if location has tropical wet-dry climate."""
        return 15 <= lat <= 25 and 75 <= lng <= 88 and not self._is_western_ghats_region(lat, lng)
    
    def _is_subtropical_humid(self, lat: float, lng: float) -> bool:
        """Check if location has subtropical humid climate."""
        return self._is_gangetic_plains(lat, lng)
    
    def _is_mountain_climate(self, lat: float, lng: float) -> bool:
        """Check if location has mountain climate."""
        return lat > 30 or (self._is_northeast_hills(lat, lng) and lat > 25)
    
    def _get_fallback_prediction(self, latitude: float, longitude: float) -> Dict:
        """Return a fallback prediction when model fails."""
        # Simple heuristic-based prediction
        base_level = 15 + abs(latitude) / 3  # Basic estimate
        current_water_level = max(5, min(50, base_level))
        future_water_level = current_water_level * 1.1  # Water table deepens over time
        
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
            'confidence': round(final_confidence, 3),
            'location': {
                'latitude': latitude,
                'longitude': longitude
            },
            'yearlyPredictions': [
                {'year': 'Year 1', 'predictedLevel': round(current_water_level * 1.02, 2)},
                {'year': 'Year 2', 'predictedLevel': round(current_water_level * 1.05, 2)},
                {'year': 'Year 3', 'predictedLevel': round(current_water_level * 1.08, 2)},
                {'year': 'Year 4', 'predictedLevel': round(current_water_level * 1.12, 2)},
                {'year': 'Year 5', 'predictedLevel': round(current_water_level * 1.16, 2)},
            ],
            'seasonalAnalysis': {
                'regionType': 'Estimated Region',
                'climateZone': 'Estimated Climate',
                'seasonalPatterns': [],
                'criticalMonths': ['May', 'June'],
                'rechargePeriod': {'months': ['July', 'August', 'September'], 'description': 'Estimated monsoon recharge'},
                'stressedPeriod': {'months': ['April', 'May', 'June'], 'description': 'Estimated summer stress'}
            },
            'drillingTimeline': {
                'urgency': 'Moderate',
                'optimalMonths': [11, 12, 1, 2, 3],
                'avoidMonths': [6, 7, 8, 9],
                'reasoning': 'Fallback recommendation - general Indian climate pattern'
            },
            'bestDrillingTime': {
                'month': 11,
                'monthName': 'November',
                'monthsFromNow': (11 - datetime.datetime.now().month) % 12,
                'recommendation': 'Post-monsoon stability (fallback estimate)'
            },
            'suitabilityNote': 'Fallback prediction - consider detailed site assessment'
        }

# Function to be called from Node.js
def predict_groundwater(latitude: float, longitude: float, model_path: str = None) -> Dict:
    """
    Main function to predict groundwater level.
    This function will be called from the Node.js backend.
    """
    try:
        if model_path is None:
            # Default path to the groundwater XGBoost model file
            model_path = r"C:\Users\Soujatya\Desktop\Bhujal-New\groundwater_xgboost_model.pkl"
            # Verify the path exists
            if not os.path.exists(model_path):
                # Fallback to relative path
                model_path = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'groundwater_xgboost_model.pkl')
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
    # Test the predictor with multiple locations including some that should trigger suitability notes
    test_locations = [
        (28.6139, 77.2090, "Delhi (Major City)"),
        (19.0760, 72.8777, "Mumbai (Coastal City)"),
        (15.3173, 75.7139, "Karnataka (Rural)"),
        (26.9124, 75.7873, "Jaipur (Arid Zone - Rajasthan)"),
        (22.5726, 88.3639, "Kolkata (Gangetic Plains)"),
        (35.6762, 139.6503, "Tokyo (Outside India)"),
        (23.5, 72.0, "Gujarat (High Recharge Structures)"),
        (18.5, 76.0, "Maharashtra Drought Zone")
    ]
    
    for lat, lng, location_name in test_locations:
        print(f"\n{'='*50}")
        print(f"Testing: {location_name}")
        print(f"Coordinates: ({lat}, {lng})")
        print(f"{'='*50}")
        
        result = predict_groundwater(lat, lng)
        if result['success']:
            data = result['data']
            seasonal = data.get('seasonalAnalysis', {})
            drilling = data.get('drillingTimeline', {})
            best_time = data.get('bestDrillingTime', {})
            
            print(f"🌊 Current Water Level: {data['currentWaterLevel']}m (mbgl)")
            print(f"🔮 Future Level (3 years): {data['futureWaterLevel']}m (mbgl)")
            print(f"✅ Suitable for Borewell: {'Yes' if data['isSuitableForBorewell'] else 'No'}")
            
            if 'suitabilityNote' in data:
                print(f"📝 Advisory: {data['suitabilityNote']}")
            
            # Show regional analysis
            if seasonal:
                print(f"\n🌍 Region: {seasonal.get('regionType', 'Unknown')} | Climate: {seasonal.get('climateZone', 'Unknown')}")
                
                # Show critical information
                critical_months = seasonal.get('criticalMonths', [])
                if critical_months:
                    print(f"⚠️  Critical Low Months: {', '.join(critical_months)}")
                
                recharge_info = seasonal.get('rechargePeriod', {})
                if recharge_info:
                    print(f"💧 Recharge Period: {', '.join(recharge_info.get('months', []))} - {recharge_info.get('description', '')}")
            
            # Show drilling recommendations
            if best_time:
                if best_time['monthsFromNow'] == 0:
                    print(f"🚧 DRILLING RECOMMENDATION: Start NOW ({best_time['monthName']}) - {best_time['recommendation']}")
                else:
                    print(f"🚧 DRILLING RECOMMENDATION: Best time is {best_time['monthName']} ({best_time['monthsFromNow']} months away)")
                    print(f"   {best_time['recommendation']}")
            
            if drilling and 'urgency' in drilling:
                print(f"🚨 Urgency Level: {drilling['urgency']}")
                if drilling.get('reasoning'):
                    print(f"📋 Reasoning: {drilling['reasoning']}")
            
            # Show next 6 months seasonal pattern (brief)
            patterns = seasonal.get('seasonalPatterns', [])
            if patterns:
                print(f"\n📊 Next 6 Months Water Level Forecast:")
                current_month = datetime.datetime.now().month
                for i in range(6):
                    month_idx = (current_month + i - 1) % 12
                    if month_idx < len(patterns):
                        pattern = patterns[month_idx]
                        status_emoji = "🔴" if "Critical" in pattern['status'] else "�" if "Low" in pattern['status'] else "🟢"
                        print(f"   {status_emoji} {pattern['month']}: {pattern['waterLevel']}m - {pattern['status']}")
            
            # Show yearly predictions to verify trend
            print(f"\n📈 5-Year Trend (mbgl - increasing = deepening water table):")
            yearly = data.get('yearlyPredictions', [])
            for prediction in yearly:
                print(f"   {prediction['year']}: {prediction['predictedLevel']}m")

        else:
            print(f"❌ Error: {result.get('error', 'Unknown error')}")
        
    print(f"\n{'='*50}")
    print("Testing Complete!")
