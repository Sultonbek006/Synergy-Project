"""
Seed Data Script for PERFETTO Company
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

# Perfetto managers configuration
# Format: (email, regions (comma-separated), group_access)
# Note: Perfetto has NO groups, so group_access is always 'ALL'
PERFETTO_MANAGERS = [
    # Multi-region managers
    ('bux@perfetto.com', 'BUXORO,NAVOIY', 'ALL'),
    ('sam@perfetto.com', 'JIZZAX,SAMARQAND', 'ALL'),
    ('obl@perfetto.com', 'TOSHKENT OBL,SIRDARYO', 'ALL'),
    
    # Single region managers
    ('nuk@perfetto.com', 'NUKUS', 'ALL'),  # Karakalpakstan = NUKUS
    ('xor@perfetto.com', 'XORAZM', 'ALL'),
    ('surx@perfetto.com', 'SURXANDARYO', 'ALL'),
    ('qash@perfetto.com', 'QASHQADARYO', 'ALL'),
    ('tosh@perfetto.com', 'TOSHKENT', 'ALL'),
    ('nam@perfetto.com', 'NAMANGAN', 'ALL'),
    ('and@perfetto.com', 'ANDIJON', 'ALL'),
    ('far@perfetto.com', "FARG'ONA", 'ALL'),
]


def create_perfetto_users():
    """Create all Perfetto users"""
    db = SessionLocal()
    users_created = []
    
    try:
        # Hash password once
        hashed_password = get_password_hash(DEFAULT_PASSWORD)
        
        for email, regions, group_access in PERFETTO_MANAGERS:
            # Check if user already exists
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                print(f"⚠️ User {email} already exists, skipping...")
                continue
            
            user = User(
                email=email,
                hashed_password=hashed_password,
                role='manager',
                company='Perfetto',
                region=regions,  # Store comma-separated regions for multi-region access
                group_access=group_access
            )
            db.add(user)
            users_created.append(email)
        
        db.commit()
        print(f"\n✅ Successfully created {len(users_created)} Perfetto users:")
        print("-" * 60)
        
        for email in users_created:
            print(f"  ✓ {email}")
        
        print("\n" + "-" * 60)
        print(f"🔑 Password for all managers: {DEFAULT_PASSWORD}")
        print("\n📋 PERFETTO STRUCTURE:")
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
    print("🌱 PERFETTO - MANAGER SEEDER")
    print("=" * 60)
    
    create_perfetto_users()
    
    print("\n✅ Seeding complete!")
