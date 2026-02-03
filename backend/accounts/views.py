from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.middleware.csrf import get_token
from django.utils import timezone
from datetime import timedelta
from .models import User, PasswordResetToken, EmailVerificationToken, PhoneOTP
from django.core.mail import send_mail
from django.conf import settings
import re
import random


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Registration API for Owner and Tenant."""
    data = request.data
    
    # Validate required fields
    required_fields = ['full_name', 'email', 'phone', 'password', 'role']
    for field in required_fields:
        if not data.get(field):
            return Response(
                {'error': f'{field.replace("_", " ").title()} is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Validate email format
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, data['email']):
        return Response(
            {'error': 'Invalid email format.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate role
    if data['role'] not in ['Owner', 'Tenant']:
        return Response(
            {'error': 'Role must be either Owner or Tenant.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Check if user already exists
    if User.objects.filter(email=data['email']).exists():
        return Response(
            {'error': 'User with this email already exists.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=data['email']).exists():
        return Response(
            {'error': 'User with this email already exists.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create user
    try:
        user = User.objects.create_user(
            username=data['email'],
            email=data['email'],
            password=data['password'],
            full_name=data['full_name'],
            phone=data['phone'],
            role=data['role'],
            is_active=False  # Deactivate until email is verified
        )
        
        # Create verification token
        verification_token = EmailVerificationToken.objects.create(user=user)
        
        # Create Phone OTP
        otp_code = PhoneOTP.generate_otp()
        PhoneOTP.objects.create(user=user, otp_code=otp_code)
        
        # Send verification email
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        verification_link = f"{frontend_url}/verify-email/{verification_token.token}"
        
        subject = 'Verify your StaySpot account'
        message = f'Hi {user.full_name},\n\nPlease click the link below to verify your email address and activate your account:\n\n{verification_link}\n\nThis link will expire in 24 hours.'
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user.email]
        
        try:
            send_mail(subject, message, from_email, recipient_list)
        except Exception as mail_error:
            # For development, we might not have SMTP configured correctly
            print(f"Failed to send email: {mail_error}")
            print(f"Verification link: {verification_link}")
        
        # Log OTP for development
        print(f"PHONE OTP for {user.phone}: {otp_code}")
        
        return Response({
            'message': 'Registration successful. Please enter the OTP sent to your phone.',
            'user': {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'role': user.role,
                'phone': user.phone
            },
            'otp_dev': otp_code, # For development convenience
            'verification_link_dev': verification_link
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login API for Owner and Tenant."""
    data = request.data
    
    # Validate required fields
    if not data.get('email'):
        return Response(
            {'error': 'Email is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not data.get('password'):
        return Response(
            {'error': 'Password is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not data.get('role'):
        return Response(
            {'error': 'Role is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate role
    if data['role'] not in ['Owner', 'Tenant']:
        return Response(
            {'error': 'Role must be either Owner or Tenant.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Authenticate user
    try:
        user = User.objects.get(email=data['email'])
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Verify password
    user_auth = authenticate(username=user.username, password=data['password'])
    if not user_auth:
        return Response(
            {'error': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Verify role match
    if user.role != data['role']:
        return Response(
            {'error': f'Role mismatch. This account is registered as {user.role}.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Login user
    login(request, user)
    
    return Response({
        'message': 'Login successful.',
        'user': {
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout API."""
    logout(request)
    return Response({'message': 'Logout successful.'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    """Get current logged-in user."""
    return Response({
        'user': {
            'id': request.user.id,
            'full_name': request.user.full_name,
            'email': request.user.email,
            'role': request.user.role
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_csrf_token(request):
    """Get CSRF token for frontend."""
    return Response({
        'csrfToken': get_token(request)
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    """Generate password reset token and send reset link."""
    data = request.data
    
    # Validate input
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    
    if not email and not phone:
        return Response(
            {'error': 'Email or phone number is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Find user by email or phone
    try:
        if email:
            user = User.objects.get(email=email)
        else:
            user = User.objects.get(phone=phone)
    except User.DoesNotExist:
        # Don't reveal if user exists or not for security
        return Response({
            'message': 'If an account exists with this email/phone, a password reset link has been sent.'
        }, status=status.HTTP_200_OK)
    
    # Invalidate any existing unused tokens for this user
    PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
    
    # Create new token (expires in 1 hour)
    expires_at = timezone.now() + timedelta(hours=1)
    reset_token = PasswordResetToken.objects.create(
        user=user,
        expires_at=expires_at
    )
    
    # In production, send email/SMS here
    # For now, we'll return the token in the response (for development/testing)
    reset_link = f"http://localhost:3000/reset-password/{reset_token.token}"
    
    # Log for development (remove in production)
    print(f"Password reset link for {user.email}: {reset_link}")
    
    return Response({
        'message': 'If an account exists with this email/phone, a password reset link has been sent.',
        'reset_link': reset_link  # Remove this in production
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request, token):
    """Reset password using token."""
    data = request.data
    
    # Validate required fields
    password = data.get('password', '').strip()
    confirm_password = data.get('confirm_password', '').strip()
    
    if not password:
        return Response(
            {'error': 'Password is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not confirm_password:
        return Response(
            {'error': 'Please confirm your password.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if password != confirm_password:
        return Response(
            {'error': 'Passwords do not match.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Find token
    try:
        reset_token = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        return Response(
            {'error': 'Invalid or expired reset token.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate token
    if not reset_token.is_valid():
        return Response(
            {'error': 'Invalid or expired reset token.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate password strength - custom requirements first
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_number = any(c.isdigit() for c in password)
    
    custom_errors = []
    if len(password) < 8:
        custom_errors.append('Password must be at least 8 characters long.')
    if not has_upper:
        custom_errors.append('Password must contain at least one uppercase letter.')
    if not has_lower:
        custom_errors.append('Password must contain at least one lowercase letter.')
    if not has_number:
        custom_errors.append('Password must contain at least one number.')
    
    if custom_errors:
        return Response(
            {'error': ' '.join(custom_errors)},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Additional Django password validation
    try:
        validate_password(password, reset_token.user)
    except DjangoValidationError as e:
        errors = list(e.messages)
        return Response(
            {'error': errors[0]},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Update password
    reset_token.user.set_password(password)
    reset_token.user.save()
    
    # Mark token as used
    reset_token.used = True
    reset_token.save()
    
    return Response({
        'message': 'Password has been reset successfully. You can now login with your new password.'
    }, status=status.HTTP_200_OK)
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request, token):
    """Verify email using token."""
    try:
        verification_token = EmailVerificationToken.objects.get(token=token)
    except EmailVerificationToken.DoesNotExist:
        return Response(
            {'error': 'Invalid or expired verification token.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not verification_token.is_valid():
        return Response(
            {'error': 'Invalid or expired verification token.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Activate user
    user = verification_token.user
    user.is_active = True
    user.save()
    
    # Mark token as used
    verification_token.used = True
    verification_token.save()
    
    return Response({
        'message': 'Email verified successfully. You can now login.'
    }, status=status.HTTP_200_OK)
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """Verify phone OTP."""
    data = request.data
    email = data.get('email')
    otp_code = data.get('otp_code')
    
    if not email or not otp_code:
        return Response(
            {'error': 'Email and OTP code are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
        otp = PhoneOTP.objects.filter(user=user, otp_code=otp_code).first()
        
        if not otp:
            return Response(
                {'error': 'Invalid OTP code.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not otp.is_valid():
            return Response(
                {'error': 'OTP has expired. Please request a new one.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP
        otp.is_verified = True
        otp.save()
        
        # Activate user
        user.is_active = True
        user.save()
        
        return Response({
            'message': 'Phone verified successfully. Your account is now active.'
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['POST'])
@permission_classes([AllowAny])
def resend_otp(request):
    """Resend phone OTP."""
    data = request.data
    email = data.get('email')
    
    if not email:
        return Response(
            {'error': 'Email is required.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
        
        # Invalidate existing OTPs for this user
        PhoneOTP.objects.filter(user=user, is_verified=False).delete()
        
        # Create new OTP
        otp_code = PhoneOTP.generate_otp()
        PhoneOTP.objects.create(user=user, otp_code=otp_code)
        
        # Log for development
        print(f"NEW PHONE OTP for {user.phone}: {otp_code}")
        
        return Response({
            'message': 'A new OTP has been sent to your phone.',
            'otp_dev': otp_code # For development
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
