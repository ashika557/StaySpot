from django.utils import timezone
from datetime import timedelta
from .models import Payment
from notifications.models import Notification

def trigger_rent_reminders():
    """
    Scans for pending rent payments due in 7 days and sends notifications.
    Returns the count of reminders sent.
    """
    reminder_date = timezone.now().date() + timedelta(days=7)
    
    pending_payments = Payment.objects.filter(
        status='Pending',
        payment_type='Rent',
        due_date=reminder_date
    )
    
    count = 0
    skipped = 0
    for payment in pending_payments:
        tenant = payment.booking.tenant
        
        # Check if a reminder has already been sent for this payment
        exists = Notification.objects.filter(
            recipient=tenant,
            notification_type='rent_reminder',
            related_id=payment.id
        ).exists()
        
        if not exists:
            Notification.objects.create(
                recipient=tenant,
                notification_type='rent_reminder',
                text=f"Reminder: Your rent for {payment.booking.room.title} is due on {payment.due_date}. Please clear it soon.",
                related_id=payment.id
            )
            count += 1
        else:
            skipped += 1
            
    return count, skipped
