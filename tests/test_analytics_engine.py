import unittest
from datetime import datetime
from farmfit.analytics.engine import AnalyticsEngine
from farmfit.data.models import CropData, SensorData, WeatherData

class TestAnalyticsEngine(unittest.TestCase):
    def setUp(self):
        """Set up test environment before each test"""
        self.analytics = AnalyticsEngine()
        self.test_crop_data = CropData(
            crop_type="corn",
            planting_date=datetime(2024, 3, 1),
            field_id="test_field_1",
            soil_type="loam",
            area=100.0
        )
        self.test_sensor_data = SensorData(
            sensor_id="sensor_1",
            timestamp=datetime.now(),
            temperature=25.0,
            humidity=60.0,
            soil_moisture=35.0,
            light_intensity=5000
        )
        self.test_weather_data = WeatherData(
            timestamp=datetime.now(),
            temperature=23.0,
            humidity=65.0,
            precipitation=0.0,
            wind_speed=5.0,
            solar_radiation=800.0
        )

    def test_crop_growth_analysis(self):
        """Test crop growth analysis functionality"""
        result = self.analytics.analyze_crop_growth(self.test_crop_data)
        self.assertIsNotNone(result)
        self.assertTrue('growth_stage' in result)
        self.assertTrue('health_index' in result)
        self.assertTrue('yield_forecast' in result)

    def test_environmental_analysis(self):
        """Test environmental conditions analysis"""
        result = self.analytics.analyze_environment(
            self.test_sensor_data,
            self.test_weather_data
        )
        self.assertIsNotNone(result)
        self.assertTrue('stress_index' in result)
        self.assertTrue('irrigation_needed' in result)
        self.assertTrue('pest_risk' in result)

    def test_yield_prediction(self):
        """Test yield prediction capabilities"""
        result = self.analytics.predict_yield(
            self.test_crop_data,
            self.test_sensor_data,
            self.test_weather_data
        )
        self.assertIsNotNone(result)
        self.assertTrue('expected_yield' in result)
        self.assertTrue('confidence_interval' in result)
        self.assertTrue(0 <= result['confidence_interval'] <= 1)

    def test_resource_optimization(self):
        """Test resource optimization recommendations"""
        result = self.analytics.optimize_resources(
            self.test_crop_data,
            self.test_sensor_data,
            self.test_weather_data
        )
        self.assertIsNotNone(result)
        self.assertTrue('water_recommendations' in result)
        self.assertTrue('fertilizer_recommendations' in result)
        self.assertTrue('energy_optimization' in result)

    def test_sustainability_metrics(self):
        """Test sustainability metrics calculation"""
        result = self.analytics.calculate_sustainability_metrics(
            self.test_crop_data,
            self.test_sensor_data
        )
        self.assertIsNotNone(result)
        self.assertTrue('water_efficiency' in result)
        self.assertTrue('carbon_footprint' in result)
        self.assertTrue('biodiversity_impact' in result)

if __name__ == '__main__':
    unittest.main()
