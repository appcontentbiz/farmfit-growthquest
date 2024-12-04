import unittest
from datetime import datetime
from farmfit.data.integration import DataIntegrationHub
from farmfit.data.models import SensorData, WeatherData, MarketData

class TestDataIntegration(unittest.TestCase):
    def setUp(self):
        """Set up test environment before each test"""
        self.data_hub = DataIntegrationHub()
        self.test_sensor_data = SensorData(
            sensor_id="test_sensor",
            timestamp=datetime.now(),
            temperature=24.5,
            humidity=55.0,
            soil_moisture=40.0,
            light_intensity=4800
        )
        self.test_weather_data = WeatherData(
            timestamp=datetime.now(),
            temperature=22.0,
            humidity=60.0,
            precipitation=0.0,
            wind_speed=4.5,
            solar_radiation=750.0
        )
        self.test_market_data = MarketData(
            timestamp=datetime.now(),
            commodity="corn",
            price=175.50,
            volume=50000,
            market="local"
        )

    def test_sensor_data_integration(self):
        """Test sensor data integration and validation"""
        result = self.data_hub.process_sensor_data(self.test_sensor_data)
        self.assertTrue(result['success'])
        self.assertIsNotNone(result['processed_data'])
        self.assertTrue(result['quality_check_passed'])

    def test_weather_data_integration(self):
        """Test weather data integration and processing"""
        result = self.data_hub.process_weather_data(self.test_weather_data)
        self.assertTrue(result['success'])
        self.assertIsNotNone(result['processed_data'])
        self.assertTrue('forecast' in result)

    def test_market_data_integration(self):
        """Test market data integration and analysis"""
        result = self.data_hub.process_market_data(self.test_market_data)
        self.assertTrue(result['success'])
        self.assertIsNotNone(result['processed_data'])
        self.assertTrue('trend_analysis' in result)

    def test_data_synchronization(self):
        """Test data synchronization between different sources"""
        result = self.data_hub.synchronize_data_sources([
            self.test_sensor_data,
            self.test_weather_data,
            self.test_market_data
        ])
        self.assertTrue(result['success'])
        self.assertTrue(result['all_sources_synced'])
        self.assertIsNotNone(result['sync_timestamp'])

    def test_data_validation(self):
        """Test data validation and error handling"""
        invalid_sensor_data = SensorData(
            sensor_id="invalid_sensor",
            timestamp=datetime.now(),
            temperature=-999,  # Invalid temperature
            humidity=150,      # Invalid humidity
            soil_moisture=-50, # Invalid moisture
            light_intensity=-100  # Invalid light intensity
        )
        result = self.data_hub.validate_data(invalid_sensor_data)
        self.assertFalse(result['is_valid'])
        self.assertTrue(len(result['validation_errors']) > 0)

    def test_data_aggregation(self):
        """Test data aggregation functionality"""
        result = self.data_hub.aggregate_data(
            start_date=datetime(2024, 1, 1),
            end_date=datetime(2024, 3, 1),
            data_types=['sensor', 'weather', 'market']
        )
        self.assertTrue(result['success'])
        self.assertIsNotNone(result['aggregated_data'])
        self.assertTrue('summary_statistics' in result)

if __name__ == '__main__':
    unittest.main()
