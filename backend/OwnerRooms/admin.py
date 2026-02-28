from django.contrib import admin
from django.utils.html import format_html
from .models import Room, RoomImage, Booking, Visit, Chat, Complaint

class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 1

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    def room_info(self, obj):
        from django.db.models import Count
        flag_count = obj.complaints.filter(status__in=['Pending', 'Investigating']).count()
        warning = ""
        if flag_count > 0:
            warning = '<span style="color: #EF4444; margin-left: 8px;">⚠</span>'
        
        return format_html(
            '<div style="display: flex; flex-direction: column;">'
            '    <div style="font-weight: 700; color: #0F172A; font-size: 14px;">{}{}</div>'
            '    <div style="color: #64748B; font-size: 12px;">{}</div>'
            '</div>',
            obj.title, format_html(warning), obj.location
        )
    room_info.short_description = 'Room'

    def owner_info(self, obj):
        user = obj.owner
        photo_url = user.profile_photo.url if user.profile_photo else None
        initial = user.full_name[0].upper() if user.full_name else user.username[0].upper()
        
        if photo_url:
            avatar = f'<img src="{photo_url}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;"/>'
        else:
            avatar = f'<div style="width: 32px; height: 32px; border-radius: 50%; background: #F1F5F9; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #64748B; font-size: 12px;">{initial}</div>'
            
        return format_html(
            '<div style="display: flex; align-items: center; gap: 10px;">'
            '    {}'
            '    <div style="display: flex; flex-direction: column;">'
            '        <div style="font-weight: 600; color: #1E293B; font-size: 13px;">{}</div>'
            '        <div style="color: #94A3B8; font-size: 11px;">{}</div>'
            '    </div>'
            '</div>',
            format_html(avatar), user.full_name or user.username, user.email
        )
    owner_info.short_description = 'Owner'

    def status_badge(self, obj):
        colors = {
            'Available': {'bg': '#ECFDF5', 'text': '#10B981'},
            'Pending Verification': {'bg': '#FFF7ED', 'text': '#F97316'},
            'Disabled': {'bg': '#FEF2F2', 'text': '#EF4444'},
            'Occupied': {'bg': '#EFF6FF', 'text': '#3B82F6'},
            'Rented': {'bg': '#F5F3FF', 'text': '#8B5CF6'},
        }
        # In mockup it's 'Flagged' if there are complaints
        flag_count = obj.complaints.filter(status__in=['Pending', 'Investigating']).count()
        if flag_count > 0:
            return format_html('<span style="background: #FEF2F2; color: #EF4444; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700;">Flagged</span>')
            
        color = colors.get(obj.status, {'bg': '#F1F5F9', 'text': '#64748B'})
        return format_html(
            '<span style="background: {}; color: {}; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700;">{}</span>',
            color['bg'], color['text'], obj.status
        )
    status_badge.short_description = 'Status'

    def flag_count_display(self, obj):
        count = obj.complaints.filter(status__in=['Pending', 'Investigating']).count()
        color = "#64748B" if count == 0 else "#EF4444"
        return format_html('<span style="color: {}; font-weight: 600;">{} flags</span>', color, count)
    flag_count_display.short_description = 'Flags'

    def property_actions(self, obj):
        from django.urls import reverse
        change_url = reverse('admin:OwnerRooms_room_change', args=[obj.pk])
        base_url = reverse('admin:OwnerRooms_room_changelist')
        
        # Base actions
        actions = []
        
        # View (always)
        actions.append(f'<a href="{change_url}" title="View Details" style="text-decoration: none; margin-right: 12px; font-size: 16px;">👁️</a>')
        
        # Approve/Verify (if pending or flagged)
        flag_count = obj.complaints.filter(status__in=['Pending', 'Investigating']).count()
        if obj.status == 'Pending Verification' or flag_count > 0:
            actions.append(f'<a href="{base_url}?action=approve_room&ids={obj.pk}" title="Approve" style="text-decoration: none; margin-right: 12px; font-size: 16px;">✅</a>')
        
        # Reject/Flag (if not flagged)
        if flag_count == 0:
             actions.append(f'<a href="{base_url}?action=reject_room&ids={obj.pk}" title="Flag/Reject" style="text-decoration: none; margin-right: 12px; font-size: 16px;">❌</a>')
             
        # Edit
        actions.append(f'<a href="{change_url}" title="Edit" style="text-decoration: none; margin-right: 12px; font-size: 16px;">✏️</a>')
        
        # Delete
        actions.append(f'<a href="#" title="Delete" style="text-decoration: none; font-size: 16px;">🗑️</a>')
        
        return format_html('<div style="display: flex; align-items: center;">{}</div>', format_html(''.join(actions)))
    property_actions.short_description = 'Actions'

    def changelist_view(self, request, extra_context=None):
        from django.db.models import Q
        from django.contrib import messages
        from django.shortcuts import redirect
        from django.urls import reverse
        
        # Handle custom actions
        action = request.GET.get('action')
        ids = request.GET.get('ids')
        if action and ids:
            queryset = Room.objects.filter(pk__in=ids.split(','))
            if action == 'approve_room':
                queryset.update(status='Available')
                # Resolve linked complaints
                from .models import Complaint
                Complaint.objects.filter(room__in=queryset, status__in=['Pending', 'Investigating']).update(status='Resolved')
                messages.success(request, f"Property listings approved and associated flags resolved.")
            elif action == 'reject_room':
                queryset.update(status='Disabled')
                messages.warning(request, f"Property listings flagged and disabled.")
            return redirect(reverse('admin:OwnerRooms_room_changelist'))

        total = Room.objects.count()
        pending = Room.objects.filter(status='Pending Verification').count()
        flagged = Room.objects.filter(complaints__status__in=['Pending', 'Investigating']).distinct().count()
        available = Room.objects.filter(status='Available').count()

        extra_context = extra_context or {}
        extra_context['title'] = 'Manage Rooms'
        extra_context['title_description'] = 'Monitor and manage all room listings'
        extra_context['stats'] = [
            {'label': 'Total Rooms', 'count': total, 'icon': '🛏️', 'color': '#2563EB', 'bg': '#EFF6FF'},
            {'label': 'Pending', 'count': pending, 'icon': '🕒', 'color': '#F97316', 'bg': '#FFF7ED'},
            {'label': 'Flagged', 'count': flagged, 'icon': '🚩', 'color': '#EF4444', 'bg': '#FEF2F2'},
            {'label': 'Available', 'count': available, 'icon': '✅', 'color': '#10B981', 'bg': '#ECFDF5'},
        ]
        return super().changelist_view(request, extra_context)

    list_display = ['room_info', 'owner_info', 'status_badge', 'created_at', 'flag_count_display', 'property_actions']
    list_filter = ['status', 'room_type', 'gender_preference']
    search_fields = ['title', 'location']
    inlines = [RoomImageInline]
    
    fieldsets = (
        ('Basic Information', {'fields': ('owner', 'title', 'location', 'room_type')}),
        ('Details', {'fields': ('price', 'floor', 'size', 'status', 'gender_preference')}),
        ('Amenities', {'fields': ('wifi', 'ac', 'tv')}),
        ('Map Location', {'fields': ('latitude', 'longitude'), 'classes': ('collapse',)}),
        ('Stats', {'fields': ('views',), 'classes': ('collapse',)}),
    )

@admin.register(RoomImage)
class RoomImageAdmin(admin.ModelAdmin):
    list_display = ['room', 'uploaded_at']

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'room', 'start_date', 'end_date', 'monthly_rent', 'status', 'created_at']
    list_filter = ['status', 'start_date']
    search_fields = ['tenant__full_name', 'room__title']
    date_hierarchy = 'start_date'

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['title'] = 'Manage Bookings'
        extra_context['title_description'] = 'Track and manage user bookings'
        return super().changelist_view(request, extra_context)

@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'room', 'owner', 'visit_date', 'visit_time', 'status']
    list_filter = ['status', 'visit_date']
    search_fields = ['tenant__full_name', 'room__title', 'owner__full_name']
    date_hierarchy = 'visit_date'

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['title'] = 'Manage Visit Requests'
        extra_context['title_description'] = 'Coordinate property visits and schedules'
        return super().changelist_view(request, extra_context)

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'room', 'owner', 'complaint_type', 'status', 'created_at']
    list_filter = ['status', 'complaint_type', 'created_at']
    search_fields = ['tenant__full_name', 'owner__full_name', 'description']
    date_hierarchy = 'created_at'
    
    def changelist_view(self, request, extra_context=None):
        from django.db.models import Count
        total_complaints = Complaint.objects.count() or 1
        type_stats = Complaint.objects.values('complaint_type').annotate(count=Count('complaint_type')).order_by('-count')
        top_issues = [{'name': item['complaint_type'], 'percentage': round((item['count'] / total_complaints) * 100)} for item in type_stats]
            
        owner_stats = Complaint.objects.values('owner__full_name').annotate(count=Count('id')).order_by('-count')[:3]
        high_complaint_owners = [{'name': item['owner__full_name'], 'count': item['count']} for item in owner_stats]

        extra_context = extra_context or {}
        extra_context['title'] = 'Manage Complaints'
        extra_context['title_description'] = 'Review and resolve tenant complaints'
        extra_context['top_issues'] = top_issues
        extra_context['high_complaint_owners'] = high_complaint_owners
        return super().changelist_view(request, extra_context=extra_context)

@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'room', 'message_preview', 'timestamp', 'is_read']
    list_filter = ['is_read', 'timestamp']
    search_fields = ['sender__full_name', 'receiver__full_name', 'message']
    date_hierarchy = 'timestamp'
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message'