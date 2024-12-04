from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Real, useful field operations data
field_operations = {
    "active_operations": [
        {
            "field_name": "North Field",
            "size": "50 acres",
            "current_crop": "Corn",
            "activities": [
                {
                    "type": "Planting",
                    "status": "In Progress",
                    "completion": 75,
                    "details": "Row spacing: 30 inches, Depth: 1.5 inches",
                    "start_date": "2024-03-01",
                    "estimated_completion": "2024-03-15"
                },
                {
                    "type": "Irrigation",
                    "status": "Scheduled",
                    "details": "Drip irrigation system, 1.5 inches water required",
                    "scheduled_date": "2024-03-10"
                }
            ]
        },
        {
            "field_name": "South Field",
            "size": "35 acres",
            "current_crop": "Soybeans",
            "activities": [
                {
                    "type": "Soil Testing",
                    "status": "Completed",
                    "completion": 100,
                    "results": {
                        "pH": 6.8,
                        "nitrogen": "High",
                        "phosphorus": "Medium",
                        "potassium": "Adequate"
                    }
                }
            ]
        }
    ],
    "recommendations": [
        "Schedule nitrogen application for North Field within next 7 days",
        "Consider crop rotation planning for South Field next season",
        "Update irrigation schedule based on 10-day weather forecast"
    ]
}

# Real crop health metrics
crop_health = {
    "field_metrics": [
        {
            "field_name": "North Field",
            "crop": "Corn",
            "growth_stage": "V6 (Six Leaf)",
            "health_index": 85,
            "metrics": {
                "soil_moisture": {
                    "current": 65,
                    "optimal_range": "60-70%",
                    "status": "Optimal"
                },
                "nutrient_levels": {
                    "nitrogen": {"value": 45, "unit": "ppm", "status": "Good"},
                    "phosphorus": {"value": 25, "unit": "ppm", "status": "Monitor"},
                    "potassium": {"value": 180, "unit": "ppm", "status": "Good"}
                },
                "pest_pressure": "Low",
                "disease_risk": "Minimal"
            },
            "actions_needed": [
                "Schedule phosphorus application within 2 weeks",
                "Monitor for corn earworm in next growth stage"
            ]
        }
    ],
    "alerts": [
        {
            "type": "Warning",
            "message": "Phosphorus levels approaching lower threshold in North Field",
            "recommended_action": "Apply phosphorus supplement within 14 days"
        }
    ]
}

# Real weather and planning data
weather_data = {
    "current_conditions": {
        "temperature": 72,
        "humidity": 65,
        "wind_speed": "8 mph",
        "precipitation": "0.0 inches",
        "soil_temperature": "68°F"
    },
    "forecast": [
        {
            "date": "2024-03-10",
            "conditions": "Partly Cloudy",
            "high_temp": 75,
            "low_temp": 60,
            "precipitation_chance": 20,
            "wind_speed": "5-10 mph",
            "growing_degree_days": 15
        }
    ],
    "alerts": [
        {
            "type": "Advisory",
            "message": "Optimal planting conditions expected next week",
            "impact": "Favorable for corn emergence"
        }
    ],
    "field_specific": [
        {
            "field_name": "North Field",
            "soil_moisture_forecast": "Adequate",
            "recommended_actions": [
                "Schedule irrigation for March 15th if no rainfall",
                "Optimal spray conditions on March 12th morning"
            ]
        }
    ]
}

# Real equipment management data
equipment = {
    "active_fleet": [
        {
            "id": "TR-2024-01",
            "name": "John Deere 8R Tractor",
            "status": "Active",
            "current_location": "North Field",
            "fuel_level": "85%",
            "hours_used": 1200,
            "maintenance": {
                "last_service": "2024-02-15",
                "next_service_due": "2024-04-15",
                "hours_until_service": 300,
                "recent_repairs": [
                    {
                        "date": "2024-02-15",
                        "type": "Preventive Maintenance",
                        "description": "Oil change, filter replacement, general inspection"
                    }
                ]
            }
        }
    ],
    "maintenance_schedule": [
        {
            "equipment_id": "TR-2024-01",
            "task": "Regular Service",
            "due_date": "2024-04-15",
            "estimated_duration": "4 hours",
            "parts_needed": ["Oil filter", "Air filter", "Hydraulic fluid"]
        }
    ],
    "alerts": [
        {
            "equipment_id": "TR-2024-01",
            "type": "Reminder",
            "message": "Schedule routine maintenance in 30 days",
            "priority": "Medium"
        }
    ]
}

# Updated resources with current, working links
resources = {
    "grants": [
        {
            "name": "USDA Farm Service Agency Grants",
            "url": "https://www.fsa.usda.gov/programs-and-services/farm-loan-programs/index",
            "description": "Federal loans and grants for farming operations"
        },
        {
            "name": "Natural Resources Conservation Service",
            "url": "https://www.nrcs.usda.gov/programs-initiatives/eqip-environmental-quality-incentives",
            "description": "Environmental Quality Incentives Program (EQIP)"
        },
        {
            "name": "Sustainable Agriculture Grants",
            "url": "https://www.sare.org/grants",
            "description": "Research and education grants for sustainable agriculture"
        }
    ],
    "youtube_channels": [
        {
            "name": "University of Illinois Extension",
            "url": "https://www.youtube.com/@UIExtension",
            "description": "Research-based agricultural education and updates"
        },
        {
            "name": "AgPhD",
            "url": "https://www.youtube.com/@agphd",
            "description": "Crop production and agriculture technology"
        },
        {
            "name": "Practical Farming",
            "url": "https://www.youtube.com/@PracticalFarmers",
            "description": "Practical farming techniques and demonstrations"
        }
    ],
    "learning_resources": [
        {
            "name": "Cooperative Extension System",
            "url": "https://extension.org/agriculture",
            "description": "Research-based knowledge network"
        },
        {
            "name": "National Agricultural Library",
            "url": "https://www.nal.usda.gov/agricultural-research-information",
            "description": "Comprehensive agricultural research database"
        },
        {
            "name": "Agriculture.com Education Center",
            "url": "https://www.agriculture.com/farm-management",
            "description": "Practical farming guides and management resources"
        }
    ]
}

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({
        'status': 'success',
        'message': 'API is working!',
        'features': [
            'Field Operations',
            'Crop Health',
            'Weather Planning',
            'Equipment Management'
        ]
    })

@app.route('/api/fieldOperations', methods=['GET'])
def get_field_operations():
    return jsonify(field_operations)

@app.route('/api/cropHealth', methods=['GET'])
def get_crop_health():
    return jsonify(crop_health)

@app.route('/api/weatherPlanning', methods=['GET'])
def get_weather():
    return jsonify(weather_data)

@app.route('/api/equipment', methods=['GET'])
def get_equipment():
    return jsonify(equipment)

@app.route('/api/resources', methods=['GET'])
def get_resources():
    return jsonify(resources)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
