from django.db import models
from accounts.models import User

class Room(models.Model):
    ROOM_TYPES = [
        ('Single Room', 'Single Room'),
        ('Double Room', 'Double Room'),
        ('Apartment', 'Apartment'),
    ]
    
    STATUS_CHOICES = [
        ('Available', 'Available'),
        ('Occupied', 'Occupied'),
        ('Disabled', 'Disabled'),
    ]
    
    GENDER_PREFERENCE_CHOICES = [
        ('Any', 'Any'),
        ('Male', 'Male'),
        ('Female', 'Female'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='rooms')
    
    # Basic Information
    title = models.CharField(max_length=200)
    location = models.CharField(max_length=300)
    room_number = models.CharField(max_length=50, blank=True)
    room_type = models.CharField(max_length=50, choices=ROOM_TYPES, default='Single Room')
    floor = models.CharField(max_length=50, blank=True)
    size = models.CharField(max_length=50, blank=True)
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Available')
    
    # Amenities
    wifi = models.BooleanField(default=False)
    ac = models.BooleanField(default=False)
    tv = models.BooleanField(default=False)
    
    # NEW FIELDS
    gender_preference = models.CharField(
        max_length=10, 
        choices=GENDER_PREFERENCE_CHOICES, 
        default='Any'
    )
    latitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        blank=True, 
        null=True,
        help_text="Latitude coordinate for map location"
    )
    longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        blank=True, 
        null=True,
        help_text="Longitude coordinate for map location"
    )
    
    # Stats
    views = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.location}"


class RoomImage(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='room_images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['uploaded_at']
    
    def __str__(self):
        return f"Image for {self.room.title}"