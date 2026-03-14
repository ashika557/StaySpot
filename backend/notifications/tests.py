from django.test import TestCase, Client
from accounts.models import User
from OwnerRooms.models import Room, Booking
from .models import Notification
from django.utils import timezone
from datetime import timedelta

class NotificationTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.owner = User.objects.create_user(
            username='notif_owner@test.com',
            email='notif_owner@test.com',
            password='Pass@123',
            role='Owner',
            is_identity_verified=True
        )
        self.tenant = User.objects.create_user(
            username='notif_tenant@test.com',
            email='notif_tenant@test.com',
            password='Pass@123',
            role='Tenant',
            is_identity_verified=True
        )
        self.room = Room.objects.create(
            owner=self.owner,
            title='Notif Room',
            location='Test Loc',
            price=1000,
            status='Available'
        )

    def test_booking_trigger_notification(self):
        """Booking actions should trigger notifications."""
        self.client.force_login(self.tenant)
        
        # Create booking request
        self.client.post('/api/bookings/', {
            'room_id': self.room.id,
            'start_date': timezone.now().date(),
            'end_date': timezone.now().date() + timedelta(days=30),
            'monthly_rent': 1000
        })
        
        # Owner should have a notification
        self.assertEqual(Notification.objects.filter(recipient=self.owner).count(), 1)
        notif = Notification.objects.filter(recipient=self.owner).first()
        self.assertIn('booking_request', notif.notification_type)

    def test_mark_as_read(self):
        """Test notification management API."""
        notif = Notification.objects.create(
            recipient=self.tenant,
            notification_type='message',
            text='Test message'
        )
        self.assertFalse(notif.is_read)
        
        self.client.force_login(self.tenant)
        response = self.client.post(f'/api/notifications/{notif.id}/mark_as_read/')
        self.assertEqual(response.status_code, 200)
        
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)
