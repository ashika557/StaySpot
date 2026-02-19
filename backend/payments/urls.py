from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, owner_financial_dashboard, trigger_reminders, generate_monthly_rents

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('owner/financial/dashboard/', owner_financial_dashboard, name='owner-financial-dashboard'),
    path('trigger-reminders/', trigger_reminders, name='trigger-reminders'),
    path('generate-monthly-rents/', generate_monthly_rents, name='generate-monthly-rents'),
    path('', include(router.urls)),
]
