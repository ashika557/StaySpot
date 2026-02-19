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
from .models import User, PasswordResetToken, EmailVerificationToken, PhoneOTP, PreRegistrationOTP
from django.core.mail import send_mail
from django.conf import settings
import re
import random


@api_view(['POST'])
@permission_classes([AllowAny])
def request_registration_otp(request):
    """Send a 6-digit code to the user's email before registration."""
    email = request.data.get('email', '').strip()
    
    if not email:
        return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Check if email is already registered
    if User.objects.filter(email=email).exists():
        return Response({'error': 'An account with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
        
    # Generate OTP
    otp_code = PreRegistrationOTP.generate_otp()
    
    # Save or update OTP
    PreRegistrationOTP.objects.update_or_create(
        email=email,
        defaults={'otp_code': otp_code, 'is_verified': False, 'created_at': timezone.now()}
    )
    
    # Send email
    subject = 'StaySpot Registration Code'
    message = f'Your verification code for StaySpot registration is: {otp_code}'
    from_email = settings.DEFAULT_FROM_EMAIL
    
    try:
        send_mail(subject, message, from_email, [email])
        print(f"DEBUG: Registration OTP for {email} is {otp_code}")
    except Exception as e:
        print(f"Failed to send email: {e}")
        return Response({'error': 'Failed to send verification email. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    return Response({
        'message': 'Verification code sent to your email.',
        'otp_dev': otp_code # Remove in production
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_registration_otp(request):
    """Verify the 6-digit registration code."""
    email = request.data.get('email', '').strip()
    otp_code = request.data.get('otp_code', '').strip()
    
    if not email or not otp_code:
        return Response({'error': 'Email and code are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        otp_entry = PreRegistrationOTP.objects.get(email=email, otp_code=otp_code)
        if not otp_entry.is_valid():
            return Response({'error': 'Code expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
            
        otp_entry.is_verified = True
        otp_entry.save()
        
        return Response({'message': 'Email verified successfully. You can now complete your registration.'}, status=status.HTTP_200_OK)
    except PreRegistrationOTP.DoesNotExist:
        return Response({'error': 'Invalid verification code.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Registration API updated to require pre-verified email."""
    data = request.data
    email = data.get('email', '').strip()
    
    # Check if email was verified
    try:
        otp_entry = PreRegistrationOTP.objects.get(email=email)
        if not otp_entry.is_verified:
            return Response({'error': 'Email not verified. Please verify your email first.'}, status=status.HTTP_400_BAD_REQUEST)
    except PreRegistrationOTP.DoesNotExist:
        return Response({'error': 'Email not verified. Please verify your email first.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate required fields
    required_fields = ['full_name', 'email', 'phone', 'password', 'role']
    for field in required_fields:
        if not data.get(field):
            return Response(
                {'error': f'{field.replace("_", " ").title()} is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    # Create user
    try:
        user = User.objects.create_user(
            username=email,
            email=email,
            password=data['password'],
            full_name=data['full_name'],
            phone=data['phone'],
            role=data['role'],
            is_active=True # Already verified via email OTP
        )
        
        # Clean up pre-registration OTP
        otp_entry.delete()
        
        return Response({
            'message': 'Registration successful! You can now login.',
            'user': {
                'id': user.id,
                'full_name': user.full_name,
                'email': user.email,
                'role': user.role
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login API for Owner and Tenant."""
    data = request.data
    email = data.get('email', '').strip()
    
    print(f"DEBUG: Login attempt - Email: '{email}', Role: '{data.get('role')}'")

    # Validate required fields
    if not email:
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
        user = User.objects.get(email=email)
        print(f"DEBUG: Found user by email: {user.username}")
    except User.DoesNotExist:
        print(f"DEBUG: User not found for email: '{email}'")
        return Response(
            {'error': 'Invalid credentials.'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Verify password
    user_auth = authenticate(username=user.username, password=data['password'])
    print(f"DEBUG: Authenticate result for {user.username}: {'Success' if user_auth else 'Failure'}")
    
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
    print(f"DEBUG: User {user.email} logged in. Session key: {request.session.session_key}")
    
    return Response({
        'message': 'Login successful.',
        'user': {
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role,
            'identity_document': user.identity_document.url if user.identity_document else None,
            'profile_photo': user.profile_photo.url if user.profile_photo else None,
            'is_identity_verified': user.is_identity_verified
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
            'role': request.user.role,
            'identity_document': request.user.identity_document.url if request.user.identity_document else None,
            'profile_photo': request.user.profile_photo.url if request.user.profile_photo else None,
            'is_identity_verified': request.user.is_identity_verified
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """Update user profile including identity document."""
    user = request.user
    full_name = request.data.get('full_name')
    phone = request.data.get('phone')
    identity_document = request.FILES.get('identity_document')
    profile_photo = request.FILES.get('profile_photo')
    
    if full_name:
        user.full_name = full_name
    if phone:
        user.phone = phone
    if identity_document:
        user.identity_document = identity_document
        if user.verification_status == 'Not Submitted' or user.verification_status == 'Rejected':
            user.verification_status = 'Pending'
            user.is_identity_verified = False
    if profile_photo:
        user.profile_photo = profile_photo
    
    user.save()
    
    return Response({
        'message': 'Profile updated successfully.',
        'user': {
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role,
            'identity_document': user.identity_document.url if user.identity_document else None,
            'profile_photo': user.profile_photo.url if user.profile_photo else None,
            'is_identity_verified': user.is_identity_verified
        }
    })


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
    """Modified to send OTP to phone instead of email link."""
    data = request.data
    phone = data.get('phone', '').strip()
    
    if not phone:
        return Response({'error': 'Phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(phone=phone)
        
        # Create Phone OTP for Password Reset
        otp_code = PhoneOTP.generate_otp()
        PhoneOTP.objects.filter(user=user, purpose='PasswordReset', is_verified=False).delete()
        PhoneOTP.objects.create(user=user, phone=phone, otp_code=otp_code, purpose='PasswordReset')
        
        # Log for dev
        print(f"DEBUG: Password Reset OTP for {phone} is {otp_code}")
        
        return Response({
            'message': 'A reset code has been sent to your phone.',
            'otp_dev': otp_code # Dev only
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        # Avoid user enumeration
        return Response({'message': 'If an account exists with this phone number, a code has been sent.'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_forgot_password_otp(request):
    """Verify phone OTP and return a reset token."""
    phone = request.data.get('phone', '').strip()
    otp_code = request.data.get('otp_code', '').strip()
    
    if not phone or not otp_code:
        return Response({'error': 'Phone and code are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        user = User.objects.get(phone=phone)
        otp = PhoneOTP.objects.get(user=user, otp_code=otp_code, purpose='PasswordReset', is_verified=False)
        
        if not otp.is_valid():
            return Response({'error': 'OTP expired.'}, status=status.HTTP_400_BAD_REQUEST)
            
        otp.is_verified = True
        otp.save()
        
        # Create a Password Reset Token that will be consumed in the final step
        reset_token = PasswordResetToken.objects.create(
            user=user,
            expires_at=timezone.now() + timedelta(minutes=15)
        )
        
        return Response({
            'token': reset_token.token,
            'message': 'OTP verified. You can now reset your password.'
        }, status=status.HTTP_200_OK)
        
    except (User.DoesNotExist, PhoneOTP.DoesNotExist):
        return Response({'error': 'Invalid phone or code.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request, token):
    """Reset password using token."""
    data = request.data
    
    # Validate required fields
    password = data.get('password', '').strip()
    confirm_password = data.get('confirm_password', '').strip()
    
    if not password or not confirm_password:
        return Response({'error': 'Password and confirmation are required.'}, status=status.HTTP_400_BAD_REQUEST)
    
    if password != confirm_password:
        return Response({'error': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Find token
    try:
        reset_token = PasswordResetToken.objects.get(token=token)
    except PasswordResetToken.DoesNotExist:
        return Response({'error': 'Invalid or expired reset token.'}, status=status.HTTP_400_BAD_REQUEST)
    
    if not reset_token.is_valid():
        return Response({'error': 'Invalid or expired reset token.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate password strength
    try:
        validate_password(password, reset_token.user)
    except DjangoValidationError as e:
        return Response({'error': list(e.messages)[0]}, status=status.HTTP_400_BAD_REQUEST)
    
    # Update password
    reset_token.user.set_password(password)
    reset_token.user.save()
    
    # Mark token as used
    reset_token.used = True
    reset_token.save()
    
    return Response({'message': 'Password has been reset successfully. You can now login.'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email(request, token):
    """Verify email using token (Legacy link support)."""
    try:
        verification_token = EmailVerificationToken.objects.get(token=token)
        if not verification_token.is_valid():
            return Response({'error': 'Invalid or expired verification token.'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = verification_token.user
        user.is_active = True
        user.save()
        
        verification_token.used = True
        verification_token.save()
        
        return Response({'message': 'Email verified successfully.'}, status=status.HTTP_200_OK)
    except EmailVerificationToken.DoesNotExist:
        return Response({'error': 'Invalid verification token.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """Verify phone OTP for registration (legacy support if needed)."""
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
        otp = PhoneOTP.objects.filter(user=user, otp_code=otp_code, purpose='Registration').first()
        
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_verify_kyc(request, user_id):
    """Approve or Reject a user's identity verification request."""
    if request.user.role != 'Admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    action = request.data.get('action') # 'Approve' or 'Reject'
    
    if action == 'Approve':
        user.is_identity_verified = True
        user.verification_status = 'Approved'
        user.rejection_reason = None
        message = 'User identity verified successfully.'
    elif action == 'Reject':
        user.is_identity_verified = False
        user.verification_status = 'Rejected'
        user.rejection_reason = request.data.get('rejection_reason', 'Document does not meet requirements.')
        message = 'User identity verification rejected.'
    else:
        return Response({'error': 'Invalid action. Use Approve or Reject.'}, status=status.HTTP_400_BAD_REQUEST)
        
    user.save()
    
    return Response({
        'message': message,
        'verification_status': user.verification_status,
        'is_identity_verified': user.is_identity_verified
    }, status=status.HTTP_200_OK)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_user(request, user_id):
    """Permanently delete a user account."""
    if request.user.role != 'Admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        
    if user == request.user:
        return Response({'error': 'You cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)
        
    user_name = user.full_name
    user.delete()
    
    return Response({'message': f'User {user_name} has been permanently deleted.'}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_users(request):
    """List all users for administrative purposes."""
    if request.user.role != 'Admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.all().order_by('-date_joined')
    user_list = []
    for u in users:
        user_list.append({
            'id': u.id,
            'full_name': u.full_name,
            'email': u.email,
            'phone': u.phone,
            'role': u.role,
            'is_active': u.is_active,
            'is_identity_verified': u.is_identity_verified,
            'verification_status': u.verification_status,
            'date_joined': u.date_joined
        })
    
    return Response(user_list, status=status.HTTP_200_OK)

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_user(request, user_id):
    """Update user role or status for administrative purposes."""
    if request.user.role != 'Admin':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    # Don't allow changing own role to something else (safety)
    if user == request.user and 'role' in request.data and request.data['role'] != 'Admin':
        return Response({'error': 'You cannot demote yourself.'}, status=status.HTTP_400_BAD_REQUEST)

    role = request.data.get('role')
    is_active = request.data.get('is_active')
    
    if role:
        if role not in [choice[0] for choice in User.ROLE_CHOICES]:
            return Response({'error': 'Invalid role.'}, status=status.HTTP_400_BAD_REQUEST)
        user.role = role
        
    if is_active is not None:
        user.is_active = bool(is_active)
        
    user.save()
    
    return Response({
        'message': 'User updated successfully.',
        'user': {
            'id': user.id,
            'role': user.role,
            'is_active': user.is_active
        }
    }, status=status.HTTP_200_OK)

