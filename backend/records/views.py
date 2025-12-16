from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from django.utils import timezone
from .models import (
    User, OrganizationUnit, CustomField, Folder,
    Document, DirectShare, OrganizationShare,
    AuditLog, SystemCustomization, UserIdFormat
)
from .serializers import (
    UserSerializer, OrganizationUnitSerializer, CustomFieldSerializer,
    FolderSerializer, DocumentSerializer, DirectShareSerializer,
    OrganizationShareSerializer, AuditLogSerializer,
    SystemCustomizationSerializer, UserIdFormatSerializer,
    LoginSerializer, PasswordChangeSerializer
)

# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        # Create audit log
        AuditLog.objects.create(
            user=user,
            user_info=f"{user.name} ({user.user_id})",
            action='User Login',
            resource=f"User {user.user_id} logged in",
            status='Success'
        )
        
        return Response({
            'token': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    # Create audit log
    AuditLog.objects.create(
        user=request.user,
        user_info=f"{request.user.name} ({request.user.user_id})",
        action='User Logout',
        resource=f"User {request.user.user_id} logged out",
        status='Success'
    )
    return Response({'message': 'Logged out successfully'})

# User ViewSet
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'user_id'
    
    def create(self, request):
        password = request.data.get('password')
        serializer = self.get_serializer(data=request.data, context={'password': password})
        if serializer.is_valid():
            user = serializer.save()
            
            # Create audit log
            AuditLog.objects.create(
                user=request.user,
                user_info=f"{request.user.name} ({request.user.user_id})",
                action='User Created',
                resource=f"{user.user_id} - {user.name}",
                status='Success'
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, user_id=None):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Create audit log
            AuditLog.objects.create(
                user=request.user,
                user_info=f"{request.user.name} ({request.user.user_id})",
                action='User Updated',
                resource=f"{user.user_id} - Personal info updated",
                status='Success'
            )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, user_id=None):
        user = self.get_object()
        user_info = f"{user.user_id} - {user.name}"
        user.delete()
        
        # Create audit log
        AuditLog.objects.create(
            user=request.user,
            user_info=f"{request.user.name} ({request.user.user_id})",
            action='User Deleted',
            resource=user_info,
            status='Success'
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def change_password(self, request, user_id=None):
        user = self.get_object()
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            new_password = serializer.validated_data['new_password']
            user.set_password(new_password)
            user.save()
            
            # Create audit log
            AuditLog.objects.create(
                user=request.user,
                user_info=f"{request.user.name} ({request.user.user_id})",
                action='Password Changed',
                resource=f"{user.user_id} - Password updated",
                status='Success'
            )
            
            return Response({'message': 'Password updated successfully'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Organization Unit ViewSet
class OrganizationUnitViewSet(viewsets.ModelViewSet):
    queryset = OrganizationUnit.objects.filter(parent__isnull=True)
    serializer_class = OrganizationUnitSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            org_unit = serializer.save()
            
            # Create audit log
            AuditLog.objects.create(
                user=request.user,
                user_info=f"{request.user.name} ({request.user.user_id})",
                action='Organization Created',
                resource=f"{org_unit.name} - {org_unit.type}",
                status='Success'
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, pk=None):
        org_unit = self.get_object()
        serializer = self.get_serializer(org_unit, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Create audit log
            AuditLog.objects.create(
                user=request.user,
                user_info=f"{request.user.name} ({request.user.user_id})",
                action='Organization Updated',
                resource=f"{org_unit.name} - {org_unit.type}",
                status='Success'
            )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, pk=None):
        org_unit = self.get_object()
        org_info = f"{org_unit.name} - {org_unit.type}"
        org_unit.delete()
        
        # Create audit log
        AuditLog.objects.create(
            user=request.user,
            user_info=f"{request.user.name} ({request.user.user_id})",
            action='Organization Deleted',
            resource=org_info,
            status='Success'
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)

# Custom Field ViewSet
class CustomFieldViewSet(viewsets.ModelViewSet):
    serializer_class = CustomFieldSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CustomField.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# Folder ViewSet
class FolderViewSet(viewsets.ModelViewSet):
    serializer_class = FolderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Folder.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

# Document ViewSet
class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # ✅ FIX: Don't filter by is_deleted here - let the specific endpoints handle it
        queryset = Document.objects.filter(user=self.request.user)
        folder_id = self.request.query_params.get('folder', None)
        if folder_id:
            queryset = queryset.filter(folder_id=folder_id)
        return queryset
    
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            document = serializer.save(user=request.user)
            
            # Create audit log
            AuditLog.objects.create(
                user=request.user,
                user_info=f"{request.user.name} ({request.user.user_id})",
                action='Document Created',
                resource=f"{document.title} ({document.format.upper()}) - ID: {document.id}",
                status='Success'
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, pk=None):
        document = self.get_object()
        serializer = self.get_serializer(document, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Create audit log
            AuditLog.objects.create(
                user=request.user,
                user_info=f"{request.user.name} ({request.user.user_id})",
                action='Document Updated',
                resource=f"{document.title} - ID: {document.id}",
                status='Success'
            )
            
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def move_to_recycle_bin(self, request, pk=None):
        document = self.get_object()
        document.is_deleted = True
        document.deleted_at = timezone.now()
        document.save()
        
        # Create audit log
        AuditLog.objects.create(
            user=request.user,
            user_info=f"{request.user.name} ({request.user.user_id})",
            action='Document Moved to Recycle Bin',
            resource=f"{document.title} - ID: {document.id}",
            status='Success'
        )
        
        return Response({'message': 'Document moved to recycle bin'})
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        # ✅ FIX: Get the document even if it's deleted
        try:
            document = Document.objects.get(pk=pk, user=request.user)
        except Document.DoesNotExist:
            return Response(
                {'error': 'Document not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if document is actually deleted
        if not document.is_deleted:
            return Response(
                {'error': 'Document is not in recycle bin'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Restore the document
        document.is_deleted = False
        document.deleted_at = None
        document.save()
        
        # Create audit log
        AuditLog.objects.create(
            user=request.user,
            user_info=f"{request.user.name} ({request.user.user_id})",
            action='Document Restored',
            resource=f"{document.title} - ID: {document.id}",
            status='Success'
        )
        
        return Response({
            'message': 'Document restored successfully',
            'document': DocumentSerializer(document).data
        })
    
    @action(detail=False, methods=['get'])
    def deleted(self, request):
        # ✅ FIX: Get only deleted documents
        queryset = Document.objects.filter(user=request.user, is_deleted=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def empty_recycle_bin(self, request):
        count = Document.objects.filter(user=request.user, is_deleted=True).count()
        Document.objects.filter(user=request.user, is_deleted=True).delete()
        
        # Create audit log
        AuditLog.objects.create(
            user=request.user,
            user_info=f"{request.user.name} ({request.user.user_id})",
            action='Recycle Bin Emptied',
            resource=f"{count} documents permanently deleted",
            status='Success'
        )
        
        return Response({'message': f'{count} documents permanently deleted'})

# Direct Share ViewSet
class DirectShareViewSet(viewsets.ModelViewSet):
    serializer_class = DirectShareSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return DirectShare.objects.filter(
            Q(shared_by=self.request.user) | Q(shared_with=self.request.user)
        ).distinct()
    
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            share = serializer.save()
            
            # Create audit log
            recipient_names = ', '.join([u.name for u in share.shared_with.all()])
            AuditLog.objects.create(
                user=request.user,
                user_info=f"{request.user.name} ({request.user.user_id})",
                action='Document Shared (Direct)',
                resource=f'"{share.document.title}" shared with {recipient_names} ({share.permission} access)',
                status='Success'
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Organization Share ViewSet
class OrganizationShareViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationShareSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return OrganizationShare.objects.filter(
            Q(sent_by=self.request.user) | Q(recipients=self.request.user)
        ).distinct()
    
    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            share = serializer.save()
            
            # Create audit log
            AuditLog.objects.create(
                user=request.user,
                user_info=f"{request.user.name} ({request.user.user_id})",
                action='Organization Distribution',
                resource=f'Document: "{share.document.title}" sent to {share.recipients.count()} recipients via {share.distribution_mode}',
                status='Success'
            )
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Audit Log ViewSet
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = AuditLog.objects.all()
        action = self.request.query_params.get('action', None)
        status_filter = self.request.query_params.get('status', None)
        
        if action:
            queryset = queryset.filter(action=action)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset

# System Customization ViewSet
class SystemCustomizationViewSet(viewsets.ModelViewSet):
    queryset = SystemCustomization.objects.all()
    serializer_class = SystemCustomizationSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get', 'post'])
    def current(self, request):
        if request.method == 'GET':
            customization, _ = SystemCustomization.objects.get_or_create(id=1)
            serializer = self.get_serializer(customization)
            return Response(serializer.data)
        else:
            customization, _ = SystemCustomization.objects.get_or_create(id=1)
            serializer = self.get_serializer(customization, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                
                # Create audit log
                AuditLog.objects.create(
                    user=request.user,
                    user_info=f"{request.user.name} ({request.user.user_id})",
                    action='System Customization Updated',
                    resource=f'System Name: {customization.system_name}, Colors updated',
                    status='Success'
                )
                
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# User ID Format ViewSet
class UserIdFormatViewSet(viewsets.ModelViewSet):
    queryset = UserIdFormat.objects.all()
    serializer_class = UserIdFormatSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get', 'post'])
    def current(self, request):
        if request.method == 'GET':
            format_config, _ = UserIdFormat.objects.get_or_create(id=1)
            serializer = self.get_serializer(format_config)
            return Response(serializer.data)
        else:
            format_config, _ = UserIdFormat.objects.get_or_create(id=1)
            serializer = self.get_serializer(format_config, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                
                # Create audit log
                AuditLog.objects.create(
                    user=request.user,
                    user_info=f"{request.user.name} ({request.user.user_id})",
                    action='User ID Format Updated',
                    resource=f'Format configuration updated',
                    status='Success'
                )
                
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)