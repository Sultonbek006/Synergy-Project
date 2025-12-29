"""
Check specific region groups
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import MasterPlan

def check_groups():
    db = SessionLocal()
    try:
        for region in ['QASHQADARYO', 'TOSHKENT']:
            records = db.query(MasterPlan).filter(MasterPlan.region == region).all()
            print(f"\nTotal {region} records: {len(records)}")
            
            groups = {}
            for r in records:
                g = r.group_name
                groups[g] = groups.get(g, 0) + 1
                
            print(f"Groups in {region}:")
            for g, count in groups.items():
                print(f"  '{g}': {count}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_groups()
