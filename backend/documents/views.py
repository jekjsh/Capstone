from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Document, DocumentShare, OcrData, Folder, FolderShare, Category
from .serializers import DocumentSerializer, DocumentShareSerializer, OcrDataSerializer, FolderSerializer, FolderShareSerializer, CategorySerializer
from monitoring.models import AuditLog


class FolderViewSet(viewsets.ModelViewSet):
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['folder_name']
    ordering_fields = ['created_at', 'folder_name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Users see only their own folders
        return Folder.objects.filter(user_index=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user_index=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create folder and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            # Log successful folder creation (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Create Folder',
                    audit_desc=f"Created folder {response.data.get('folder_name', 'unknown')}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed folder creation (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Create Folder',
                    audit_desc=f"Failed to create folder: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
    
    def update(self, request, *args, **kwargs):
        """Update folder and log the action"""
        try:
            response = super().update(request, *args, **kwargs)
            # Log successful folder update (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Update Folder',
                    audit_desc=f"Updated folder {self.kwargs.get('pk', 'unknown')}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed folder update (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Update Folder',
                    audit_desc=f"Failed to update folder: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Delete folder and log the action"""
        try:
            folder_id = self.kwargs.get('pk', 'unknown')
            response = super().destroy(request, *args, **kwargs)
            # Log successful folder deletion (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Folder',
                    audit_desc=f"Deleted folder {folder_id}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed folder deletion (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Folder',
                    audit_desc=f"Failed to delete folder: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def documents(self, request, pk=None):
        """Get all documents in a folder"""
        folder = self.get_object()
        documents = folder.documents.all()
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def root_folders(self, request):
        """Get root folders (folders without parent)"""
        folders = self.get_queryset().filter(parent_folder__isnull=True)
        serializer = self.get_serializer(folders, many=True)
        return Response(serializer.data)


class FolderShareViewSet(viewsets.ModelViewSet):
    serializer_class = FolderShareSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users see shares they sent or received
        user = self.request.user
        return FolderShare.objects.filter(shared_by_user=user) | FolderShare.objects.filter(shared_to_user=user)
    
    def perform_create(self, serializer):
        serializer.save(shared_by_user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create folder share and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            # Log successful folder share
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Share Folder',
                audit_desc=f"Shared folder with user",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed folder share
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Share Folder',
                audit_desc=f"Failed to share folder: {str(e)}",
                audit_status='Failed'
            )
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Delete folder share and log the action"""
        try:
            response = super().destroy(request, *args, **kwargs)
            # Log successful share removal
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Revoke Folder Share',
                audit_desc=f"Revoked folder share",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed share removal
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Revoke Folder Share',
                audit_desc=f"Failed to revoke folder share: {str(e)}",
                audit_status='Failed'
            )
            raise


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['doc_name', 'doc_desc']
    ordering_fields = ['doc_uploaded', 'doc_name']
    ordering = ['-doc_uploaded']
    
    def get_queryset(self):
        user = self.request.user
        # Admins see all documents in their organization
        if hasattr(user, 'role_type') and user.role_type == 'admin':
            return Document.objects.filter(user_index__org=user.org)
        # Regular users see only their own documents
        return Document.objects.filter(user_index=user)
    
    def perform_create(self, serializer):
        serializer.save(user_index=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create document and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            # Log successful document creation (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Upload Document',
                    audit_desc=f"Uploaded document {response.data.get('doc_name', 'unknown')}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                # Don't fail the upload if audit logging fails
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed document creation (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Upload Document',
                    audit_desc=f"Failed to upload document: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
    
    def update(self, request, *args, **kwargs):
        """Update document and log the action"""
        try:
            response = super().update(request, *args, **kwargs)
            # Log successful document update (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Update Document',
                    audit_desc=f"Updated document {self.kwargs.get('pk', 'unknown')}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed document update (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Update Document',
                    audit_desc=f"Failed to update document: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Delete document and log the action"""
        try:
            doc_id = self.kwargs.get('pk', 'unknown')
            response = super().destroy(request, *args, **kwargs)
            # Log successful document deletion (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Document',
                    audit_desc=f"Deleted document {doc_id}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed document deletion (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Document',
                    audit_desc=f"Failed to delete document: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def ocr_data(self, request, pk=None):
        """Get OCR data for a document"""
        document = self.get_object()
        try:
            ocr = OcrData.objects.get(doc=document)
            serializer = OcrDataSerializer(ocr)
            return Response(serializer.data)
        except OcrData.DoesNotExist:
            return Response({'error': 'OCR data not found'}, status=status.HTTP_404_NOT_FOUND)


class DocumentShareViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentShareSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users see shares they sent or received
        user = self.request.user
        return DocumentShare.objects.filter(shared_by_user=user) | DocumentShare.objects.filter(shared_to_user=user)
    
    def perform_create(self, serializer):
        serializer.save(shared_by_user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create document share and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            # Log successful document share
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Share Document',
                audit_desc=f"Shared document with user",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed document share
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Share Document',
                audit_desc=f"Failed to share document: {str(e)}",
                audit_status='Failed'
            )
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Delete document share and log the action"""
        try:
            response = super().destroy(request, *args, **kwargs)
            # Log successful share removal
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Revoke Document Share',
                audit_desc=f"Revoked document share",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed share removal
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Revoke Document Share',
                audit_desc=f"Failed to revoke document share: {str(e)}",
                audit_status='Failed'
            )
            raise


class OcrDataViewSet(viewsets.ModelViewSet):
    serializer_class = OcrDataSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users see OCR for their own documents
        return OcrData.objects.filter(doc__user_index=self.request.user)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['category_name']
    ordering_fields = ['created_at', 'category_name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Users see only categories in their organization
        user_org = self.request.user.org
        if user_org:
            return Category.objects.filter(org=user_org)
        # If user has no organization, return empty queryset (no access to categories)
        return Category.objects.none()
    
    def perform_create(self, serializer):
        # Automatically set organization and user when creating a category
        serializer.save(user_index=self.request.user, org=self.request.user.org)
    
    def create(self, request, *args, **kwargs):
        """Create category and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            # Log successful category creation (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Create Category',
                    audit_desc=f"Created category {response.data.get('category_name', 'unknown')}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed category creation (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Create Category',
                    audit_desc=f"Failed to create category: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
    
    def update(self, request, *args, **kwargs):
        """Update category and log the action"""
        try:
            response = super().update(request, *args, **kwargs)
            # Log successful category update (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Update Category',
                    audit_desc=f"Updated category {self.kwargs.get('pk', 'unknown')}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed category update (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Update Category',
                    audit_desc=f"Failed to update category: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Delete category and log the action"""
        try:
            category_id = self.kwargs.get('pk', 'unknown')
            response = super().destroy(request, *args, **kwargs)
            # Log successful category deletion (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Category',
                    audit_desc=f"Deleted category {category_id}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed category deletion (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Category',
                    audit_desc=f"Failed to delete category: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
