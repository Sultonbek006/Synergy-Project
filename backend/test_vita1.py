"""
Test Toshkent VITA1 filtering
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import User, MasterPlan
from sqlalchemy import func, or_

db = SessionLocal()

# Get VITA1 user
user = db.query(User).filter(User.email == 'tash.vita1@amare.com').first()
print(f"Testing user: {user.email}")
print(f"  Region: {user.region}")
print(f"  Group Access: {user.group_access}")
print()

# Districts for VITA1
districts_1 = ['БЕКТЕМИР', 'ҚИБРАЙ', 'МИРЗО УЛУҒБЕК', 'МИРОБОД', 'СИРҒАЛИ', 'ЮНУСОБОД', 'ЯНГИҲАЁТ', 'ЯШНОБОД']

# Build query
query = db.query(MasterPlan).filter(
    MasterPlan.company == 'Amare',
    MasterPlan.region == 'TOSHKENT CITY',
    MasterPlan.group_name == 'VITA'
)

# Apply district filter
district_conditions = [func.upper(MasterPlan.district).contains(d) for d in districts_1]
query = query.filter(or_(*district_conditions))

docs = query.all()

print(f"Found {len(docs)} doctors for VITA1")
print("\nFirst 10 doctors:")
for i, doc in enumerate(docs[:10], 1):
    print(f"  {i}. {doc.district:<30} | {doc.doctor_name}")

db.close()
