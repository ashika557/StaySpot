from django.test import TestCase, Client
from django.utils import timezone
from datetime import timedelta
from django.urls import reverse
from .models import User, PhoneOTP, PasswordResetToken, PreRegistrationOTP

class AccountsUnitTests(TestCase):
    """
    UNIT TESTS
    These tests isolate specific functions or methods to ensure they work correctly
    independent of the rest of the application.
    """

    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username='testunit@example.com',
            email='testunit@example.com',
            password='testpassword123',
            full_name='Unit Test User',
            phone='1234567890',
            role='Tenant'
        )

    def test_phone_otp_generation_and_validation(self):
        """
        Unit Test: Tests the PhoneOTP mechanism.
        Checks if standard OTP validates properly and if an expired one is rejected.
        """
        # Generate OTP
        otp_code = PhoneOTP.generate_otp()
        self.assertEqual(len(otp_code), 6, "OTP should be exactly 6 digits long.")
        self.assertTrue(otp_code.isdigit(), "OTP should contain only numbers.")

        # Create valid OTP record
        valid_otp = PhoneOTP.objects.create(
            user=self.user, 
            phone=self.user.phone, 
            otp_code=otp_code, 
            purpose='PasswordReset'
        )
        self.assertTrue(valid_otp.is_valid(), "A newly created OTP should be valid.")

        # Create expired OTP
        expired_otp = PhoneOTP.objects.create(
            user=self.user,
            phone=self.user.phone,
            otp_code='111111',
            purpose='PasswordReset'
        )
        # Manually alter the created_at time to simulate expiry
        PhoneOTP.objects.filter(id=expired_otp.id).update(
            created_at=timezone.now() - timedelta(minutes=15)
        )
        
        # Refresh from database
        expired_otp.refresh_from_db()
        self.assertFalse(expired_otp.is_valid(), "An OTP created > 10 mins ago should be invalid.")

    def test_password_reset_token_validation(self):
        """
        Unit Test: Tests the PasswordResetToken generation and expiry logic.
        """
        # Create a valid token
        valid_token = PasswordResetToken.objects.create(
            user=self.user,
            expires_at=timezone.now() + timedelta(minutes=15)
        )
        self.assertTrue(valid_token.is_valid(), "Valid token should return True.")
        self.assertTrue(len(valid_token.token) > 20, "Token string should be secure and long.")

        # Create an expired token
        expired_token = PasswordResetToken.objects.create(
            user=self.user,
            expires_at=timezone.now() - timedelta(minutes=5)
        )
        self.assertFalse(expired_token.is_valid(), "Expired token should return False.")


class AccountsIntegrationTests(TestCase):
    """
    INTEGRATION TESTS
    These tests ensure different parts of your system work together.
    They test full API endpoints from the perspective of a client (e.g., frontend).
    """

    def setUp(self):
        self.client = Client()
        # Set up data needed for login
        self.valid_email = 'integration@example.com'
        self.valid_password = 'StrongPassword123!'
        
        # Create a registered user directly in the database
        self.user = User.objects.create_user(
            username=self.valid_email,
            email=self.valid_email,
            password=self.valid_password,
            full_name='Integration Test User',
            phone='0987654321',
            role='Owner',
            is_active=True
        )

    def test_request_registration_otp_integration(self):
        """
        Integration Test: Tests the `/api/request-registration-otp/` endpoint.
        Verifies that requesting an OTP creates a record in the database and returns a success response.
        """
        test_email = 'newuser@example.com'
        
        # URL mapping defined in urls.py
        url = '/api/request-registration-otp/' 
        
        response = self.client.post(url, {
            'email': test_email
        })
        
        # Check HTTP Status Code
        self.assertEqual(response.status_code, 200)
        
        # Verify the database actually created the OTP
        has_otp = PreRegistrationOTP.objects.filter(email=test_email).exists()
        self.assertTrue(has_otp, "An OTP record should be created in the database.")
        
        otp_entry = PreRegistrationOTP.objects.get(email=test_email)
        self.assertFalse(otp_entry.is_verified, "New OTP should not be verified yet.")

    def test_login_integration_success(self):
        """
        Integration Test: Tests the `/api/login/` endpoint with valid credentials.
        """
        url = '/api/login/'
        
        response = self.client.post(url, {
            'email': self.valid_email,
            'password': self.valid_password,
            'role': 'Owner'
        })

        self.assertEqual(response.status_code, 200, "Should return 200 OK for valid login.")
        self.assertIn('user', response.json(), "Response should contain user data.")
        self.assertEqual(response.json()['user']['email'], self.valid_email)

    def test_login_integration_failure(self):
        """
        Integration Test: Tests the `/api/login/` endpoint with invalid credentials.
        """
        url = '/api/login/'
        
        response = self.client.post(url, {
            'email': self.valid_email,
            'password': 'WrongPassword!',
            'role': 'Owner'
        })

        self.assertEqual(response.status_code, 401, "Should return 401 Unauthorized for bad password.")
        self.assertIn('error', response.json(), "Response should complain about invalid credentials.")
