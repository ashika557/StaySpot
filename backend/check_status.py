
import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from accounts.models import User

print("-" * 50)
print(f"{'Email':<30} | {'Role':<10} | {'Status':<15} | {'Verified?':<10}")
print("-" * 50)

for user in User.objects.filter(role='Owner').order_by('-date_joined')[:5]:
    print(f"{user.email:<30} | {user.role:<10} | {user.verification_status:<15} | {str(user.is_identity_verified):<10}")

print("-" * 50)
