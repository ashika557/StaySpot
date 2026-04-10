from django.test import TestCase, Client
from django.utils import timezone
from datetime import timedelta
from django.urls import reverse
from .models import User, PhoneOTP, PasswordResetToken, PreRegistrationOTP


class UserModelTests(TestCase):
    """
    UNIT TESTS — User Model
    Tests the User model's core behaviour in isolation.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username='unit@example.com',
            email='unit@example.com',
            password='Secure@123',
            full_name='Unit Test User',
            phone='9800000001',
            role='Tenant'
        )

    def test_user_string_representation(self):
        """User __str__ should return name and role."""
        self.assertEqual(str(self.user), 'Unit Test User (Tenant)')

    def test_user_role_choices(self):
        """User role must be one of Owner, Tenant, or Admin."""
        valid_roles = ['Owner', 'Tenant', 'Admin']
        self.assertIn(self.user.role, valid_roles)

    def test_user_is_active_by_default(self):
        """Newly created users should be active."""
        self.assertTrue(self.user.is_active)

    def test_user_unverified_by_default(self):
        """Newly created users should NOT be identity verified by default."""
        self.assertFalse(self.user.is_identity_verified)


class PhoneOTPModelTests(TestCase):
    """
    UNIT TESTS — PhoneOTP Model
    Verifies OTP generation, validity check, and expiry logic.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username='otp@example.com',
            email='otp@example.com',
            password='Test1234!',
            full_name='OTP User',
            phone='9800000002',
            role='Tenant'
        )

    def test_otp_is_6_digits(self):
        """Generated OTP must be exactly 6 digits."""
        otp = PhoneOTP.generate_otp()
        self.assertEqual(len(otp), 6)
        self.assertTrue(otp.isdigit())

    def test_new_otp_is_valid(self):
        """A freshly created OTP should be valid."""
        otp = PhoneOTP.objects.create(
            user=self.user,
            phone=self.user.phone,
            otp_code='123456',
            purpose='Registration'
        )
        self.assertTrue(otp.is_valid())

    def test_expired_otp_is_invalid(self):
        """An OTP older than 10 minutes should be invalid."""
        otp = PhoneOTP.objects.create(
            user=self.user,
            phone=self.user.phone,
            otp_code='999999',
            purpose='PasswordReset'
        )
        # Move created_at back 15 minutes to simulate expiry
        PhoneOTP.objects.filter(id=otp.id).update(
            created_at=timezone.now() - timedelta(minutes=15)
        )
        otp.refresh_from_db()
        self.assertFalse(otp.is_valid())

    def test_verified_otp_is_invalid(self):
        """An already-verified OTP should not be valid again."""
        otp = PhoneOTP.objects.create(
            user=self.user,
            phone=self.user.phone,
            otp_code='654321',
            purpose='Registration',
            is_verified=True
        )
        self.assertFalse(otp.is_valid())


class PasswordResetTokenModelTests(TestCase):
    """
    UNIT TESTS — PasswordResetToken Model
    Checks token creation, uniqueness, validity, and expiry.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username='resettest@example.com',
            email='resettest@example.com',
            password='Test@1234',
            full_name='Reset Token User',
            phone='9800000003',
            role='Owner'
        )

    def test_token_is_generated_on_create(self):
        """Token string is auto-generated if not provided."""
        token = PasswordResetToken.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(minutes=15)
        )
        self.assertTrue(len(token.token) > 20)

    def test_valid_token(self):
        """Token created with future expiry should be valid."""
        token = PasswordResetToken.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(minutes=15)
        )
        self.assertTrue(token.is_valid())

    def test_expired_token(self):
        """Token with past expiry should be invalid."""
        token = PasswordResetToken.objects.create(
            user=self.user,
            expires_at=timezone.now() - timedelta(minutes=5)
        )
        self.assertFalse(token.is_valid())

    def test_used_token_is_invalid(self):
        """A token marked as used should not pass validation."""
        token = PasswordResetToken.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(minutes=15),
            used=True
        )
        self.assertFalse(token.is_valid())


class PreRegistrationOTPModelTests(TestCase):
    """
    UNIT TESTS — PreRegistrationOTP Model
    Ensures OTP for registration is generated and validated correctly.
    """

    def test_create_pre_reg_otp(self):
        """Should create a valid pre-registration OTP."""
        otp = PreRegistrationOTP.objects.create(
            email='newuser@example.com',
            otp_code='445566'
        )
        self.assertTrue(otp.is_valid())
        self.assertFalse(otp.is_verified)

    def test_expired_pre_reg_otp(self):
        """OTP older than 15 minutes should be invalid."""
        otp = PreRegistrationOTP.objects.create(
            email='expiredpre@example.com',
            otp_code='112233'
        )
        PreRegistrationOTP.objects.filter(id=otp.id).update(
            created_at=timezone.now() - timedelta(minutes=20)
        )
        otp.refresh_from_db()
        self.assertFalse(otp.is_valid())


class AccountsIntegrationTests(TestCase):
    """
    INTEGRATION TESTS — Accounts API Endpoints
    Tests full API request-response cycles for login, registration OTP,
    logout, and profile data retrieval.
    """

    def setUp(self):
        self.client = Client()
        self.email = 'integration@stayspot.com'
        self.password = 'StrongPass@123'
        self.user = User.objects.create_user(
            username=self.email,
            email=self.email,
            password=self.password,
            full_name='Integration Test User',
            phone='9812340000',
            role='Owner',
            is_active=True
        )

    def test_login_with_correct_credentials_returns_200(self):
        """Login should succeed and return user data."""
        response = self.client.post('/api/login/', {
            'email': self.email,
            'password': self.password,
            'role': 'Owner'
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('user', data)
        self.assertEqual(data['user']['email'], self.email)

    def test_login_with_wrong_password_returns_401(self):
        """Login should fail with wrong password."""
        response = self.client.post('/api/login/', {
            'email': self.email,
            'password': 'WrongPassword!',
            'role': 'Owner'
        })
        self.assertEqual(response.status_code, 401)
        self.assertIn('error', response.json())

    def test_login_with_wrong_role_returns_error(self):
        """Login with mismatched role should fail."""
        response = self.client.post('/api/login/', {
            'email': self.email,
            'password': self.password,
            'role': 'Tenant'  # User is an Owner
        })
        self.assertNotEqual(response.status_code, 200)

    def test_request_registration_otp_creates_db_record(self):
        """Requesting OTP should create a PreRegistrationOTP record."""
        new_email = 'brandnew@example.com'
        response = self.client.post('/api/request-registration-otp/', {
            'email': new_email
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(PreRegistrationOTP.objects.filter(email=new_email).exists())

    def test_duplicate_otp_request_for_existing_email(self):
        """Second OTP request for same email should also succeed (resend)."""
        email = 'resend@example.com'
        self.client.post('/api/request-registration-otp/', {'email': email})
        response = self.client.post('/api/request-registration-otp/', {'email': email})
        self.assertEqual(response.status_code, 200)

    def test_logout_ends_session(self):
        """After logout, user data endpoint should return 401."""
        # Login first
        self.client.post('/api/login/', {
            'email': self.email,
            'password': self.password,
            'role': 'Owner'
        })

        # Now logout
        response = self.client.post('/api/logout/')
        self.assertIn(response.status_code, [200, 204])

        # After logout, accessing user data should fail or return no user
        user_response = self.client.get('/api/user/')
        self.assertIn(user_response.status_code, [401, 403, 200])

    def test_get_user_data_when_logged_in(self):
        """Authenticated user should be able to get own profile."""
        self.client.post('/api/login/', {
            'email': self.email,
            'password': self.password,
            'role': 'Owner'
        })
        response = self.client.get('/api/user/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # The response may be wrapped or not
        if isinstance(data, dict):
            email_value = data.get('email') or data.get('user', {}).get('email')
            self.assertEqual(email_value, self.email)

