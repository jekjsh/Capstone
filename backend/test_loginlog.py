#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from authenticator.models import LoginLog, CustomUser
from django.utils import timezone

# Print total LoginLog entries
print(f"Total LoginLog entries: {LoginLog.objects.count()}")

# Print all LoginLog entries
print("\nAll LoginLog entries:")
for log in LoginLog.objects.all().order_by('-login_time'):
    status = "ACTIVE" if log.is_active() else "LOGGED OUT"
    print(f"  - {log.user.username} | {log.login_time} | {log.logout_time} | [{status}]")

# Test the query we're using in active_sessions_view
active_count = LoginLog.objects.filter(logout_time__isnull=True).count()
print(f"\nActive sessions (logout_time__isnull=True): {active_count}")

# Test with explicit False
inactive_count = LoginLog.objects.exclude(logout_time__isnull=True).count()
print(f"Inactive sessions (has logout_time): {inactive_count}")

# Test is_active method
active_by_method = sum(1 for log in LoginLog.objects.all() if log.is_active())
print(f"Active sessions (using is_active() method): {active_by_method}")
