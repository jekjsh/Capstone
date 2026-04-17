from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.http import HttpResponse
from django.utils import timezone
from datetime import datetime
import uuid
from os.path import splitext
import zipfile
import xml.etree.ElementTree as ET
import io
from .models import Document, DocumentShare, OcrData, Folder, FolderShare, Category, DocumentCategory, DocumentArchive, FolderArchive
from .serializers import DocumentSerializer, DocumentShareSerializer, OcrDataSerializer, FolderSerializer, FolderShareSerializer, CategorySerializer
from .permissions import IsOrgMember, CanAccessFolder, CanAccessDocument, CanEditDocument, CanShareFolder, CanAccessDocumentShare
from monitoring.models import AuditLog
from authenticator.models import CustomUser
from monitoring.models import Notification
from .ocr_service import extract_text as extract_ocr_text


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
        parent_folder = serializer.validated_data.get('parent_folder')

        created_folder = serializer.save(
            user_index=self.request.user,
            owning_org=self.request.user.org,
            created_by_user=self.request.user
        )

        # Inherit shares from parent folder when creating a child under the same owner organization.
        if parent_folder and parent_folder.owning_org_id == self.request.user.org_id:
            parent_shares = FolderShare.objects.filter(folder=parent_folder)

            for parent_share in parent_shares:
                if not parent_share.shared_with_org_id:
                    continue

                FolderShare.objects.get_or_create(
                    folder=created_folder,
                    shared_with_org_id=parent_share.shared_with_org_id,
                    defaults={
                        'shared_by_org_id': parent_share.shared_by_org_id or self.request.user.org_id,
                        'share_msg': parent_share.share_msg,
                    },
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

    def _sanitize_zip_part(self, value, fallback):
        cleaned = ''.join(ch if ch.isalnum() or ch in (' ', '-', '_', '.') else '_' for ch in str(value or '').strip())
        cleaned = cleaned.strip().strip('.')
        return cleaned or fallback

    def _can_open_document_for_user(self, doc, user):
        owner_user_index = doc.uploaded_by_user_id or doc.user_index_id
        user_index = getattr(user, 'user_index', None)
        user_org_id = getattr(user, 'org_id', None)
        user_role = getattr(user, 'role_type', '') or ''

        if owner_user_index and owner_user_index == user_index:
            return True

        if user_role == 'admin' and user_org_id is not None and getattr(doc, 'owning_org_id', None) == user_org_id:
            return True

        if not owner_user_index and getattr(doc, 'owning_org_id', None) == user_org_id:
            return True

        if DocumentShare.objects.filter(doc=doc, shared_to_user=user).exists():
            return True

        return False

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsOrgMember, CanAccessFolder], url_path='download-zip')
    def download_zip(self, request, pk=None):
        root_folder = self.get_object()
        user = request.user

        def can_access_folder(folder_obj):
            return (
                folder_obj.owning_org_id == user.org_id or
                FolderShare.objects.filter(folder=folder_obj, shared_with_org=user.org).exists()
            )

        zip_buffer = io.BytesIO()
        used_paths = set()
        added_files = 0
        root_name = self._sanitize_zip_part(root_folder.folder_name, f'folder_{root_folder.folder_id}')

        def unique_path(path):
            if path not in used_paths:
                used_paths.add(path)
                return path

            base, ext = splitext(path)
            counter = 1
            while True:
                candidate = f"{base}({counter}){ext}"
                if candidate not in used_paths:
                    used_paths.add(candidate)
                    return candidate
                counter += 1

        def add_folder_contents(folder_obj, relative_base):
            nonlocal added_files

            docs = folder_obj.documents.filter(is_archived=False, is_deleted=False).order_by('doc_name')
            for doc in docs:
                if not self._can_open_document_for_user(doc, user):
                    continue

                if not doc.doc_file:
                    continue

                file_name = self._sanitize_zip_part(doc.doc_name, f'document_{doc.doc_id}')
                archive_path = unique_path(f"{relative_base}/{file_name}")

                try:
                    doc.doc_file.open('rb')
                    file_bytes = doc.doc_file.read()
                    if file_bytes is not None:
                        archive.writestr(archive_path, file_bytes)
                        added_files += 1
                except Exception:
                    continue
                finally:
                    try:
                        doc.doc_file.close()
                    except Exception:
                        pass

            subfolders = folder_obj.subfolders.filter(is_archived=False, is_deleted=False).order_by('folder_name')
            for subfolder in subfolders:
                if not can_access_folder(subfolder):
                    continue
                next_base = f"{relative_base}/{self._sanitize_zip_part(subfolder.folder_name, f'folder_{subfolder.folder_id}') }"
                add_folder_contents(subfolder, next_base)

        with zipfile.ZipFile(zip_buffer, mode='w', compression=zipfile.ZIP_DEFLATED) as archive:
            add_folder_contents(root_folder, root_name)

            if added_files == 0:
                archive.writestr(f"{root_name}/README.txt", 'No downloadable files are available in this folder for your account.')

        zip_buffer.seek(0)
        filename = self._sanitize_zip_part(root_folder.folder_name, f'folder_{root_folder.folder_id}') + '.zip'
        response = HttpResponse(zip_buffer.getvalue(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
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

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def set_category(self, request, pk=None):
        folder = self.get_object()

        if folder.owning_org_id != request.user.org_id:
            return Response({'detail': 'Only owner organization can update folder category.'}, status=status.HTTP_403_FORBIDDEN)

        category_id = request.data.get('category_id')
        if not category_id:
            return Response({'error': 'category_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            category = Category.objects.get(category_id=category_id, user_index=request.user)
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

        folder.folder_category = category
        folder.save(update_fields=['folder_category', 'updated_at'])

        try:
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Set Folder Category',
                audit_desc=f"Set category '{category.category_name}' on folder '{folder.folder_name}'",
                audit_status='Success'
            )
        except Exception:
            pass

        return Response({'message': 'Folder category updated successfully.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def remove_category(self, request, pk=None):
        folder = self.get_object()

        if folder.owning_org_id != request.user.org_id:
            return Response({'detail': 'Only owner organization can update folder category.'}, status=status.HTTP_403_FORBIDDEN)

        previous_name = getattr(folder.folder_category, 'category_name', None)
        folder.folder_category = None
        folder.save(update_fields=['folder_category', 'updated_at'])

        try:
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Remove Folder Category',
                audit_desc=f"Removed category '{previous_name or 'None'}' from folder '{folder.folder_name}'",
                audit_status='Success'
            )
        except Exception:
            pass

        return Response({'message': 'Folder category removed successfully.'}, status=status.HTTP_200_OK)
    
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

    def _build_unique_doc_name(self, requested_name, folder, owning_org):
        """Return a non-conflicting document name like file(1).ext when needed."""
        candidate_name = (requested_name or '').strip()
        if not candidate_name:
            candidate_name = 'Untitled'

        existing_names = set(
            Document.objects.filter(
                owning_org=owning_org,
                folder=folder,
                is_archived=False,
                is_deleted=False,
            ).values_list('doc_name', flat=True)
        )

        if candidate_name not in existing_names:
            return candidate_name

        name_root, extension = splitext(candidate_name)
        counter = 1

        while True:
            numbered_name = f"{name_root}({counter}){extension}"
            if numbered_name not in existing_names:
                return numbered_name
            counter += 1

    def _parse_bool(self, value):
        if isinstance(value, bool):
            return value
        if value is None:
            return False
        return str(value).strip().lower() in {'1', 'true', 'yes', 'on'}

    def _is_ocr_supported_file(self, file_name):
        name = (file_name or '').lower()
        return any(name.endswith(ext) for ext in ['.pdf', '.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp', '.tif', '.tiff'])

    def _score_category_match(self, category_name, category_desc, text_blob):
        if (not category_name and not category_desc) or not text_blob:
            return 0

        category_name = (category_name or '').lower().strip()
        category_desc = (category_desc or '').lower().strip()
        text_blob = text_blob.lower()
        if not category_name and not category_desc:
            return 0

        category_text = f"{category_name} {category_desc}".strip()
        if not category_text:
            return 0

        score = 0
        if category_name and category_name in text_blob:
            score += len(category_name) + 5
        if category_desc and category_desc in text_blob:
            score += len(category_desc) + 3

        for word in category_text.split():
            if len(word) >= 3 and word in text_blob:
                score += len(word)

        return score

    def _extract_text_from_office_like_file(self, document):
        if not document.doc_file:
            return ''

        file_name = getattr(document.doc_file, 'name', '').lower()

        try:
            document.doc_file.open('rb')
            raw_bytes = document.doc_file.read() or b''
        except Exception:
            return ''
        finally:
            try:
                document.doc_file.close()
            except Exception:
                pass

        if not raw_bytes:
            return ''

        if file_name.endswith('.txt'):
            try:
                return raw_bytes.decode('utf-8', errors='ignore')
            except Exception:
                return ''

        if file_name.endswith('.docx') or file_name.endswith('.xlsx'):
            try:
                with zipfile.ZipFile(io.BytesIO(raw_bytes)) as zf:
                    extracted = []
                    if file_name.endswith('.docx'):
                        xml_names = [name for name in zf.namelist() if name.startswith('word/') and name.endswith('.xml')]
                    else:
                        xml_names = [name for name in zf.namelist() if name.startswith('xl/') and name.endswith('.xml')]

                    for xml_name in xml_names:
                        try:
                            root = ET.fromstring(zf.read(xml_name))
                            for elem in root.iter():
                                if elem.text and elem.text.strip():
                                    extracted.append(elem.text.strip())
                        except Exception:
                            continue

                return ' '.join(extracted)
            except Exception:
                return ''

        return ''

    def _pick_best_category(self, owning_org_id, text_blob):
        if not text_blob:
            return None

        categories = Category.objects.filter(org_id=owning_org_id, is_active=True)
        best_category = None
        best_score = 0

        for category in categories:
            score = self._score_category_match(category.category_name, category.category_desc, text_blob)
            if score > best_score:
                best_score = score
                best_category = category

        return best_category if best_score > 0 else None

    def _run_auto_categorization(self, document):
        request = self.request
        if not self._parse_bool(request.data.get('auto_categorize')):
            return

        source_text = f"{document.doc_name or ''} {document.doc_desc or ''}".strip()

        office_text = self._extract_text_from_office_like_file(document)
        if office_text:
            source_text = f"{source_text} {office_text}".strip()

        if document.doc_file and self._is_ocr_supported_file(getattr(document.doc_file, 'name', '')):
            try:
                document.doc_file.open('rb')
                ocr_result = extract_ocr_text(document.doc_file.file, engine='tesseract', mode='fast', lang='eng')
                ocr_text = (ocr_result or {}).get('text', '') or ''
                if ocr_text.strip():
                    OcrData.objects.update_or_create(
                        doc=document,
                        defaults={'ocr_extract': ocr_text}
                    )
                    source_text = f"{source_text} {ocr_text}".strip()
            except Exception:
                # OCR failures should never block upload.
                pass
            finally:
                try:
                    document.doc_file.close()
                except Exception:
                    pass

        matched_category = self._pick_best_category(document.owning_org_id, source_text)
        if not matched_category:
            return

        DocumentCategory.objects.get_or_create(doc=document, category=matched_category)
    
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

        # Get documents directly shared to this user.
        docs_shared_directly = Document.objects.filter(
            Q(documentshare__shared_to_user=user)
        )
        
        # Combine all visibility scopes.
        return (docs_by_org | docs_in_org_folders | docs_in_shared_folders | docs_shared_directly).filter(is_archived=False, is_deleted=False).distinct()
    
    def perform_create(self, serializer):
        folder = serializer.validated_data.get('folder')
        user_org = self.request.user.org
        target_owning_org = user_org
        requested_doc_name = serializer.validated_data.get('doc_name')

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

        document = serializer.save(
            user_index=self.request.user,
            owning_org=target_owning_org,
            uploaded_by_user=self.request.user,
            doc_name=self._build_unique_doc_name(requested_doc_name, folder, target_owning_org),
        )

        self._run_auto_categorization(document)

    def perform_update(self, serializer):
        instance = self.get_object()
        user_org = self.request.user.org
        target_folder = serializer.validated_data.get('folder', instance.folder)

        if 'folder' in serializer.validated_data:
            if instance.owning_org_id != user_org.org_id:
                raise PermissionDenied('You can only move documents owned by your organization.')

            if target_folder is not None:
                has_folder_access = (
                    target_folder.owning_org_id == user_org.org_id or
                    FolderShare.objects.filter(folder=target_folder, shared_with_org=user_org).exists()
                )
                if not has_folder_access:
                    raise PermissionDenied('You can only move documents to folders owned by your org or shared to your org.')

        target_owning_org = user_org
        if target_folder is not None and target_folder.owning_org_id != user_org.org_id:
            target_owning_org = target_folder.owning_org

        requested_doc_name = serializer.validated_data.get('doc_name', instance.doc_name)

        serializer.save(
            owning_org=target_owning_org,
            doc_name=self._build_unique_doc_name(requested_doc_name, target_folder, target_owning_org),
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

            if document.owning_org_id != request.user.org_id:
                return Response(
                    {'detail': 'Only the owner organization can delete this document.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

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
            doc_id = request.data.get('doc')
            shared_to_user_id = request.data.get('shared_to_user')

            if not doc_id or not shared_to_user_id:
                return Response({'detail': 'doc and shared_to_user are required.'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                document = Document.objects.get(pk=doc_id)
            except Document.DoesNotExist:
                return Response({'detail': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)

            if str(getattr(document, 'owning_org_id', '')) != str(getattr(request.user, 'org_id', '')):
                raise PermissionDenied('You can only share documents owned by your organization.')

            owner_user_id = getattr(document, 'uploaded_by_user_id', None) or getattr(document, 'user_index_id', None)
            if str(owner_user_id) != str(request.user.pk):
                raise PermissionDenied('Only the document owner can share this file.')

            existing_share = DocumentShare.objects.filter(
                doc=document,
                shared_to_user_id=shared_to_user_id,
            ).first()
            if existing_share is not None:
                serializer = self.get_serializer(existing_share)
                return Response(serializer.data, status=status.HTTP_200_OK)

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
            if str(share_obj.shared_by_user_id) != str(request.user.pk):
                raise PermissionDenied('Only the original sharer can revoke this document share.')

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

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgMember], url_path='extract-text')
    def extract_text(self, request):
        uploaded_file = request.FILES.get('file')
        if uploaded_file is None:
            return Response({'detail': 'No file uploaded. Use field name "file".'}, status=status.HTTP_400_BAD_REQUEST)

        engine = (request.data.get('engine') or 'tesseract').strip().lower()
        mode = (request.data.get('mode') or 'fast').strip().lower()
        lang = (request.data.get('lang') or 'eng').strip() or 'eng'

        try:
            result = extract_ocr_text(uploaded_file, engine=engine, mode=mode, lang=lang)
            return Response(result, status=status.HTTP_200_OK)
        except RuntimeError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response({'detail': f'OCR extraction failed: {str(exc)}'}, status=status.HTTP_400_BAD_REQUEST)


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
