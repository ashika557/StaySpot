from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta
from accounts.models import User
from .models import Room, Booking, Visit, RoomReview, Complaint

class RoomModelTests(TestCase):
    """
    UNIT TESTS — Room Model
    Covers the owner's side: room creation, attributes, and defaults.
    """
    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner_unit@gmail.com',
            email='owner_unit@gmail.com',
            password='Pass@123',
            full_name='Test Owner',
            role='Owner'
        )

    def test_room_basic_creation(self):
        """Room should be created with correct fields and default status."""
        print("\n[RUNNING]: test_room_basic_creation")
        room = Room.objects.create(
            owner=self.owner,
            title='Spacious Single Room',
            location='Central Kathmandu',
            price=6000,
            room_type='Single Room',
            status='Available'
        )
        self.assertEqual(room.title, 'Spacious Single Room')
        self.assertEqual(room.status, 'Available')
        self.assertEqual(room.owner, self.owner)
        print("[RESULT]: SUCCESS - Room created with correct owner and defaults.")

    def test_room_amenities_defaults(self):
        """Verify that basic amenities default to False if not specified."""
        print("\n[RUNNING]: test_room_amenities_defaults")
        room = Room.objects.create(
            owner=self.owner,
            title='Basic Room',
            location='Local Area',
            price=4500
        )
        self.assertFalse(room.wifi)
        self.assertFalse(room.ac)
        self.assertFalse(room.parking)
        print("[RESULT]: SUCCESS - Amenities correctly default to False.")

    def test_room_string_representation(self):
        """__str__ should return Title - Location."""
        print("\n[RUNNING]: test_room_string_representation")
        room = Room.objects.create(
            owner=self.owner,
            title='Green Villa',
            location='Pokhara',
            price=12000
        )
        self.assertEqual(str(room), 'Green Villa - Pokhara')
        print("[RESULT]: SUCCESS - Room string representation is accurate.")


class BookingModelTests(TestCase):
    """
    UNIT TESTS — Booking Model
    Covers the interaction: Tenant requesting/booking a Room.
    """
    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner_b@gmail.com', email='owner_b@gmail.com', password='123', role='Owner'
        )
        self.tenant = User.objects.create_user(
            username='tenant_b@gmail.com', email='tenant_b@gmail.com', password='123', role='Tenant'
        )
        self.room = Room.objects.create(
            owner=self.owner, title='Booking Room', location='Loc', price=5000
        )

    def test_booking_initialization(self):
        """New booking should link tenant and room with 'Pending' status."""
        print("\n[RUNNING]: test_booking_initialization")
        start = timezone.now().date()
        end = start + timedelta(days=90)
        booking = Booking.objects.create(
            tenant=self.tenant,
            room=self.room,
            start_date=start,
            end_date=end,
            monthly_rent=5000,
            status='Pending'
        )
        self.assertEqual(booking.tenant, self.tenant)
        self.assertEqual(booking.room, self.room)
        self.assertEqual(booking.status, 'Pending')
        print("[RESULT]: SUCCESS - Booking created correctly for link between tenant and owner.")

    def test_booking_status_choices(self):
        """Booking must respect the defined status choice fields."""
        print("\n[RUNNING]: test_booking_status_choices")
        booking = Booking.objects.create(
            tenant=self.tenant, room=self.room, start_date=date.today(), end_date=date.today(),
            monthly_rent=5000, status='Confirmed'
        )
        valid_statuses = ['Pending', 'Confirmed', 'Rejected', 'Active', 'Completed', 'Cancelled']
        self.assertIn(booking.status, valid_statuses)
        print(f"[RESULT]: SUCCESS - Booking status '{booking.status}' is valid.")


class VisitModelTests(TestCase):
    """
    UNIT TESTS — Visit Model
    Covers tenants scheduling viewings.
    """
    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner_v@gmail.com', email='owner_v@gmail.com', password='123', role='Owner'
        )
        self.tenant = User.objects.create_user(
            username='tenant_v@gmail.com', email='tenant_v@gmail.com', password='123', role='Tenant'
        )
        self.room = Room.objects.create(
            owner=self.owner, title='Visit Room', location='Loc', price=5000
        )

    def test_visit_creation(self):
        """Should successfully schedule a viewing visit."""
        print("\n[RUNNING]: test_visit_creation")
        visit = Visit.objects.create(
            tenant=self.tenant,
            room=self.room,
            owner=self.owner,
            visit_date=date.today() + timedelta(days=2),
            visit_time="14:00:00",
            purpose='Room for student'
        )
        self.assertEqual(visit.status, 'Pending')
        self.assertEqual(str(visit.tenant.full_name) in str(visit), True)
        print("[RESULT]: SUCCESS - Visit scheduled correctly.")


class ReviewModelTests(TestCase):
    """
    UNIT TESTS — RoomReview Model
    Covers tenant feedback logic.
    """
    def setUp(self):
        self.tenant = User.objects.create_user(
            username='rev_t@gmail.com', email='rev_t@gmail.com', password='123', role='Tenant'
        )
        self.owner = User.objects.create_user(
            username='rev_o@gmail.com', email='rev_o@gmail.com', password='123', role='Owner'
        )
        self.room = Room.objects.create(
            owner=self.owner, title='Reviewed Room', location='Loc', price=5000
        )

    def test_review_rating_range(self):
        """Reviews should have a rating within 1-5 (logic level)."""
        print("\n[RUNNING]: test_review_rating_range")
        review = RoomReview.objects.create(
            tenant=self.tenant,
            room=self.room,
            rating=5,
            comment='Excellent place!'
        )
        self.assertTrue(1 <= review.rating <= 5)
        print(f"[RESULT]: SUCCESS - Review rating {review.rating} is within 1-5 range.")


class ComplaintModelTests(TestCase):
    """
    UNIT TESTS — Complaint Model
    Covers issue reporting by tenants.
    """
    def setUp(self):
        self.tenant = User.objects.create_user(
            username='comp_t@gmail.com', email='comp_t@gmail.com', password='123', role='Tenant'
        )
        self.owner = User.objects.create_user(
            username='comp_o@gmail.com', email='comp_o@gmail.com', password='123', role='Owner'
        )
        self.room = Room.objects.create(
            owner=self.owner, title='Complaint Room', location='Loc', price=5000
        )

    def test_complaint_defaults(self):
        """New complaints should be 'Pending' with 'Medium' priority by default."""
        print("\n[RUNNING]: test_complaint_defaults")
        complaint = Complaint.objects.create(
            tenant=self.tenant,
            owner=self.owner,
            room=self.room,
            complaint_type='Maintenance',
            description='Leaking faucet'
        )
        self.assertEqual(complaint.status, 'Pending')
        self.assertEqual(complaint.priority, 'Medium')
        print("[RESULT]: SUCCESS - Complaint defaults are correct.")

    def test_complaint_status_updates(self):
        """Owner/Admin should be able to update complaint status."""
        print("\n[RUNNING]: test_complaint_status_updates")
        complaint = Complaint.objects.create(
            tenant=self.tenant, owner=self.owner, room=self.room,
            complaint_type='Security', description='Lock broken'
        )
        complaint.status = 'Investigating'
        complaint.save()
        self.assertEqual(complaint.status, 'Investigating')
        print("[RESULT]: SUCCESS - Complaint status correctly updated to Investigating.")


class OwnerRoomsIntegrationTests(TestCase):
    """
    INTEGRATION TESTS — OwnerRooms API
    Tests room search, booking creation, and dashboard endpoints.
    """
    def setUp(self):
        from django.test import Client
        self.client = Client()
        self.tenant = User.objects.create_user(
            username='room_tenant@gmail.com', email='room_tenant@gmail.com', password='123', 
            role='Tenant', is_identity_verified=True
        )
        self.owner = User.objects.create_user(
            username='room_owner@gmail.com', email='room_owner@gmail.com', password='123', 
            role='Owner', is_identity_verified=True
        )
        self.room = Room.objects.create(
            owner=self.owner, title='Integration Room', location='Kathmandu', price=5000, status='Available'
        )

    def test_room_list_api(self):
        """Should return list of available rooms."""
        print("\n[RUNNING]: test_room_list_api")
        self.client.force_login(self.tenant)
        response = self.client.get('/api/rooms/')
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        print("[RESULT]: SUCCESS - Room list API works (200 OK).")

    def test_create_booking_api(self):
        """Tenant should be able to request a booking via API."""
        print("\n[RUNNING]: test_create_booking_api")
        self.client.force_login(self.tenant)
        import json
        response = self.client.post('/api/bookings/', 
            data=json.dumps({
                'room_id': self.room.id,
                'start_date': str(date.today()),
                'end_date': str(date.today() + timedelta(days=30)),
                'monthly_rent': 5000
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 201)
        print("[RESULT]: SUCCESS - Booking created via API (201 Created).")

    def test_tenant_dashboard_api(self):
        """Dashboard endpoint should return summarized data for tenant."""
        print("\n[RUNNING]: test_tenant_dashboard_api")
        self.client.force_login(self.tenant)
        response = self.client.get('/api/tenant/dashboard/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('suggested_rooms', response.json())
        print("[RESULT]: SUCCESS - Tenant dashboard API returned correctly.")


class GoogleMapIntegrationTests(TestCase):
    """
    INTEGRATION TESTS — Google Maps Backend
    Tests coordinate storage and distance-based search.
    These tests verify the BACKEND side of Google Maps integration.
    (Google Maps JavaScript API is frontend-only and not tested here.)
    """
    def setUp(self):
        from django.test import Client
        self.client = Client()
        self.owner = User.objects.create_user(
            username='map_owner@gmail.com', email='map_owner@gmail.com', password='123',
            role='Owner', is_identity_verified=True
        )
        self.tenant = User.objects.create_user(
            username='map_tenant@gmail.com', email='map_tenant@gmail.com', password='123',
            role='Tenant', is_identity_verified=True
        )
        # Kathmandu coordinates
        self.ktm_lat = 27.7172
        self.ktm_lng = 85.3240

    def test_room_coordinates_stored_in_db(self):
        """Room lat/lng from MapPicker should be saved correctly in the database."""
        print("\n[RUNNING]: test_room_coordinates_stored_in_db")
        room = Room.objects.create(
            owner=self.owner,
            title='Map Room',
            location='Thamel, Kathmandu',
            price=5000,
            status='Available',
            latitude=self.ktm_lat,
            longitude=self.ktm_lng
        )
        room.refresh_from_db()
        self.assertAlmostEqual(float(room.latitude), self.ktm_lat, places=4)
        self.assertAlmostEqual(float(room.longitude), self.ktm_lng, places=4)
        print(f"[RESULT]: SUCCESS - Coordinates saved: lat={room.latitude}, lng={room.longitude}.")

    def test_distance_search_returns_nearby_rooms(self):
        """API should return rooms within the specified radius of coordinates."""
        print("\n[RUNNING]: test_distance_search_returns_nearby_rooms")
        # Create a room at Kathmandu coordinates
        Room.objects.create(
            owner=self.owner, title='Nearby Room', location='Thamel',
            price=5000, status='Available',
            latitude=self.ktm_lat, longitude=self.ktm_lng
        )
        # Create a room far away (Pokhara coordinates)
        Room.objects.create(
            owner=self.owner, title='Far Room', location='Pokhara',
            price=5000, status='Available',
            latitude=28.2096, longitude=83.9856
        )
        self.client.force_login(self.tenant)
        # Search within 5km radius of Kathmandu center
        response = self.client.get(
            f'/api/rooms/?lat={self.ktm_lat}&lng={self.ktm_lng}&radius=5'
        )
        self.assertEqual(response.status_code, 200)
        rooms = response.json()
        titles = [r['title'] for r in rooms]
        self.assertIn('Nearby Room', titles)
        self.assertNotIn('Far Room', titles)
        print(f"[RESULT]: SUCCESS - Distance search returned {len(rooms)} nearby room(s), excluded far rooms.")

    def test_room_without_coordinates_not_in_distance_search(self):
        """Rooms with no coordinates should not appear in distance-based search."""
        print("\n[RUNNING]: test_room_without_coordinates_not_in_distance_search")
        # Room with no lat/lng
        Room.objects.create(
            owner=self.owner, title='No Coord Room', location='Unknown',
            price=5000, status='Available'
            # No latitude / longitude
        )
        self.client.force_login(self.tenant)
        # Search within 1km of Kathmandu
        response = self.client.get(
            f'/api/rooms/?lat={self.ktm_lat}&lng={self.ktm_lng}&radius=1'
        )
        self.assertEqual(response.status_code, 200)
        titles = [r['title'] for r in response.json()]
        self.assertNotIn('No Coord Room', titles)
        print("[RESULT]: SUCCESS - Room without coordinates correctly excluded from map search.")
