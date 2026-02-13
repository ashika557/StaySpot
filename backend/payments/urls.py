from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, owner_financial_dashboard

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('owner/financial/dashboard/', owner_financial_dashboard, name='owner-financial-dashboard'),
    path('', include(router.urls)),
]
