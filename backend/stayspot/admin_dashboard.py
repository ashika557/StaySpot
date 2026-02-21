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
    
    # Financials
    total_rev = Payment.objects.filter(status='Paid').aggregate(total=Sum('amount'))['total'] or 0
    monthly_rev = Payment.objects.filter(status='Paid', paid_date__gte=start_of_month).aggregate(total=Sum('amount'))['total'] or 0

    # Complaint Breakdown
    total_complaints = Complaint.objects.count()
    breakdown = {
        'Resolved': Complaint.objects.filter(status='Resolved').count(),
        'In_Progress': Complaint.objects.filter(status='Investigating').count(),
        'Pending': Complaint.objects.filter(status='Pending').count(),
    }
    # Calculate percentages for the chart
    complaint_stats = {}
    if total_complaints > 0:
        for key, val in breakdown.items():
            complaint_stats[key] = round((val / total_complaints) * 100)
    else:
        complaint_stats = {'Resolved': 0, 'In_Progress': 0, 'Pending': 0}

    # Recent Activity (Combined feed)
    recent_activity = []
    
    # New Users
    for u in User.objects.order_by('-date_joined')[:3]:
        recent_activity.append({
            'type': 'New user registration',
            'detail': f"{u.full_name} signed up as {u.role}",
            'time': u.date_joined,
            'icon': 'user'
        })
    
    # New Rooms
    for r in Room.objects.order_by('-created_at')[:3]:
        recent_activity.append({
            'type': 'Room uploaded',
            'detail': f"{r.owner.full_name} added {r.title}",
            'time': r.created_at,
            'icon': 'home'
        })
        
    # New Bookings
    for b in Booking.objects.order_by('-created_at')[:3]:
        recent_activity.append({
            'type': 'New booking',
            'detail': f"{b.tenant.full_name} booked a room",
            'time': b.created_at,
            'icon': 'calendar'
        })
        
    # New Complaints
    for c in Complaint.objects.order_by('-created_at')[:3]:
        recent_activity.append({
            'type': 'Complaint filed',
            'detail': f"{c.complaint_type}: {c.description[:30]}...",
            'time': c.created_at,
            'icon': 'alert'
        })

    # Sort and take top 5
    recent_activity.sort(key=lambda x: x['time'], reverse=True)
    recent_activity = recent_activity[:5]

    return {
        'stats': {
            'total_users': User.objects.count(),
            'total_rooms': Room.objects.count(),
            'total_bookings': Booking.objects.count(),
            'active_complaints': Complaint.objects.exclude(status='Resolved').count(),
        },
        'complaint_breakdown': complaint_stats,
        'recent_activity': recent_activity,
        'revenue': {
            'total': float(total_rev),
            'monthly': float(monthly_rev),
        }
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
