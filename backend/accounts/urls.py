from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('user/', views.get_user, name='get_user'),
    path('csrf/', views.get_csrf_token, name='get_csrf_token'),
    path('forgot-password/', views.forgot_password, name='forgot_password'),
    path('reset-password/<str:token>/', views.reset_password, name='reset_password'),
    path('verify-email/<str:token>/', views.verify_email, name='verify_email'),
    path('request-registration-otp/', views.request_registration_otp, name='request_registration_otp'),
    path('verify-registration-otp/', views.verify_registration_otp, name='verify_registration_otp'),
    path('verify-forgot-password-otp/', views.verify_forgot_password_otp, name='verify_forgot_password_otp'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),
    path('resend-otp/', views.resend_otp, name='resend_otp'),
    path('update-profile/', views.update_profile, name='update_profile'),
    path('admin/users/', views.admin_list_users, name='admin_list_users'),
    path('admin/users/<int:user_id>/update/', views.admin_update_user, name='admin_update_user'),
    path('admin/users/<int:user_id>/verify-kyc/', views.admin_verify_kyc, name='admin_verify_kyc'),
    path('admin/users/<int:user_id>/delete/', views.admin_delete_user, name='admin_delete_user'),
]
