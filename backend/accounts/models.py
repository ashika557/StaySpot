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
    
    def __str__(self):
        return f"{self.full_name} ({self.role})"


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
