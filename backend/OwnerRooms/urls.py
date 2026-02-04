from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoomViewSet, BookingViewSet, VisitViewSet, 
    PaymentViewSet, tenant_dashboard, debug_user_info
)

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'visits', VisitViewSet, basename='visit')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('debug/user/', debug_user_info, name='debug-user-info'),
    path('tenant/dashboard/', tenant_dashboard, name='tenant-dashboard'),
    path('', include(router.urls)),
]