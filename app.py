from flask import Flask, render_template, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from datetime import datetime
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///growthquest.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key')

# Initialize extensions
db = SQLAlchemy(app)
login_manager = LoginManager(app)
jwt = JWTManager(app)

# User Model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    subscription_tier = db.Column(db.String(20), default='basic')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Equipment Model
class Equipment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50))
    status = db.Column(db.String(20))
    cost = db.Column(db.Float)
    location = db.Column(db.String(100))
    next_maintenance = db.Column(db.DateTime)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))

# Market Data Model
class MarketData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product = db.Column(db.String(100))
    price = db.Column(db.Float)
    market = db.Column(db.String(100))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    demand = db.Column(db.Integer)

# Heritage Crop Model
class HeritageCrop(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    origin = db.Column(db.String(100))
    history = db.Column(db.Text)
    preservation_status = db.Column(db.String(20))
    cultivation_tips = db.Column(db.Text)

@app.before_first_request
def create_tables():
    try:
        db.create_all()
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/equipment')
def equipment():
    return render_template('equipment.html')

@app.route('/market')
def market():
    return render_template('market.html')

# Quantum Agriculture route
@app.route('/quantum')
def quantum():
    return render_template('quantum.html')

@app.route('/heritage')
def heritage():
    return render_template('heritage.html')

# API Routes
@app.route('/api/equipment', methods=['GET'])
def get_equipment():
    equipment_list = Equipment.query.all()
    return jsonify([{
        'id': e.id,
        'name': e.name,
        'type': e.type,
        'status': e.status,
        'cost': e.cost,
        'location': e.location,
        'next_maintenance': e.next_maintenance.isoformat() if e.next_maintenance else None
    } for e in equipment_list])

@app.route('/api/market-data', methods=['GET'])
def get_market_data():
    market_data = MarketData.query.order_by(MarketData.timestamp.desc()).limit(100).all()
    return jsonify([{
        'product': m.product,
        'price': m.price,
        'market': m.market,
        'timestamp': m.timestamp.isoformat(),
        'demand': m.demand
    } for m in market_data])

@app.route('/api/heritage-crops', methods=['GET'])
def get_heritage_crops():
    crops = HeritageCrop.query.all()
    return jsonify([{
        'name': c.name,
        'origin': c.origin,
        'history': c.history,
        'preservation_status': c.preservation_status,
        'cultivation_tips': c.cultivation_tips
    } for c in crops])

@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True)
