from dataclasses import dataclass
from typing import Dict, List, Optional, Set, Tuple
import json
import numpy as np
from datetime import datetime, timedelta
from enum import Enum
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class DifficultyLevel(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class GrowthStage(Enum):
    GERMINATION = "germination"
    SEEDLING = "seedling"
    VEGETATIVE = "vegetative"
    FLOWERING = "flowering"
    FRUITING = "fruiting"
    HARVEST = "harvest"

@dataclass
class PlantRequirement:
    min_value: float
    max_value: float
    optimal_range: Tuple[float, float]
    unit: str
    importance: int  # 1-10
    tips: List[str]
    common_mistakes: List[str]
    warning_signs: List[str]

@dataclass
class GrowthStageGuide:
    stage: GrowthStage
    duration: Tuple[int, int]  # min and max days
    description: str
    key_indicators: List[str]
    common_problems: List[str]
    solutions: List[str]
    tips: List[str]
    images: List[str]

@dataclass
class PlantGuide:
    name: str
    scientific_name: str
    difficulty: DifficultyLevel
    description: str
    growth_time: Tuple[int, int]  # min and max days
    space_needed: Tuple[int, int]  # in cm
    light_requirement: PlantRequirement
    temperature_requirement: PlantRequirement
    water_requirement: PlantRequirement
    soil_requirement: PlantRequirement
    nutrient_requirement: PlantRequirement
    growth_stages: List[GrowthStageGuide]
    companion_plants: List[str]
    pests: List[str]
    diseases: List[str]
    benefits: List[str]
    tips: List[str]
    warnings: List[str]
    success_rate: float  # 0-1
    maintenance_level: int  # 1-10

class LearningSystem:
    def __init__(self, data_path: str):
        self.data_path = Path(data_path)
        self.plants: Dict[str, PlantGuide] = {}
        self.learning_paths: Dict[str, List[str]] = {}
        self.load_data()

    def load_data(self):
        """Load plant data and learning paths"""
        try:
            with open(self.data_path / "plants.json", "r") as f:
                plant_data = json.load(f)
                for data in plant_data:
                    self.plants[data["name"]] = self._create_plant_guide(data)

            with open(self.data_path / "learning_paths.json", "r") as f:
                self.learning_paths = json.load(f)
        except Exception as e:
            logger.error(f"Error loading data: {str(e)}")
            raise

    def _create_plant_guide(self, data: Dict) -> PlantGuide:
        """Create PlantGuide object from JSON data"""
        return PlantGuide(
            name=data["name"],
            scientific_name=data["scientific_name"],
            difficulty=DifficultyLevel(data["difficulty"]),
            description=data["description"],
            growth_time=(data["growth_time_min"], data["growth_time_max"]),
            space_needed=(data["space_needed_min"], data["space_needed_max"]),
            light_requirement=self._create_requirement(data["light"]),
            temperature_requirement=self._create_requirement(data["temperature"]),
            water_requirement=self._create_requirement(data["water"]),
            soil_requirement=self._create_requirement(data["soil"]),
            nutrient_requirement=self._create_requirement(data["nutrients"]),
            growth_stages=[
                self._create_stage_guide(stage)
                for stage in data["growth_stages"]
            ],
            companion_plants=data["companion_plants"],
            pests=data["pests"],
            diseases=data["diseases"],
            benefits=data["benefits"],
            tips=data["tips"],
            warnings=data["warnings"],
            success_rate=data["success_rate"],
            maintenance_level=data["maintenance_level"]
        )

    def _create_requirement(self, data: Dict) -> PlantRequirement:
        """Create PlantRequirement object from JSON data"""
        return PlantRequirement(
            min_value=data["min"],
            max_value=data["max"],
            optimal_range=(data["optimal_min"], data["optimal_max"]),
            unit=data["unit"],
            importance=data["importance"],
            tips=data["tips"],
            common_mistakes=data["common_mistakes"],
            warning_signs=data["warning_signs"]
        )

    def _create_stage_guide(self, data: Dict) -> GrowthStageGuide:
        """Create GrowthStageGuide object from JSON data"""
        return GrowthStageGuide(
            stage=GrowthStage(data["stage"]),
            duration=(data["duration_min"], data["duration_max"]),
            description=data["description"],
            key_indicators=data["key_indicators"],
            common_problems=data["common_problems"],
            solutions=data["solutions"],
            tips=data["tips"],
            images=data["images"]
        )

    def get_beginner_plants(self) -> List[PlantGuide]:
        """Get list of plants suitable for beginners"""
        return [
            plant for plant in self.plants.values()
            if plant.difficulty == DifficultyLevel.BEGINNER
            and plant.success_rate >= 0.8
            and plant.maintenance_level <= 5
        ]

    def get_plant_recommendations(
        self,
        space: int,
        light_level: str,
        time_available: int,
        experience_level: DifficultyLevel
    ) -> List[Tuple[PlantGuide, float]]:
        """Get personalized plant recommendations"""
        recommendations = []
        for plant in self.plants.values():
            score = self._calculate_recommendation_score(
                plant, space, light_level, time_available, experience_level
            )
            if score > 0.6:  # Only recommend if good match
                recommendations.append((plant, score))

        return sorted(recommendations, key=lambda x: x[1], reverse=True)

    def _calculate_recommendation_score(
        self,
        plant: PlantGuide,
        space: int,
        light_level: str,
        time_available: int,
        experience_level: DifficultyLevel
    ) -> float:
        """Calculate how well a plant matches user's conditions"""
        scores = []

        # Space score
        space_score = 1.0 if space >= plant.space_needed[0] else 0.0
        scores.append(space_score)

        # Light score
        light_scores = {
            "low": 0.3,
            "medium": 0.6,
            "high": 1.0
        }
        light_score = light_scores.get(light_level, 0.0)
        scores.append(light_score)

        # Time score
        time_score = 1.0 if time_available >= plant.growth_time[0] else 0.0
        scores.append(time_score)

        # Experience score
        experience_scores = {
            DifficultyLevel.BEGINNER: 1.0 if plant.difficulty == DifficultyLevel.BEGINNER else 0.3,
            DifficultyLevel.INTERMEDIATE: 0.7 if plant.difficulty != DifficultyLevel.ADVANCED else 0.4,
            DifficultyLevel.ADVANCED: 1.0
        }
        experience_score = experience_scores.get(experience_level, 0.0)
        scores.append(experience_score)

        # Success rate score
        scores.append(plant.success_rate)

        return np.mean(scores)

    def get_growth_stage_guide(
        self,
        plant_name: str,
        current_stage: GrowthStage
    ) -> Dict:
        """Get detailed guidance for current growth stage"""
        plant = self.plants.get(plant_name)
        if not plant:
            raise ValueError(f"Plant {plant_name} not found")

        stage_guide = next(
            (stage for stage in plant.growth_stages if stage.stage == current_stage),
            None
        )
        if not stage_guide:
            raise ValueError(f"Stage {current_stage} not found for {plant_name}")

        return {
            "stage": stage_guide.stage.value,
            "duration": stage_guide.duration,
            "description": stage_guide.description,
            "key_indicators": stage_guide.key_indicators,
            "common_problems": stage_guide.common_problems,
            "solutions": stage_guide.solutions,
            "tips": stage_guide.tips,
            "images": stage_guide.images,
            "next_stage": self._get_next_stage(plant, current_stage)
        }

    def _get_next_stage(
        self,
        plant: PlantGuide,
        current_stage: GrowthStage
    ) -> Optional[Dict]:
        """Get information about the next growth stage"""
        stages = [stage.stage for stage in plant.growth_stages]
        current_index = stages.index(current_stage)
        
        if current_index < len(stages) - 1:
            next_stage = plant.growth_stages[current_index + 1]
            return {
                "stage": next_stage.stage.value,
                "description": next_stage.description,
                "preparation_tips": next_stage.tips[:3]  # Top 3 tips
            }
        return None

    def get_problem_solutions(
        self,
        plant_name: str,
        problem_type: str,
        symptoms: List[str]
    ) -> List[Dict]:
        """Get solutions for common problems"""
        plant = self.plants.get(plant_name)
        if not plant:
            raise ValueError(f"Plant {plant_name} not found")

        solutions = []
        if problem_type == "pest":
            for pest in plant.pests:
                if any(symptom.lower() in pest.lower() for symptom in symptoms):
                    solutions.append({
                        "type": "pest",
                        "name": pest,
                        "solutions": self._get_pest_solutions(pest)
                    })
        elif problem_type == "disease":
            for disease in plant.diseases:
                if any(symptom.lower() in disease.lower() for symptom in symptoms):
                    solutions.append({
                        "type": "disease",
                        "name": disease,
                        "solutions": self._get_disease_solutions(disease)
                    })

        return solutions

    def _get_pest_solutions(self, pest: str) -> List[str]:
        """Get solutions for specific pest"""
        # Implementation would include database lookup
        return [
            "Inspect plants regularly",
            "Remove affected leaves",
            "Use organic pesticides",
            "Introduce beneficial insects"
        ]

    def _get_disease_solutions(self, disease: str) -> List[str]:
        """Get solutions for specific disease"""
        # Implementation would include database lookup
        return [
            "Improve air circulation",
            "Adjust watering schedule",
            "Remove infected plants",
            "Apply organic fungicide"
        ]

    def get_learning_path(
        self,
        experience_level: DifficultyLevel,
        goals: List[str]
    ) -> List[Dict]:
        """Generate personalized learning path"""
        base_path = self.learning_paths[experience_level.value]
        
        # Customize path based on goals
        custom_path = []
        for step in base_path:
            custom_path.append({
                "title": step,
                "resources": self._get_learning_resources(step),
                "exercises": self._get_practical_exercises(step),
                "milestones": self._get_milestones(step)
            })

        return custom_path

    def _get_learning_resources(self, topic: str) -> List[Dict]:
        """Get learning resources for a topic"""
        # Implementation would include database lookup
        return [
            {
                "type": "video",
                "title": f"Understanding {topic}",
                "url": f"https://example.com/learn/{topic}",
                "duration": "10:00"
            },
            {
                "type": "article",
                "title": f"Guide to {topic}",
                "url": f"https://example.com/guides/{topic}",
                "reading_time": "5 mins"
            }
        ]

    def _get_practical_exercises(self, topic: str) -> List[Dict]:
        """Get practical exercises for a topic"""
        # Implementation would include database lookup
        return [
            {
                "title": f"Practice {topic}",
                "description": "Step-by-step exercise",
                "duration": "30 mins",
                "materials_needed": ["Soil", "Seeds", "Water"]
            }
        ]

    def _get_milestones(self, topic: str) -> List[Dict]:
        """Get milestones for tracking progress"""
        # Implementation would include database lookup
        return [
            {
                "title": f"Complete {topic} basics",
                "criteria": ["Understand concepts", "Complete exercise"],
                "points": 100
            }
        ]
