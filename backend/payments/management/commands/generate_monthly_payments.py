from django.core.management.base import BaseCommand
from payments.utils import generate_monthly_payments


class Command(BaseCommand):
    help = 'Auto-generates next month rent payment records for active bookings whose last rent was paid'

    def handle(self, *args, **options):
        created = generate_monthly_payments()

        if created > 0:
            self.stdout.write(self.style.SUCCESS(f"Created {created} new monthly rent payment(s)."))
        else:
            self.stdout.write("No new monthly payments needed at this time.")
