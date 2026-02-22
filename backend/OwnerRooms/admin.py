from django.contrib import admin
from .models import Room, RoomImage, Booking, Visit, Chat

class RoomImageInline(admin.TabularInline):
    model = RoomImage
    extra = 1

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['title', 'owner', 'location', 'price', 'status', 'gender_preference', 'views']
    list_filter = ['status', 'room_type', 'gender_preference']  # Added gender_preference filter
    search_fields = ['title', 'location']
    inlines = [RoomImageInline]
    
    # Optional: Group fields in the form view for better organization
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
            'classes': ('collapse',)  # Makes this section collapsible
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


# Payment registration moved to payments app


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ['sender', 'receiver', 'room', 'message_preview', 'timestamp', 'is_read']
    list_filter = ['is_read', 'timestamp']
    search_fields = ['sender__full_name', 'receiver__full_name', 'message']
    date_hierarchy = 'timestamp'
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message'