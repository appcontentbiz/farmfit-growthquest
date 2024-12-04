"""
Aquaponics Analytics System for FarmFit platform.
Provides comprehensive analysis and optimization for aquaponics systems.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
from datetime import datetime
import numpy as np
from sklearn.ensemble import RandomForestRegressor

@dataclass
class WaterQualityData:
    """Water quality metrics for aquaponics system."""
    ph: float
    ammonia: float
    nitrite: float
    nitrate: float
    temperature: float
    dissolved_oxygen: float

@dataclass
class FishData:
    """Fish-related metrics for aquaponics system."""
    species: str
    biomass: float
    feed_rate: float
    mortality_rate: float
    growth_rate: float

@dataclass
class PlantData:
    """Plant-related metrics for aquaponics system."""
    species: str
    density: float
    growth_rate: float
    nutrient_uptake: float
    health_index: float

@dataclass
class AquaponicsData:
    """Complete aquaponics system data."""
    water_quality: WaterQualityData
    fish: FishData
    plants: PlantData
    system_flow_rate: float
    energy_usage: float

class AquaponicsAnalytics:
    """Analytics system for aquaponics operations."""
    
    def __init__(self):
        """Initialize the analytics system."""
        self.model = RandomForestRegressor(n_estimators=100, random_state=42)
        self._load_optimal_parameters()

    def _load_optimal_parameters(self):
        """Load optimal parameters for different system configurations."""
        self.optimal_params = {
            'water_quality': {
                'ph': {'min': 6.8, 'max': 7.2},
                'ammonia': {'min': 0, 'max': 0.5},
                'nitrite': {'min': 0, 'max': 0.1},
                'nitrate': {'min': 5, 'max': 150},
                'temperature': {'min': 18, 'max': 30},
                'dissolved_oxygen': {'min': 5, 'max': 8}
            },
            'stocking_density': {
                'tilapia': {'min': 20, 'max': 40},  # kg/m3
                'catfish': {'min': 15, 'max': 30},
                'trout': {'min': 10, 'max': 25}
            },
            'plant_density': {
                'leafy_greens': {'min': 20, 'max': 30},  # plants/m2
                'herbs': {'min': 16, 'max': 25},
                'fruiting_plants': {'min': 4, 'max': 8}
            }
        }

    def analyze_system_balance(self, fish_biomass: float, plant_area: float,
                             water_quality: Dict[str, float]) -> dict:
        """Analyze the balance between fish, plants, and water quality."""
        try:
            # Calculate key ratios
            biomass_to_area_ratio = fish_biomass / plant_area
            
            # Evaluate water quality
            ph_status = 6.8 <= water_quality.get('ph', 0) <= 7.2
            ammonia_status = water_quality.get('ammonia', 0) <= 0.5
            
            # Determine system balance
            is_balanced = (
                2.0 <= biomass_to_area_ratio <= 2.5 and  # Optimal range adjusted
                ph_status and
                ammonia_status
            )
            
            # Generate recommendations
            recommendations = []
            if not ph_status:
                recommendations.append("Adjust pH levels to maintain 6.8-7.2 range")
            if not ammonia_status:
                recommendations.append("Reduce feeding rate or increase filtration")
            if biomass_to_area_ratio < 2.0:
                recommendations.append("Consider increasing fish stocking density")
            elif biomass_to_area_ratio > 2.5:
                recommendations.append("Consider expanding plant growing area")
            
            return {
                'balanced': is_balanced,
                'biomass_to_area_ratio': biomass_to_area_ratio,
                'water_quality_status': {
                    'ph': ph_status,
                    'ammonia': ammonia_status
                },
                'recommendations': recommendations
            }
        
        except Exception as e:
            return {'balanced': False, 'error': str(e)}

    def optimize_production(self, system_type: str,
                          current_metrics: Dict[str, float]) -> dict:
        """Optimize production parameters for the aquaponics system."""
        try:
            # Validate system type
            if system_type not in ['nft', 'dwc', 'media_bed']:
                return {'success': False, 'error': 'Invalid system type'}
            
            # Get current metrics
            fish_density = current_metrics.get('fish_density', 0)
            plant_density = current_metrics.get('plant_density', 0)
            water_flow = current_metrics.get('water_flow', 0)
            
            # Calculate optimal parameters based on system type
            optimal_params = {
                'nft': {
                    'fish_density': 25,  # kg/m3
                    'plant_density': 20,  # plants/m2
                    'water_flow': 120    # L/hr
                },
                'dwc': {
                    'fish_density': 30,
                    'plant_density': 25,
                    'water_flow': 150
                },
                'media_bed': {
                    'fish_density': 20,
                    'plant_density': 16,
                    'water_flow': 100
                }
            }[system_type]
            
            # Generate optimization recommendations
            recommendations = []
            if abs(fish_density - optimal_params['fish_density']) > 5:
                recommendations.append(
                    f"Adjust fish density to {optimal_params['fish_density']} kg/m3"
                )
            if abs(plant_density - optimal_params['plant_density']) > 2:
                recommendations.append(
                    f"Adjust plant density to {optimal_params['plant_density']} plants/m2"
                )
            if abs(water_flow - optimal_params['water_flow']) > 20:
                recommendations.append(
                    f"Adjust water flow rate to {optimal_params['water_flow']} L/hr"
                )
            
            return {
                'success': True,
                'optimal_parameters': optimal_params,
                'current_parameters': current_metrics,
                'recommendations': recommendations
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def calculate_sustainability_impact(self, system_data: 'SystemData',
                                     production_data: 'ProductionData') -> dict:
        """Calculate the environmental impact and sustainability metrics."""
        try:
            # Calculate water efficiency
            base_water_usage = 1000  # L/kg of production
            actual_water_usage = base_water_usage * 0.3  # Aquaponics uses ~70% less water
            water_efficiency = 1 - (actual_water_usage / base_water_usage)
            
            # Calculate carbon footprint
            energy_per_kg = 2.5  # kWh/kg of production
            carbon_factor = 0.5  # kg CO2/kWh
            carbon_footprint = production_data.yield_amount * energy_per_kg * carbon_factor
            
            # Calculate resource recovery
            nutrient_recovery = 0.95  # 95% nutrient recovery in aquaponics
            water_reuse = 0.98      # 98% water reuse
            
            # Calculate overall sustainability score
            sustainability_score = (water_efficiency + nutrient_recovery + water_reuse) / 3
            
            return {
                'success': True,
                'water_efficiency': water_efficiency,
                'carbon_footprint': carbon_footprint,
                'nutrient_recovery': nutrient_recovery,
                'water_reuse': water_reuse,
                'sustainability_score': sustainability_score,
                'comparison': {
                    'water_savings': f"{water_efficiency * 100:.1f}% less water usage",
                    'carbon_reduction': "50% less than conventional systems"
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def analyze_integration(self, connected_systems: List[str],
                          resource_flows: Dict[str, float]) -> dict:
        """Analyze integration with other farming systems."""
        try:
            # Validate connected systems
            valid_systems = ['greenhouse', 'solar', 'hydroponics', 'vertical_farm']
            if not all(system in valid_systems for system in connected_systems):
                return {'success': False, 'error': 'Invalid connected system'}
            
            # Analyze resource sharing efficiency
            water_efficiency = min(1.0, resource_flows.get('water', 0) / 1000)
            energy_efficiency = min(1.0, resource_flows.get('energy', 0) / 600)
            
            # Calculate overall integration score
            integration_score = (water_efficiency + energy_efficiency) / 2
            
            # Generate recommendations
            recommendations = []
            if water_efficiency < 0.7:
                recommendations.append("Optimize water sharing between systems")
            if energy_efficiency < 0.7:
                recommendations.append("Consider expanding solar capacity")
            if 'greenhouse' in connected_systems:
                recommendations.append("Monitor greenhouse climate control integration")
            
            return {
                'success': True,
                'integration_score': integration_score,
                'efficiency_metrics': {
                    'water': water_efficiency,
                    'energy': energy_efficiency
                },
                'recommendations': recommendations,
                'optimal_resource_flows': {
                    'water': 1000,  # L/day
                    'energy': 600   # kWh/day
                }
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
