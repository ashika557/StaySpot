from django.core.management.base import BaseCommand
from payments.utils import trigger_rent_reminders

class Command(BaseCommand):
    help = 'Sends rent reminders to tenants 7 days before their due date'

    def handle(self, *args, **options):
        count, skipped = trigger_rent_reminders()
        
        if count > 0:
            self.stdout.write(self.style.SUCCESS(f"Sent {count} rent reminders."))
        if skipped > 0:
            self.stdout.write(self.style.WARNING(f"Skipped {skipped} already notified payments."))
            
        if count == 0 and skipped == 0:
            self.stdout.write("No reminders were due to be sent.")
