from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.utils import timezone
from datetime import datetime
import uuid
from .models import Document, DocumentShare, OcrData, Folder, FolderShare, Category, DocumentCategory, DocumentArchive, FolderArchive
from .serializers import DocumentSerializer, DocumentShareSerializer, OcrDataSerializer, FolderSerializer, FolderShareSerializer, CategorySerializer
from .permissions import IsOrgMember, CanAccessFolder, CanAccessDocument, CanEditDocument, CanShareFolder, CanAccessDocumentShare
from monitoring.models import AuditLog
from authenticator.models import CustomUser
from monitoring.models import Notification


class FolderViewSet(viewsets.ModelViewSet):
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrgMember]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['folder_name']
    ordering_fields = ['created_at', 'folder_name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        user = self.request.user
        if not user.org:
            return Folder.objects.none()
        
        # Get folders owned by user's org OR folders shared with user's org
        from django.db.models import Q
        return Folder.objects.filter(
            Q(owning_org=user.org) |
            Q(org_shares__shared_with_org=user.org)
        ).filter(is_archived=False, is_deleted=False).distinct()
    
    def perform_create(self, serializer):
        serializer.save(
            user_index=self.request.user,
            owning_org=self.request.user.org,
            created_by_user=self.request.user
        )

    def perform_update(self, serializer):
        instance = self.get_object()
        if instance.owning_org_id != self.request.user.org_id:
            raise PermissionDenied('Only the owner organization can update this folder.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.owning_org_id != self.request.user.org_id:
            raise PermissionDenied('Only the owner organization can delete this folder.')
        now = timezone.now()
        instance.is_deleted = True
        instance.deleted_at = now
        instance.save(update_fields=['is_deleted', 'deleted_at'])

        # Soft-delete documents under this folder as part of folder recycle operation.
        instance.documents.filter(is_deleted=False).update(is_deleted=True, deleted_at=now)
    
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
                    audit_desc=f"Moved folder {folder_id} to recycle bin",
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

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def archive(self, request, pk=None):
        folder = self.get_object()
        if folder.owning_org_id != request.user.org_id:
            return Response({'detail': 'Only owner organization can archive this folder.'}, status=status.HTTP_403_FORBIDDEN)

        folder.is_archived = True
        folder.archived_at = timezone.now()
        folder.save(update_fields=['is_archived', 'archived_at'])

        folder.documents.filter(is_archived=False).update(is_archived=True, archived_at=timezone.now())
        return Response({'detail': 'Folder archived successfully.'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsOrgMember, CanAccessFolder])
    def documents(self, request, pk=None):
        """Get documents in a folder - filtered by org access"""
        folder = self.get_object()
        user = request.user
        
        # Check user's org access to the folder
        if not (folder.owning_org == user.org or 
                FolderShare.objects.filter(folder=folder, shared_with_org=user.org).exists()):
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Shared org members can list document metadata in shared folders.
        # Actual file opening is controlled at object level.
        documents = folder.documents.filter(is_archived=False, is_deleted=False)
        
        serializer = DocumentSerializer(documents, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def root_folders(self, request):
        """Get root folders (folders without parent)"""
        folders = self.get_queryset().filter(parent_folder__isnull=True)
        serializer = self.get_serializer(folders, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def deleted(self, request):
        user = request.user
        deleted_folders = Folder.objects.filter(owning_org=user.org, is_deleted=True).order_by('-deleted_at', '-updated_at')
        serializer = self.get_serializer(deleted_folders, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def restore(self, request, pk=None):
        folder = Folder.objects.filter(folder_id=pk).first()
        if folder is None:
            return Response({'detail': 'Folder not found.'}, status=status.HTTP_404_NOT_FOUND)

        if folder.owning_org_id != request.user.org_id:
            return Response({'detail': 'Only owner organization can restore this folder.'}, status=status.HTTP_403_FORBIDDEN)

        folder.is_deleted = False
        folder.deleted_at = None
        folder.save(update_fields=['is_deleted', 'deleted_at'])

        # Restore documents in this folder that were soft-deleted with folder lifecycle.
        folder.documents.filter(is_deleted=True).update(is_deleted=False, deleted_at=None)

        return Response({'detail': 'Folder restored successfully.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def permanent_delete(self, request, pk=None):
        folder = Folder.objects.filter(folder_id=pk).first()
        if folder is None:
            return Response({'detail': 'Folder not found.'}, status=status.HTTP_404_NOT_FOUND)

        if folder.owning_org_id != request.user.org_id:
            return Response({'detail': 'Only owner organization can permanently delete this folder.'}, status=status.HTTP_403_FORBIDDEN)

        if not folder.is_deleted:
            return Response({'detail': 'Only deleted folders can be permanently deleted.'}, status=status.HTTP_400_BAD_REQUEST)

        batch_id = str(uuid.uuid4())

        if not FolderArchive.objects.filter(source_folder_id=folder.folder_id).exists():
            FolderArchive.objects.create(
                archive_batch_id=batch_id,
                source_folder_id=folder.folder_id,
                owning_org=folder.owning_org,
                folder_name=folder.folder_name,
                deleted_at=folder.deleted_at,
                snapshot={
                    'folder_id': folder.folder_id,
                    'folder_name': folder.folder_name,
                    'folder_color': folder.folder_color,
                    'parent_folder_id': folder.parent_folder_id,
                    'owning_org_id': folder.owning_org_id,
                    'created_by_user_id': folder.created_by_user_id,
                    'deleted_at': folder.deleted_at.isoformat() if folder.deleted_at else None,
                    'created_at': folder.created_at.isoformat() if folder.created_at else None,
                    'updated_at': folder.updated_at.isoformat() if folder.updated_at else None,
                },
            )

        for doc in folder.documents.filter(is_deleted=True).iterator():
            if not DocumentArchive.objects.filter(source_doc_id=doc.doc_id).exists():
                DocumentArchive.objects.create(
                    archive_batch_id=batch_id,
                    source_doc_id=doc.doc_id,
                    owning_org=doc.owning_org,
                    doc_name=doc.doc_name,
                    doc_desc=doc.doc_desc,
                    doc_path=doc.doc_path,
                    doc_file_path=getattr(doc.doc_file, 'name', None),
                    deleted_at=doc.deleted_at,
                    snapshot={
                        'doc_id': doc.doc_id,
                        'doc_name': doc.doc_name,
                        'doc_desc': doc.doc_desc,
                        'doc_path': doc.doc_path,
                        'doc_file': getattr(doc.doc_file, 'name', None),
                        'owning_org_id': doc.owning_org_id,
                        'uploaded_by_user_id': doc.uploaded_by_user_id,
                        'folder_id': doc.folder_id,
                        'deleted_at': doc.deleted_at.isoformat() if doc.deleted_at else None,
                        'doc_uploaded': doc.doc_uploaded.isoformat() if doc.doc_uploaded else None,
                        'updated_at': doc.updated_at.isoformat() if doc.updated_at else None,
                    },
                )

        folder.delete()
        return Response({'detail': 'Folder permanently deleted.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsOrgMember, CanAccessFolder])
    def history(self, request, pk=None):
        folder = self.get_object()

        folder_shares = FolderShare.objects.filter(folder=folder).select_related('shared_by_org', 'shared_with_org').order_by('-created_at')
        events = []

        events.append({
            'type': 'folder_created',
            'timestamp': folder.created_at,
            'actor': getattr(folder.created_by_user, 'user_id', None),
            'details': {
                'folder_name': folder.folder_name,
                'owning_org': getattr(folder.owning_org, 'org_name', None),
            }
        })

        if folder.is_archived and folder.archived_at:
            events.append({
                'type': 'folder_archived',
                'timestamp': folder.archived_at,
                'actor': None,
                'details': {
                    'folder_name': folder.folder_name,
                }
            })

        for share in folder_shares:
            events.append({
                'type': 'folder_shared',
                'timestamp': share.created_at,
                'actor': getattr(share.shared_by_org, 'org_name', None),
                'details': {
                    'shared_with_org': getattr(share.shared_with_org, 'org_name', None),
                    'message': share.share_msg,
                }
            })

        events.sort(key=lambda item: item.get('timestamp') or timezone.make_aware(datetime.min), reverse=True)

        return Response({
            'folder': {
                'folder_id': folder.folder_id,
                'folder_name': folder.folder_name,
                'owning_org_id': folder.owning_org_id,
                'owning_org_name': getattr(folder.owning_org, 'org_name', None),
                'created_by_user_id': folder.created_by_user_id,
                'created_by_user_code': getattr(folder.created_by_user, 'user_id', None),
                'is_archived': folder.is_archived,
                'archived_at': folder.archived_at,
                'created_at': folder.created_at,
                'updated_at': folder.updated_at,
            },
            'events': events,
        })


class FolderShareViewSet(viewsets.ModelViewSet):
    serializer_class = FolderShareSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrgMember]
    
    def get_queryset(self):
        user = self.request.user
        if not user.org:
            return FolderShare.objects.none()
        
        # Users see shares where their org is the owner or recipient
        from django.db.models import Q
        return FolderShare.objects.filter(
            Q(shared_by_org=user.org) | 
            Q(shared_with_org=user.org)
        )
    
    def perform_create(self, serializer):
        folder = serializer.validated_data.get('folder')
        target_org = serializer.validated_data.get('shared_with_org')
        user_org = self.request.user.org

        if folder is None:
            raise PermissionDenied('Folder is required.')
        if folder.owning_org_id != user_org.org_id:
            raise PermissionDenied('Only the folder owner organization can share this folder.')
        if target_org and target_org.org_id == user_org.org_id:
            raise PermissionDenied('Use direct folder access for your own organization. Sharing to same org is not allowed.')

        serializer.save(shared_by_org=user_org)
    
    def create(self, request, *args, **kwargs):
        """Create folder share and log the action"""
        try:
            response = super().create(request, *args, **kwargs)

            # Notify recipients in the target organization about the new folder share.
            try:
                share_id = response.data.get('share_id')
                created_share = FolderShare.objects.select_related('folder', 'shared_with_org').get(share_id=share_id)
                recipients = CustomUser.objects.filter(org=created_share.shared_with_org, is_active=True)
                notif_msg = f"Folder '{created_share.folder.folder_name}' was shared with your organization"
                if created_share.share_msg:
                    notif_msg = f"{notif_msg}. Message: {created_share.share_msg}"
                for recipient in recipients:
                    Notification.objects.create(
                        recipient_user=recipient,
                        actor_user=request.user,
                        notif_msg=notif_msg,
                    )
            except Exception:
                # Notification delivery should not block the share operation.
                pass

            created_share = None
            try:
                share_id = response.data.get('share_id')
                created_share = FolderShare.objects.select_related('folder', 'shared_with_org').get(share_id=share_id)
            except Exception:
                created_share = None

            folder_name = getattr(getattr(created_share, 'folder', None), 'folder_name', 'Unknown Folder')
            target_org = getattr(getattr(created_share, 'shared_with_org', None), 'org_code', None) or getattr(getattr(created_share, 'shared_with_org', None), 'org_name', 'Unknown Organization')

            # Log successful folder share
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Share Folder',
                audit_desc=f"Shared folder '{folder_name}' to organization '{target_org}'",
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
            share_obj = self.get_object()
            if share_obj.shared_by_org_id != request.user.org_id:
                raise PermissionDenied('Only the owner organization can revoke this folder share.')

            folder_name = getattr(getattr(share_obj, 'folder', None), 'folder_name', 'Unknown Folder')
            target_org = getattr(getattr(share_obj, 'shared_with_org', None), 'org_code', None) or getattr(getattr(share_obj, 'shared_with_org', None), 'org_name', 'Unknown Organization')

            response = super().destroy(request, *args, **kwargs)
            # Log successful share removal
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Revoke Folder Share',
                audit_desc=f"Revoked folder share '{folder_name}' from organization '{target_org}'",
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
    permission_classes = [permissions.IsAuthenticated, IsOrgMember, CanAccessDocument]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['doc_name', 'doc_desc']
    ordering_fields = ['doc_uploaded', 'doc_name']
    ordering = ['-doc_uploaded']

    def _archive_document_record(self, document, batch_id=None):
        if DocumentArchive.objects.filter(source_doc_id=document.doc_id).exists():
            return

        DocumentArchive.objects.create(
            archive_batch_id=batch_id,
            source_doc_id=document.doc_id,
            owning_org=document.owning_org,
            doc_name=document.doc_name,
            doc_desc=document.doc_desc,
            doc_path=document.doc_path,
            doc_file_path=getattr(document.doc_file, 'name', None),
            deleted_at=document.deleted_at,
            snapshot={
                'doc_id': document.doc_id,
                'doc_name': document.doc_name,
                'doc_desc': document.doc_desc,
                'doc_path': document.doc_path,
                'doc_file': getattr(document.doc_file, 'name', None),
                'owning_org_id': document.owning_org_id,
                'uploaded_by_user_id': document.uploaded_by_user_id,
                'folder_id': document.folder_id,
                'deleted_at': document.deleted_at.isoformat() if document.deleted_at else None,
                'doc_uploaded': document.doc_uploaded.isoformat() if document.doc_uploaded else None,
                'updated_at': document.updated_at.isoformat() if document.updated_at else None,
            },
        )
    
    def get_queryset(self):
        user = self.request.user
        if not user.org:
            return Document.objects.none()
        
        from django.db.models import Q
        
        # Get documents owned by user's org
        docs_by_org = Document.objects.filter(owning_org=user.org)
        
        # Get documents in folders owned by user's org (all docs visible)
        docs_in_org_folders = Document.objects.filter(folder__owning_org=user.org)
        
        # Get all documents in folders shared with user's org (metadata listing).
        docs_in_shared_folders = Document.objects.filter(
            Q(folder__org_shares__shared_with_org=user.org)
        )
        
        # Combine all three querysets
        return (docs_by_org | docs_in_org_folders | docs_in_shared_folders).filter(is_archived=False, is_deleted=False).distinct()
    
    def perform_create(self, serializer):
        folder = serializer.validated_data.get('folder')
        user_org = self.request.user.org
        target_owning_org = user_org

        if folder is not None:
            has_folder_access = (
                folder.owning_org_id == user_org.org_id or
                FolderShare.objects.filter(folder=folder, shared_with_org=user_org).exists()
            )
            if not has_folder_access:
                raise PermissionDenied('You can only upload into folders owned by your org or shared to your org.')

            # In shared-folder collaboration, legal ownership follows the folder owner org.
            # Uploader identity is preserved via uploaded_by_user for traceability.
            if folder.owning_org_id != user_org.org_id:
                target_owning_org = folder.owning_org

        serializer.save(
            user_index=self.request.user,
            owning_org=target_owning_org,
            uploaded_by_user=self.request.user
        )
    
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
            document = self.get_object()
            doc_id = getattr(document, 'doc_id', self.kwargs.get('pk', 'unknown'))

            document.is_deleted = True
            document.deleted_at = timezone.now()
            document.save(update_fields=['is_deleted', 'deleted_at'])

            # Log successful document deletion (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Document',
                    audit_desc=f"Moved document {doc_id} to recycle bin",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return Response(status=status.HTTP_204_NO_CONTENT)
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

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def deleted(self, request):
        user = request.user
        if not user.org:
            return Response([])

        from django.db.models import Q

        deleted_docs = (
            Document.objects.filter(
                Q(owning_org=user.org) |
                Q(folder__owning_org=user.org) |
                Q(folder__org_shares__shared_with_org=user.org)
            )
            .filter(is_deleted=True)
            .distinct()
            .order_by('-deleted_at', '-updated_at')
        )

        serializer = DocumentSerializer(deleted_docs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def restore(self, request, pk=None):
        document = Document.objects.filter(doc_id=pk).first()
        if document is None:
            return Response({'detail': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)

        user_org_id = request.user.org_id
        if document.owning_org_id != user_org_id and (not document.folder or document.folder.owning_org_id != user_org_id):
            return Response({'detail': 'You do not have permission to restore this document.'}, status=status.HTTP_403_FORBIDDEN)

        document.is_deleted = False
        document.deleted_at = None
        document.save(update_fields=['is_deleted', 'deleted_at'])

        return Response({'detail': 'Document restored successfully.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def permanent_delete(self, request, pk=None):
        document = Document.objects.filter(doc_id=pk).first()
        if document is None:
            return Response({'detail': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)

        user_org_id = request.user.org_id
        if document.owning_org_id != user_org_id and (not document.folder or document.folder.owning_org_id != user_org_id):
            return Response({'detail': 'You do not have permission to permanently delete this document.'}, status=status.HTTP_403_FORBIDDEN)

        if not document.is_deleted:
            return Response({'detail': 'Only deleted documents can be permanently deleted.'}, status=status.HTTP_400_BAD_REQUEST)

        self._archive_document_record(document, batch_id=str(uuid.uuid4()))
        document.delete()
        return Response({'detail': 'Document permanently deleted.'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def empty_trash(self, request):
        user = request.user
        if not user.org:
            return Response({'deleted_count': 0}, status=status.HTTP_200_OK)

        deleted_queryset = Document.objects.filter(owning_org=user.org, is_deleted=True)
        deleted_count = deleted_queryset.count()
        batch_id = str(uuid.uuid4())

        for doc in deleted_queryset.iterator():
            self._archive_document_record(doc, batch_id=batch_id)

        deleted_queryset.delete()

        return Response({'deleted_count': deleted_count}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def archive(self, request, pk=None):
        document = self.get_object()
        user_org_id = request.user.org_id

        if document.owning_org_id != user_org_id and (not document.folder or document.folder.owning_org_id != user_org_id):
            return Response({'detail': 'You do not have permission to archive this document.'}, status=status.HTTP_403_FORBIDDEN)

        document.is_archived = True
        document.archived_at = timezone.now()
        document.save(update_fields=['is_archived', 'archived_at'])
        return Response({'detail': 'Document archived successfully.'}, status=status.HTTP_200_OK)
    
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
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_category(self, request, pk=None):
        """Add a category to a document"""
        document = self.get_object()
        category_id = request.data.get('category_id')
        
        if not category_id:
            return Response({'error': 'category_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            category = Category.objects.get(category_id=category_id, user_index=request.user)
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create DocumentCategory if it doesn't already exist
        doc_category, created = DocumentCategory.objects.get_or_create(
            doc=document,
            category=category
        )
        
        if created:
            # Log the action
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Add Category to Document',
                    audit_desc=f"Added category '{category.category_name}' to document '{document.doc_name}'",
                    audit_status='Success'
                )
            except:
                pass
            return Response({'message': 'Category added to document'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': 'Category already added to this document'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsOrgMember, CanAccessDocument])
    def history(self, request, pk=None):
        document = self.get_object()

        doc_shares = DocumentShare.objects.filter(doc=document).select_related('shared_by_user', 'shared_to_user').order_by('-share_timestamp')
        folder_shares = FolderShare.objects.filter(folder=document.folder).select_related('shared_by_org', 'shared_with_org').order_by('-created_at') if document.folder else []

        def user_code(user_obj):
            if not user_obj:
                return None
            return getattr(user_obj, 'user_id', None)

        events = []
        events.append({
            'type': 'document_uploaded',
            'timestamp': document.doc_uploaded,
            'actor': user_code(document.uploaded_by_user),
            'details': {
                'doc_name': document.doc_name,
                'owning_org': getattr(document.owning_org, 'org_name', None),
                'folder_name': getattr(document.folder, 'folder_name', None),
            }
        })

        if document.is_archived and document.archived_at:
            events.append({
                'type': 'document_archived',
                'timestamp': document.archived_at,
                'actor': None,
                'details': {
                    'doc_name': document.doc_name,
                }
            })

        for share in doc_shares:
            events.append({
                'type': 'document_shared_user',
                'timestamp': share.share_timestamp,
                'actor': user_code(share.shared_by_user),
                'details': {
                    'shared_to_user': user_code(share.shared_to_user),
                    'message': share.share_msg,
                }
            })

        for share in folder_shares:
            events.append({
                'type': 'folder_shared_org',
                'timestamp': share.created_at,
                'actor': getattr(share.shared_by_org, 'org_name', None),
                'details': {
                    'shared_with_org': getattr(share.shared_with_org, 'org_name', None),
                    'message': share.share_msg,
                    'folder_name': getattr(document.folder, 'folder_name', None),
                }
            })

        # Include related audit logs by document name as best-effort legacy trace.
        legacy_audits = AuditLog.objects.filter(audit_desc__icontains=document.doc_name).order_by('-audit_timestamp')[:50]
        for log in legacy_audits:
            events.append({
                'type': 'audit_log',
                'timestamp': log.audit_timestamp,
                'actor': getattr(log.user_index, 'user_id', None),
                'details': {
                    'action': log.audit_action,
                    'description': log.audit_desc,
                    'status': log.audit_status,
                }
            })

        events.sort(key=lambda item: item.get('timestamp') or timezone.make_aware(datetime.min), reverse=True)

        return Response({
            'document': {
                'doc_id': document.doc_id,
                'doc_name': document.doc_name,
                'owning_org_id': document.owning_org_id,
                'owning_org_name': getattr(document.owning_org, 'org_name', None),
                'uploaded_by_user_id': document.uploaded_by_user_id,
                'uploaded_by_user_code': user_code(document.uploaded_by_user),
                'folder_id': document.folder_id,
                'folder_name': getattr(document.folder, 'folder_name', None),
                'is_archived': document.is_archived,
                'archived_at': document.archived_at,
                'doc_uploaded': document.doc_uploaded,
                'updated_at': document.updated_at,
            },
            'events': events,
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_category(self, request, pk=None):
        """Remove a category from a document"""
        document = self.get_object()
        doc_category_id = request.data.get('doc_category_id')
        
        if not doc_category_id:
            return Response({'error': 'doc_category_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            doc_category = DocumentCategory.objects.get(doc_category_id=doc_category_id, doc=document)
        except DocumentCategory.DoesNotExist:
            return Response({'error': 'DocumentCategory not found'}, status=status.HTTP_404_NOT_FOUND)
        
        category_name = doc_category.category.category_name
        doc_category.delete()
        
        # Log the action
        try:
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Remove Category from Document',
                audit_desc=f"Removed category '{category_name}' from document '{document.doc_name}'",
                audit_status='Success'
            )
        except:
            pass
        
        return Response({'message': 'Category removed from document'}, status=status.HTTP_200_OK)


class DocumentShareViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentShareSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Org admins can audit all shares within their org scope.
        # Regular users see only shares they sent or received.
        user = self.request.user
        if getattr(user, 'role_type', None) == 'admin' and getattr(user, 'org_id', None) is not None:
            from django.db.models import Q
            return DocumentShare.objects.filter(
                Q(shared_by_user__org_id=user.org_id) |
                Q(shared_to_user__org_id=user.org_id)
            ).distinct()

        return DocumentShare.objects.filter(shared_by_user=user) | DocumentShare.objects.filter(shared_to_user=user)
    
    def perform_create(self, serializer):
        serializer.save(shared_by_user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create document share and log the action"""
        try:
            response = super().create(request, *args, **kwargs)

            # Notify the target user about the direct document share.
            try:
                share_id = response.data.get('share_id')
                created_share = DocumentShare.objects.select_related('doc', 'shared_to_user').get(share_id=share_id)
                notif_msg = f"Document '{created_share.doc.doc_name}' was shared with you"
                if created_share.share_msg:
                    notif_msg = f"{notif_msg}. Message: {created_share.share_msg}"
                Notification.objects.create(
                    recipient_user=created_share.shared_to_user,
                    actor_user=request.user,
                    doc=created_share.doc,
                    notif_msg=notif_msg,
                )
            except Exception:
                # Notification delivery should not block the share operation.
                pass

            created_share = None
            try:
                share_id = response.data.get('share_id')
                created_share = DocumentShare.objects.select_related('doc', 'shared_to_user').get(share_id=share_id)
            except Exception:
                created_share = None

            doc_name = getattr(getattr(created_share, 'doc', None), 'doc_name', 'Unknown Document')
            target_user = getattr(getattr(created_share, 'shared_to_user', None), 'user_id', 'Unknown User')

            # Log successful document share
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Share Document',
                audit_desc=f"Shared document '{doc_name}' to user '{target_user}'",
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
            share_obj = self.get_object()
            doc_name = getattr(getattr(share_obj, 'doc', None), 'doc_name', 'Unknown Document')
            target_user = getattr(getattr(share_obj, 'shared_to_user', None), 'user_id', 'Unknown User')

            response = super().destroy(request, *args, **kwargs)
            # Log successful share removal
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Revoke Document Share',
                audit_desc=f"Revoked document share '{doc_name}' from user '{target_user}'",
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
    permission_classes = [permissions.IsAuthenticated, IsOrgMember, CanAccessDocument]
    
    def get_queryset(self):
        user = self.request.user
        if not user.org:
            return OcrData.objects.none()
        
        from django.db.models import Q
        
        # OcrData for documents owned by user's org
        # (include all documents the user has access to based on CanAccessDocument permission)
        docs_owned_by_org = OcrData.objects.filter(doc__owning_org=user.org)
        docs_in_org_folders = OcrData.objects.filter(doc__folder__owning_org=user.org)
        docs_in_shared_folders = OcrData.objects.filter(
            Q(doc__folder__org_shares__shared_with_org=user.org) &
            Q(doc__owning_org=user.org)
        )
        
        return (docs_owned_by_org | docs_in_org_folders | docs_in_shared_folders).distinct()


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
            target_category = self.get_object()
            response = super().update(request, *args, **kwargs)
            # Log successful category update (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Update Category',
                    audit_desc=f"Updated category '{getattr(target_category, 'category_name', self.kwargs.get('pk', 'unknown'))}'",
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
            target_category = self.get_object()
            category_name = getattr(target_category, 'category_name', self.kwargs.get('pk', 'unknown'))
            response = super().destroy(request, *args, **kwargs)
            # Log successful category deletion (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Category',
                    audit_desc=f"Deleted category '{category_name}'",
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
