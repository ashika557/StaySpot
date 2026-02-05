from django.core.management.base import BaseCommand
from OwnerRooms.models import Booking
from payments.models import Payment

class Command(BaseCommand):
    help = 'Creates missing payment records for Confirmed or Active bookings'

    def handle(self, *args, **kwargs):
        # Find bookings that are Confirmed/Active but have no Rent payment
        bookings = Booking.objects.filter(status__in=['Confirmed', 'Active'])
        
        created_count = 0
        for booking in bookings:
            # Check if rent payment exists
            if not Payment.objects.filter(booking=booking, payment_type='Rent').exists():
                Payment.objects.create(
                    booking=booking,
                    amount=booking.monthly_rent,
                    due_date=booking.start_date,
                    status='Pending',
                    payment_type='Rent'
                )
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Created payment for booking {booking.id} ({booking.room.title})'))
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} missing payments.'))
