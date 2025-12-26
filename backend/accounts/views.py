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
from .models import User, PasswordResetToken
import re


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
            role=data['role']
        )
        
        return Response({
            'message': 'User registered successfully.',
            'user': {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'role': user.role
            }
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
