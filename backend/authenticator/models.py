from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone

class Organization(models.Model):
    org_id = models.AutoField(primary_key=True)
    parent_org = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_offices')
    org_name = models.CharField(max_length=255)
    org_desc = models.TextField(blank=True, null=True)
    org_code = models.CharField(max_length=50)
    org_type = models.CharField(max_length=100) # Hardcoded from Dropbox in frontend

    class Meta:
        db_table = 'organizations'

    def __str__(self):
        return self.org_code

class IdFormat(models.Model):
    format_id = models.AutoField(primary_key=True)
    prefix = models.CharField(max_length=20, null=True, blank=True)
    admin_separator = models.CharField(max_length=5)
    user_separator = models.CharField(max_length=5)
    segment1_len = models.IntegerField()
    segment2_len = models.IntegerField()
    segment3_len = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'id_format'

# Custom Manager required for createsuperuser (as discussed previously)
class CustomUserManager(BaseUserManager):
    def create_user(self, user_id, email_add, password=None, **extra_fields):
        if not user_id: raise ValueError("User ID required")
        email_add = self.normalize_email(email_add)
        user = self.model(user_id=user_id, email_add=email_add, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, user_id, email_add, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role_type', 'system_admin')
        return self.create_user(user_id, email_add, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    user_index = models.AutoField(primary_key=True)
    org = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    user_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)
    suffix = models.CharField(max_length=20, blank=True, null=True)
    user_pos = models.CharField(max_length=255, blank=True, null=True)
    user_contact = models.CharField(max_length=20, blank=True, null=True)
    user_birthdate = models.DateField(blank=True, null=True)
    email_add = models.EmailField(unique=True)
    role_type = models.CharField(max_length=50, default='user')
    joined_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    password_changed = models.BooleanField(default=False)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'user_id'
    REQUIRED_FIELDS = ['email_add', 'first_name', 'last_name']

    def get_full_name(self):
        """
        Generate full name with middle initial and suffix.
        Format: First Middle_Initial Last, Suffix
        Example: John P. Doe, Jr.
        """
        name_parts = [self.first_name, self.last_name]
        
        # Add middle initial if middle_name exists
        if self.middle_name and self.middle_name.strip():
            middle_initial = self.middle_name.strip()[0].upper() + '.'
            # Insert middle initial between first and last name
            name_parts = [self.first_name, middle_initial, self.last_name]
        
        full_name = ' '.join(name_parts)
        
        # Add suffix if it exists
        if self.suffix and self.suffix.strip():
            full_name = f"{full_name}, {self.suffix}"
        
        return full_name

    class Meta:
        db_table = 'users'


class UserCreationRequest(models.Model):
    REQUEST_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
    ]
    
    request_id = models.CharField(max_length=50, unique=True, primary_key=True)
    
    # Registration data from user
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)
    suffix = models.CharField(max_length=50, blank=True, null=True)
    email_add = models.EmailField(unique=True)
    user_pos = models.CharField(max_length=255)
    user_contact = models.CharField(max_length=20, blank=True, null=True)
    user_birthdate = models.DateField(blank=True, null=True)
    org = models.ForeignKey(Organization, on_delete=models.PROTECT)
    
    # Request metadata
    status = models.CharField(max_length=20, choices=REQUEST_STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.EmailField()  # Email from registration form
    
    # Admin review data
    reviewed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_requests')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Claim/lock mechanism - first-come-first-serve
    claimed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='claimed_requests')
    claimed_at = models.DateTimeField(null=True, blank=True)
    
    # For approval
    assigned_user_id = models.CharField(max_length=50, null=True, blank=True)
    
    # For denial
    denial_reason = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'user_creation_requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.request_id} - {self.email_add} ({self.status})"


class TwoFactorAuthCode(models.Model):
    """Model to store OTP codes for 2FA"""
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='two_factor_codes')
    code = models.CharField(max_length=6)  # 6-digit OTP
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()  # OTP expires after 10 minutes
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    attempts = models.IntegerField(default=0)  # Track failed attempts
    
    class Meta:
        db_table = 'two_factor_auth_codes'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"2FA Code for {self.user.user_id}"
    
    @property
    def is_expired(self):
        """Check if the OTP has expired"""
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        """Check if the OTP is still valid for use"""
        return not self.is_used and not self.is_expired and self.attempts < 3


class RememberedDevice(models.Model):
    """Model to store remembered/trusted devices for users"""
    device_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='remembered_devices')
    device_token = models.CharField(max_length=255)  # Unique per user (see unique_together)
    device_name = models.CharField(max_length=255, blank=True, null=True)  # e.g., "Chrome on Windows"
    device_fingerprint = models.CharField(max_length=255)  # Unique per user (see unique_together)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)  # User can disable remembered devices
    expires_at = models.DateTimeField()  # Device trust expires after 30 days
    
    class Meta:
        db_table = 'remembered_devices'
        ordering = ['-last_used_at']
        unique_together = ('user', 'device_token', 'device_fingerprint')
    
    def __str__(self):
        return f"Device {self.device_name} for {self.user.user_id}"
    
    @property
    def is_valid(self):
        """Check if the device is still valid for trusted login"""
        return self.is_active and timezone.now() <= self.expires_at