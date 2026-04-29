from rest_framework import serializers
from .models import AuditLog, Notification


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.StringRelatedField(source='user_index', read_only=True)
    first_name = serializers.CharField(source='user_index.first_name', read_only=True, allow_null=True)
    last_name = serializers.CharField(source='user_index.last_name', read_only=True, allow_null=True)
    user_id = serializers.CharField(source='user_index.user_id', read_only=True, allow_null=True)
    
    class Meta:
        model = AuditLog
        fields = ['log_id', 'user_index', 'user_name', 'first_name', 'last_name', 'user_id', 'audit_timestamp', 'audit_action', 'audit_desc', 'audit_status']
        read_only_fields = ['log_id', 'audit_timestamp']


class NotificationSerializer(serializers.ModelSerializer):
    recipient_name = serializers.CharField(source='recipient_user.user_id', read_only=True, allow_null=True)
    actor_name = serializers.CharField(source='actor_user.user_id', read_only=True, allow_null=True)
    actor_first_name = serializers.CharField(source='actor_user.first_name', read_only=True, allow_null=True)
    actor_last_name = serializers.CharField(source='actor_user.last_name', read_only=True, allow_null=True)
    actor_position = serializers.CharField(source='actor_user.user_pos', read_only=True, allow_null=True)
    doc_name = serializers.CharField(source='doc.doc_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Notification
        fields = ['notif_id', 'recipient_user', 'recipient_name', 'actor_user', 'actor_name', 'actor_first_name', 'actor_last_name', 'actor_position', 'doc', 'doc_name', 'notif_msg', 'is_read', 'approval_status', 'created_at']
        read_only_fields = ['notif_id', 'created_at']
