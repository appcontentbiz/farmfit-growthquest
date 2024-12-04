import unittest
from datetime import datetime
from farmfit.specialized.grain_analytics import GrainAnalytics
from farmfit.specialized.hemp_analytics import HempAnalytics
from farmfit.specialized.aquaponics_analytics import AquaponicsAnalytics
from farmfit.data.models import SystemData, ProductionData

class TestSpecializedSystems(unittest.TestCase):
    def setUp(self):
        """Set up test environment before each test"""
        self.grain_analytics = GrainAnalytics()
        self.hemp_analytics = HempAnalytics()
        self.aquaponics_analytics = AquaponicsAnalytics()
        
        self.test_system_data = SystemData(
            system_id="test_system",
            timestamp=datetime.now(),
            type="commercial",
            location="test_location"
        )
        
        self.test_production_data = ProductionData(
            timestamp=datetime.now(),
            yield_amount=1000.0,
            quality_metrics={
                "moisture": 14.0,
                "protein": 12.5,
                "purity": 98.5
            }
        )

    def test_grain_analysis(self):
        """Test grain analytics system"""
        # Test growth analysis
        growth_result = self.grain_analytics.analyze_growth(
            crop_type="wheat",
            growth_stage="flowering",
            field_conditions={"soil_moisture": 35, "temperature": 22}
        )
        self.assertTrue(growth_result['success'])
        self.assertIsNotNone(growth_result['health_index'])
        
        # Test yield prediction
        yield_result = self.grain_analytics.predict_yield(
            crop_type="wheat",
            historical_data=self.test_production_data,
            current_conditions={"rainfall": 500, "temperature": 22}
        )
        self.assertTrue(yield_result['success'])
        self.assertTrue(0 <= yield_result['confidence'] <= 1)

    def test_hemp_analytics(self):
        """Test hemp analytics system"""
        # Test compliance monitoring
        compliance_result = self.hemp_analytics.check_compliance(
            production_type="CBD",
            thc_content=0.2,
            growing_conditions={"temperature": 25, "humidity": 60}
        )
        self.assertTrue(compliance_result['compliant'])
        self.assertIsNotNone(compliance_result['report'])
        
        # Test cannabinoid optimization
        optimization_result = self.hemp_analytics.optimize_cannabinoid_production(
            target_compound="CBD",
            current_conditions={"light_hours": 14, "temperature": 25}
        )
        self.assertTrue(optimization_result['success'])
        self.assertIsNotNone(optimization_result['recommendations'])

    def test_aquaponics_analytics(self):
        """Test aquaponics analytics system"""
        # Test system balance
        balance_result = self.aquaponics_analytics.analyze_system_balance(
            fish_biomass=100.0,
            plant_area=50.0,
            water_quality={"ph": 7.0, "ammonia": 0.25}
        )
        self.assertTrue(balance_result['balanced'])
        self.assertIsNotNone(balance_result['recommendations'])
        
        # Test production optimization
        optimization_result = self.aquaponics_analytics.optimize_production(
            system_type="nft",
            current_metrics={
                "fish_density": 10.0,
                "plant_density": 20.0,
                "water_flow": 100.0
            }
        )
        self.assertTrue(optimization_result['success'])
        self.assertIsNotNone(optimization_result['optimal_parameters'])

    def test_cross_system_integration(self):
        """Test integration between specialized systems"""
        # Test resource sharing analysis
        integration_result = self.aquaponics_analytics.analyze_integration(
            connected_systems=["greenhouse", "solar"],
            resource_flows={"water": 1000, "energy": 500}
        )
        self.assertTrue(integration_result['success'])
        self.assertIsNotNone(integration_result['efficiency_metrics'])
        
        # Test sustainability impact
        sustainability_result = self.aquaponics_analytics.calculate_sustainability_impact(
            system_data=self.test_system_data,
            production_data=self.test_production_data
        )
        self.assertTrue(sustainability_result['success'])
        self.assertTrue('carbon_footprint' in sustainability_result)
        self.assertTrue('water_efficiency' in sustainability_result)

if __name__ == '__main__':
    unittest.main()
