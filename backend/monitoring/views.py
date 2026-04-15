from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import AuditLog, Notification
from .serializers import AuditLogSerializer, NotificationSerializer
from authenticator.models import UserCreationRequest

User = get_user_model()


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
        user = self.request.user

        # System-level users can see everything.
        if user.is_superuser or getattr(user, 'role_type', None) == 'system_admin':
            return AuditLog.objects.all()

        # Org admins can view logs for users in their org (and any null-user system rows are excluded).
        if getattr(user, 'role_type', None) == 'admin' and getattr(user, 'org_id', None) is not None:
            return AuditLog.objects.filter(
                Q(user_index__org_id=user.org_id) | Q(user_index=user)
            )

        # Regular users can only see their own actions.
        return AuditLog.objects.filter(user_index=user)
    
    def create(self, request, *args, **kwargs):
        """Create a new audit log entry"""
        # Automatically set the user to the current user
        data = request.data.copy()
        data['user_index'] = request.user.pk  # Use pk to get the primary key (user_index)
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

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def unread_count(self, request):
        """Return unread notification count for the current user"""
        count = Notification.objects.filter(recipient_user=request.user, is_read=False).count()
        return Response({'unread_count': count})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def generate_notifications(self, request):
        """Sync notifications for pending user creation requests (system-level only)."""
        user = request.user
        if not (user.is_superuser or user.role_type == 'system_admin'):
            return Response({'detail': 'Not authorized to generate notifications.'}, status=status.HTTP_403_FORBIDDEN)

        pending_requests = UserCreationRequest.objects.filter(status='pending')
        created_count = 0

        for pending_request in pending_requests:
            message = f"New user creation request {pending_request.request_id} from {pending_request.email_add}."
            existing_notifications = Notification.objects.filter(
                recipient_user=user,
                notif_msg=message
            ).order_by('-created_at', '-notif_id')

            # Keep only one notification per pending request message for this user.
            if existing_notifications.exists():
                keep_notification = existing_notifications.first()
                duplicate_ids = list(existing_notifications.values_list('notif_id', flat=True))[1:]
                if duplicate_ids:
                    Notification.objects.filter(notif_id__in=duplicate_ids).delete()
                    # Ensure the kept one stays unread so the admin still sees pending work.
                    if keep_notification.is_read:
                        keep_notification.is_read = False
                        keep_notification.save(update_fields=['is_read'])
            else:
                Notification.objects.create(
                    recipient_user=user,
                    actor_user=user,
                    notif_msg=message
                )
                created_count += 1

        return Response({'created': created_count})

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def cleanup_user_creation_notifications(self, request):
        """Remove user-creation request notifications from all non-system-level recipients."""
        user = request.user
        if not (user.is_superuser or user.role_type == 'system_admin'):
            return Response({'detail': 'Not authorized to perform cleanup.'}, status=status.HTTP_403_FORBIDDEN)

        non_system_user_ids = User.objects.exclude(
            Q(is_superuser=True) | Q(role_type='system_admin')
        ).values_list('pk', flat=True)

        deleted_count, _ = Notification.objects.filter(
            recipient_user_id__in=non_system_user_ids,
            notif_msg__startswith='New user creation request '
        ).delete()

        return Response({'deleted': deleted_count})
    
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
