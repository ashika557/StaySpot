from django.test import TestCase
from accounts.models import User
from OwnerRooms.models import Room, Booking
from .models import Notification
from django.utils import timezone
from datetime import timedelta

class NotificationUnitTests(TestCase):
    """
    UNIT TESTS — Notification Model
    Tests notification creation and management logic.
    """
    def setUp(self):
        self.owner = User.objects.create_user(
            username='notif_owner@gmail.com',
            email='notif_owner@gmail.com',
            password='Pass@123',
            role='Owner',
            is_identity_verified=True
        )
        self.tenant = User.objects.create_user(
            username='notif_tenant@gmail.com',
            email='notif_tenant@gmail.com',
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

    def test_notification_creation(self):
        """Should successfully create a notification record."""
        print("\n[RUNNING]: test_notification_creation")
        notif = Notification.objects.create(
            recipient=self.owner,
            notification_type='booking_request',
            text='You have a new booking request.'
        )
        self.assertEqual(notif.recipient, self.owner)
        self.assertFalse(notif.is_read)
        print("[RESULT]: SUCCESS - Notification created correctly.")

    def test_mark_as_read(self):
        """Marking a notification as read should update is_read flag."""
        print("\n[RUNNING]: test_mark_as_read")
        notif = Notification.objects.create(
            recipient=self.tenant,
            notification_type='message',
            text='Test message'
        )
        self.assertFalse(notif.is_read)
        
        # Simulate marking as read
        notif.is_read = True
        notif.save()
        
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)
        print("[RESULT]: SUCCESS - Notification successfully marked as read.")


class NotificationIntegrationTests(TestCase):
    """
    INTEGRATION TESTS — Notifications API
    Tests listing and marking notifications as read.
    """
    def setUp(self):
        from django.test import Client
        self.client = Client()
        self.user = User.objects.create_user(
            username='notif_int@gmail.com', email='notif_int@gmail.com', password='123', role='Tenant'
        )

    def test_notification_list_api(self):
        """Authenticated user should see their notifications."""
        print("\n[RUNNING]: test_notification_list_api")
        self.client.force_login(self.user)
        response = self.client.get('/api/notifications/')
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        print("[RESULT]: SUCCESS - Notification list API works (200 OK).")

    def test_mark_as_read_api(self):
        """API should successfully mark a notification as read."""
        print("\n[RUNNING]: test_mark_as_read_api")
        notif = Notification.objects.create(
            recipient=self.user, notification_type='test', text='Test'
        )
        self.client.force_login(self.user)
        response = self.client.post(f'/api/notifications/{notif.id}/mark_as_read/')
        self.assertEqual(response.status_code, 200)
        print("[RESULT]: SUCCESS - Notification marked as read via API (200 OK).")
