from django.db import models
from OwnerRooms.models import Booking

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
    
    PAYMENT_METHOD_CHOICES = [
        ('eSewa', 'eSewa'),
        ('Khalti', 'Khalti'),
        ('Cash', 'Cash'),
        ('Other', 'Other'),
    ]
    
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='Rent')
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, null=True, blank=True)
    transaction_id = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'OwnerRooms_payment'
        ordering = ['due_date']
    
    def __str__(self):
        return f"{self.payment_type} - {self.booking.tenant.full_name} - ₹{self.amount} ({self.status})"
    
    def save(self, *args, **kwargs):
        """Auto-update status to Overdue if past due date and not paid."""
        from django.utils import timezone
        if self.status == 'Pending' and self.due_date < timezone.now().date():
            self.status = 'Overdue'
        super().save(*args, **kwargs)
