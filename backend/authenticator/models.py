from django.contrib.auth.models import AbstractUser
from django.db import models

class Office(models.Model):
    office_name = models.CharField(max_length=100)
    # ... other office fields ...

class CustomUser(AbstractUser):
    # Hierarchy Fields
    office = models.ForeignKey(Office, on_delete=models.SET_NULL, null=True, blank=True)
    is_office_head = models.BooleanField(default=False)
    position_title = models.CharField(max_length=100, null=True, blank=True)
    
    # System Admin Field (UITC)
    is_system_admin = models.BooleanField(default=False)
    
    # Extra
    profile_pic = models.ImageField(upload_to='profile_pics/', null=True, blank=True)

    def __str__(self):
        return self.username