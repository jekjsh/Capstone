from django.db import models
from django.conf import settings
from documents.models import Document

class AuditLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    user_index = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    audit_timestamp = models.DateTimeField(auto_now_add=True)
    audit_action = models.CharField(max_length=100)
    audit_desc = models.TextField()
    audit_status = models.CharField(max_length=50) # 'Success' or 'Failed'

    class Meta:
        db_table = 'audit_logs'

class Notification(models.Model):
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('passed_to_higher', 'Passed to Higher'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
        ('other', 'Other'),
    ]
    
    notif_id = models.AutoField(primary_key=True)
    recipient_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifs_received')
    actor_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifs_triggered')
    doc = models.ForeignKey(Document, on_delete=models.CASCADE, null=True, blank=True)
    notif_msg = models.CharField(max_length=255)
    is_read = models.BooleanField(default=False)
    approval_status = models.CharField(max_length=20, choices=APPROVAL_STATUS_CHOICES, default='other', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'