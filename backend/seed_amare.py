"""
Seed Data Script for AMARE Company
Creates managers with vita/forte groups
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, engine, Base
from backend.models import User
from backend.auth import get_password_hash

DEFAULT_PASSWORD = 'pass123'

# Amare managers configuration
# Format: (email, regions (comma-separated), group_access)
AMARE_MANAGERS = [
    # Multi-region managers with specific groups
    ('bux.vita@amare.com', 'BUXORO,NAVOIY', 'VITA'),
    ('bux.forte@amare.com', 'BUXORO,NAVOIY', 'FORTE'),
    ('sam.vita@amare.com', 'SAMARQAND,JIZZAX', 'VITA'),
    ('sam.forte@amare.com', 'SAMARQAND,JIZZAX', 'FORTE'),
    ('nuk.all@amare.com', 'NUKUS,XORAZM', 'ALL'),  # Karakalpakstan = NUKUS
    
    # Single region managers with ALL groups (vita + forte)
    ('qash.all@amare.com', 'QASHQADARYO', 'ALL'),
    ('surx.all@amare.com', 'SURXANDARYO', 'ALL'),
    ('nam.all@amare.com', 'NAMANGAN', 'ALL'),  # Note: email says sam but it's Namangan
    ('and.all@amare.com', 'ANDIJON', 'ALL'),
    ('far.all@amare.com', "FARG'ONA", 'ALL'),
    ('obl.all@amare.com', 'TOSHKENT OBL', 'ALL'),  # Includes Sirdaryo
    ('obsh.all@amare.com', 'TOSHKENT OBSH', 'ALL'),
    
    # Toshkent City - divided by districts
    # VITA1 districts: Бектемир, Қибрай, Мирзо Улуғбек, Миробод, Сирғали, Юнусобод, Янгиҳаёт, Яшнобод
    ('tash.vita1@amare.com', 'TOSHKENT CITY', 'VITA1'),
    # VITA2 districts: Олмазор, Келес шаҳри, Назарбек шаҳарча, Учтепа, Чилонзор, Шайхонтохур, Эшонгузар шаҳарча, Яккасарой
    ('tash.vita2@amare.com', 'TOSHKENT CITY', 'VITA2'),
    # FORTE1 districts: Same as VITA1
    ('tash.forte1@amare.com', 'TOSHKENT CITY', 'FORTE1'),
    # FORTE2 districts: Same as VITA2
    ('tash.forte2@amare.com', 'TOSHKENT CITY', 'FORTE2'),
]

# District mappings for Toshkent City
TASHKENT_DISTRICT_GROUPS = {
    'VITA1': ['БЕКТЕМИР', 'ҚИБРАЙ', 'МИРЗО УЛУҒБЕК', 'МИРОБОД', 'СИРҒАЛИ', 'ЮНУСОБОД', 'ЯНГИҲАЁТ', 'ЯШНОБОД'],
    'VITA2': ['ОЛМАЗОР', 'КЕЛЕС', 'НАЗАРБЕК', 'УЧТЕПА', 'ЧИЛОНЗОР', 'ШАЙХОНТОХУР', 'ЭШОНГУЗАР', 'ЯККАСАРОЙ'],
    'FORTE1': ['БЕКТЕМИР', 'ҚИБРАЙ', 'МИРЗО УЛУҒБЕК', 'МИРОБОД', 'СИРҒАЛИ', 'ЮНУСОБОД', 'ЯНГИҲАЁТ', 'ЯШНОБОД'],
    'FORTE2': ['ОЛМАЗОР', 'КЕЛЕС', 'НАЗАРБЕК', 'УЧТЕПА', 'ЧИЛОНЗОР', 'ШАЙХОНТОХУР', 'ЭШОНГУЗАР', 'ЯККАСАРОЙ'],
}


def create_amare_users():
    """Create all Amare users"""
    db = SessionLocal()
    users_created = []
    
    try:
        # Hash password once
        hashed_password = get_password_hash(DEFAULT_PASSWORD)
        
        for email, regions, group_access in AMARE_MANAGERS:
            # Check if user already exists
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                print(f"⚠️ User {email} already exists, skipping...")
                continue
            
            user = User(
                email=email,
                hashed_password=hashed_password,
                role='manager',
                company='Amare',
                region=regions,  # Store comma-separated regions for multi-region access
                group_access=group_access
            )
            db.add(user)
            users_created.append(email)
        
        db.commit()
        print(f"\n✅ Successfully created {len(users_created)} Amare users:")
        print("-" * 60)
        
        for email in users_created:
            print(f"  ✓ {email}")
        
        print("\n" + "-" * 60)
        print(f"🔑 Password for all managers: {DEFAULT_PASSWORD}")
        print("\n📋 AMARE GROUP STRUCTURE:")
        print("  • VITA / FORTE (standard groups)")
        print("  • ALL = both VITA and FORTE")
        print("  • VITA1/VITA2/FORTE1/FORTE2 = Toshkent City (district-based)")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating users: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("🌱 AMARE - MANAGER SEEDER")
    print("=" * 60)
    
    create_amare_users()
    
    print("\n✅ Seeding complete!")
