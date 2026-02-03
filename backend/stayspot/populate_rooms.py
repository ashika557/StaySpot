import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stayspot.settings')
django.setup()

from OwnerRooms.models import Room, RoomImage
from accounts.models import User

def create_sample_rooms():
    # Get or create an owner
    owner, created = User.objects.get_or_create(
        email='owner@example.com',
        defaults={
            'username': 'owner@example.com',
            'full_name': 'Rajesh Basnet',
            'phone': '9800000000',
            'role': 'Owner',
            'is_active': True
        }
    )
    if created:
        owner.set_password('password123')
        owner.save()

    # Sample Room Data in Dharan
    rooms_data = [
        {
            'title': 'Premium Single Room in Zero Point',
            'location': 'Zero Point, Dharan',
            'price': 8000.00,
            'room_type': 'Single',
            'latitude': 26.8125,
            'longitude': 87.2834,
            'gender_preference': 'Male',
            'wifi': True, 'ac': False, 'tv': True, 'parking': True,
            'water_supply': True, 'attached_bathroom': True, 'cctv': True
        },
        {
            'title': 'Spacious Flat near BPKIHS',
            'location': 'Ghopa, Dharan',
            'price': 25000.00,
            'room_type': 'Flat',
            'latitude': 26.8200,
            'longitude': 87.2750,
            'gender_preference': 'Any',
            'wifi': True, 'ac': True, 'tv': True, 'parking': True,
            'water_supply': True, 'attached_bathroom': True, 'kitchen': True
        },
        {
            'title': 'Budget Student Sharing Room',
            'location': 'Bhanuchowk, Dharan',
            'price': 5000.00,
            'room_type': 'Sharing',
            'latitude': 26.8080,
            'longitude': 87.2850,
            'gender_preference': 'Female',
            'wifi': True, 'ac': False, 'tv': False, 'parking': False,
            'water_supply': True, 'attached_bathroom': False, 'furniture': True
        },
        {
            'title': 'Modern Apartment in Itahari',
            'location': 'Main Chowk, Itahari',
            'price': 15000.00,
            'room_type': 'Flat',
            'latitude': 26.6647,
            'longitude': 87.2718,
            'gender_preference': 'Any',
            'wifi': True, 'ac': True, 'tv': True, 'parking': True,
            'water_supply': True, 'attached_bathroom': True, 'kitchen': True
        },
        {
            'title': 'Cozy Single Room near Itahari Stadium',
            'location': 'Stadium Road, Itahari',
            'price': 6500.00,
            'room_type': 'Single',
            'latitude': 26.6700,
            'longitude': 87.2800,
            'gender_preference': 'Male',
            'wifi': True, 'ac': False, 'tv': False, 'parking': True,
            'water_supply': True, 'attached_bathroom': False, 'furniture': True
        }
    ]

    for data in rooms_data:
        room, created = Room.objects.get_or_create(
            title=data['title'],
            owner=owner,
            defaults=data
        )
        if created:
            print(f"Created: {room.title}")
        else:
            print(f"Skipped (already exists): {room.title}")

if __name__ == '__main__':
    create_sample_rooms()
