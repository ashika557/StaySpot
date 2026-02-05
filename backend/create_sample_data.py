import os
import django
from datetime import date, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stayspot.settings')
django.setup()

from accounts.models import User
from OwnerRooms.models import Room, Booking
from payments.models import Payment

def create_data():
    # 1. Get or Create Users
    tenant = User.objects.filter(role='Tenant').first()
    owner = User.objects.filter(role='Owner').first()
    
    if not tenant or not owner:
        print("Error: Please make sure you have at least one Tenant and one Owner user created.")
        return

    # 2. Get or Create Room
    room = Room.objects.filter(owner=owner).first()
    if not room:
        room = Room.objects.create(
            owner=owner,
            title="Spacious Single Room",
            location="Kathmandu",
            room_number="101",
            room_type="Single",
            price=12000,
            status="Available"
        )
        print(f"Created Room: {room.title}")

    # 3. Create Booking
    booking = Booking.objects.create(
        tenant=tenant,
        room=room,
        start_date=date.today(),
        end_date=date.today() + timedelta(days=365),
        monthly_rent=room.price,
        status='Active'
    )
    print(f"Created Booking for {tenant.full_name}")

    # 4. Create Payments
    # Paid Payment
    Payment.objects.create(
        booking=booking,
        amount=room.price,
        due_date=date.today() - timedelta(days=30),
        paid_date=date.today() - timedelta(days=28),
        status='Paid',
        payment_type='Rent',
        payment_method='eSewa',
        transaction_id='TXN123456789'
    )
    
    # Pending Payment (Next Month)
    Payment.objects.create(
        booking=booking,
        amount=room.price,
        due_date=date.today() + timedelta(days=5),
        status='Pending',
        payment_type='Rent'
    )
    
    # Overdue Payment
    Payment.objects.create(
        booking=booking,
        amount=room.price,
        due_date=date.today() - timedelta(days=5),
        status='Overdue',
        payment_type='Rent'
    )

    print("Successfully created 3 sample payments!")

if __name__ == "__main__":
    create_data()
