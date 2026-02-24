from django.contrib.auth import authenticate
from django.db import models
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework_simplejwt.tokens import RefreshToken
from .models import OrganizationUnit, UserProfile, AuditLog, Document, SystemSettings, Folder, Tag, OrganizationShare, Notification
from .serializers import (
    OrganizationUnitSerializer, 
    OrganizationUnitCreateUpdateSerializer,
    UserSerializer,
    UserCreateSerializer,
    AuditLogSerializer,
    DocumentSerializer,
    SystemSettingsSerializer,
    FolderSerializer,
    TagSerializer,
    OrganizationShareSerializer,
    NotificationSerializer
)
import base64
import io
from docx import Document as DocxDocument
from django.utils import timezone
from datetime import timedelta


def create_audit_log(user, action, resource, status_value='Success', request=None):
    """Helper function to create audit log entries"""
    ip_address = None
    if request:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0]
        else:
            ip_address = request.META.get('REMOTE_ADDR')
    
    AuditLog.objects.create(
        user=user if isinstance(user, str) else user.username,
        action=action,
        resource=resource,
        status=status_value,
        ip_address=ip_address
    )


def extract_docx_content(file_data):
    """Extract text content from DOCX file (base64 encoded)"""
    try:
        # Decode base64 file data
        if isinstance(file_data, str) and file_data.startswith('data:'):
            # Remove data URI prefix if present
            file_data = file_data.split(',')[1]
        
        file_bytes = base64.b64decode(file_data)
        
        # Create in-memory file
        file_stream = io.BytesIO(file_bytes)
        
        # Extract text from DOCX
        doc = DocxDocument(file_stream)
        paragraphs = []
        
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                paragraphs.append(paragraph.text)
        
        # Also extract from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = []
                for cell in row.cells:
                    row_text.append(cell.text.strip())
                if any(row_text):
                    paragraphs.append(' | '.join(row_text))
        
        return '\n'.join(paragraphs)
    except Exception as e:
        print(f"Error extracting DOCX content: {e}")
        return None


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    user_id = request.data.get("user_id") or request.data.get("username") or request.data.get("userId")
    password = request.data.get("password")

    if not user_id or not password:
        return Response(
            {"detail": "User ID and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = authenticate(request, username=user_id, password=password)
    if user is None:
        # Log failed login attempt
        create_audit_log(user_id, 'Login', f'Failed login attempt for {user_id}', 'Failed', request)
        return Response(
            {"detail": "Invalid User ID or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Update last login time
    from django.utils import timezone
    user.last_login = timezone.now()
    user.save(update_fields=['last_login'])

    # Log successful login
    create_audit_log(user, 'Login', f'User {user.username} logged in successfully', 'Success', request)

    refresh = RefreshToken.for_user(user)

    # Get user profile data
    profile = getattr(user, 'profile', None)
    profile_data = {}
    if profile:
        profile_data = {
            "organizationUnitId": profile.organization_unit_id,
            "jobTitle": profile.job_title,
            "department": profile.department,
            "organizationPosition": profile.organization_position,
            "status": profile.status,
            "role": profile.role,
        }

    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "is_staff": user.is_staff,
                "is_superuser": user.is_superuser,
                **profile_data
            },
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_password(request):
    """Verify if the provided password matches the current user's password"""
    password = request.data.get("password")

    if not password:
        return Response(
            {"detail": "Password is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Authenticate using the current user's username and provided password
    user = authenticate(request, username=request.user.username, password=password)
    
    if user is None:
        return Response(
            {"valid": False, "detail": "Invalid password."},
            status=status.HTTP_200_OK,
        )

    return Response(
        {"valid": True, "detail": "Password verified successfully."},
        status=status.HTTP_200_OK,
    )


class OrganizationUnitViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing organizational units
    """
    queryset = OrganizationUnit.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return OrganizationUnitCreateUpdateSerializer
        return OrganizationUnitSerializer
    
    def list(self, request, *args, **kwargs):
        """Return only root-level organizations with nested children"""
        root_units = OrganizationUnit.objects.filter(parent=None)
        serializer = OrganizationUnitSerializer(root_units, many=True)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete organization unit and all its children"""
        instance = self.get_object()
        unit_name = instance.name
        self.perform_destroy(instance)
        return Response(
            {"detail": f"Organization unit '{unit_name}' and all its children were deleted successfully."},
            status=status.HTTP_200_OK
        )


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users
    """
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    lookup_field = 'username'  # Use username instead of pk for lookups
    
    def get_queryset(self):
        """Return all users with their profiles"""
        return User.objects.select_related('profile').all()
    
    def list(self, request, *args, **kwargs):
        """List all users with profile data"""
        users = self.get_queryset()
        data = []
        
        for user in users:
            user_data = {
                'id': user.username,  # Use username as ID for frontend compatibility
                'userId': user.username,
                'firstName': user.first_name,
                'lastName': user.last_name,
                'email': user.email,
                'role': user.profile.role if hasattr(user, 'profile') else 'User',
                'jobTitle': user.profile.job_title if hasattr(user, 'profile') else '',
                'department': user.profile.department if hasattr(user, 'profile') else '',
                'organizationUnitId': user.profile.organization_unit_id if hasattr(user, 'profile') else None,
                'organizationPosition': user.profile.organization_position if hasattr(user, 'profile') else '',
                'status': user.profile.status if hasattr(user, 'profile') else 'Active',
            }
            data.append(user_data)
        
        return Response(data)
    
    def create(self, request, *args, **kwargs):
        """Create a new user with profile"""
        serializer = UserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Create audit log
        create_audit_log(
            request.user,
            'User Created',
            f'Created user {user.username} ({user.first_name} {user.last_name})',
            'Success',
            request
        )
        
        # Return user data in expected format
        response_data = {
            'id': user.username,
            'userId': user.username,
            'firstName': user.first_name,
            'lastName': user.last_name,
            'email': user.email,
            'role': user.profile.role,
            'jobTitle': user.profile.job_title,
            'department': user.profile.department,
            'organizationUnitId': user.profile.organization_unit_id,
            'organizationPosition': user.profile.organization_position,
            'status': user.profile.status,
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update user and profile"""
        instance = self.get_object()
        
        # Update user fields
        if 'first_name' in request.data:
            instance.first_name = request.data['first_name']
        if 'firstName' in request.data:
            instance.first_name = request.data['firstName']
        if 'last_name' in request.data:
            instance.last_name = request.data['last_name']
        if 'lastName' in request.data:
            instance.last_name = request.data['lastName']
        if 'email' in request.data:
            instance.email = request.data['email']
        
        # Handle password update
        if 'password' in request.data and request.data['password']:
            instance.set_password(request.data['password'])
        
        instance.save()
        
        # Update profile fields
        profile = instance.profile
        if 'role' in request.data:
            profile.role = request.data['role']
            # Update is_superuser and is_staff flags based on role
            if request.data['role'] == 'System Admin':
                instance.is_superuser = True
                instance.is_staff = True
            elif request.data['role'] == 'Admin':
                instance.is_staff = True
                instance.is_superuser = False
            else:  # User
                instance.is_staff = False
                instance.is_superuser = False
            instance.save()
        
        if 'jobTitle' in request.data:
            profile.job_title = request.data['jobTitle']
        if 'job_title' in request.data:
            profile.job_title = request.data['job_title']
        if 'department' in request.data:
            profile.department = request.data['department']
        if 'organizationUnitId' in request.data:
            profile.organization_unit_id = request.data['organizationUnitId']
        if 'organization_unit_id' in request.data:
            profile.organization_unit_id = request.data['organization_unit_id']
        if 'organizationPosition' in request.data:
            profile.organization_position = request.data['organizationPosition']
        if 'organization_position' in request.data:
            profile.organization_position = request.data['organization_position']
        if 'status' in request.data:
            profile.status = request.data['status']
        
        profile.save()
        
        # Create audit log
        create_audit_log(
            request.user,
            'User Updated',
            f'Updated user {instance.username}',
            'Success',
            request
        )
        
        return Response(UserSerializer(instance).data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete user"""
        instance = self.get_object()
        username = instance.username
        
        # Create audit log before deleting
        create_audit_log(
            request.user,
            'User Deleted',
            f'Deleted user {username}',
            'Success',
            request
        )
        
        self.perform_destroy(instance)
        return Response(
            {"detail": f"User '{username}' was deleted successfully."},
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['post'])
    def change_password(self, request, username=None, pk=None):
        """Change user password with current password verification"""
        # Use username (from lookup_field) or pk
        lookup_value = username or pk
        try:
            user = User.objects.get(username=lookup_value)
        except User.DoesNotExist:
            return Response(
                {"detail": f"User '{lookup_value}' not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get passwords from request
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        # Validate current password is provided
        if not current_password:
            return Response(
                {"detail": "Current password is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate new password is provided
        if not new_password:
            return Response(
                {"detail": "New password is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate confirm password is provided
        if not confirm_password:
            return Response(
                {"detail": "Confirm password is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if current password is correct
        if not user.check_password(current_password):
            return Response(
                {"detail": "Current password is incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if new passwords match
        if new_password != confirm_password:
            return Response(
                {"detail": "New passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        # Create audit log
        create_audit_log(
            request.user,
            'Password Changed',
            f'Password changed for user {user.username}',
            'Success',
            request
        )
        
        return Response(
            {"detail": "Password changed successfully."},
            status=status.HTTP_200_OK
        )


class AuditLogViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing audit logs
    """
    queryset = AuditLog.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = AuditLogSerializer
    http_method_names = ['get', 'post', 'head', 'options']  # Read and create only, no update/delete
    
    def list(self, request, *args, **kwargs):
        """List all audit logs, most recent first"""
        logs = AuditLog.objects.all()
        serializer = AuditLogSerializer(logs, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Create a new audit log entry"""
        # Get IP address from request
        ip_address = self.get_client_ip(request)
        
        data = request.data.copy()
        data['ip_address'] = ip_address
        
        serializer = AuditLogSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def get_client_ip(self, request):
        """Get the client's IP address from the request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing documents
    """
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer
    
    def get_queryset(self):
        """Return documents visible to the current user"""
        base_queryset = Document.objects.filter(
            is_deleted=False
        ).select_related('created_by')

        user = self.request.user
        profile = getattr(user, 'profile', None)
        is_admin = user.is_staff or user.is_superuser or (profile and profile.role == 'Admin')

        if is_admin:
            return base_queryset

        return base_queryset.filter(created_by=user)
    
    def list(self, request, *args, **kwargs):
        """List all documents"""
        documents = self.get_queryset()
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)
    
    def create(self, request, *args, **kwargs):
        """Create a new document"""
        print(f"Document create request data: {request.data}")
        print(f"User: {request.user}")
        serializer = DocumentSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            print(f"Validation errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        document = serializer.save()
        
        # Extract DOCX content if applicable
        if document.format == 'docx' and document.file_data:
            try:
                extracted_content = extract_docx_content(document.file_data)
                if extracted_content:
                    document.content = extracted_content
                    document.save()
            except Exception as e:
                print(f"Error extracting DOCX content: {e}")
                # Continue anyway, document is already saved
        
        # Create audit log
        create_audit_log(
            request.user,
            'Document Created',
            f'Created document "{document.title}"',
            'Success',
            request
        )
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update a document"""
        instance = self.get_object()
        
        # Store old shared_with list to detect new shares
        old_shared_with = instance.shared_with or []
        
        serializer = DocumentSerializer(instance, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        document = serializer.save()
        
        # Detect new shares and create notifications
        new_shared_with = document.shared_with or []
        newly_shared_users = [u for u in new_shared_with if u not in old_shared_with]
        
        for username in newly_shared_users:
            try:
                recipient_user = User.objects.get(username=username)
                # Check if notification already exists
                if not Notification.objects.filter(
                    user=recipient_user,
                    type='document_share',
                    document=document
                ).exists():
                    sender_name = f'{document.created_by.first_name} {document.created_by.last_name}' or document.created_by.username
                    Notification.objects.create(
                        user=recipient_user,
                        type='document_share',
                        title='New document shared with you',
                        message=f'{sender_name} shared "{document.title}" with you.',
                        document=document
                    )
            except User.DoesNotExist:
                continue
        
        # Extract DOCX content if file was updated
        if document.format == 'docx' and document.file_data:
            try:
                extracted_content = extract_docx_content(document.file_data)
                if extracted_content:
                    document.content = extracted_content
                    document.save()
            except Exception as e:
                print(f"Error extracting DOCX content: {e}")
                # Continue anyway, document is already saved
        
        # Create audit log
        create_audit_log(
            request.user,
            'Document Updated',
            f'Updated document "{document.title}"',
            'Success',
            request
        )
        
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete a document"""
        from django.utils import timezone
        instance = self.get_object()
        document_title = instance.title
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        instance.save()
        
        # Create audit log
        create_audit_log(
            request.user,
            'Document Deleted',
            f'Deleted document "{document_title}"',
            'Success',
            request
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore a soft-deleted document"""
        document = Document.objects.get(pk=pk)
        document.is_deleted = False
        document.save()
        serializer = DocumentSerializer(document)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def shared_with_me(self, request):
        """Get documents shared with the current user"""
        current_user_id = request.user.id
        # Get documents where current user is in shared_with list
        documents = Document.objects.filter(
            is_deleted=False,
            shared_with__contains=[current_user_id]
        ).exclude(created_by=request.user).select_related('created_by')
        
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def shared_by_me(self, request):
        """Get documents shared by the current user"""
        from django.db.models import Q
        documents = Document.objects.filter(
            is_deleted=False,
            created_by=request.user
        ).exclude(shared_with=[]).select_related('created_by')
        
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def deleted(self, request):
        """Get deleted documents for the current user"""
        documents = Document.objects.filter(
            is_deleted=True,
            created_by=request.user
        ).select_related('created_by')
        
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def permanent_delete(self, request, pk=None):
        """Permanently delete a document"""
        document = Document.objects.get(pk=pk)
        if document.created_by != request.user:
            return Response(
                {"detail": "You don't have permission to delete this document"},
                status=status.HTTP_403_FORBIDDEN
            )
        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['post'])
    def empty_trash(self, request):
        """Permanently delete all deleted documents for the current user"""
        deleted_docs = Document.objects.filter(
            is_deleted=True,
            created_by=request.user
        )
        deleted_docs.delete()
        return Response({"detail": f"Permanently deleted {deleted_docs.count()} documents"})


class OrganizationShareViewSet(viewsets.ModelViewSet):
    """ViewSet for organization-wide document shares"""
    serializer_class = OrganizationShareSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = OrganizationShare.objects.select_related('document', 'sent_by', 'sent_from')

        user = self.request.user
        profile = getattr(user, 'profile', None)
        is_admin = user.is_staff or user.is_superuser or (profile and profile.role == 'Admin')

        if is_admin:
            return queryset

        return queryset.filter(
            models.Q(sent_by=user) | models.Q(recipients__contains=[user.username])
        )

    def perform_create(self, serializer):
        """Create organization share and generate notifications for recipients"""
        org_share = serializer.save()
        
        # Create notifications for all recipients
        for recipient_username in org_share.recipients:
            try:
                recipient_user = User.objects.get(username=recipient_username)
                # Check if notification already exists to avoid duplicates
                if not Notification.objects.filter(
                    user=recipient_user,
                    type='organization_share',
                    organization_share=org_share
                ).exists():
                    Notification.objects.create(
                        user=recipient_user,
                        type='organization_share',
                        title=f'New document from {org_share.sent_from.name if org_share.sent_from else "Organization"}',
                        message=f'{org_share.sent_by.first_name} {org_share.sent_by.last_name} shared "{org_share.document.title}" with your organization.',
                        document=org_share.document,
                        organization_share=org_share
                    )
            except User.DoesNotExist:
                continue

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SystemSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet for system settings"""
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'setting_key'
    
    def get_queryset(self):
        """Filter by setting_key if provided"""
        queryset = super().get_queryset()
        setting_key = self.request.query_params.get('setting_key', None)
        if setting_key:
            queryset = queryset.filter(setting_key=setting_key)
        return queryset
    
    @action(detail=False, methods=['get', 'post'], permission_classes=[IsAuthenticated])
    def user_id_format(self, request):
        """Get or set user ID format configuration"""
        if request.method == 'GET':
            try:
                setting = SystemSettings.objects.get(setting_key='user_id_format')
                serializer = self.get_serializer(setting)
                return Response(serializer.data)
            except SystemSettings.DoesNotExist:
                # Return default format if not found
                default_format = {
                    'format': {
                        'prefix': 'TUPM',
                        'adminSeparator': '_',
                        'userSeparator': '-',
                        'segmentCount': 2,
                        'segmentLength': [2, 4],
                        'autoIncrement': True,
                        'customFormat': False
                    },
                    'customPattern': {
                        'admin': 'TUPM_XX_XXXX',
                        'user': 'TUPM-XX-XXXX'
                    },
                    'previewIds': {
                        'admin': 'TUPM_01_0001',
                        'user': 'TUPM-01-0001'
                    }
                }
                return Response({'setting_key': 'user_id_format', 'setting_value': default_format})
        
        elif request.method == 'POST':
            setting_value = request.data.get('setting_value')
            if not setting_value:
                return Response(
                    {'error': 'setting_value is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            setting, created = SystemSettings.objects.update_or_create(
                setting_key='user_id_format',
                defaults={'setting_value': setting_value}
            )
            
            serializer = self.get_serializer(setting)
            return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def active_sessions_view(request):
    """
    Return the count of active sessions based on valid refresh tokens
    """
    from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
    from django.utils import timezone
    from rest_framework_simplejwt.settings import api_settings
    
    try:
        # Get all outstanding tokens that haven't been blacklisted
        active_tokens = OutstandingToken.objects.filter(
            blacklistedtoken__isnull=True
        )
        
        # Filter tokens that haven't expired
        now = timezone.now()
        active_count = 0
        
        for token in active_tokens:
            # Check if token is still valid (not expired)
            if token.expires_at > now:
                active_count += 1
        
        return Response({'active_sessions': active_count})
    except Exception as e:
        # If token blacklist is not enabled, count based on users logged in recently
        # Consider users who have logged in within the last hour as active
        from datetime import timedelta
        one_hour_ago = timezone.now() - timedelta(hours=1)
        
        # Count users with recent login (this is a fallback method)
        active_users = User.objects.filter(
            last_login__gte=one_hour_ago
        ).count()
        
        return Response({'active_sessions': active_users})


class FolderViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user folders"""
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only folders owned by the current user"""
        return Folder.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        """Create folder owned by current user"""
        serializer.save(owner=self.request.user)
    
    def perform_destroy(self, instance):
        """Delete folder and update documents in that folder"""
        # Move documents from this folder back to root (set folder_id to None)
        Document.objects.filter(
            created_by=self.request.user,
            folder_id=str(instance.id)
        ).update(folder_id=None)
        super().perform_destroy(instance)

class TagViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user tags"""
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only tags owned by the current user"""
        return Tag.objects.filter(owner=self.request.user)
    
    def perform_create(self, serializer):
        """Create tag owned by current user"""
        serializer.save(owner=self.request.user)


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user notifications"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return notifications for the current user"""
        return Notification.objects.filter(user=self.request.user).select_related(
            'document', 'organization_share', 'organization_share__sent_by'
        )
    
    @action(detail=False, methods=['post'])
    def generate_notifications(self, request):
        """Generate notifications for document shares and deletion warnings"""
        user = request.user
        notifications_created = []
        
        # Check for organization shares
        org_shares = OrganizationShare.objects.filter(
            recipients__contains=[user.username]
        ).select_related('document', 'sent_by', 'sent_from')
        
        for share in org_shares:
            # Check if notification already exists
            if not Notification.objects.filter(
                user=user,
                type='organization_share',
                organization_share=share
            ).exists():
                notification = Notification.objects.create(
                    user=user,
                    type='organization_share',
                    title=f'New document from {share.sent_from.name if share.sent_from else "Organization"}',
                    message=f'{share.sent_by.first_name} {share.sent_by.last_name} shared "{share.document.title}" with your organization.',
                    document=share.document,
                    organization_share=share
                )
                notifications_created.append(notification)
        
        # Check for personal document shares
        shared_docs = Document.objects.filter(
            shared_with__contains=[user.username],
            is_deleted=False
        ).exclude(created_by=user)
        
        for doc in shared_docs:
            # Check if notification already exists
            if not Notification.objects.filter(
                user=user,
                type='document_share',
                document=doc
            ).exists():
                sender_name = f'{doc.created_by.first_name} {doc.created_by.last_name}' or doc.created_by.username
                notification = Notification.objects.create(
                    user=user,
                    type='document_share',
                    title='New document shared with you',
                    message=f'{sender_name} shared "{doc.title}" with you.',
                    document=doc
                )
                notifications_created.append(notification)
        
        # Check for documents near 30-day deletion
        threshold_date = timezone.now() - timedelta(days=23)  # Warn at day 23 (7 days before deletion)
        deletion_warning_docs = Document.objects.filter(
            created_by=user,
            is_deleted=True,
            deleted_at__lte=threshold_date,
            deleted_at__gte=timezone.now() - timedelta(days=29)  # Within last 29 days
        )
        
        for doc in deletion_warning_docs:
            # Check if notification already exists
            if not Notification.objects.filter(
                user=user,
                type='deletion_warning',
                document=doc
            ).exists():
                days_until_deletion = 30 - (timezone.now() - doc.deleted_at).days
                notification = Notification.objects.create(
                    user=user,
                    type='deletion_warning',
                    title='Document will be permanently deleted soon',
                    message=f'"{doc.title}" will be permanently deleted in {days_until_deletion} day(s). Restore it from Recycle Bin if needed.',
                    document=doc
                )
                notifications_created.append(notification)
        
        serializer = self.get_serializer(notifications_created, many=True)
        return Response({
            'count': len(notifications_created),
            'notifications': serializer.data
        })
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read for current user"""
        updated = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).update(is_read=True)
        return Response({'updated': updated})
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a specific notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).count()
        return Response({'count': count})