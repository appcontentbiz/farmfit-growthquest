from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Union
from enum import Enum
import logging
from datetime import datetime, timedelta
import numpy as np
from pathlib import Path
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class FarmingMethod(Enum):
    TRADITIONAL = "traditional"
    ORGANIC = "organic"
    HYDROPONIC = "hydroponic"
    AQUAPONIC = "aquaponic"
    VERTICAL = "vertical"
    GREENHOUSE = "greenhouse"
    URBAN = "urban"

class CropType(Enum):
    VEGETABLE = "vegetable"
    FRUIT = "fruit"
    GRAIN = "grain"
    HERB = "herb"
    FLOWER = "flower"
    AQUATIC = "aquatic"
    MICROGREEN = "microgreen"

@dataclass
class MethodRequirements:
    space_needed: int  # square meters
    min_temperature: float
    max_temperature: float
    min_humidity: float
    max_humidity: float
    light_requirements: Dict[str, float]
    water_requirements: Dict[str, float]
    nutrient_requirements: Dict[str, float]
    equipment_needed: List[str]
    maintenance_level: int  # 1-10
    initial_cost: float
    operating_cost: float
    expected_roi: float
    sustainability_score: float  # 0-1
    complexity_level: int  # 1-10

class FarmingMethodsIntegration:
    def __init__(self, data_path: str):
        self.data_path = Path(data_path)
        self.methods: Dict[FarmingMethod, MethodRequirements] = {}
        self.crop_compatibility: Dict[CropType, Set[FarmingMethod]] = {}
        self.method_combinations: Dict[str, List[FarmingMethod]] = {}
        self.executor = ThreadPoolExecutor(max_workers=4)
        self.load_data()

    def load_data(self):
        """Load farming methods data"""
        try:
            with open(self.data_path / "farming_methods.json", "r") as f:
                methods_data = json.load(f)
                for method_name, data in methods_data.items():
                    self.methods[FarmingMethod(method_name)] = MethodRequirements(**data)

            with open(self.data_path / "crop_compatibility.json", "r") as f:
                compat_data = json.load(f)
                for crop_name, methods in compat_data.items():
                    self.crop_compatibility[CropType(crop_name)] = {
                        FarmingMethod(m) for m in methods
                    }

            with open(self.data_path / "method_combinations.json", "r") as f:
                self.method_combinations = json.load(f)

        except Exception as e:
            logger.error(f"Error loading farming methods data: {str(e)}")
            raise

    def get_suitable_methods(
        self,
        space: int,
        budget: float,
        experience_level: int,
        sustainability_priority: float,
        crop_types: List[CropType]
    ) -> List[Dict[str, Any]]:
        """Get suitable farming methods based on constraints"""
        suitable_methods = []
        
        for method, requirements in self.methods.items():
            # Check basic constraints
            if (space < requirements.space_needed or
                budget < requirements.initial_cost or
                experience_level < requirements.complexity_level):
                continue

            # Check crop compatibility
            if not all(method in self.crop_compatibility[crop]
                      for crop in crop_types):
                continue

            # Calculate suitability score
            score = self._calculate_suitability_score(
                method, requirements, space, budget,
                experience_level, sustainability_priority
            )

            if score >= 0.6:  # Only include if reasonably suitable
                suitable_methods.append({
                    'method': method.value,
                    'score': score,
                    'requirements': requirements,
                    'recommendations': self._get_recommendations(
                        method, requirements, space, budget
                    )
                })

        return sorted(suitable_methods, key=lambda x: x['score'], reverse=True)

    def _calculate_suitability_score(
        self,
        method: FarmingMethod,
        requirements: MethodRequirements,
        space: int,
        budget: float,
        experience_level: int,
        sustainability_priority: float
    ) -> float:
        """Calculate how suitable a farming method is"""
        scores = []

        # Space efficiency score
        space_score = min(1.0, space / requirements.space_needed)
        scores.append(space_score)

        # Budget efficiency score
        budget_score = min(1.0, budget / (requirements.initial_cost + 
                                        requirements.operating_cost))
        scores.append(budget_score)

        # Experience match score
        experience_score = 1.0 - (abs(experience_level - 
                                    requirements.complexity_level) / 10)
        scores.append(experience_score)

        # Sustainability score
        sustainability_score = requirements.sustainability_score * sustainability_priority
        scores.append(sustainability_score)

        # ROI score
        roi_score = min(1.0, requirements.expected_roi / 2.0)  # Normalize to 200% ROI
        scores.append(roi_score)

        return float(np.mean(scores))

    def _get_recommendations(
        self,
        method: FarmingMethod,
        requirements: MethodRequirements,
        space: int,
        budget: float
    ) -> List[str]:
        """Get specific recommendations for implementing a farming method"""
        recommendations = []

        # Space recommendations
        if space < requirements.space_needed * 1.2:
            recommendations.append(
                "Consider space optimization techniques for maximum efficiency"
            )

        # Budget recommendations
        if budget < requirements.initial_cost * 1.3:
            recommendations.append(
                "Consider phased implementation to spread costs"
            )

        # Equipment recommendations
        recommendations.append(
            f"Essential equipment needed: {', '.join(requirements.equipment_needed[:3])}"
        )

        # Environmental control recommendations
        recommendations.append(
            f"Maintain temperature between {requirements.min_temperature}°C "
            f"and {requirements.max_temperature}°C"
        )

        return recommendations

    def get_method_combinations(
        self,
        primary_method: FarmingMethod,
        space: int,
        budget: float
    ) -> List[Dict[str, Any]]:
        """Get viable combinations with other farming methods"""
        combinations = []
        base_requirements = self.methods[primary_method]

        for combo_name, methods in self.method_combinations.items():
            if primary_method.value not in methods:
                continue

            # Calculate total requirements
            total_space = sum(
                self.methods[FarmingMethod(m)].space_needed
                for m in methods
            )
            total_cost = sum(
                self.methods[FarmingMethod(m)].initial_cost
                for m in methods
            )

            if total_space <= space and total_cost <= budget:
                combinations.append({
                    'name': combo_name,
                    'methods': methods,
                    'total_space': total_space,
                    'total_cost': total_cost,
                    'synergy_score': self._calculate_synergy_score(methods),
                    'recommendations': self._get_combination_recommendations(
                        methods, space, budget
                    )
                })

        return sorted(combinations, key=lambda x: x['synergy_score'], reverse=True)

    def _calculate_synergy_score(self, methods: List[str]) -> float:
        """Calculate how well methods work together"""
        method_objs = [FarmingMethod(m) for m in methods]
        scores = []

        # Resource sharing score
        equipment_sets = [
            set(self.methods[m].equipment_needed)
            for m in method_objs
        ]
        shared_equipment = set.intersection(*equipment_sets)
        resource_score = len(shared_equipment) / len(set.union(*equipment_sets))
        scores.append(resource_score)

        # Complexity balance score
        complexity_values = [
            self.methods[m].complexity_level
            for m in method_objs
        ]
        complexity_score = 1.0 - (max(complexity_values) - 
                                min(complexity_values)) / 10
        scores.append(complexity_score)

        # Sustainability score
        sustainability_values = [
            self.methods[m].sustainability_score
            for m in method_objs
        ]
        sustainability_score = np.mean(sustainability_values)
        scores.append(sustainability_score)

        return float(np.mean(scores))

    def _get_combination_recommendations(
        self,
        methods: List[str],
        space: int,
        budget: float
    ) -> List[str]:
        """Get recommendations for combining methods"""
        recommendations = []

        # Space allocation
        space_needs = {
            m: self.methods[FarmingMethod(m)].space_needed
            for m in methods
        }
        total_space = sum(space_needs.values())
        
        if total_space > space * 0.9:
            recommendations.append(
                "Space is tight - consider vertical integration where possible"
            )

        # Resource sharing
        equipment_sets = [
            set(self.methods[FarmingMethod(m)].equipment_needed)
            for m in methods
        ]
        shared_equipment = set.intersection(*equipment_sets)
        
        if shared_equipment:
            recommendations.append(
                f"Shared equipment opportunities: {', '.join(list(shared_equipment)[:3])}"
            )

        # Cost optimization
        total_cost = sum(
            self.methods[FarmingMethod(m)].initial_cost
            for m in methods
        )
        
        if total_cost > budget * 0.8:
            recommendations.append(
                "Consider phased implementation to manage costs"
            )

        return recommendations

    def get_transition_plan(
        self,
        current_method: FarmingMethod,
        target_method: FarmingMethod,
        space: int,
        budget: float,
        timeline_months: int
    ) -> Dict[str, Any]:
        """Create a transition plan between farming methods"""
        current_reqs = self.methods[current_method]
        target_reqs = self.methods[target_method]

        # Calculate resource differences
        space_diff = target_reqs.space_needed - current_reqs.space_needed
        cost_diff = target_reqs.initial_cost - current_reqs.initial_cost
        equipment_diff = set(target_reqs.equipment_needed) - set(current_reqs.equipment_needed)

        # Create phased plan
        phases = []
        monthly_budget = budget / timeline_months

        # Phase 1: Preparation
        phases.append({
            'name': 'Preparation',
            'duration': max(1, timeline_months // 4),
            'tasks': [
                'Research and planning',
                'Site preparation',
                'Initial equipment acquisition',
                'Team training'
            ],
            'costs': target_reqs.initial_cost * 0.2
        })

        # Phase 2: Transition
        phases.append({
            'name': 'Transition',
            'duration': max(1, timeline_months // 2),
            'tasks': [
                'Gradual system setup',
                'Parallel operation',
                'Process optimization',
                'Staff training'
            ],
            'costs': target_reqs.initial_cost * 0.5
        })

        # Phase 3: Optimization
        phases.append({
            'name': 'Optimization',
            'duration': max(1, timeline_months // 4),
            'tasks': [
                'System fine-tuning',
                'Full operation',
                'Performance monitoring',
                'Process documentation'
            ],
            'costs': target_reqs.initial_cost * 0.3
        })

        return {
            'phases': phases,
            'total_duration': timeline_months,
            'total_cost': sum(phase['costs'] for phase in phases),
            'space_requirements': {
                'initial': current_reqs.space_needed,
                'final': target_reqs.space_needed,
                'difference': space_diff
            },
            'equipment_needs': list(equipment_diff),
            'recommendations': self._get_transition_recommendations(
                current_method, target_method, timeline_months
            )
        }

    def _get_transition_recommendations(
        self,
        current_method: FarmingMethod,
        target_method: FarmingMethod,
        timeline_months: int
    ) -> List[str]:
        """Get specific recommendations for transition"""
        recommendations = []

        # Complexity difference
        complexity_diff = (self.methods[target_method].complexity_level - 
                         self.methods[current_method].complexity_level)
        
        if complexity_diff > 2:
            recommendations.append(
                "Consider additional training and expert consultation"
            )

        # Timeline recommendations
        if timeline_months < 6:
            recommendations.append(
                "Timeline is aggressive - consider extending for smoother transition"
            )

        # Equipment recommendations
        equipment_diff = (set(self.methods[target_method].equipment_needed) - 
                        set(self.methods[current_method].equipment_needed))
        
        if equipment_diff:
            recommendations.append(
                f"Key new equipment needed: {', '.join(list(equipment_diff)[:3])}"
            )

        return recommendations
