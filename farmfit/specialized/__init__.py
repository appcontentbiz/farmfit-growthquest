"""
FarmFit Specialized Analytics Systems

This package contains specialized analytics systems for different agricultural domains:
- Grain Analytics
- Hemp Analytics
- Aquaponics Analytics
- Livestock Analytics
- Soil Analytics
- Weather Analytics
"""

from .grain_analytics import GrainAnalytics, GrainData
from .hemp_analytics import HempAnalytics, HempData
from .aquaponics_analytics import (
    AquaponicsAnalytics,
    AquaponicsData,
    WaterQualityData,
    FishData,
    PlantData
)

__all__ = [
    'GrainAnalytics',
    'GrainData',
    'HempAnalytics',
    'HempData',
    'AquaponicsAnalytics',
    'AquaponicsData',
    'WaterQualityData',
    'FishData',
    'PlantData'
]
