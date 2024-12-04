"""
FarmFit Data Models - Core data structures
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, Optional

@dataclass
class CropData:
    crop_type: str
    planting_date: datetime
    field_id: str
    soil_type: str
    area: float

@dataclass
class SensorData:
    sensor_id: str
    timestamp: datetime
    temperature: float
    humidity: float
    soil_moisture: float
    light_intensity: float

@dataclass
class WeatherData:
    timestamp: datetime
    temperature: float
    humidity: float
    precipitation: float
    wind_speed: float
    solar_radiation: float

@dataclass
class MarketData:
    timestamp: datetime
    commodity: str
    price: float
    volume: float
    market: str

@dataclass
class SystemData:
    system_id: str
    timestamp: datetime
    type: str
    location: str

@dataclass
class ProductionData:
    timestamp: datetime
    yield_amount: float
    quality_metrics: Dict[str, float]
