from dataclasses import dataclass
from typing import List, Optional, Dict
import numpy as np
from sklearn.ensemble import RandomForestRegressor

@dataclass
class GrainData:
    moisture_content: float
    protein_content: float
    test_weight: float
    foreign_material: float
    damaged_kernels: float

@dataclass
class ProductionData:
    yield_amount: float

class GrainAnalytics:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self._is_trained = False

    def analyze_quality(self, grain_data: GrainData) -> dict:
        """Analyze grain quality based on various parameters."""
        quality_score = (
            (1 - grain_data.foreign_material / 100) * 0.3 +
            (1 - grain_data.damaged_kernels / 100) * 0.3 +
            (grain_data.protein_content / 20) * 0.4
        ) * 100

        return {
            'quality_score': quality_score,
            'moisture_status': 'optimal' if 12 <= grain_data.moisture_content <= 14 else 'suboptimal',
            'protein_status': 'high' if grain_data.protein_content >= 12 else 'normal',
            'recommendations': self._generate_recommendations(grain_data)
        }

    def train_model(self, historical_data: List[GrainData], yields: List[float]):
        """Train the yield prediction model."""
        if not historical_data or not yields or len(historical_data) != len(yields):
            raise ValueError("Invalid training data")

        X = np.array([[
            d.moisture_content,
            d.protein_content,
            d.test_weight,
            d.foreign_material,
            d.damaged_kernels
        ] for d in historical_data])

        self.model.fit(X, yields)
        self._is_trained = True

    def predict_yield(self, grain_data: GrainData) -> Optional[float]:
        """Predict yield based on grain parameters."""
        if not self._is_trained:
            return None

        X = np.array([[
            grain_data.moisture_content,
            grain_data.protein_content,
            grain_data.test_weight,
            grain_data.foreign_material,
            grain_data.damaged_kernels
        ]])

        return float(self.model.predict(X)[0])

    def _generate_recommendations(self, grain_data: GrainData) -> List[str]:
        """Generate recommendations based on grain analysis."""
        recommendations = []

        if grain_data.moisture_content > 14:
            recommendations.append("Reduce moisture content through proper drying")
        elif grain_data.moisture_content < 12:
            recommendations.append("Monitor storage conditions to prevent further moisture loss")

        if grain_data.foreign_material > 1:
            recommendations.append("Improve cleaning and sorting processes")

        if grain_data.damaged_kernels > 2:
            recommendations.append("Investigate cause of kernel damage and adjust handling")

        if grain_data.protein_content < 10:
            recommendations.append("Consider adjusting fertilization strategy for higher protein content")

        return recommendations if recommendations else ["No specific recommendations at this time"]

    def analyze_growth(self, crop_type: str, growth_stage: str, field_conditions: Dict[str, float]) -> Dict[str, float]:
        """Analyze crop growth based on current conditions."""
        # Validate inputs
        if not all([crop_type, growth_stage, field_conditions]):
            return {'success': False, 'error': 'Missing required parameters'}

        # Calculate health index based on field conditions
        soil_moisture = field_conditions.get('soil_moisture', 0)
        temperature = field_conditions.get('temperature', 0)

        # Optimal ranges vary by crop type and growth stage
        moisture_score = self._score_moisture(crop_type, growth_stage, soil_moisture)
        temp_score = self._score_temperature(crop_type, growth_stage, temperature)

        health_index = (moisture_score + temp_score) / 2

        return {
            'success': True,
            'health_index': health_index,
            'moisture_status': 'optimal' if moisture_score > 0.8 else 'suboptimal',
            'temperature_status': 'optimal' if temp_score > 0.8 else 'suboptimal'
        }

    def predict_yield(self, crop_type: str, historical_data: ProductionData, current_conditions: Dict[str, float]) -> Dict[str, float]:
        """Predict crop yield based on historical data and current conditions."""
        try:
            # Extract relevant features
            rainfall = current_conditions.get('rainfall', 0)
            temperature = current_conditions.get('temperature', 0)

            # Simple yield prediction model
            base_yield = historical_data.yield_amount
            rainfall_factor = min(1.2, max(0.8, rainfall / 500))  # Normalize around 500mm
            temp_factor = min(1.2, max(0.8, temperature / 22))    # Normalize around 22°C

            predicted_yield = base_yield * rainfall_factor * temp_factor
            confidence = min(1.0, (rainfall_factor + temp_factor) / 2)

            return {
                'success': True,
                'predicted_yield': predicted_yield,
                'confidence': confidence,
                'factors': {
                    'rainfall_impact': rainfall_factor,
                    'temperature_impact': temp_factor
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def _score_moisture(self, crop_type: str, growth_stage: str, moisture: float) -> float:
        """Score soil moisture based on crop type and growth stage."""
        # Simplified scoring - could be expanded with more crop-specific logic
        optimal_moisture = {
            'wheat': {'flowering': 35, 'vegetative': 40},
            'corn': {'flowering': 40, 'vegetative': 45},
        }.get(crop_type, {}).get(growth_stage, 35)

        return max(0, 1 - abs(moisture - optimal_moisture) / 50)

    def _score_temperature(self, crop_type: str, growth_stage: str, temperature: float) -> float:
        """Score temperature based on crop type and growth stage."""
        # Simplified scoring - could be expanded with more crop-specific logic
        optimal_temp = {
            'wheat': {'flowering': 22, 'vegetative': 20},
            'corn': {'flowering': 25, 'vegetative': 23},
        }.get(crop_type, {}).get(growth_stage, 22)

        return max(0, 1 - abs(temperature - optimal_temp) / 30)
