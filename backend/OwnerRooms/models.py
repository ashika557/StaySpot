from django.db import models
from accounts.models import User

class Room(models.Model):
    ROOM_TYPES = [
        ('Single Room', 'Single Room'),
        ('Double Room', 'Double Room'),
        ('Shared Room', 'Shared Room'),
        ('Family Room', 'Family Room'),
        ('Apartment', 'Apartment'),
    ]
    
    STATUS_CHOICES = [
        ('Pending Verification', 'Pending Verification'),
        ('Available', 'Available'), # Treated as Approved
        ('Occupied', 'Occupied'),
        ('Rented', 'Rented'),
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
    # room_number removed as per requirement
    room_type = models.CharField(max_length=50, choices=ROOM_TYPES, default='Single Room')
    floor = models.CharField(max_length=50, blank=True)
    size = models.CharField(max_length=50, blank=True) # Small, Medium, Large
    
    # Details
    toilet_type = models.CharField(max_length=20, choices=[('Attached', 'Attached'), ('Shared', 'Shared')], default='Shared')
    kitchen_access = models.BooleanField(default=False)
    furnished = models.BooleanField(default=False)
    available_from = models.DateField(null=True, blank=True)
    
    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2) # Monthly Rent
    deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Tenant Preference
    preferred_tenant = models.CharField(
        max_length=50, 
        choices=[
            ('Any', 'Any'),
            ('Students', 'Students'),
            ('Working Professionals', 'Working Professionals'),
            ('Family', 'Family')
        ],
        default='Any'
    )
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Available')
    
    # Amenities (House-friendly)
    wifi = models.BooleanField(default=False)
    ac = models.BooleanField(default=False)
    tv = models.BooleanField(default=False)
    cctv = models.BooleanField(default=False)
    parking = models.BooleanField(default=False)
    attached_bathroom = models.BooleanField(default=False)
    water_supply = models.BooleanField(default=False) # 24/7 Water
    electricity_backup = models.CharField(max_length=20, choices=[('Inverter', 'Inverter'), ('None', 'None')], default='None')
    
    # House Rules
    cooking_allowed = models.BooleanField(default=False)
    smoking_allowed = models.BooleanField(default=False)
    drinking_allowed = models.BooleanField(default=False)
    pets_allowed = models.BooleanField(default=False)
    visitor_allowed = models.BooleanField(default=False)
    
    # NEW FIELDS (keeping compatible with existing code if needed)
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
    
    # Descriptions & Details
    description = models.TextField(blank=True)
    amenities = models.TextField(blank=True, help_text="Comma-separated amenities")

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


class UserSearchPreference(models.Model):
    """Tracks user search preferences for room suggestions."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='search_preference')
    location = models.CharField(max_length=200, blank=True, null=True)
    gender_preference = models.CharField(max_length=20, blank=True, null=True)
    room_type = models.CharField(max_length=50, blank=True, null=True)
    wifi = models.BooleanField(default=False)
    ac = models.BooleanField(default=False)
    tv = models.BooleanField(default=False)
    cctv = models.BooleanField(default=False)
    furnished = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user.email}"


class Booking(models.Model):
    """Represents a tenant's booking/rental of a room."""
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Confirmed', 'Confirmed'),
        ('Rejected', 'Rejected'),
        ('Active', 'Active'),  # Kept for backward compatibility (equivalent to Confirmed)
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings')
    start_date = models.DateField()
    end_date = models.DateField()
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.tenant.full_name} - {self.room.title} ({self.status})"


class Visit(models.Model):
    """Represents a scheduled visit to view a room."""
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'),
        ('Rejected', 'Rejected'),
        ('Cancelled', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='visits')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='visits')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scheduled_visits')
    visit_date = models.DateField()
    visit_time = models.TimeField()
    purpose = models.CharField(max_length=200, default='Room viewing')
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['visit_date', 'visit_time']
    
    def __str__(self):
        return f"{self.tenant.full_name} visiting {self.room.title} on {self.visit_date}"


# Payment model moved to payments app


class Chat(models.Model):
    """Represents chat messages between tenants and owners."""
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='chats')
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.sender.full_name} to {self.receiver.full_name} - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"


class RoomReview(models.Model):
    """Stores tenant reviews and ratings for rooms."""
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='room_reviews')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['tenant', 'room'] # One review per tenant per room

    def __str__(self):
        return f"Review by {self.tenant.full_name} for {self.room.title} - {self.rating} stars"


class Complaint(models.Model):
    """Represents a complaint filed by a tenant."""
    COMPLAINT_TYPES = [
        ('Maintenance', 'Maintenance'),
        ('Noise', 'Noise'),
        ('Billing', 'Billing'),
        ('Security', 'Security'),
        ('Other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Investigating', 'Investigating'),
        ('Resolved', 'Resolved'),
    ]
    
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='filed_complaints')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_complaints')
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name='complaints')
    complaint_type = models.CharField(max_length=50, choices=COMPLAINT_TYPES, default='Maintenance')
    description = models.TextField()
    image = models.ImageField(upload_to='complaint_images/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Complaint from {self.tenant.full_name} - {self.complaint_type} ({self.status})"