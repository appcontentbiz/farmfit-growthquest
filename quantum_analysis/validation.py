from dataclasses import dataclass
from typing import Dict, List, Optional, Union
import numpy as np
from enum import Enum

class ValidationError(Exception):
    """Custom exception for validation errors"""
    def __init__(self, message: str, field: Optional[str] = None):
        self.message = message
        self.field = field
        super().__init__(self.message)

class EnvironmentalFactor(Enum):
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    SOIL_PH = "soil_ph"
    LIGHT_INTENSITY = "light_intensity"
    CO2_LEVEL = "co2_level"

@dataclass
class EnvironmentalLimits:
    min_value: float
    max_value: float
    optimal_range: tuple[float, float]
    unit: str
    warning_threshold: tuple[float, float]
    critical_threshold: tuple[float, float]

# Define environmental parameter limits and optimal ranges
ENVIRONMENTAL_LIMITS = {
    EnvironmentalFactor.TEMPERATURE: EnvironmentalLimits(
        min_value=15.0,
        max_value=30.0,
        optimal_range=(20.0, 24.0),
        unit="°C",
        warning_threshold=(18.0, 26.0),
        critical_threshold=(15.0, 30.0)
    ),
    EnvironmentalFactor.HUMIDITY: EnvironmentalLimits(
        min_value=30.0,
        max_value=70.0,
        optimal_range=(45.0, 55.0),
        unit="%",
        warning_threshold=(40.0, 60.0),
        critical_threshold=(35.0, 65.0)
    ),
    EnvironmentalFactor.SOIL_PH: EnvironmentalLimits(
        min_value=5.5,
        max_value=7.5,
        optimal_range=(6.0, 7.0),
        unit="pH",
        warning_threshold=(5.8, 7.2),
        critical_threshold=(5.5, 7.5)
    ),
    EnvironmentalFactor.LIGHT_INTENSITY: EnvironmentalLimits(
        min_value=20000.0,
        max_value=80000.0,
        optimal_range=(40000.0, 60000.0),
        unit="lux",
        warning_threshold=(30000.0, 70000.0),
        critical_threshold=(25000.0, 75000.0)
    ),
    EnvironmentalFactor.CO2_LEVEL: EnvironmentalLimits(
        min_value=300.0,
        max_value=500.0,
        optimal_range=(380.0, 420.0),
        unit="ppm",
        warning_threshold=(350.0, 450.0),
        critical_threshold=(320.0, 480.0)
    )
}

def validate_environmental_factor(
    factor: EnvironmentalFactor,
    value: float
) -> tuple[bool, Optional[str], str]:
    """
    Validate a single environmental factor value.
    
    Returns:
        tuple: (is_valid, warning_message, status)
        status can be 'optimal', 'warning', 'critical', or 'invalid'
    """
    limits = ENVIRONMENTAL_LIMITS[factor]
    
    try:
        value = float(value)
    except (TypeError, ValueError):
        raise ValidationError(
            f"Invalid value for {factor.value}: must be a number",
            factor.value
        )

    if value < limits.min_value or value > limits.max_value:
        raise ValidationError(
            f"{factor.value} must be between {limits.min_value} and {limits.max_value} {limits.unit}",
            factor.value
        )

    # Check status and generate warnings
    if limits.optimal_range[0] <= value <= limits.optimal_range[1]:
        return True, None, "optimal"
    
    if value < limits.warning_threshold[0]:
        warning = f"Low {factor.value}: {value} {limits.unit}"
        status = "warning" if value > limits.critical_threshold[0] else "critical"
        return True, warning, status
    
    if value > limits.warning_threshold[1]:
        warning = f"High {factor.value}: {value} {limits.unit}"
        status = "warning" if value < limits.critical_threshold[1] else "critical"
        return True, warning, status

    return True, None, "normal"

def validate_environmental_data(data: Dict[str, float]) -> Dict[str, Dict[str, Union[bool, str, None]]]:
    """
    Validate all environmental factors and return validation results.
    """
    validation_results = {}
    warnings = []
    
    for factor in EnvironmentalFactor:
        if factor.value not in data:
            raise ValidationError(f"Missing required factor: {factor.value}")
            
        try:
            is_valid, warning, status = validate_environmental_factor(factor, data[factor.value])
            validation_results[factor.value] = {
                "is_valid": is_valid,
                "warning": warning,
                "status": status
            }
            if warning:
                warnings.append(warning)
        except ValidationError as e:
            validation_results[factor.value] = {
                "is_valid": False,
                "warning": e.message,
                "status": "invalid"
            }
            warnings.append(e.message)

    return {
        "factors": validation_results,
        "warnings": warnings,
        "is_valid": all(r["is_valid"] for r in validation_results.values())
    }

def calculate_environmental_score(data: Dict[str, float]) -> float:
    """
    Calculate an overall environmental score based on how close factors are to optimal ranges.
    """
    validation_result = validate_environmental_data(data)
    if not validation_result["is_valid"]:
        raise ValidationError("Cannot calculate score with invalid environmental data")

    scores = []
    for factor in EnvironmentalFactor:
        value = data[factor.value]
        limits = ENVIRONMENTAL_LIMITS[factor]
        
        # Calculate how close the value is to the optimal range
        if limits.optimal_range[0] <= value <= limits.optimal_range[1]:
            score = 1.0
        else:
            # Distance to nearest optimal value
            dist_to_optimal = min(
                abs(value - limits.optimal_range[0]),
                abs(value - limits.optimal_range[1])
            )
            # Max possible distance within valid range
            max_dist = max(
                abs(limits.min_value - limits.optimal_range[0]),
                abs(limits.max_value - limits.optimal_range[1])
            )
            score = 1.0 - (dist_to_optimal / max_dist)
        
        scores.append(score)
    
    return np.mean(scores)

def generate_recommendations(
    data: Dict[str, float],
    validation_result: Dict[str, Dict[str, Union[bool, str, None]]]
) -> List[str]:
    """
    Generate specific recommendations based on environmental factors and their validation results.
    """
    recommendations = []
    
    for factor in EnvironmentalFactor:
        factor_data = validation_result["factors"][factor.value]
        if factor_data["status"] in ["warning", "critical"]:
            limits = ENVIRONMENTAL_LIMITS[factor]
            value = data[factor.value]
            
            if value < limits.optimal_range[0]:
                recommendations.append(
                    f"Increase {factor.value} from {value:.1f} to "
                    f"{limits.optimal_range[0]:.1f}-{limits.optimal_range[1]:.1f} {limits.unit}"
                )
            elif value > limits.optimal_range[1]:
                recommendations.append(
                    f"Decrease {factor.value} from {value:.1f} to "
                    f"{limits.optimal_range[0]:.1f}-{limits.optimal_range[1]:.1f} {limits.unit}"
                )
    
    return recommendations
