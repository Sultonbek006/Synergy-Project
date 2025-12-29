"""
Seed Data Script for GALASSIYA Company
Creates managers with region-only access (no groups)
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal, engine, Base
from backend.models import User
from backend.auth import get_password_hash

DEFAULT_PASSWORD = 'pass123'

# Galassiya managers configuration
# Format: (email, regions (comma-separated), group_access)
# Note: Galassiya has NO groups, so group_access is always 'ALL'
GALASSIYA_MANAGERS = [
    # Multi-region managers
    ('nuk.xor@galassia.com', 'NUKUS,XORAZM', 'ALL'),  # Karakalpakstan = NUKUS
    ('bux.nav@galassia.com', 'BUXORO,NAVOIY', 'ALL'),
    ('obl@galassia.com', 'TOSHKENT OBL,SIRDARYO', 'ALL'),
    
    # Single region managers
    ('surx@galassia.com', 'SURXANDARYO', 'ALL'),
    ('qash@galassia.com', 'QASHQADARYO', 'ALL'),
    ('jizzax@galassia.com', 'JIZZAX', 'ALL'),
    ('sama@galassia.com', 'SAMARQAND', 'ALL'),
    ('tosh@galassia.com', 'TOSHKENT', 'ALL'),
    ('nam@galassia.com', 'NAMANGAN', 'ALL'),
    ('far@galassia.com', "FARG'ONA", 'ALL'),
    ('and@galassia.com', 'ANDIJON', 'ALL'),
]


def create_galassiya_users():
    """Create all Galassiya users"""
    db = SessionLocal()
    users_created = []
    
    try:
        # Hash password once
        hashed_password = get_password_hash(DEFAULT_PASSWORD)
        
        for email, regions, group_access in GALASSIYA_MANAGERS:
            # Check if user already exists
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                print(f"⚠️ User {email} already exists, skipping...")
                continue
            
            user = User(
                email=email,
                hashed_password=hashed_password,
                role='manager',
                company='Galassiya',
                region=regions,  # Store comma-separated regions for multi-region access
                group_access=group_access
            )
            db.add(user)
            users_created.append(email)
        
        db.commit()
        print(f"\n✅ Successfully created {len(users_created)} Galassiya users:")
        print("-" * 60)
        
        for email in users_created:
            print(f"  ✓ {email}")
        
        print("\n" + "-" * 60)
        print(f"🔑 Password for all managers: {DEFAULT_PASSWORD}")
        print("\n📋 GALASSIYA STRUCTURE:")
        print("  • NO GROUPS - Region-only filtering")
        print("  • Managers see ALL doctors in their assigned region(s)")
        print("  • Same 10-column Excel format")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating users: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 60)
    print("🌱 GALASSIYA - MANAGER SEEDER")
    print("=" * 60)
    
    create_galassiya_users()
    
    print("\n✅ Seeding complete!")
