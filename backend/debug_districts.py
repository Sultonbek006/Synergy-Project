"""
Debug district matching
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import MasterPlan
from sqlalchemy import func

db = SessionLocal()

# Get all VITA doctors in Toshkent
vita_docs = db.query(MasterPlan).filter(
    MasterPlan.company == 'Amare',
    MasterPlan.region == 'TOSHKENT CITY',
    MasterPlan.group_name == 'VITA'
).all()

print(f"Total VITA doctors in Toshkent City: {len(vita_docs)}")
print()

# Check district names
districts_to_find = ['БЕКТЕМИР', 'ҚИБРАЙ', 'МИРЗО УЛУҒБЕК', 'МИРОБОД', 'СИРҒАЛИ', 'ЮНУСОБОД', 'ЯНГИҲАЁТ', 'ЯШНОБОД']

print("Checking for matches:")
for search_dist in districts_to_find:
    matches = [d for d in vita_docs if d.district and search_dist in d.district.upper()]
    print(f"  {search_dist}: {len(matches)} matches")
    if matches:
        print(f"    Example: {matches[0].district}")

print()
print("Sample actual districts:")
unique_dists = set(d.district for d in vita_docs if d.district)
for dist in sorted(unique_dists)[:10]:
    print(f"  {dist}")

db.close()
