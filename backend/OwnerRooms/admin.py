from django.contrib import admin
from .models import Room, RoomImage

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