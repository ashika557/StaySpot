from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
import secrets
import hashlib


class User(AbstractUser):
    ROLE_CHOICES = [
        ('Owner', 'Owner'),
        ('Tenant', 'Tenant'),
    ]
    
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    
    # Identity Verification
    identity_document = models.ImageField(upload_to='identity_docs/', null=True, blank=True)
    is_identity_verified = models.BooleanField(default=False)
    
    # Profile Photo
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    
    def __str__(self):
        return f"{self.full_name} ({self.role})"

class PendingVerificationManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(
            identity_document__isnull=False, 
            is_identity_verified=False
        ).exclude(identity_document='')

class PendingVerification(User):
    objects = PendingVerificationManager()
    class Meta:
        proxy = True
        verbose_name = 'Pending Identity Verification'
        verbose_name_plural = 'Pending Identity Verifications'


class PasswordResetToken(models.Model):
    """Model to store password reset tokens with expiry."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Token for {self.user.email} - {'Used' if self.used else 'Active'}"
    
    def is_valid(self):
        """Check if token is valid (not used and not expired)."""
        return not self.used and timezone.now() < self.expires_at
    
    @staticmethod
    def generate_token():
        """Generate a secure random token."""
        return secrets.token_urlsafe(32)
    
    def save(self, *args, **kwargs):
        if not self.token:
            self.token = self.generate_token()
        super().save(*args, **kwargs)
class EmailVerificationToken(models.Model):
    """Model to store email verification tokens with expiry."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_verification_tokens')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Email Verification for {self.user.email} - {'Used' if self.used else 'Active'}"
    
    def is_valid(self):
        """Check if token is valid (not used and not expired)."""
        return not self.used and timezone.now() < self.expires_at
    
    @staticmethod
    def generate_token():
        """Generate a secure random token."""
        return secrets.token_urlsafe(32)
    
    def save(self, *args, **kwargs):
        if not self.token:
            self.token = self.generate_token()
        if not self.expires_at:
            # Default to 24 hours expiry
            self.expires_at = timezone.now() + timezone.timedelta(hours=24)
        super().save(*args, **kwargs)
class PhoneOTP(models.Model):
    """Model to store 6-digit phone OTPs."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='phone_otps')
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"OTP for {self.user.phone} - {'Verified' if self.is_verified else 'Pending'}"
    
    def is_valid(self):
        # OTP valid for 10 minutes
        return not self.is_verified and timezone.now() < self.created_at + timezone.timedelta(minutes=10)

    @staticmethod
    def generate_otp():
        import random
        return str(random.randint(100000, 999999))
