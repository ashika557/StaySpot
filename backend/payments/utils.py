from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from .models import Payment
from notifications.utils import send_notification
from notifications.models import Notification


def trigger_rent_reminders(booking_id=None):
    """
    Scans for pending rent payments due within the next 7 days and sends notifications.
    Can be filtered by booking_id for manual triggers.
    Returns the count of reminders sent and skipped.
    """
    today = timezone.now().date()
    # Reminder window: strictly 7 days before, but we include today and everything in between 
    # to ensure no one is missed if they don't login exactly on the 7th day.
    reminder_window = today + timedelta(days=7)

    # Find all pending or overdue rent payments due within the next 7 days
    filters = {
        'status__in': ['Pending', 'Overdue'],
        'payment_type': 'Rent',
        'due_date__lte': reminder_window,
    }
    if booking_id:
        filters['booking_id'] = booking_id

    pending_payments = Payment.objects.filter(**filters)

    count = 0
    skipped = 0
    for payment in pending_payments:
        tenant = payment.booking.tenant
        
        # We only send ONE reminder per payment to avoid spamming.
        # But we send it as soon as it enters the 7-day window.
        exists = Notification.objects.filter(
            recipient=tenant,
            notification_type='rent_reminder',
            related_id=payment.id
        ).exists()

        if not exists:
            days_left = (payment.due_date - today).days
            if days_left < 0:
                due_text = f"was due {abs(days_left)} days ago (on {payment.due_date})"
            elif days_left == 0:
                due_text = "today"
            elif days_left == 1:
                due_text = "tomorrow"
            else:
                due_text = f"in {days_left} days (on {payment.due_date})"

            notification_text = f"Rent Reminder: Your rent of NPR {payment.amount} for {payment.booking.room.title} is due {due_text}. Please clear it soon."
            
            # 1. Send in-app notification (WebSocket + DB)
            send_notification(
                recipient=tenant,
                actor=payment.booking.room.owner, # Owner is the actor
                notification_type='rent_reminder',
                text=notification_text,
                related_id=payment.id
            )

            # 2. Send Email Reminder
            if tenant.email:
                try:
                    subject = f"Rent Reminder: {payment.booking.room.title}"
                    email_body = f"Hello {tenant.full_name},\n\nThis is a friendly reminder that your rent for {payment.booking.room.title} is {due_text}.\n\nAmount: NPR {payment.amount}\nDue Date: {payment.due_date}\n\nPlease login to StaySpot to complete your payment.\n\nThank you,\nStaySpot Team"
                    send_mail(
                        subject,
                        email_body,
                        settings.DEFAULT_FROM_EMAIL,
                        [tenant.email],
                        fail_silently=True
                    )
                except Exception as e:
                    print(f"Failed to send email to {tenant.email}: {str(e)}")

            count += 1
        else:
            skipped += 1

    return count, skipped


def generate_monthly_payments():
    """
    Ensures every active booking has a rent payment record for the current/next period.
    This runs every time reminders are checked to ensure "one must pay in a month".
    """
    from OwnerRooms.models import Booking
    from django.db.models import Max

    active_bookings = Booking.objects.filter(status__in=['Active', 'Confirmed', 'Rented'])
    created = 0
    today = timezone.now().date()

    for booking in active_bookings:
        # Get the latest due date for any rent payment for this booking
        latest_due = Payment.objects.filter(
            booking=booking,
            payment_type='Rent'
        ).aggregate(Max('due_date'))['due_date__max']

        # If no payments exist, start from 1 month after the booking start_date
        if not latest_due:
            # Shift first payment to 1 month after start
            next_due_date = booking.start_date + relativedelta(months=1)
            
            # If the booking ends before the 1-month mark, ensure we still generate a bill for the stay
            if booking.end_date and next_due_date > booking.end_date:
                next_due_date = booking.end_date
        else:
            # Otherwise, calculate the next month's due date from the latest one
            next_due_date = latest_due + relativedelta(months=1)

        # We generate payments up to 7 days in advance of their due date.
        # This matches the reminder window and prevents creating "next month's" bill
        # while the current month is still pending.
        generation_limit = today + timedelta(days=7)

        # Loop to catch up if multiple months were missed (though usually it will just be one)
        while next_due_date <= generation_limit:
            # Don't create if beyond the booking end date
            if booking.end_date and next_due_date > booking.end_date:
                break

            # Only create if it doesn't already exist for this date
            if not Payment.objects.filter(booking=booking, payment_type='Rent', due_date=next_due_date).exists():
                Payment.objects.create(
                    booking=booking,
                    amount=booking.monthly_rent,
                    due_date=next_due_date,
                    status='Pending',
                    payment_type='Rent',
                )
                created += 1
            
            # Move to the next month for the next iteration of the while loop
            next_due_date = next_due_date + relativedelta(months=1)

    return created
