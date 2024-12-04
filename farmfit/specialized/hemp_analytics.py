from dataclasses import dataclass
from typing import List, Optional, Dict
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime

@dataclass
class HempData:
    cbd_content: float
    thc_content: float
    moisture_content: float
    plant_height: float
    plant_density: float
    days_to_harvest: int

class HempAnalytics:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self._is_trained = False

    def analyze_quality(self, hemp_data: HempData) -> dict:
        """Analyze hemp quality based on various parameters."""
        # Calculate quality score based on key parameters
        quality_score = (
            (hemp_data.cbd_content / 20) * 0.4 +
            (1 - hemp_data.thc_content / 0.3) * 0.3 +
            (1 - abs(hemp_data.moisture_content - 12) / 12) * 0.3
        ) * 100

        return {
            'quality_score': max(0, min(100, quality_score)),
            'compliance_status': 'compliant' if hemp_data.thc_content <= 0.3 else 'non-compliant',
            'moisture_status': 'optimal' if 10 <= hemp_data.moisture_content <= 14 else 'suboptimal',
            'recommendations': self._generate_recommendations(hemp_data)
        }

    def train_model(self, historical_data: List[HempData], yields: List[float]):
        """Train the yield prediction model."""
        if not historical_data or not yields or len(historical_data) != len(yields):
            raise ValueError("Invalid training data")

        X = np.array([[
            d.cbd_content,
            d.thc_content,
            d.moisture_content,
            d.plant_height,
            d.plant_density,
            d.days_to_harvest
        ] for d in historical_data])

        self.model.fit(X, yields)
        self._is_trained = True

    def predict_yield(self, hemp_data: HempData) -> Optional[float]:
        """Predict yield based on hemp parameters."""
        if not self._is_trained:
            return None

        X = np.array([[
            hemp_data.cbd_content,
            hemp_data.thc_content,
            hemp_data.moisture_content,
            hemp_data.plant_height,
            hemp_data.plant_density,
            hemp_data.days_to_harvest
        ]])

        return float(self.model.predict(X)[0])

    def _generate_recommendations(self, hemp_data: HempData) -> List[str]:
        """Generate recommendations based on hemp analysis."""
        recommendations = []

        if hemp_data.thc_content > 0.28:  # Close to legal limit
            recommendations.append("Monitor THC levels closely - approaching legal limit")

        if hemp_data.cbd_content < 8:
            recommendations.append("Consider adjusting cultivation practices to improve CBD content")

        if hemp_data.moisture_content > 14:
            recommendations.append("Implement drying measures to prevent mold growth")
        elif hemp_data.moisture_content < 10:
            recommendations.append("Adjust storage conditions to maintain optimal moisture")

        if hemp_data.plant_density > 3:  # plants per square foot
            recommendations.append("Consider reducing plant density to optimize growth")

        return recommendations if recommendations else ["No specific recommendations at this time"]

    def estimate_harvest_window(self, hemp_data: HempData) -> dict:
        """Estimate optimal harvest window based on current data."""
        days_remaining = max(0, hemp_data.days_to_harvest)
        
        return {
            'days_to_harvest': days_remaining,
            'optimal_window': f"{max(0, days_remaining - 5)} to {days_remaining + 5} days",
            'risk_level': 'high' if hemp_data.thc_content > 0.28 else 'normal'
        }

    def check_compliance(self, production_type: str, thc_content: float,
                        growing_conditions: Dict[str, float]) -> dict:
        """Check compliance with regulations based on production type and THC content."""
        # Validate inputs
        if not all([production_type, isinstance(thc_content, (int, float))]):
            return {'compliant': False, 'error': 'Invalid input parameters'}

        # Check THC compliance (0.3% is typical legal limit)
        is_compliant = thc_content <= 0.3

        # Generate compliance report
        report = {
            'production_type': production_type,
            'thc_content': thc_content,
            'legal_limit': 0.3,
            'margin': 0.3 - thc_content,
            'growing_conditions': growing_conditions,
            'timestamp': datetime.now().isoformat()
        }

        recommendations = []
        if thc_content > 0.25:  # Warning threshold
            recommendations.append("THC levels approaching legal limit - monitor closely")
        if growing_conditions.get('temperature', 0) > 30:
            recommendations.append("High temperatures may affect cannabinoid production")
        if growing_conditions.get('humidity', 0) > 65:
            recommendations.append("High humidity may increase risk of mold")

        return {
            'compliant': is_compliant,
            'report': report,
            'recommendations': recommendations
        }

    def optimize_cannabinoid_production(self, target_compound: str,
                                      current_conditions: Dict[str, float]) -> dict:
        """Optimize growing conditions for specific cannabinoid production."""
        if target_compound not in ['CBD', 'CBG', 'CBN']:
            return {'success': False, 'error': 'Unsupported cannabinoid target'}

        # Optimal conditions for different cannabinoids
        optimal_conditions = {
            'CBD': {
                'light_hours': 18,
                'temperature': 25,
                'humidity': 60,
                'soil_ph': 6.5
            },
            'CBG': {
                'light_hours': 16,
                'temperature': 24,
                'humidity': 55,
                'soil_ph': 6.2
            },
            'CBN': {
                'light_hours': 12,
                'temperature': 23,
                'humidity': 50,
                'soil_ph': 6.0
            }
        }

        target_conditions = optimal_conditions[target_compound]
        current_light = current_conditions.get('light_hours', 0)
        current_temp = current_conditions.get('temperature', 0)

        recommendations = []
        if abs(current_light - target_conditions['light_hours']) > 1:
            recommendations.append(
                f"Adjust light cycle to {target_conditions['light_hours']} hours"
            )
        if abs(current_temp - target_conditions['temperature']) > 2:
            recommendations.append(
                f"Adjust temperature to {target_conditions['temperature']}°C"
            )

        return {
            'success': True,
            'optimal_conditions': target_conditions,
            'current_conditions': current_conditions,
            'recommendations': recommendations,
            'estimated_optimization_time': '2-3 weeks'
        }
