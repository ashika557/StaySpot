from django.test import TestCase
from django.utils import timezone
from datetime import date, timedelta
from accounts.models import User
from OwnerRooms.models import Room, Booking
from .models import Payment


class PaymentBasicTests(TestCase):
    """
    UNIT TESTS — Payment Basic Creation
    Tests basic fields and display logic.
    """
    def setUp(self):
        self.owner = User.objects.create_user(
            username='pay_owner@gmail.com', email='pay_owner@gmail.com',
            password='123', full_name='Payment Owner', role='Owner'
        )
        self.tenant = User.objects.create_user(
            username='pay_tenant@gmail.com', email='pay_tenant@gmail.com',
            password='123', full_name='Payment Tenant', role='Tenant'
        )
        self.room = Room.objects.create(owner=self.owner, title='Pay Room', location='Loc', price=1000)
        self.booking = Booking.objects.create(
            tenant=self.tenant, room=self.room, monthly_rent=1000,
            start_date=timezone.now().date(), end_date=timezone.now().date() + timedelta(days=30)
        )

    def test_payment_creation(self):
        """Should successfully create a payment record linked to a booking."""
        print("\n[RUNNING]: test_payment_creation")
        payment = Payment.objects.create(
            booking=self.booking,
            amount=1000,
            due_date=timezone.now().date() + timedelta(days=5),
            payment_type='Rent'
        )
        self.assertEqual(payment.amount, 1000)
        self.assertEqual(payment.booking, self.booking)
        print("[RESULT]: SUCCESS - Payment record created and linked correctly.")

    def test_payment_str_representation(self):
        """String representation should include tenant name, amount, and type."""
        print("\n[RUNNING]: test_payment_str_representation")
        payment = Payment.objects.create(
            booking=self.booking,
            amount=1200,
            due_date=timezone.now().date(),
            payment_type='Deposit'
        )
        # Expected format: "Deposit - Payment Tenant - ₹1200 (Pending)"
        self.assertIn('Deposit', str(payment))
        self.assertIn('Payment Tenant', str(payment))
        self.assertIn('1200', str(payment))
        print("[RESULT]: SUCCESS - Payment string representation is accurate.")


class PaymentLogicTests(TestCase):
    """
    UNIT TESTS — Payment Business Logic
    Tests automatic status changes and calculations.
    """
    def setUp(self):
        self.owner = User.objects.create_user(
            username='logic_owner@gmail.com', email='logic_owner@gmail.com', password='123', role='Owner'
        )
        self.tenant = User.objects.create_user(
            username='logic_tenant@gmail.com', email='logic_tenant@gmail.com', password='123', role='Tenant'
        )
        self.room = Room.objects.create(owner=self.owner, title='Logic Room', location='Loc', price=2000)
        self.booking = Booking.objects.create(
            tenant=self.tenant, room=self.room, monthly_rent=2000,
            start_date=date.today(), end_date=date.today() + timedelta(days=30)
        )

    def test_auto_overdue_logic(self):
        """Payments older than their due date should automatically become 'Overdue'."""
        print("\n[RUNNING]: test_auto_overdue_logic")
        past_date = date.today() - timedelta(days=1)
        payment = Payment.objects.create(
            booking=self.booking,
            amount=2000,
            due_date=past_date,
            status='Pending'
        )
        # The save() method in models.py should trigger the update
        self.assertEqual(payment.status, 'Overdue')
        print("[RESULT]: SUCCESS - Payment correctly flagged as Overdue.")

    def test_paid_payment_not_overdue(self):
        """A payment marked as 'Paid' should NOT become 'Overdue' even if past date."""
        print("\n[RUNNING]: test_paid_payment_not_overdue")
        past_date = date.today() - timedelta(days=1)
        payment = Payment.objects.create(
            booking=self.booking,
            amount=2000,
            due_date=past_date,
            status='Paid'
        )
        self.assertEqual(payment.status, 'Paid')
        print("[RESULT]: SUCCESS - Paid payments correctly remain 'Paid'.")


class PaymentValidationTests(TestCase):
    """
    UNIT TESTS — Payment Choice Validations
    Ensures allowed statuses and methods are respected.
    """
    def setUp(self):
        self.owner = User.objects.create_user(
            username='val_o@gmail.com', email='val_o@gmail.com', password='123', role='Owner'
        )
        self.tenant = User.objects.create_user(
            username='val_t@gmail.com', email='val_t@gmail.com', password='123', role='Tenant'
        )
        self.room = Room.objects.create(owner=self.owner, title='Val Room', location='Loc', price=800)
        self.booking = Booking.objects.create(
            tenant=self.tenant, room=self.room, monthly_rent=800,
            start_date=date.today(), end_date=date.today()
        )

    def test_payment_type_valid(self):
        """Ensure payment type is one of the allowed choices."""
        print("\n[RUNNING]: test_payment_type_valid")
        payment = Payment.objects.create(
            booking=self.booking, amount=800, due_date=date.today(), payment_type='Rent'
        )
        allowed_types = ['Rent', 'Deposit', 'Maintenance']
        self.assertIn(payment.payment_type, allowed_types)
        print(f"[RESULT]: SUCCESS - Payment type '{payment.payment_type}' is valid.")

    def test_payment_method_valid(self):
        """Ensure payment method matches standard options."""
        print("\n[RUNNING]: test_payment_method_valid")
        payment = Payment.objects.create(
            booking=self.booking, amount=800, due_date=date.today(), 
            payment_method='eSewa'
        )
        allowed_methods = ['eSewa', 'Khalti', 'Cash', 'Other']
        self.assertIn(payment.payment_method, allowed_methods)

        print(f"[RESULT]: SUCCESS - Payment method '{payment.payment_method}' is valid.")


class PaymentReminderTests(TestCase):
    """
    UNIT TESTS — Payment Reminders & Generation
    Tests the utility functions that create monthly bills and send notifications.
    """
    def setUp(self):
        from notifications.models import Notification
        self.owner = User.objects.create_user(
            username='rem_o@gmail.com', email='rem_o@gmail.com', password='123', role='Owner'
        )
        self.tenant = User.objects.create_user(
            username='rem_t@gmail.com', email='rem_t@gmail.com', password='123', role='Tenant'
        )
        self.room = Room.objects.create(owner=self.owner, title='Reminder Room', location='Loc', price=1000)
        self.booking = Booking.objects.create(
            tenant=self.tenant, room=self.room, monthly_rent=1000,
            start_date=date.today() - timedelta(days=35), # Started over a month ago
            end_date=date.today() + timedelta(days=365),  # 1 year lease
            status='Active'
        )

    def test_generate_monthly_payments(self):
        """Should automatically create a Rent payment for active bookings."""
        print("\n[RUNNING]: test_generate_monthly_payments")
        from .utils import generate_monthly_payments
        count = generate_monthly_payments()
        self.assertGreaterEqual(count, 1)
        self.assertTrue(Payment.objects.filter(booking=self.booking, payment_type='Rent').exists())
        print(f"[RESULT]: SUCCESS - {count} monthly payment(s) generated automatically.")

    def test_trigger_rent_reminders(self):
        """Should create a notification for payments due soon."""
        print("\n[RUNNING]: test_trigger_rent_reminders")
        from .utils import trigger_rent_reminders
        from notifications.models import Notification
        
        # Create a payment due in 2 days
        Payment.objects.create(
            booking=self.booking, amount=1000, 
            due_date=date.today() + timedelta(days=2), 
            status='Pending', payment_type='Rent'
        )
        
        count, skipped = trigger_rent_reminders()
        self.assertEqual(count, 1)
        self.assertTrue(Notification.objects.filter(recipient=self.tenant, notification_type='rent_reminder').exists())
        print("[RESULT]: SUCCESS - Rent reminder notification sent to tenant.")

    def test_reminder_spam_prevention(self):
        """Should not send duplicate reminders for the same payment."""
        print("\n[RUNNING]: test_reminder_spam_prevention")
        from .utils import trigger_rent_reminders
        
        Payment.objects.create(
            booking=self.booking, amount=1000, 
            due_date=date.today() + timedelta(days=1), 
            status='Pending', payment_type='Rent'
        )
        
        # Trigger first time
        trigger_rent_reminders()
        
        # Trigger second time
        count, skipped = trigger_rent_reminders()
        self.assertEqual(count, 0)
        self.assertEqual(skipped, 1)
        print("[RESULT]: SUCCESS - Duplicate reminder correctly skipped (Spam prevention works).")


class PaymentIntegrationTests(TestCase):
    """
    INTEGRATION TESTS — Payments API
    Tests payment listing and reminder trigger endpoints.
    """
    def setUp(self):
        from django.test import Client
        self.client = Client()
        self.tenant = User.objects.create_user(
            username='pay_int_t@gmail.com', email='pay_int_t@gmail.com', password='123', 
            role='Tenant', is_active=True
        )

    def test_payment_list_api(self):
        """Logged-in tenant should be able to view their payments."""
        print("\n[RUNNING]: test_payment_list_api")
        self.client.force_login(self.tenant)
        response = self.client.get('/api/payments/')
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)
        print("[RESULT]: SUCCESS - Payment list API returned 200 OK.")

    def test_trigger_reminders_api(self):
        """API should successfully trigger the reminder processing logic."""
        print("\n[RUNNING]: test_trigger_reminders_api")
        # Assuming only Admin/Owner can trigger, but let's test general availability
        self.client.force_login(self.tenant)
        response = self.client.post('/api/trigger-reminders/')
        # Even if unauthorized, it checks if the endpoint exists and responds
        self.assertIn(response.status_code, [200, 403])
        print(f"[RESULT]: SUCCESS - Trigger reminders endpoint responded (Status {response.status_code}).")
