from django.contrib import admin
from .models import Payment

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['booking', 'amount', 'payment_type', 'paid_date', 'status']
    list_filter = ['status', 'payment_type', 'paid_date']
    search_fields = ['booking__tenant__full_name', 'booking__room__title', 'booking__room__owner__full_name']
    date_hierarchy = 'paid_date'
    actions = ['mark_as_paid', 'mark_as_failed']

    def mark_as_paid(self, request, queryset):
        queryset.update(status='Paid')
    mark_as_paid.short_description = 'Mark selected payments as Paid'

    def mark_as_failed(self, request, queryset):
        queryset.update(status='Failed')
    mark_as_failed.short_description = 'Mark selected payments as Failed'
