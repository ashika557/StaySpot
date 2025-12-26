# Password Reset Feature Setup Guide

## Overview
This document describes the Forgot Password and Reset Password feature implementation for StaySpot.

## Backend Setup

### 1. Create Database Migration
After adding the `PasswordResetToken` model, you need to create and run migrations:

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

### 2. API Endpoints

#### Forgot Password
- **Endpoint**: `POST /api/forgot-password/`
- **Request Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
  OR
  ```json
  {
    "phone": "+1234567890"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "If an account exists with this email/phone, a password reset link has been sent.",
    "reset_link": "http://localhost:3000/reset-password/<token>" // Development only
  }
  ```

#### Reset Password
- **Endpoint**: `POST /api/reset-password/<token>/`
- **Request Body**:
  ```json
  {
    "password": "NewPassword123",
    "confirm_password": "NewPassword123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "message": "Password has been reset successfully. You can now login with your new password."
  }
  ```
- **Error Response** (400 Bad Request):
  ```json
  {
    "error": "Password must be at least 8 characters long. Password must contain at least one uppercase letter."
  }
  ```

### 3. Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### 4. Token Expiry
- Tokens expire after 1 hour
- Tokens are single-use (invalidated after successful reset)
- Old unused tokens are invalidated when a new one is requested

## Frontend Routes

- `/forgot-password` - Forgot password page
- `/reset-password/<token>` - Reset password page with token

## Testing the Feature

### 1. Request Password Reset
1. Navigate to `/forgot-password`
2. Enter email or phone number
3. Submit the form
4. Check console for reset link (development mode)
5. Copy the reset link

### 2. Reset Password
1. Navigate to the reset link: `/reset-password/<token>`
2. Enter new password (must meet requirements)
3. Confirm password
4. Submit form
5. You'll be redirected to login page after successful reset

## Security Features

1. **Token Security**:
   - Secure random token generation using `secrets.token_urlsafe()`
   - Time-limited tokens (1 hour expiry)
   - Single-use tokens

2. **User Privacy**:
   - Doesn't reveal if email/phone exists in database
   - Returns same message whether user exists or not

3. **Password Security**:
   - Uses Django's password hashing
   - Validates password strength
   - Prevents weak passwords

## Production Considerations

1. **Email/SMS Integration**:
   - Currently returns reset link in response (development only)
   - In production, integrate with email service (SendGrid, AWS SES, etc.) or SMS service
   - Remove `reset_link` from response in production

2. **Token Storage**:
   - Consider adding rate limiting to prevent abuse
   - Monitor for suspicious activity

3. **Security**:
   - Use HTTPS in production
   - Consider adding CAPTCHA to forgot password form
   - Implement rate limiting on API endpoints

## Database Model

The `PasswordResetToken` model includes:
- `user`: Foreign key to User
- `token`: Unique secure token
- `created_at`: Timestamp of creation
- `expires_at`: Expiration timestamp
- `used`: Boolean flag to mark token as used

## Admin Interface

Password reset tokens are available in Django admin for monitoring and debugging.

