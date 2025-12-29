"""
Test script to verify Toshkent City district filtering
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import MasterPlan

def test_toshkent_districts():
    """Check if Toshkent City data exists and show district examples"""
    db = SessionLocal()
    
    try:
        # Check for Toshkent City data
        tash_docs = db.query(MasterPlan).filter(
            MasterPlan.company == 'Amare',
            MasterPlan.region == 'TOSHKENT CITY'
        ).all()
        
        print("=" * 60)
        print("TOSHKENT CITY DATA CHECK")
        print("=" * 60)
        print(f"Total Toshkent City doctors: {len(tash_docs)}")
        
        if len(tash_docs) == 0:
            print("\n⚠️  No Toshkent City data found!")
            print("Please upload Excel file with:")
            print("  - Company: Amare")
            print("  - Region: TOSHKENT CITY")
            print("  - Group: VITA or FORTE")
            print("  - Districts: Бектемир, Олмазор, etc.")
        else:
            print("\n✅ Toshkent City data found!")
            print("\nSample records:")
            print("-" * 60)
            
            # Show first 10 records
            for doc in tash_docs[:10]:
                print(f"  District: {doc.district:<30} | Group: {doc.group_name}")
            
            # Show unique districts
            unique_districts = set(doc.district for doc in tash_docs if doc.district)
            print(f"\nUnique Districts ({len(unique_districts)}):")
            for dist in sorted(unique_districts):
                print(f"  • {dist}")
            
            # Count by group
            vita_count = len([d for d in tash_docs if d.group_name == 'VITA'])
            forte_count = len([d for d in tash_docs if d.group_name == 'FORTE'])
            print(f"\nGroup counts:")
            print(f"  VITA:  {vita_count}")
            print(f"  FORTE: {forte_count}")
        
        print("\n" + "=" * 60)
        
    finally:
        db.close()

if __name__ == "__main__":
    test_toshkent_districts()
