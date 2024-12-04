import numpy as np
import tensorflow as tf
from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass
import logging
from pathlib import Path
import json
from datetime import datetime

from .validation import (
    validate_environmental_data,
    calculate_environmental_score,
    generate_recommendations,
    ValidationError
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class QuantumState:
    """Represents a quantum state with real and imaginary components"""
    real: float
    imag: float
    
    @property
    def magnitude(self) -> float:
        return np.sqrt(self.real**2 + self.imag**2)
    
    @property
    def phase(self) -> float:
        return np.arctan2(self.imag, self.real)

class QuantumPredictionError(Exception):
    """Custom exception for quantum prediction errors"""
    pass

class QuantumPredictor:
    def __init__(self, model_path: Optional[str] = None):
        self.model: Optional[tf.keras.Model] = None
        self.model_path = model_path or str(Path(__file__).parent / "models" / "quantum_model")
        self.history: List[Dict] = []
        self._load_model()

    def _load_model(self) -> None:
        """Load the TensorFlow model with error handling"""
        try:
            self.model = tf.keras.models.load_model(self.model_path)
            logger.info("Successfully loaded quantum prediction model")
        except (IOError, ImportError) as e:
            logger.error(f"Failed to load model from {self.model_path}: {str(e)}")
            raise QuantumPredictionError(f"Failed to load quantum model: {str(e)}")

    def _calculate_quantum_state(self, environmental_score: float) -> QuantumState:
        """
        Calculate quantum state based on environmental conditions
        """
        try:
            # Create superposition of optimal and stress states
            optimal_amplitude = np.sqrt(environmental_score)
            stress_amplitude = np.sqrt(1 - environmental_score)
            
            # Calculate quantum state components
            state = QuantumState(
                real=optimal_amplitude * np.cos(environmental_score * np.pi/2),
                imag=stress_amplitude * np.sin(environmental_score * np.pi/2)
            )
            
            # Verify state normalization
            if not np.isclose(state.magnitude, 1.0, atol=1e-6):
                raise QuantumPredictionError("Quantum state normalization error")
            
            return state
            
        except Exception as e:
            logger.error(f"Error calculating quantum state: {str(e)}")
            raise QuantumPredictionError(f"Quantum state calculation failed: {str(e)}")

    def predict(self, environmental_data: Dict[str, float]) -> Dict[str, Union[float, List[str], Dict]]:
        """
        Make predictions using quantum-enhanced model with comprehensive error handling
        """
        try:
            # Validate environmental data
            validation_result = validate_environmental_data(environmental_data)
            if not validation_result["is_valid"]:
                raise ValidationError("Invalid environmental data", 
                                   str(validation_result["warnings"]))

            # Calculate environmental score
            env_score = calculate_environmental_score(environmental_data)
            
            # Calculate quantum state
            quantum_state = self._calculate_quantum_state(env_score)
            
            # Prepare model input
            model_input = np.array([[
                environmental_data["temperature"],
                environmental_data["humidity"],
                environmental_data["soil_ph"],
                environmental_data["light_intensity"],
                environmental_data["co2_level"],
                quantum_state.real,
                quantum_state.imag
            ]])

            # Make prediction
            if self.model is None:
                raise QuantumPredictionError("Model not initialized")
                
            prediction = self.model.predict(model_input, verbose=0)
            growth_potential, pred_env_score, quantum_efficiency = prediction[0]

            # Generate recommendations
            recommendations = generate_recommendations(
                environmental_data, validation_result
            )

            # Calculate confidence score based on quantum coherence
            confidence_score = 1.0 - abs(1.0 - quantum_state.magnitude)

            # Store prediction in history
            self._update_history(environmental_data, growth_potential)

            return {
                "growth_potential": float(growth_potential),
                "environmental_score": float(pred_env_score),
                "quantum_efficiency": float(quantum_efficiency),
                "confidence_score": float(confidence_score),
                "recommendations": recommendations,
                "warnings": validation_result["warnings"],
                "quantum_state": {
                    "real": quantum_state.real,
                    "imaginary": quantum_state.imag,
                    "magnitude": quantum_state.magnitude,
                    "phase": quantum_state.phase
                },
                "history": self._get_recent_history()
            }

        except ValidationError as e:
            logger.error(f"Validation error: {str(e)}")
            raise
        except QuantumPredictionError as e:
            logger.error(f"Quantum prediction error: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in prediction: {str(e)}")
            raise QuantumPredictionError(f"Prediction failed: {str(e)}")

    def _update_history(self, environmental_data: Dict[str, float], growth_potential: float) -> None:
        """Update prediction history with error handling"""
        try:
            self.history.append({
                "timestamp": datetime.now().isoformat(),
                "environmental_data": environmental_data.copy(),
                "growth_potential": float(growth_potential)
            })
            
            # Keep only last 30 predictions
            if len(self.history) > 30:
                self.history = self.history[-30:]
                
        except Exception as e:
            logger.warning(f"Failed to update history: {str(e)}")

    def _get_recent_history(self) -> List[Dict]:
        """Get recent prediction history with error handling"""
        try:
            return [
                {
                    "timestamp": entry["timestamp"],
                    "growth_potential": entry["growth_potential"]
                }
                for entry in self.history
            ]
        except Exception as e:
            logger.warning(f"Failed to retrieve history: {str(e)}")
            return []

    def save_history(self, filepath: str) -> None:
        """Save prediction history to file with error handling"""
        try:
            with open(filepath, 'w') as f:
                json.dump(self.history, f, indent=2)
            logger.info(f"Successfully saved history to {filepath}")
        except Exception as e:
            logger.error(f"Failed to save history: {str(e)}")
            raise QuantumPredictionError(f"Failed to save history: {str(e)}")

    def load_history(self, filepath: str) -> None:
        """Load prediction history from file with error handling"""
        try:
            with open(filepath, 'r') as f:
                self.history = json.load(f)
            logger.info(f"Successfully loaded history from {filepath}")
        except Exception as e:
            logger.error(f"Failed to load history: {str(e)}")
            raise QuantumPredictionError(f"Failed to load history: {str(e)}")
