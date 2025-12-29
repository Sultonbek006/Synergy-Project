"""
Test VITA1 with LIKE filtering
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import MasterPlan
from sqlalchemy import or_

db = SessionLocal()

# Districts for VITA1
districts_1 = ['Бектемир', 'Қибрай', 'Мирзо Улуғбек', 'Миробод', 'Сирғали', 'Юнусобод', 'Янгиҳаёт', 'Яшнобод']

# Build query with LIKE
query = db.query(MasterPlan).filter(
    MasterPlan.company == 'Amare',
    MasterPlan.region == 'TOSHKENT CITY',
    MasterPlan.group_name == 'VITA'
)

district_conditions = [MasterPlan.district.like(f'%{d}%') for d in districts_1]
query = query.filter(or_(*district_conditions))

docs = query.all()

print(f"Found {len(docs)} doctors for VITA1 using LIKE")
print("\nFirst 10 doctors:")
for i, doc in enumerate(docs[:10], 1):
    print(f"  {i}. {doc.district:<30} | {doc.doctor_name}")

print(f"\nExpected: ~192 doctors (districts 1 from total 308 VITA)")
print(f"Actual: {len(docs)} doctors")

db.close()
