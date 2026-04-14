from django.test import TestCase
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
            username='unit@gmail.com',
            email='unit@gmail.com',
            password='Secure@123',
            full_name='Unit Test User',
            phone='9800000001',
            role='Tenant'
        )

    def test_user_string_representation(self):
        """User __str__ should return name and role."""
        print("\n[RUNNING]: test_user_string_representation")
        self.assertEqual(str(self.user), 'Unit Test User (Tenant)')
        print("[RESULT]: SUCCESS - User string representation is correct.")

    def test_user_role_choices(self):
        """User role must be one of Owner, Tenant, or Admin."""
        print("\n[RUNNING]: test_user_role_choices")
        valid_roles = ['Owner', 'Tenant', 'Admin']
        self.assertIn(self.user.role, valid_roles)
        print(f"[RESULT]: SUCCESS - User role '{self.user.role}' is valid.")

    def test_user_is_active_by_default(self):
        """Newly created users should be active."""
        print("\n[RUNNING]: test_user_is_active_by_default")
        self.assertTrue(self.user.is_active)
        print("[RESULT]: SUCCESS - User is active by default.")

    def test_user_unverified_by_default(self):
        """Newly created users should NOT be identity verified by default."""
        print("\n[RUNNING]: test_user_unverified_by_default")
        self.assertFalse(self.user.is_identity_verified)
        print("[RESULT]: SUCCESS - User identity is unverified by default.")


class PhoneOTPModelTests(TestCase):
    """
    UNIT TESTS — PhoneOTP Model
    Verifies OTP generation, validity check, and expiry logic.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username='otp@gmail.com',
            email='otp@gmail.com',
            password='Test1234!',
            full_name='OTP User',
            phone='9800000002',
            role='Tenant'
        )

    def test_otp_is_6_digits(self):
        """Generated OTP must be exactly 6 digits."""
        print("\n[RUNNING]: test_otp_is_6_digits")
        otp = PhoneOTP.generate_otp()
        self.assertEqual(len(otp), 6)
        self.assertTrue(otp.isdigit())
        print(f"[RESULT]: SUCCESS - Generated OTP {otp} is 6 digits.")

    def test_new_otp_is_valid(self):
        """A freshly created OTP should be valid."""
        print("\n[RUNNING]: test_new_otp_is_valid")
        otp = PhoneOTP.objects.create(
            user=self.user,
            phone=self.user.phone,
            otp_code='123456',
            purpose='Registration'
        )
        self.assertTrue(otp.is_valid())
        print("[RESULT]: SUCCESS - Freshly created OTP is valid.")

    def test_expired_otp_is_invalid(self):
        """An OTP older than 10 minutes should be invalid."""
        print("\n[RUNNING]: test_expired_otp_is_invalid")
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
        print("[RESULT]: SUCCESS - Expired OTP correctly identified.")

    def test_verified_otp_is_invalid(self):
        """An already-verified OTP should not be valid again."""
        print("\n[RUNNING]: test_verified_otp_is_invalid")
        otp = PhoneOTP.objects.create(
            user=self.user,
            phone=self.user.phone,
            otp_code='654321',
            purpose='Registration',
            is_verified=True
        )
        self.assertFalse(otp.is_valid())
        print("[RESULT]: SUCCESS - Verified OTP correctly identified as invalid.")


class PasswordResetTokenModelTests(TestCase):
    """
    UNIT TESTS — PasswordResetToken Model
    Checks token creation, uniqueness, validity, and expiry.
    """

    def setUp(self):
        self.user = User.objects.create_user(
            username='resettest@gmail.com',
            email='resettest@gmail.com',
            password='Test@1234',
            full_name='Reset Token User',
            phone='9800000003',
            role='Owner'
        )

    def test_token_is_generated_on_create(self):
        """Token string is auto-generated if not provided."""
        print("\n[RUNNING]: test_token_is_generated_on_create")
        token = PasswordResetToken.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(minutes=15)
        )
        self.assertTrue(len(token.token) > 20)
        print("[RESULT]: SUCCESS - Token generated on creation.")

    def test_valid_token(self):
        """Token created with future expiry should be valid."""
        print("\n[RUNNING]: test_valid_token")
        token = PasswordResetToken.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(minutes=15)
        )
        self.assertTrue(token.is_valid())
        print("[RESULT]: SUCCESS - Future-dated token is valid.")

    def test_expired_token(self):
        """Token with past expiry should be invalid."""
        print("\n[RUNNING]: test_expired_token")
        token = PasswordResetToken.objects.create(
            user=self.user,
            expires_at=timezone.now() - timedelta(minutes=5)
        )
        self.assertFalse(token.is_valid())
        print("[RESULT]: SUCCESS - Past-dated token is invalid.")

    def test_used_token_is_invalid(self):
        """A token marked as used should not pass validation."""
        print("\n[RUNNING]: test_used_token_is_invalid")
        token = PasswordResetToken.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(minutes=15),
            used=True
        )
        self.assertFalse(token.is_valid())
        print("[RESULT]: SUCCESS - Used token correctly identified as invalid.")


class PreRegistrationOTPModelTests(TestCase):
    """
    UNIT TESTS — PreRegistrationOTP Model
    Ensures OTP for registration is generated and validated correctly.
    """

    def test_create_pre_reg_otp(self):
        """Should create a valid pre-registration OTP."""
        print("\n[RUNNING]: test_create_pre_reg_otp")
        otp = PreRegistrationOTP.objects.create(
            email='newuser@gmail.com',
            otp_code='445566'
        )
        self.assertTrue(otp.is_valid())
        self.assertFalse(otp.is_verified)
        print("[RESULT]: SUCCESS - Pre-registration OTP created and is valid.")

    def test_expired_pre_reg_otp(self):
        """OTP older than 15 minutes should be invalid."""
        print("\n[RUNNING]: test_expired_pre_reg_otp")
        otp = PreRegistrationOTP.objects.create(
            email='expiredpre@gmail.com',
            otp_code='112233'
        )
        PreRegistrationOTP.objects.filter(id=otp.id).update(
            created_at=timezone.now() - timedelta(minutes=20)
        )
        otp.refresh_from_db()
        self.assertFalse(otp.is_valid())
        print("[RESULT]: SUCCESS - Expired pre-registration OTP correctly identified.")


class AccountsIntegrationTests(TestCase):
    """
    INTEGRATION TESTS — Accounts API
    Tests real request-response cycles for login and profile.
    """
    def setUp(self):
        from django.test import Client
        self.client = Client()
        self.email = 'integration@gmail.com'
        self.password = 'Pass@123'
        self.user = User.objects.create_user(
            username=self.email, email=self.email, password=self.password, 
            full_name='Integration User', role='Tenant', is_active=True
        )

    def test_login_api_success(self):
        """API should return 200 and user data on correct login."""
        print("\n[RUNNING]: test_login_api_success")
        response = self.client.post('/api/login/', {
            'email': self.email, 'password': self.password, 'role': 'Tenant'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('user', response.json())
        print("[RESULT]: SUCCESS - API login endpoint returned 200 OK.")

    def test_profile_access_denied_if_not_logged_in(self):
        """API should return 401 or 403 for unauthenticated profile requests."""
        print("\n[RUNNING]: test_profile_access_denied_if_not_logged_in")
        response = self.client.get('/api/user/')
        self.assertIn(response.status_code, [401, 403])
        print(f"[RESULT]: SUCCESS - Unauthorized access correctly blocked (Status {response.status_code}).")
