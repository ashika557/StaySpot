from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoomViewSet, BookingViewSet, VisitViewSet,
    RoomReviewViewSet, ComplaintViewSet, tenant_dashboard, debug_user_info,
    owner_tenant_management, admin_dashboard_stats
)

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'visits', VisitViewSet, basename='visit')
router.register(r'reviews', RoomReviewViewSet, basename='review')
router.register(r'complaints', ComplaintViewSet, basename='complaint')

urlpatterns = [
    path('debug/user/', debug_user_info, name='debug-user-info'),
    path('tenant/dashboard/', tenant_dashboard, name='tenant-dashboard'),
    path('owner/tenants/', owner_tenant_management, name='owner-tenant-management'),
    path('admin/dashboard/', admin_dashboard_stats, name='admin-dashboard-stats'),
    path('', include(router.urls)),
]