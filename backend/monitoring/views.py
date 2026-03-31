from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import AuditLog, Notification
from .serializers import AuditLogSerializer, NotificationSerializer


class AuditLogViewSet(viewsets.ModelViewSet):
    """ViewSet for audit logs. Can create new logs and view."""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['audit_action', 'user_index__user_id']
    ordering_fields = ['audit_timestamp', 'audit_status']
    ordering = ['-audit_timestamp']
    
    def get_queryset(self):
        # Only superusers/admins can see all logs
        if self.request.user.is_superuser:
            return AuditLog.objects.all()
        # Regular users can only see their own actions
        return AuditLog.objects.filter(user_index=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create a new audit log entry"""
        # Automatically set the user to the current user
        data = request.data.copy()
        data['user_index'] = request.user.id
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'is_read']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Users see notifications they received
        return Notification.objects.filter(recipient_user=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_as_read(self, request, pk=None):
        """Mark a notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_all_as_read(self, request):
        """Mark all notifications for this user as read"""
        Notification.objects.filter(recipient_user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})
