from flask import Blueprint, jsonify, request
from models import db, User, Equipment, MarketData, HeritageCrop

api = Blueprint('api', __name__)

@api.route('/api/equipment', methods=['GET'])
def get_equipment():
    equipment = Equipment.query.all()
    return jsonify([{
        'id': e.id,
        'name': e.name,
        'type': e.type,
        'status': e.status,
        'location': e.location,
        'next_maintenance': e.next_maintenance.isoformat() if e.next_maintenance else None
    } for e in equipment])

@api.route('/api/market-data', methods=['GET'])
def get_market_data():
    data = MarketData.query.all()
    return jsonify([{
        'id': d.id,
        'product': d.product,
        'price': d.price,
        'market': d.market,
        'demand': d.demand,
        'timestamp': d.timestamp.isoformat()
    } for d in data])

@api.route('/api/heritage-crops', methods=['GET'])
def get_heritage_crops():
    crops = HeritageCrop.query.all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'origin': c.origin,
        'history': c.history
    } for c in crops])

@api.route('/api/resources', methods=['GET'])
def get_resources():
    return jsonify({
        'grants': [
            {
                'name': 'USDA Farm Grants',
                'url': 'https://www.farmers.gov/grants',
                'description': 'Various grants for farming operations'
            },
            {
                'name': 'Rural Development Grants',
                'url': 'https://www.rd.usda.gov/programs-services',
                'description': 'Grants for rural agricultural development'
            }
        ],
        'youtube_channels': [
            {
                'name': 'Farm Tech',
                'url': 'https://youtube.com/farmtech',
                'description': 'Latest farming technology and innovations'
            },
            {
                'name': 'Sustainable Farming',
                'url': 'https://youtube.com/sustainablefarming',
                'description': 'Sustainable farming practices and tips'
            }
        ],
        'learning_resources': [
            {
                'name': 'Extension.org',
                'url': 'https://extension.org',
                'description': 'Research-based learning network'
            },
            {
                'name': 'AgLearn',
                'url': 'https://aglearn.org',
                'description': 'Agricultural online learning platform'
            }
        ]
    })
