from django.contrib import admin
from django.db.models import Sum
from django.utils import timezone
from django.contrib.admin import AdminSite

def get_admin_analytics():
    from accounts.models import User
    from OwnerRooms.models import Room, Booking, Complaint
    from payments.models import Payment

    now = timezone.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Safe aggregation with fallback
    total_rev = Payment.objects.filter(status='Paid').aggregate(total=Sum('amount'))['total'] or 0
    monthly_rev = Payment.objects.filter(status='Paid', paid_date__gte=start_of_month).aggregate(total=Sum('amount'))['total'] or 0

    return {
        'total_users': User.objects.count(),
        'tenants': User.objects.filter(role='Tenant').count(),
        'owners': User.objects.filter(role='Owner').count(),
        'total_rooms': Room.objects.count(),
        'active_rooms': Room.objects.filter(status='Available').count(),
        'total_bookings': Booking.objects.count(),
        'pending_verifications': User.objects.filter(verification_status='Pending').count(),
        'active_issues': Complaint.objects.exclude(status='Resolved').count(),
        'total_revenue': float(total_rev),
        'monthly_revenue': float(monthly_rev),
    }

# Patch the default admin site
original_index = admin.site.index

def stayspot_admin_index(request, extra_context=None):
    extra_context = extra_context or {}
    try:
        extra_context['analytics'] = get_admin_analytics()
    except Exception:
        extra_context['analytics'] = None
    return original_index(request, extra_context)

admin.site.index = stayspot_admin_index
admin.site.site_header = "StaySpot Premium Admin"
admin.site.site_title = "StaySpot Admin"
admin.site.index_title = "Platform Overview & Analytics"
