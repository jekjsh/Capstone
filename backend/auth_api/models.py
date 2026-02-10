from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class OrganizationUnit(models.Model):
    """Represents an organizational unit in the hierarchy"""
    
    TYPE_CHOICES = [
        ('Office', 'Office'),
        ('Department', 'Department'),
        ('College', 'College'),
        ('Division', 'Division'),
        ('Section', 'Section'),
        ('Unit', 'Unit'),
        ('Other', 'Other'),
    ]
    
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    code = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    head_position = models.CharField(max_length=255, blank=True, null=True)
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='children'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
        
    def __str__(self):
        return f"{self.name} ({self.type})"
    
    def get_full_path(self):
        """Get the full hierarchical path of this unit"""
        path = [self.name]
        parent = self.parent
        while parent:
            path.insert(0, parent.name)
            parent = parent.parent
        return ' > '.join(path)


class UserProfile(models.Model):
    """Extended user profile for additional fields"""
    
    STATUS_CHOICES = [
        ('Active', 'Active'),
        ('Inactive', 'Inactive'),
    ]
    
    ROLE_CHOICES = [
        ('Admin', 'Admin'),
        ('User', 'User'),
        ('System Admin', 'System Admin'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    job_title = models.CharField(max_length=255, blank=True, null=True)
    department = models.CharField(max_length=255, blank=True, null=True)
    organization_unit = models.ForeignKey(
        OrganizationUnit, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )
    organization_position = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='User')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['user__username']
    
    def __str__(self):
        return f"{self.user.username} - {self.role}"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Automatically create UserProfile when User is created"""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save UserProfile when User is saved"""
    if hasattr(instance, 'profile'):
        instance.profile.save()


class Folder(models.Model):
    """User folders for organizing documents"""
    
    COLOR_CHOICES = [
        ('blue', 'Blue'),
        ('green', 'Green'),
        ('purple', 'Purple'),
        ('red', 'Red'),
        ('yellow', 'Yellow'),
        ('pink', 'Pink'),
    ]
    
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=20, choices=COLOR_CHOICES, default='blue')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='folders')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['owner']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.owner.username})"


class Document(models.Model):
    """User-created documents in the system"""
    
    FORMAT_CHOICES = [
        ('pdf', 'PDF'),
        ('docx', 'DOCX'),
        ('ocr', 'OCR'),
        ('other', 'Other'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='other')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    folder_id = models.CharField(max_length=100, blank=True, null=True)
    file_data = models.TextField(blank=True, null=True)  # Base64 or file path
    content = models.TextField(blank=True, null=True)  # Text content
    ocr_content = models.TextField(blank=True, null=True)  # OCR extracted content
    personal_info = models.JSONField(default=dict, blank=True)  # Personal info fields
    custom_field_values = models.JSONField(default=dict, blank=True)  # Custom fields
    tags = models.JSONField(default=list, blank=True)  # Document tags
    shared_with = models.JSONField(default=list, blank=True)  # List of user IDs
    is_deleted = models.BooleanField(default=False)  # Soft delete flag
    deleted_at = models.DateTimeField(blank=True, null=True)  # Timestamp when document was deleted
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['created_by']),
            models.Index(fields=['is_deleted']),
        ]
    
    def __str__(self):
        return f"{self.title} by {self.created_by.username}"


class AuditLog(models.Model):
    """Log of system activities and user actions"""
    
    STATUS_CHOICES = [
        ('Success', 'Success'),
        ('Failed', 'Failed'),
    ]
    
    user = models.CharField(max_length=255)  # Username or user identifier
    action = models.CharField(max_length=255)  # Action performed
    resource = models.TextField()  # Resource affected or details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Success')
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']  # Most recent first
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['user']),
            models.Index(fields=['action']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.timestamp} - {self.user} - {self.action}"


class SystemSettings(models.Model):
    """System-wide settings including User ID format configuration"""
    
    setting_key = models.CharField(max_length=255, unique=True)  # e.g., 'user_id_format', 'customization'
    setting_value = models.JSONField(default=dict)  # JSON value for the setting
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['setting_key']
        verbose_name_plural = "System Settings"
    
    def __str__(self):
        return f"{self.setting_key}"

class Tag(models.Model):
    """User-defined tags for organizing documents"""
    
    TYPE_CHOICES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('select', 'Select'),
    ]
    
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='text')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tags')
    show_in_documents = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ('name', 'owner')
        indexes = [
            models.Index(fields=['owner']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.name} (by {self.owner.username})"


class OrganizationShare(models.Model):
    """Organization-wide document distribution records"""

    DISTRIBUTION_CHOICES = [
        ('all-sub-units', 'All Sub-Units'),
        ('direct-children', 'Direct Children Only'),
        ('specific-units', 'Specific Units'),
    ]

    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='organization_shares')
    sent_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='organization_shares_sent')
    sent_from = models.ForeignKey(OrganizationUnit, on_delete=models.SET_NULL, null=True, blank=True, related_name='organization_shares')
    distribution_mode = models.CharField(max_length=30, choices=DISTRIBUTION_CHOICES, default='all-sub-units')
    recipients = models.JSONField(default=list, blank=True)
    selected_units = models.JSONField(default=list, blank=True)
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['sent_by']),
        ]

    def __str__(self):
        return f"Org share: {self.document.title} by {self.sent_by.username}"