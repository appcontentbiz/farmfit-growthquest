"""
Livestock Analytics System for FarmFit platform.
Provides comprehensive analysis and management tools for livestock care.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime
import numpy as np
from sklearn.ensemble import RandomForestRegressor

@dataclass
class AnimalHealth:
    """Health metrics for individual animals."""
    weight: float
    temperature: float
    heart_rate: float
    respiratory_rate: float
    body_condition_score: float
    vaccination_status: Dict[str, datetime]
    last_checkup: datetime
    medical_history: List[str]

@dataclass
class NutritionalData:
    """Nutritional tracking for livestock."""
    feed_type: str
    daily_intake: float
    feed_efficiency: float
    water_consumption: float
    supplements: List[str]
    grazing_hours: float
    pasture_quality: float

@dataclass
class LivestockData:
    """Complete livestock management data."""
    animal_type: str
    breed: str
    id_number: str
    birth_date: datetime
    health: AnimalHealth
    nutrition: NutritionalData
    reproduction_status: Optional[str]
    production_metrics: Dict[str, float]

class LivestockAnalytics:
    """Analytics system for livestock operations."""
    
    def __init__(self):
        """Initialize the analytics system."""
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self._load_breed_standards()
        self._load_health_parameters()

    def _load_breed_standards(self):
        """Load standard metrics for different breeds."""
        self.breed_standards = {
            'cattle': {
                'angus': {
                    'weight_range': {'min': 550, 'max': 1000},
                    'temperature': {'min': 37.8, 'max': 39.2},
                    'heart_rate': {'min': 48, 'max': 84},
                    'respiratory_rate': {'min': 26, 'max': 50}
                },
                'hereford': {
                    'weight_range': {'min': 500, 'max': 950},
                    'temperature': {'min': 37.8, 'max': 39.2},
                    'heart_rate': {'min': 48, 'max': 84},
                    'respiratory_rate': {'min': 26, 'max': 50}
                }
            },
            'horses': {
                'quarter_horse': {
                    'weight_range': {'min': 400, 'max': 550},
                    'temperature': {'min': 37.5, 'max': 38.5},
                    'heart_rate': {'min': 28, 'max': 44},
                    'respiratory_rate': {'min': 8, 'max': 16}
                },
                'thoroughbred': {
                    'weight_range': {'min': 450, 'max': 600},
                    'temperature': {'min': 37.5, 'max': 38.5},
                    'heart_rate': {'min': 28, 'max': 44},
                    'respiratory_rate': {'min': 8, 'max': 16}
                }
            }
        }

    def _load_health_parameters(self):
        """Load health monitoring parameters."""
        self.health_parameters = {
            'cattle': {
                'vaccinations': [
                    'BVD', 'IBR', 'PI3', 'BRSV', 'Leptospirosis',
                    'Clostridial diseases', 'Anthrax'
                ],
                'checkup_frequency': 90,  # days
                'body_condition_optimal': {'min': 5, 'max': 7}
            },
            'horses': {
                'vaccinations': [
                    'Tetanus', 'Eastern/Western Encephalomyelitis',
                    'Influenza', 'Rhinopneumonitis', 'Rabies'
                ],
                'checkup_frequency': 180,  # days
                'body_condition_optimal': {'min': 4, 'max': 6}
            }
        }

    def analyze_health_status(self, animal_data: LivestockData) -> dict:
        """Analyze animal health status and provide recommendations."""
        try:
            breed_standard = self.breed_standards[animal_data.animal_type][animal_data.breed]
            health_params = self.health_parameters[animal_data.animal_type]
            
            # Calculate health scores
            weight_score = self._calculate_weight_score(
                animal_data.health.weight,
                breed_standard['weight_range']
            )
            
            vital_signs_score = self._analyze_vital_signs(
                animal_data.health,
                breed_standard
            )
            
            vaccination_score = self._check_vaccination_status(
                animal_data.health.vaccination_status,
                health_params['vaccinations']
            )
            
            # Generate health assessment
            health_status = {
                'overall_score': (weight_score + vital_signs_score + vaccination_score) / 3,
                'weight_status': weight_score >= 0.8 ? 'optimal' : 'needs_attention',
                'vital_signs': vital_signs_score >= 0.8 ? 'normal' : 'concerning',
                'vaccination_status': vaccination_score >= 0.9 ? 'current' : 'update_needed',
                'recommendations': self._generate_health_recommendations(
                    animal_data,
                    weight_score,
                    vital_signs_score,
                    vaccination_score
                )
            }
            
            return health_status
            
        except Exception as e:
            return {'error': str(e)}

    def analyze_nutrition(self, animal_data: LivestockData) -> dict:
        """Analyze nutritional status and feeding efficiency."""
        try:
            # Calculate nutritional metrics
            feed_efficiency = animal_data.nutrition.feed_efficiency
            pasture_quality = animal_data.nutrition.pasture_quality
            
            # Generate nutritional assessment
            nutrition_status = {
                'feed_efficiency_score': feed_efficiency,
                'pasture_quality_score': pasture_quality,
                'water_consumption_status': self._analyze_water_consumption(
                    animal_data.nutrition.water_consumption,
                    animal_data.animal_type
                ),
                'recommendations': self._generate_nutrition_recommendations(
                    animal_data.nutrition
                )
            }
            
            return nutrition_status
            
        except Exception as e:
            return {'error': str(e)}

    def predict_health_trends(self, historical_data: List[LivestockData]) -> dict:
        """Predict future health trends based on historical data."""
        try:
            # Extract relevant features
            features = np.array([[
                d.health.weight,
                d.health.body_condition_score,
                d.nutrition.feed_efficiency
            ] for d in historical_data])
            
            # Make predictions
            future_trend = self.model.predict(features)
            
            return {
                'predicted_trend': future_trend.tolist(),
                'confidence': self.model.score(features, future_trend),
                'recommendations': self._generate_trend_recommendations(future_trend)
            }
            
        except Exception as e:
            return {'error': str(e)}

    def _calculate_weight_score(self, weight: float, range_limits: dict) -> float:
        """Calculate weight score based on breed standards."""
        if range_limits['min'] <= weight <= range_limits['max']:
            return 1.0
        deviation = min(
            abs(weight - range_limits['min']),
            abs(weight - range_limits['max'])
        )
        return max(0, 1 - deviation / range_limits['max'])

    def _analyze_vital_signs(self, health: AnimalHealth, standards: dict) -> float:
        """Analyze vital signs against breed standards."""
        temp_score = 1.0 if standards['temperature']['min'] <= health.temperature <= standards['temperature']['max'] else 0.5
        heart_score = 1.0 if standards['heart_rate']['min'] <= health.heart_rate <= standards['heart_rate']['max'] else 0.5
        resp_score = 1.0 if standards['respiratory_rate']['min'] <= health.respiratory_rate <= standards['respiratory_rate']['max'] else 0.5
        
        return (temp_score + heart_score + resp_score) / 3

    def _check_vaccination_status(self, status: Dict[str, datetime], required: List[str]) -> float:
        """Check vaccination status against requirements."""
        current_date = datetime.now()
        valid_vaccinations = sum(
            1 for vaccine in required
            if vaccine in status and (current_date - status[vaccine]).days < 365
        )
        return valid_vaccinations / len(required)

    def _generate_health_recommendations(self, animal_data: LivestockData,
                                      weight_score: float, vital_score: float,
                                      vacc_score: float) -> List[str]:
        """Generate health-related recommendations."""
        recommendations = []
        
        if weight_score < 0.8:
            recommendations.append("Adjust feeding program to optimize weight")
        if vital_score < 0.8:
            recommendations.append("Schedule veterinary check-up for vital signs")
        if vacc_score < 0.9:
            recommendations.append("Update vaccinations")
            
        return recommendations

    def _generate_nutrition_recommendations(self, nutrition: NutritionalData) -> List[str]:
        """Generate nutrition-related recommendations."""
        recommendations = []
        
        if nutrition.feed_efficiency < 0.8:
            recommendations.append("Review feed composition and quality")
        if nutrition.pasture_quality < 0.7:
            recommendations.append("Consider pasture rotation or improvement")
        if nutrition.water_consumption < recommended_water[animal_type]:
            recommendations.append("Monitor and increase water availability")
            
        return recommendations

    def _generate_trend_recommendations(self, trend: np.ndarray) -> List[str]:
        """Generate recommendations based on predicted trends."""
        recommendations = []
        
        if trend[-1] < trend[0]:
            recommendations.append("Monitor health indicators more frequently")
        if np.std(trend) > 0.2:
            recommendations.append("Stabilize management practices")
            
        return recommendations
