from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['booking', 'amount', 'payment_type', 'due_date', 'paid_date', 'status']
    list_filter = ['status', 'payment_type', 'due_date']
    search_fields = ['booking__tenant__full_name', 'booking__room__title']
    date_hierarchy = 'due_date'
