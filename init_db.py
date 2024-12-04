from app import app, db, User, Equipment, MarketData, HeritageCrop
from datetime import datetime, timedelta
import random

def init_db():
    with app.app_context():
        # Create tables
        db.create_all()

        # Add sample user
        if not User.query.filter_by(username='demo').first():
            demo_user = User(
                username='demo',
                email='demo@example.com',
                subscription_tier='professional'
            )
            db.session.add(demo_user)

        # Add sample equipment
        equipment_list = [
            {
                'name': 'John Deere Tractor',
                'type': 'Tractor',
                'status': 'Active',
                'cost': 50000.00,
                'location': 'Field A',
                'next_maintenance': datetime.now() + timedelta(days=30)
            },
            {
                'name': 'Irrigation System',
                'type': 'Irrigation',
                'status': 'Maintenance',
                'cost': 15000.00,
                'location': 'Field B',
                'next_maintenance': datetime.now() + timedelta(days=15)
            }
        ]

        for eq in equipment_list:
            if not Equipment.query.filter_by(name=eq['name']).first():
                equipment = Equipment(**eq)
                db.session.add(equipment)

        # Add sample market data
        products = ['Wheat', 'Corn', 'Soybeans']
        markets = ['Local', 'Regional', 'International']
        
        for product in products:
            for _ in range(5):  # 5 data points per product
                market_data = MarketData(
                    product=product,
                    price=random.uniform(200, 500),
                    market=random.choice(markets),
                    demand=random.randint(50, 100)
                )
                db.session.add(market_data)

        # Add sample heritage crops
        heritage_crops = [
            {
                'name': 'Ancient Wheat Variety',
                'origin': 'Mesopotamia',
                'history': 'One of the oldest known wheat varieties, cultivated since 8000 BCE.',
                'preservation_status': 'endangered',
                'cultivation_tips': 'Requires well-drained soil and moderate irrigation.'
            },
            {
                'name': 'Heritage Rice',
                'origin': 'Southeast Asia',
                'history': 'Traditional rice variety known for its unique aroma and taste.',
                'preservation_status': 'stable',
                'cultivation_tips': 'Best grown in flooded paddies with high organic matter content.'
            },
            {
                'name': 'Traditional Corn',
                'origin': 'Central America',
                'history': 'Ancient maize variety cultivated by indigenous peoples.',
                'preservation_status': 'vulnerable',
                'cultivation_tips': 'Requires full sun and rich, well-drained soil.'
            }
        ]

        for crop in heritage_crops:
            if not HeritageCrop.query.filter_by(name=crop['name']).first():
                heritage = HeritageCrop(**crop)
                db.session.add(heritage)

        # Commit all changes
        db.session.commit()

if __name__ == '__main__':
    init_db()
    print("Database initialized with sample data!")
