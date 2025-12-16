from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import json

class UserManager(BaseUserManager):
    def create_user(self, user_id, password=None, **extra_fields):
        if not user_id:
            raise ValueError('User ID is required')
        user = self.model(user_id=user_id, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, user_id, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'Admin')
        return self.create_user(user_id, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('User', 'User'),
    ]
    
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]
    
    user_id = models.CharField(max_length=50, unique=True, primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='User')
    job_title = models.CharField(max_length=100, blank=True, null=True)
    organization_unit = models.ForeignKey('OrganizationUnit', on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    organization_position = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Active')
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'user_id'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.user_id})"
    
    @property
    def name(self):
        return f"{self.first_name} {self.last_name}"

class OrganizationUnit(models.Model):
    UNIT_TYPES = [
        ('Office', 'Office'),
        ('Department', 'Department'),
        ('College', 'College'),
        ('Division', 'Division'),
        ('Section', 'Section'),
        ('Unit', 'Unit'),
        ('Other', 'Other'),
    ]
    
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=50, choices=UNIT_TYPES)
    code = models.CharField(max_length=50, blank=True, null=True)
    head_position = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'organization_units'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.type})"

class CustomField(models.Model):
    FIELD_TYPES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('textarea', 'Long Text'),
        ('select', 'Select'),
        ('checkbox', 'Checkbox'),
        ('radio', 'Radio'),
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='custom_fields')
    name = models.CharField(max_length=100)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPES)
    options = models.JSONField(default=list, blank=True, null=True)
    show_in_documents = models.BooleanField(default=True)
    required = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'custom_fields'
        unique_together = ['user', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.field_type})"

class Folder(models.Model):
    COLOR_CHOICES = [
        ('blue', 'Blue'),
        ('green', 'Green'),
        ('purple', 'Purple'),
        ('red', 'Red'),
        ('yellow', 'Yellow'),
        ('pink', 'Pink'),
    ]
    
    id = models.CharField(max_length=100, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='folders')
    name = models.CharField(max_length=200)
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='blue')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'folders'
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Document(models.Model):
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('docx', 'DOCX'),
        ('ocr', 'OCR'),
        ('other', 'Other'),
    ]
    
    # ✅ Let Django auto-generate IDs
    id = models.AutoField(primary_key=True)  # Changed from CharField
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    folder = models.ForeignKey(Folder, on_delete=models.SET_NULL, null=True, blank=True, related_name='documents')
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, null=True)
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES)
    content = models.TextField(blank=True, null=True)
    ocr_content = models.TextField(blank=True, null=True)
    file_name = models.CharField(max_length=255, blank=True, null=True)
    file_size = models.CharField(max_length=50, blank=True, null=True)
    file_data = models.TextField(blank=True, null=True)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    custom_field_values = models.JSONField(default=dict, blank=True)
    personal_info = models.JSONField(default=dict, blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'documents'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title

class DirectShare(models.Model):
    PERMISSION_CHOICES = [
        ('view', 'View Only'),
        ('edit', 'Can Edit'),
        ('full', 'Full Access'),
    ]
    
    id = models.CharField(max_length=100, primary_key=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='direct_shares')
    shared_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shares_given')
    shared_with = models.ManyToManyField(User, related_name='shares_received')
    permission = models.CharField(max_length=10, choices=PERMISSION_CHOICES, default='view')
    message = models.TextField(blank=True, null=True)
    shared_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'direct_shares'
        ordering = ['-shared_at']
    
    def __str__(self):
        return f"Share: {self.document.title} by {self.shared_by.name}"

class OrganizationShare(models.Model):
    DISTRIBUTION_MODES = [
        ('all-sub-units', 'All Sub-Units'),
        ('direct-children', 'Direct Children Only'),
        ('specific-units', 'Specific Units'),
    ]
    
    id = models.CharField(max_length=100, primary_key=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='org_shares')
    sent_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='org_shares_sent')
    sent_from = models.ForeignKey(OrganizationUnit, on_delete=models.CASCADE, related_name='shares_from')
    distribution_mode = models.CharField(max_length=20, choices=DISTRIBUTION_MODES)
    selected_units = models.JSONField(default=list, blank=True, null=True)
    recipients = models.ManyToManyField(User, related_name='org_shares_received')
    message = models.TextField(blank=True, null=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'organization_shares'
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"Org Share: {self.document.title}"

class AuditLog(models.Model):
    STATUS_CHOICES = [
        ('Success', 'Success'),
        ('Failed', 'Failed'),
    ]
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    user_info = models.CharField(max_length=200)  # Stored as "Name (ID)"
    action = models.CharField(max_length=200)
    resource = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Success')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.action} - {self.user_info}"

class SystemCustomization(models.Model):
    id = models.AutoField(primary_key=True)
    system_name = models.CharField(max_length=200, default='Record Keeping Management System')
    system_logo = models.TextField(blank=True, null=True)  # Base64 encoded
    login_background = models.TextField(blank=True, null=True)  # Base64 encoded
    primary_color = models.CharField(max_length=20, default='#4F46E5')
    sidebar_gradient_start = models.CharField(max_length=20, default='#4F46E5')
    sidebar_gradient_end = models.CharField(max_length=20, default='#7C3AED')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_customization'
    
    def __str__(self):
        return self.system_name

class UserIdFormat(models.Model):
    id = models.AutoField(primary_key=True)
    prefix = models.CharField(max_length=20, default='TUPM')
    admin_separator = models.CharField(max_length=5, default='_')
    user_separator = models.CharField(max_length=5, default='-')
    segment_count = models.IntegerField(default=2)
    segment_lengths = models.JSONField(default=list)  # e.g., [2, 4]
    custom_format = models.BooleanField(default=False)
    custom_pattern_admin = models.CharField(max_length=50, default='TUPM_XX_XXXX')
    custom_pattern_user = models.CharField(max_length=50, default='TUPM-XX-XXXX')
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_id_format'
    
    def __str__(self):
        return f"User ID Format: {self.prefix}"