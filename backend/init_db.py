"""
Database Initialization Script
Creates all tables in the database
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine, Base
from backend.models import User, MasterPlan, Payment

def init_db():
    """Create all tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")
    print(f"✅ Database file: sql_app.db")
    print(f"✅ Tables created: users, master_plan, payments")

if __name__ == "__main__":
    init_db()
