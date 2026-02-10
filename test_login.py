import os
import sys
import json
import django

# Set up Django
sys.path.insert(0, 'C:\\Caps_Final\\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from auth_api.models import UserProfile
from rest_framework_simplejwt.tokens import RefreshToken

u = User.objects.get(username='TUPM-01-0002')
profile = u.profile

# Simulate what the login_view does
refresh = RefreshToken.for_user(u)

profile_data = {}
if profile:
    profile_data = {
        "organizationUnitId": profile.organization_unit_id,
        "jobTitle": profile.job_title,
        "department": profile.department,
        "organizationPosition": profile.organization_position,
        "status": profile.status,
        "role": profile.role,
    }

response_data = {
    "access": str(refresh.access_token),
    "refresh": str(refresh),
    "user": {
        "id": u.id,
        "username": u.username,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "email": u.email,
        "is_staff": u.is_staff,
        "is_superuser": u.is_superuser,
        **profile_data
    },
}

print("Login Response would be:")
print(json.dumps(response_data, indent=2, default=str))
