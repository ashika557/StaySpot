from django.test import TestCase, Client
from django.utils import timezone
from datetime import date, timedelta
from accounts.models import User


class PaymentModelTests(TestCase):
    """
    UNIT TESTS — Payment Model
    Tests payment creation, auto-overdue logic, and string representation.

    NOTE: The Payment model depends on the Booking model from OwnerRooms app.
    These tests use the API layer to avoid importing cross-app models directly.
    Integration tests cover the full payment workflow below.
    """

    def setUp(self):
        self.client = Client()
        self.owner = User.objects.create_user(
            username='payment_owner@test.com',
            email='payment_owner@test.com',
            password='Secure@123',
            full_name='Payment Owner',
            phone='9801000001',
            role='Owner',
            is_active=True
        )
        self.tenant = User.objects.create_user(
            username='payment_tenant@test.com',
            email='payment_tenant@test.com',
            password='Secure@123',
            full_name='Payment Tenant',
            phone='9801000002',
            role='Tenant',
            is_active=True
        )
        from OwnerRooms.models import Room, Booking
        self.room = Room.objects.create(owner=self.owner, title='Pay Room', location='Loc', price=1000)
        self.booking = Booking.objects.create(
            tenant=self.tenant, room=self.room, monthly_rent=1000,
            start_date=timezone.now().date(), end_date=timezone.now().date() + timedelta(days=30)
        )

    def test_payment_auto_overdue(self):
        """Payment should auto-update to Overdue if saved past due date."""
        from .models import Payment
        # Create a pending payment due in the past
        past_due = timezone.now().date() - timedelta(days=5)
        payment = Payment.objects.create(
            booking=self.booking,
            amount=1000,
            due_date=past_due,
            status='Pending'
        )
        # The save() method should have triggered Overdue status
        self.assertEqual(payment.status, 'Overdue')

    def test_payment_str_representation(self):
        """String representation should include tenant name and amount."""
        from .models import Payment
        payment = Payment.objects.create(
            booking=self.booking,
            amount=1200,
            due_date=timezone.now().date(),
            payment_type='Rent'
        )
        self.assertIn('Payment Tenant', str(payment))
        self.assertIn('1200', str(payment))


class PaymentApiIntegrationTests(TestCase):
    """
    INTEGRATION TESTS — Payment API Endpoints
    Tests the payments list endpoint and access control.
    """

    def setUp(self):
        self.client = Client()
        self.tenant = User.objects.create_user(
            username='pay_api_tenant@test.com',
            email='pay_api_tenant@test.com',
            password='Secure@123',
            full_name='Pay API Tenant',
            phone='9801000003',
            role='Tenant',
            is_active=True
        )
        self.owner = User.objects.create_user(
            username='pay_api_owner@test.com',
            email='pay_api_owner@test.com',
            password='Secure@123',
            full_name='Pay API Owner',
            phone='9801000004',
            role='Owner',
            is_active=True
        )

    def test_unauthenticated_cannot_access_payments(self):
        """Unauthenticated requests to payments endpoint should be rejected."""
        response = self.client.get('/api/payments/')
        self.assertIn(response.status_code, [401, 403, 302])

    def test_tenant_can_access_payments_list(self):
        """Logged-in tenant should get 200 from the payments endpoint."""
        self.client.post('/api/login/', {
            'email': 'pay_api_tenant@test.com',
            'password': 'Secure@123',
            'role': 'Tenant'
        })

        response = self.client.get('/api/payments/')
        # Even if empty, should return 200 with a list
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)

    def test_owner_can_access_payments_list(self):
        """Logged-in owner should also be able to access payments."""
        self.client.post('/api/login/', {
            'email': 'pay_api_owner@test.com',
            'password': 'Secure@123',
            'role': 'Owner'
        })

        response = self.client.get('/api/payments/')
        self.assertEqual(response.status_code, 200)

    def test_logout_prevents_payment_access(self):
        """After logout, payment endpoints should no longer be accessible."""
        # Login
        self.client.post('/api/login/', {
            'email': 'pay_api_tenant@test.com',
            'password': 'Secure@123',
            'role': 'Tenant'
        })

        # Verify access works
        before_logout = self.client.get('/api/payments/')
        self.assertEqual(before_logout.status_code, 200)

        # Logout
        self.client.post('/api/logout/')

        # Should now be denied
        after_logout = self.client.get('/api/payments/')
        self.assertIn(after_logout.status_code, [401, 403, 302])
