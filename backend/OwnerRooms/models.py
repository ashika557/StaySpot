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
    parking = models.BooleanField(default=False)
    water_supply = models.BooleanField(default=False)
    attached_bathroom = models.BooleanField(default=False)
    cctv = models.BooleanField(default=False)
    kitchen = models.BooleanField(default=False)
    furniture = models.BooleanField(default=False)
    
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


class UserSearchPreference(models.Model):
    """Tracks user search preferences for room suggestions."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='search_preference')
    location = models.CharField(max_length=200, blank=True, null=True)
    gender_preference = models.CharField(max_length=20, blank=True, null=True)
    room_type = models.CharField(max_length=50, blank=True, null=True)
    wifi = models.BooleanField(default=False)
    ac = models.BooleanField(default=False)
    tv = models.BooleanField(default=False)
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
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
    ]
    
    tenant = models.ForeignKey(User, on_delete=models.CASCADE, related_name='visits')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='visits')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scheduled_visits')
    visit_date = models.DateField()
    visit_time = models.TimeField()
    purpose = models.CharField(max_length=200, default='Room viewing')
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Scheduled')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['visit_date', 'visit_time']
    
    def __str__(self):
        return f"{self.tenant.full_name} visiting {self.room.title} on {self.visit_date}"


class Payment(models.Model):
    """Tracks payments for bookings."""
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Paid', 'Paid'),
        ('Overdue', 'Overdue'),
    ]
    
    PAYMENT_TYPE_CHOICES = [
        ('Rent', 'Rent'),
        ('Deposit', 'Deposit'),
        ('Maintenance', 'Maintenance'),
    ]
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='Rent')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['due_date']
    
    def __str__(self):
        return f"{self.payment_type} - {self.booking.tenant.full_name} - ₹{self.amount} ({self.status})"
    
    def save(self, *args, **kwargs):
        """Auto-update status to Overdue if past due date and not paid."""
        from django.utils import timezone
        if self.status == 'Pending' and self.due_date < timezone.now().date():
            self.status = 'Overdue'
        super().save(*args, **kwargs)


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