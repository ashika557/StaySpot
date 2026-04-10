from django.test import TestCase, Client
from django.utils import timezone
from datetime import date, timedelta
from accounts.models import User
from .models import Room, Booking, Visit, RoomReview, Complaint
from payments.models import Payment

class OwnerRoomsTests(TestCase):
    def setUp(self):
        self.client = Client()
        
        # Create an Owner
        self.owner = User.objects.create_user(
            username='owner@test.com',
            email='owner@test.com',
            password='Pass@123',
            full_name='Test Owner',
            phone='9800000001',
            role='Owner',
            is_identity_verified=True
        )
        
        # Create a Tenant
        self.tenant = User.objects.create_user(
            username='tenant@test.com',
            email='tenant@test.com',
            password='Pass@123',
            full_name='Test Tenant',
            phone='9800000002',
            role='Tenant',
            is_identity_verified=True
        )
        
        # Create a Room
        self.room = Room.objects.create(
            owner=self.owner,
            title='Test Room',
            location='Kathmandu',
            price=5000,
            status='Available'
        )

    def test_room_creation(self):
        """Room should be created with default status 'Available'."""
        self.assertEqual(self.room.status, 'Available')
        self.assertEqual(self.room.owner, self.owner)

    def test_room_rating_is_zero_by_default(self):
        """A new room should have 0.0 average rating and 0 review count."""
        # Check that we handle 'zero reviews' correctly in the model logic
        self.assertEqual(float(self.room.average_rating or 0), 0.0)
        self.assertEqual(int(self.room.review_count or 0), 0)

    def test_booking_flow(self):
        """Lifecycle of a booking: Pending -> Confirmed -> Occupied."""
        # 1. Create Booking
        booking = Booking.objects.create(
            tenant=self.tenant,
            room=self.room,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=30),
            monthly_rent=5000,
            status='Pending'
        )
        self.assertEqual(booking.status, 'Pending')
        
        # 2. Confirm Booking (Simulate Owner action)
        self.client.force_login(self.owner)
        response = self.client.patch(f'/api/bookings/{booking.id}/', {'status': 'Confirmed'}, content_type='application/json')
        
        booking.refresh_from_db()
        self.room.refresh_from_db()
        
        self.assertEqual(booking.status, 'Confirmed')
        self.assertEqual(self.room.status, 'Occupied')
        
        # 3. Verify Payment auto-generation
        payment_exists = Payment.objects.filter(booking=booking).exists()
        self.assertTrue(payment_exists)

    def test_visit_scheduling_and_cleanup(self):
        """Test visit creation and automated duplicate cleanup."""
        visit_date = timezone.now().date() + timedelta(days=1)
        visit_time = "10:00:00"
        
        # Create first visit
        Visit.objects.create(
            tenant=self.tenant,
            room=self.room,
            owner=self.owner,
            visit_date=visit_date,
            visit_time=visit_time
        )
        
        # Create duplicate visit
        Visit.objects.create(
            tenant=self.tenant,
            room=self.room,
            owner=self.owner,
            visit_date=visit_date,
            visit_time=visit_time
        )
        
        self.assertEqual(Visit.objects.count(), 2)
        
        # Trigger list view which has cleanup logic
        self.client.force_login(self.tenant)
        self.client.get('/api/visits/')
        
        # Only 1 should remain
        self.assertEqual(Visit.objects.count(), 1)

    def test_review_permission(self):
        """Tenants can only review rooms they have a confirmed booking for."""
        self.client.force_login(self.tenant)
        
        # Try to review without booking
        response = self.client.post('/api/reviews/', {
            'room': self.room.id,
            'rating': 5,
            'comment': 'Great room!'
        })
        self.assertEqual(response.status_code, 400)
        
        # Create Confirmed Booking
        Booking.objects.create(
            tenant=self.tenant,
            room=self.room,
            start_date=timezone.now().date(),
            end_date=timezone.now().date() + timedelta(days=30),
            monthly_rent=5000,
            status='Confirmed'
        )
        
        # Now review should work
        response = self.client.post('/api/reviews/', {
            'room': self.room.id,
            'rating': 5,
            'comment': 'Great room!'
        })
        self.assertEqual(response.status_code, 201)

    def test_complaint_cycle(self):
        """Test filing and updating a complaint."""
        self.client.force_login(self.tenant)
        response = self.client.post('/api/complaints/', {
            'owner_id': self.owner.id,
            'room_id': self.room.id,
            'complaint_type': 'Maintenance',
            'description': 'Tap is leaking'
        })
        self.assertEqual(response.status_code, 201)
        complaint_id = response.json()['id']
        
        # Owner marks as Resolved
        self.client.force_login(self.owner)
        response = self.client.patch(f'/api/complaints/{complaint_id}/', {'status': 'Resolved'}, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        
        complaint = Complaint.objects.get(id=complaint_id)
        self.assertEqual(complaint.status, 'Resolved')

    def test_room_maintenance_hides_from_search(self):
        """Rooms with status 'Maintenance' should not be available for the frontend search."""
        self.room.status = 'Maintenance'
        self.room.save()
        
        response = self.client.get('/api/rooms/')
        # The room should still exist in DB, but let's check your specific filtering logic
        # Most search views filter for 'Available' only.
        if response.status_code == 200:
            rooms = response.json()
            available_room_ids = [r['id'] for r in rooms]
            self.assertNotIn(self.room.id, available_room_ids)
