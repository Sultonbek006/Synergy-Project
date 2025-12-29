"""
Seed Data Script
Populates the database with standardized Synergy managers and admin
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, engine, Base
from backend.models import User
from backend.auth import get_password_hash

# Region prefix mapping
REGION_PREFIXES = {
    'SURXANDARYO': 'surx',
    'SAMARQAND': 'sam',
    'BUXORO': 'bux',
    'ANDIJON': 'and',
    'NAMANGAN': 'nam',
    'QASHQADARYO': 'qash',
    'XORAZM': 'xor',
    
    # Tashkent Variations
    'TOSHKENT CITY': 'tosh',  # tosh.a@...
    'TOSHKENT OBL': 'obl',    # obl.ab@...
    'TOSHKENT OBSH': 'obsh',  # obsh.all@...
    
    "FARG'ONA": 'far',
    'JIZZAX': 'jiz',
    'NAVOIY': 'nav',
    'NUKUS': 'nuk',
}

# Type A: Split Groups (AB and A2C)
TYPE_A_REGIONS = [
    'SURXANDARYO',
    'SAMARQAND',
    'BUXORO',
    'ANDIJON',
    'NAMANGAN',
    'QASHQADARYO',
    'XORAZM',
    'TOSHKENT OBL', # Added back (Tosh Obl/Sirdaryo)
]

# Type B: Unified Group (ALL)
TYPE_B_REGIONS = [
    "FARG'ONA",
    'JIZZAX',
    'NAVOIY',
    'NUKUS',
    'TOSHKENT OBSH', # Added (Common/General)
]

# Type C: Fragmented (A, B, C, A2)
TYPE_C_REGIONS = [
    'TOSHKENT CITY',
]


DEFAULT_PASSWORD = 'pass123'
ADMIN_PASSWORD = 'admin123'


def create_users():
    """Create all standardized users"""
    db = SessionLocal()
    users_created = []
    
    try:
        # Hash passwords once
        hashed_default = get_password_hash(DEFAULT_PASSWORD)
        hashed_admin = get_password_hash(ADMIN_PASSWORD)
        
        # Create Admin
        admin = User(
            email='admin@hq.com',
            hashed_password=hashed_admin,
            role='admin',
            company='Synergy',
            region=None,
            group_access='ALL'
        )
        db.add(admin)
        users_created.append('admin@hq.com')
        
        # Type A: Create 2 users per region (AB and A2C)
        for region in TYPE_A_REGIONS:
            prefix = REGION_PREFIXES.get(region)
            if not prefix:
                continue
            
            # AB user
            user_ab = User(
                email=f'{prefix}.ab@synergy.com',
                hashed_password=hashed_default,
                role='manager',
                company='Synergy',
                region=region,
                group_access='AB'
            )
            db.add(user_ab)
            users_created.append(f'{prefix}.ab@synergy.com')
            
            # A2C user
            user_a2c = User(
                email=f'{prefix}.a2c@synergy.com',
                hashed_password=hashed_default,
                role='manager',
                company='Synergy',
                region=region,
                group_access='A2C'
            )
            db.add(user_a2c)
            users_created.append(f'{prefix}.a2c@synergy.com')
        
        # Type B: Create 1 user per region (ALL)
        for region in TYPE_B_REGIONS:
            prefix = REGION_PREFIXES.get(region)
            if not prefix:
                continue
            
            user_all = User(
                email=f'{prefix}.all@synergy.com',
                hashed_password=hashed_default,
                role='manager',
                company='Synergy',
                region=region,
                group_access='ALL'
            )
            db.add(user_all)
            users_created.append(f'{prefix}.all@synergy.com')
        
        # Type C: Create 4 users for Toshkent City (A, B, C, A2)
        for region in TYPE_C_REGIONS:
            prefix = REGION_PREFIXES.get(region)
            if not prefix:
                continue
            
            for group in ['a', 'b', 'c', 'a2']:
                user = User(
                    email=f'{prefix}.{group}@synergy.com',
                    hashed_password=hashed_default,
                    role='manager',
                    company='Synergy',
                    region=region,
                    group_access=group.upper()
                )
                db.add(user)
                users_created.append(f'{prefix}.{group}@synergy.com')
        
        db.commit()
        print(f"✅ Successfully created {len(users_created)} users:")
        print("-" * 50)
        
        # Print by category
        print("\n📋 ADMIN:")
        print("   admin@hq.com (password: admin123)")
        
        print("\n📋 TYPE A - Split Groups (AB / A2C):")
        for region in TYPE_A_REGIONS:
            prefix = REGION_PREFIXES.get(region)
            if prefix:
                print(f"   {region}: {prefix}.ab@synergy.com, {prefix}.a2c@synergy.com")
        
        print("\n📋 TYPE B - Unified Group (ALL):")
        for region in TYPE_B_REGIONS:
            prefix = REGION_PREFIXES.get(region)
            if prefix:
                print(f"   {region}: {prefix}.all@synergy.com")
        
        print("\n📋 TYPE C - Fragmented (A, B, C, A2):")
        for region in TYPE_C_REGIONS:
            prefix = REGION_PREFIXES.get(region)
            if prefix:
                print(f"   {region}: {prefix}.a@synergy.com, {prefix}.b@synergy.com, {prefix}.c@synergy.com, {prefix}.a2@synergy.com")
        
        print("\n" + "-" * 50)
        print(f"🔑 Default password for all managers: {DEFAULT_PASSWORD}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating users: {e}")
        raise
    finally:
        db.close()


def reset_database():
    """Reset Users table only (preserve MasterPlan)"""
    print("🔄 Resetting Users table...")
    db = SessionLocal()
    try:
        db.query(User).delete()
        db.commit()
        print("✅ Users table cleared!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error clearing users: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 50)
    print("🌱 SYNERGY PLATFORM - DATABASE SEEDER")
    print("=" * 50)
    
    # Reset database first
    reset_database()
    
    # Create users
    create_users()
    
    print("\n✅ Seeding complete!")
