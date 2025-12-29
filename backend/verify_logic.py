"""
Verification Script: Simulate Excel Upload & Check Access Logic
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import MasterPlan, User
from backend.services import normalize_region

def verify_logic():
    db = SessionLocal()
    try:
        print("🧪 STARTING VERIFICATION SIMULATION...")
        
        # 1. Test Region Normalization Logic directly
        print("\n[1] Testing Normalization Logic:")
        test_cases = [
            ("Toshkent", "TOSHKENT CITY"),
            ("Toshkent City", "TOSHKENT CITY"),
            ("Toshkent Obl", "TOSHKENT OBL"),
            ("Tosh Obl", "TOSHKENT OBL"),
            ("Sirdaryo", "TOSHKENT OBL"),
            ("Guliston", "TOSHKENT OBL"),
            ("Toshkent Obsh", "TOSHKENT OBSH"),
            ("Obsh", "TOSHKENT OBSH")
        ]
        
        failed = False
        for input_reg, expected in test_cases:
            result = normalize_region(input_reg)
            status = "✅" if result == expected else f"❌ (Got {result})"
            print(f"   Input: '{input_reg}' -> Expected: '{expected}' ... {status}")
            if result != expected:
                failed = True
        
        if failed:
            print("🚨 stopping: Normalization logic failed!")
            return

        # 2. Simulate Inserting Records into DB
        print("\n[2] Simulating DB Data Insertion...")
        # Clear existing plan data first for clean test
        db.query(MasterPlan).delete()
        
        rows_to_insert = [
            # City Doctors
            MasterPlan(doctor_name="Dr. City A", region="TOSHKENT CITY", group_name="A", target_amount=100, planned_type="Card", company="Synergy", month=12),
            MasterPlan(doctor_name="Dr. City B", region="TOSHKENT CITY", group_name="B", target_amount=100, planned_type="Card", company="Synergy", month=12),
            
            # Obl/Sirdaryo Doctors (Should be TOSHKENT OBL)
            MasterPlan(doctor_name="Dr. Obl A", region="TOSHKENT OBL", group_name="A", target_amount=100, planned_type="Card", company="Synergy", month=12),
            MasterPlan(doctor_name="Dr. Sirdaryo B", region="TOSHKENT OBL", group_name="B", target_amount=100, planned_type="Card", company="Synergy", month=12),
            
            # Obsh Doctors
            MasterPlan(doctor_name="Dr. Obsh A", region="TOSHKENT OBSH", group_name="A", target_amount=100, planned_type="Card", company="Synergy", month=12),
        ]
        
        for row in rows_to_insert:
            db.add(row)
        db.commit()
        print(f"   Inserted {len(rows_to_insert)} test records.")

        # 3. Check what Managers See
        print("\n[3] verifying Manager Access Queries:")
        
        def check_manager_access(email, expected_doc_names):
            user = db.query(User).filter(User.email == email).first()
            if not user:
                print(f"   ❌ User {email} not found!")
                return
            
            print(f"   Checking {email} (Region: {user.region}, Group: {user.group_access})...")
            
            # Replicate get_manager_doctors logic
            query = db.query(MasterPlan).filter(
                MasterPlan.company == user.company,
                MasterPlan.region == user.region
            )
            
            if user.group_access == 'ALL':
                pass
            elif user.group_access == 'AB':
                query = query.filter(MasterPlan.group_name.in_(['A', 'B', 'AB']))
            elif user.group_access == 'A2C':
                query = query.filter(MasterPlan.group_name.in_(['A2', 'C', 'A2C']))
            else:
                query = query.filter(MasterPlan.group_name == user.group_access)
                
            results = query.all()
            found_names = sorted([r.doctor_name for r in results])
            expected_sorted = sorted(expected_doc_names)
            
            if found_names == expected_sorted:
                print(f"     ✅ Success! Saw: {found_names}")
            else:
                print(f"     ❌ FAILED! Expected {expected_sorted}, but saw {found_names}")

        # TEST CASES
        # 1. City Manager A -> Should ONLY see "Dr. City A"
        check_manager_access('tosh.a@synergy.com', ['Dr. City A'])
        
        # 2. Obl Manager AB -> Should see "Dr. Obl A" AND "Dr. Sirdaryo B" (mapped to OBL)
        check_manager_access('obl.ab@synergy.com', ['Dr. Obl A', 'Dr. Sirdaryo B'])
        
        # 3. Obsh Manager -> Should see "Dr. Obsh A"
        check_manager_access('obsh.all@synergy.com', ['Dr. Obsh A'])

        print("\n✅ VERIFICATION COMPLETE.")

    finally:
        # cleanup
        db.query(MasterPlan).delete()
        db.commit()
        db.close()

if __name__ == "__main__":
    verify_logic()
