"""
Seed Data Script for SYNERGY B2 Group Updates
- Updates existing users to add B2 access
- Creates new B2 group managers
- Creates new Qo'qon region manager
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import User
from backend.auth import get_password_hash

DEFAULT_PASSWORD = 'pass123'

def update_synergy_b2():
    """Update and create Synergy B2 group managers"""
    db = SessionLocal()
    
    try:
        hashed_password = get_password_hash(DEFAULT_PASSWORD)
        
        print("\n" + "=" * 60)
        print("1️⃣  UPDATING EXISTING USERS (Adding B2 access)")
        print("=" * 60)
        
        # These users already have ALL access, so they already see everything
        # For nuk.all and nav.all with ALL access, they already see all groups including B2
        # For obl.a2c, we need to update to include B2 - change to A2CB2 access
        
        updates = [
            ('nuk.all@synergy.com', 'ALL', 'Already has ALL access - includes B2'),
            ('nav.all@synergy.com', 'ALL', 'Already has ALL access - includes B2'),
            ('obl.a2c@synergy.com', 'A2CB2', 'Updated from A2C to A2CB2'),
        ]
        
        for email, new_group, note in updates:
            user = db.query(User).filter(User.email == email).first()
            if user:
                if new_group != user.group_access:
                    user.group_access = new_group
                    print(f"  ✅ {email}: {note}")
                else:
                    print(f"  ✓ {email}: {note}")
            else:
                print(f"  ⚠️ {email}: User not found")
        
        print("\n" + "=" * 60)
        print("2️⃣  CREATING NEW B2 GROUP MANAGERS")
        print("=" * 60)
        
        new_b2_managers = [
            ('xor.b2@synergy.com', 'XORAZM', 'B2'),
            ('nam.b2@synergy.com', 'NAMANGAN', 'B2'),
            ('qash.b2@synergy.com', 'QASHQADARYO', 'B2'),
            ('sam.b2@synergy.com', 'SAMARQAND', 'B2'),
            ('bux.b2@synergy.com', 'BUXORO', 'B2'),
        ]
        
        for email, region, group in new_b2_managers:
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                print(f"  ⚠️ {email}: Already exists, skipping")
                continue
            
            user = User(
                email=email,
                hashed_password=hashed_password,
                role='manager',
                company='Synergy',
                region=region,
                group_access=group
            )
            db.add(user)
            print(f"  ✅ {email}: Created ({region} / {group})")
        
        print("\n" + "=" * 60)
        print("3️⃣  CREATING NEW QO'QON REGION MANAGER")
        print("=" * 60)
        
        # Qo'qon (Коканд) - new region with ALL groups (A, B, C, B2, A2)
        qoqon_email = 'qoq.all@synergy.com'
        existing = db.query(User).filter(User.email == qoqon_email).first()
        if existing:
            print(f"  ⚠️ {qoqon_email}: Already exists, skipping")
        else:
            user = User(
                email=qoqon_email,
                hashed_password=hashed_password,
                role='manager',
                company='Synergy',
                region="QO'QON",  # Will match Qo'qon or Коканд in Excel
                group_access='ALL'
            )
            db.add(user)
            print(f"  ✅ {qoqon_email}: Created (QO'QON / ALL)")
        
        db.commit()
        
        print("\n" + "=" * 60)
        print("📋 SYNERGY B2 GROUP SUMMARY")
        print("=" * 60)
        print("\n🔑 Password for all: pass123")
        print("\n📌 New B2 Managers:")
        for email, region, group in new_b2_managers:
            print(f"  • {email} ({region}, {group})")
        print(f"\n📌 New Region: QO'QON")
        print(f"  • {qoqon_email} (ALL groups: A, B, C, B2, A2)")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("🌱 SYNERGY B2 GROUP UPDATES")
    print("=" * 60)
    
    update_synergy_b2()
    
    print("\n✅ Update complete!")
