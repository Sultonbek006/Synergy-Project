"""
Debug script to check what data is in the database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import MasterPlan, User

def check_data():
    db = SessionLocal()
    try:
        # Check MasterPlan regions
        plans = db.query(MasterPlan).all()
        regions_in_plan = set(p.region for p in plans)
        groups_in_plan = set(p.group_name for p in plans)
        companies_in_plan = set(p.company for p in plans)
        
        print("=" * 60)
        print("📊 MASTER PLAN DATA")
        print("=" * 60)
        print(f"Total records: {len(plans)}")
        print(f"Companies: {companies_in_plan}")
        print(f"Regions: {regions_in_plan}")
        print(f"Groups: {groups_in_plan}")
        
        # Check Users
        managers = db.query(User).filter(User.role == 'manager').all()
        print("\n" + "=" * 60)
        print("👤 MANAGERS")
        print("=" * 60)
        for m in managers[:10]:
            print(f"  {m.email}: region={m.region}, company={m.company}, group_access={m.group_access}")
        
        # Check for matching region/company combinations
        print("\n" + "=" * 60)
        print("🔍 CHECKING MATCH FOR FIRST 5 MANAGERS")
        print("=" * 60)
        for m in managers[:5]:
            matching = db.query(MasterPlan).filter(
                MasterPlan.company == m.company,
                MasterPlan.region == m.region
            ).count()
            print(f"  {m.email}: {matching} matching records (company={m.company}, region={m.region})")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
