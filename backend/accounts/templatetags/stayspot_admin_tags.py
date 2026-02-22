from django import template
from django.db.models import Count
from django.utils import timezone
from accounts.models import User
from OwnerRooms.models import Room, Booking, Complaint

register = template.Library()

@register.simple_tag
def get_dashboard_stats():
    now = timezone.now()
    stats = {
        'total_users': User.objects.count(),
        'total_rooms': Room.objects.count(),
        'total_bookings': Booking.objects.count(),
        'active_complaints': Complaint.objects.exclude(status='Resolved').count(),
    }
    return stats

@register.simple_tag
def get_recent_activities(limit=5):
    activities = []
    
    # New Users
    users = User.objects.all().order_by('-date_joined')[:limit]
    for u in users:
        activities.append({
            'type': 'user',
            'title': 'New user registration',
            'desc': f"{u.full_name} joined as {u.role}",
            'time': u.date_joined,
            'icon': 'user'
        })
        
    # New Rooms
    rooms = Room.objects.all().order_by('-created_at')[:limit]
    for r in rooms:
        owner_name = getattr(r, 'owner', getattr(r, 'user', None))
        owner_name = owner_name.full_name if owner_name else "Unknown"
        activities.append({
            'type': 'room',
            'title': 'Room uploaded',
            'desc': f"{owner_name} added {r.title}",
            'time': r.created_at,
            'icon': 'home'
        })
        
    # New Bookings
    bookings = Booking.objects.all().order_by('-created_at')[:limit]
    for b in bookings:
        activities.append({
            'type': 'booking',
            'title': 'New booking',
            'desc': f"{b.tenant.full_name} booked a room",
            'time': b.created_at,
            'icon': 'calendar'
        })
        
    # Sort all by time
    activities.sort(key=lambda x: x['time'], reverse=True)
    return activities[:limit]

@register.simple_tag
def get_complaint_distribution():
    total = Complaint.objects.count()
    if total == 0:
        return []
    data = Complaint.objects.values('status').annotate(total=Count('id'))
    return list(data)
