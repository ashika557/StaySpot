from django.core.management.base import BaseCommand
from payments.models import Payment
from OwnerRooms.models import Booking
from payments.utils import trigger_rent_reminders
from django.utils import timezone
from datetime import timedelta

class Command(BaseCommand):
    help = 'Quickly sets up an overdue rent reminder for a live demonstration.'

    def handle(self, *args, **kwargs):
        # 1. Find an active booking
        booking = Booking.objects.filter(status='Active').first()
        if not booking:
            self.stdout.write(self.style.ERROR('No active bookings found! Please create a booking first.'))
            return

        # 2. Set an overdue payment (Due 2 days ago)
        yesterday = timezone.now().date() - timedelta(days=2)
        
        # Look for existing pending payment to modify, or create a new one
        payment, created = Payment.objects.get_or_create(
            booking=booking,
            payment_type='Rent',
            status__in=['Pending', 'Overdue'],
            due_date__gte=timezone.now().date() - timedelta(days=30), # Within current month
            defaults={
                'amount': booking.monthly_rent,
                'due_date': yesterday,
                'status': 'Pending'
            }
        )

        # Force it to be overdue
        payment.status = 'Pending'
        payment.due_date = yesterday
        payment.save() # save() triggers the 'Overdue' logic automatically

        self.stdout.write(self.style.SUCCESS(f'Demo Payment Ready: {payment.booking.tenant.full_name} is now OVERDUE.'))

        # 3. Trigger the reminder logic immediately
        self.stdout.write('Triggering reminders (Notification + Email)...')
        trigger_rent_reminders(booking_id=booking.id)
        
        self.stdout.write(self.style.SUCCESS('Successfully prepared demo. Open your dashboard now!'))
