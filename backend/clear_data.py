import sys
import os
sys.path.append(os.getcwd())

from backend.database import SessionLocal
from backend.models import MasterPlan, Payment

def clear_master_plan():
    db = SessionLocal()
    try:
        # Delete payments first due to foreign key constraint
        deleted_payments = db.query(Payment).delete()
        print(f"Deleted {deleted_payments} payment records.")
        
        # Delete master plan records
        deleted_plans = db.query(MasterPlan).delete()
        print(f"Deleted {deleted_plans} master plan records.")
        
        db.commit()
        print("✅ Master Plan data successfully cleared!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error clearing data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_master_plan()
