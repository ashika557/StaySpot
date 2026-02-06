from OwnerRooms.models import Room
rooms = Room.objects.all()
print(f"{'ID':<5} {'Title':<30} {'Status':<15} {'Location'}")
print("-" * 70)
for r in rooms:
    print(f"{r.id:<5} {r.title:<30} {r.status:<15} {r.location}")
