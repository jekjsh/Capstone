from django.contrib import admin
from .models import AuditLog, Notification


class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['log_id', 'user_index', 'audit_timestamp', 'audit_action', 'audit_status']
    search_fields = ['user_index__user_id', 'audit_action']
    list_filter = ['audit_status', 'audit_timestamp']
    ordering = ['-audit_timestamp']
    readonly_fields = ['audit_timestamp']


class NotificationAdmin(admin.ModelAdmin):
    list_display = ['notif_id', 'recipient_user', 'actor_user', 'notif_msg', 'is_read', 'created_at']
    search_fields = ['recipient_user__user_id', 'actor_user__user_id', 'notif_msg']
    list_filter = ['is_read', 'created_at']
    ordering = ['-created_at']
    readonly_fields = ['created_at']


admin.site.register(AuditLog, AuditLogAdmin)
admin.site.register(Notification, NotificationAdmin)
