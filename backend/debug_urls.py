import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'stayspot.settings')
django.setup()

from django.urls import get_resolver

def print_urls(patterns, prefix=''):
    for pattern in patterns:
        if hasattr(pattern, 'url_patterns'):
            print_urls(pattern.url_patterns, prefix + str(pattern.pattern))
        else:
            print(f"{prefix}{pattern.pattern}")

resolver = get_resolver()
print_urls(resolver.url_patterns)
