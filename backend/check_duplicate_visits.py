import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from OwnerRooms.models import Visit
from django.db.models import Count

duplicates = Visit.objects.values('tenant', 'room', 'visit_date', 'visit_time', 'purpose').annotate(count=Count('id')).filter(count__gt=1)

print(f"Found {len(duplicates)} sets of duplicate visits.")
for d in duplicates:
    print(f"Tenant ID: {d['tenant']}, Room ID: {d['room']}, Date: {d['visit_date']}, Time: {d['visit_time']}, Purpose: {d['purpose']}, Count: {d['count']}")
    
    # List actual IDs
    ids = Visit.objects.filter(
        tenant_id=d['tenant'], 
        room_id=d['room'], 
        visit_date=d['visit_date'], 
        visit_time=d['visit_time'],
        purpose=d['purpose']
    ).values_list('id', flat=True)
    print(f"  IDs: {list(ids)}")
