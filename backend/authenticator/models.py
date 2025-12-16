from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

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


class LoginLog(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='login_logs')
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-login_time']
    
    def __str__(self):
        return f"{self.user.username} - {self.login_time}"
    
    def is_active(self):
        """Check if session is still active (not logged out)"""
        return self.logout_time is None


class ActivityLog(models.Model):
    """Track user activities including document actions and login/logout"""
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('create', 'Create Document'),
        ('view', 'View Document'),
        ('edit', 'Edit Document'),
        ('delete', 'Delete Document'),
        ('download', 'Download Document'),
        ('share', 'Share Document'),
        ('upload', 'Upload Document'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    target_doc = models.CharField(max_length=255, null=True, blank=True, help_text="Document name or ID that was acted upon")
    log_timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-log_timestamp']
        indexes = [
            models.Index(fields=['-log_timestamp']),
            models.Index(fields=['user', '-log_timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.log_timestamp}"