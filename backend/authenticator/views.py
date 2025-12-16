from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .serializers import UserSerializer, ActivityLogSerializer
from .models import CustomUser, LoginLog, ActivityLog
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from datetime import timedelta


# Create your views here.
class CreateUserView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only allow authenticated users to list all users
        return CustomUser.objects.all()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def login_event_view(request):
    """Record a login event"""
    user = request.user
    ip_address = request.META.get('REMOTE_ADDR', '')
    
    print(f"[LOGIN EVENT] User: {user.username}, IP: {ip_address}")
    
    # Create login log entry
    login_log = LoginLog.objects.create(
        user=user,
        ip_address=ip_address
    )
    
    # Also create an activity log entry
    ActivityLog.objects.create(
        user=user,
        action='login',
        ip_address=ip_address
    )
    
    print(f"[LOGIN EVENT] Created LoginLog ID: {login_log.id}")
    
    return Response({
        'message': 'Login recorded',
        'login_id': login_log.id
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_event_view(request):
    """Record a logout event"""
    user = request.user
    ip_address = request.META.get('REMOTE_ADDR', '')
    
    print(f"[LOGOUT EVENT] User: {user.username}")
    
    # Mark the most recent active login as logged out
    active_login = LoginLog.objects.filter(
        user=user,
        logout_time__isnull=True
    ).order_by('-login_time').first()
    
    if active_login:
        active_login.logout_time = timezone.now()
        active_login.save()
        
        # Also create an activity log entry
        ActivityLog.objects.create(
            user=user,
            action='logout',
            ip_address=ip_address
        )
        
        print(f"[LOGOUT EVENT] Marked login {active_login.id} as logged out")
        return Response({'message': 'Logout recorded'})
    
    print(f"[LOGOUT EVENT] No active login found for {user.username}")
    return Response({'message': 'No active login found'}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_sessions_view(request):
    """Count currently active sessions (users still logged in)"""
    # Count login logs with no logout time (still active)
    active_count = LoginLog.objects.filter(logout_time__isnull=True).count()
    
    print(f"[ACTIVE SESSIONS] Querying LoginLog with logout_time__isnull=True")
    print(f"[ACTIVE SESSIONS] Found: {active_count} active sessions")
    
    # Debug: show all login logs
    all_logs = LoginLog.objects.all().order_by('-login_time')
    print(f"[ACTIVE SESSIONS] Total LoginLog entries: {all_logs.count()}")
    for log in all_logs[:5]:
        print(f"  - User: {log.user.username}, Login: {log.login_time}, Logout: {log.logout_time}")
    
    return Response({'active_sessions': active_count})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recent_activity_view(request):
    """Get recent activity logs for all users (admin only)"""
    # Limit to last 50 activities, ordered by most recent
    activities = ActivityLog.objects.all().order_by('-log_timestamp')[:50]
    serializer = ActivityLogSerializer(activities, many=True)
    
    return Response({'activities': serializer.data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_activity_view(request):
    """Log a user activity"""
    user = request.user
    action = request.data.get('action')
    target_doc = request.data.get('target_doc')
    ip_address = request.META.get('REMOTE_ADDR', '')
    
    # Validate action
    valid_actions = ['login', 'logout', 'create', 'view', 'edit', 'delete', 'download', 'share', 'upload']
    if action not in valid_actions:
        return Response({'error': f'Invalid action: {action}'}, status=400)
    
    # Create activity log entry
    activity_log = ActivityLog.objects.create(
        user=user,
        action=action,
        target_doc=target_doc,
        ip_address=ip_address
    )
    
    print(f"[ACTIVITY LOG] User: {user.username}, Action: {action}, Target: {target_doc}")
    
    return Response({
        'message': 'Activity logged',
        'activity_id': activity_log.id
    })