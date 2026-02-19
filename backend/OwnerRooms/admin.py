from django.contrib import admin
from .models import Room, RoomImage, Booking, Visit, Chat, RoomReview, Complaint

class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 1

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'location', 'price', 'status', 'gender_preference', 'views']
    list_filter = ['status', 'room_type', 'gender_preference']
    search_fields = ['title', 'location', 'owner__full_name']
    inlines = [RoomImageInline]
    actions = ['approve_rooms', 'disable_rooms']
    
    def approve_rooms(self, request, queryset):
        count = queryset.update(status='Available')
        self.message_user(request, f"{count} rooms have been approved.")
    approve_rooms.short_description = 'Approve selected rooms'

    def disable_rooms(self, request, queryset):
        count = queryset.update(status='Disabled')
        self.message_user(request, f"{count} rooms have been disabled.")
    disable_rooms.short_description = 'Disable selected rooms'

    fieldsets = (
        ('Basic Information', {
            'fields': ('owner', 'title', 'location', 'room_number', 'room_type')
        }),
        ('Details', {
            'fields': ('price', 'floor', 'size', 'status', 'gender_preference')
        }),
        ('Amenities', {
            'fields': ('wifi', 'ac', 'tv')
        }),
        ('Map Location', {
            'fields': ('latitude', 'longitude'),
            'classes': ('collapse',)
        }),
        ('Stats', {
            'fields': ('views',),
            'classes': ('collapse',)
        }),
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


@admin.register(Visit)
class VisitAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'room', 'owner', 'visit_date', 'visit_time', 'status']
    list_filter = ['status', 'visit_date']
    search_fields = ['tenant__full_name', 'room__title', 'owner__full_name']
    date_hierarchy = 'visit_date'


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'room', 'message_preview', 'timestamp', 'is_read']
    list_filter = ['is_read', 'timestamp']
    search_fields = ['sender__full_name', 'receiver__full_name', 'message']
    date_hierarchy = 'timestamp'
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message'

@admin.register(RoomReview)
class RoomReviewAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'room', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['tenant__full_name', 'room__title', 'comment']

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'owner', 'complaint_type', 'status', 'created_at']
    list_filter = ['status', 'complaint_type', 'created_at']
    search_fields = ['tenant__full_name', 'owner__full_name', 'description']
    actions = ['mark_investigating', 'mark_resolved']

    def mark_investigating(self, request, queryset):
        queryset.update(status='Investigating')
    mark_investigating.short_description = 'Mark selected complaints as Investigating'

    def mark_resolved(self, request, queryset):
        queryset.update(status='Resolved')
    mark_resolved.short_description = 'Mark selected complaints as Resolved'
