from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django.http import HttpResponse, FileResponse
from django.utils import timezone
from datetime import datetime
import uuid
from os.path import splitext
import zipfile
import xml.etree.ElementTree as ET
import io
from .models import Document, DocumentShare, OcrData, Folder, FolderShare, Category, DocumentCategory, DocumentArchive, FolderArchive, DocumentApprovalRequest
from .serializers import DocumentSerializer, DocumentShareSerializer, OcrDataSerializer, FolderSerializer, FolderShareSerializer, CategorySerializer, DocumentApprovalRequestSerializer
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
        if not self._can_manage_deletions(self.request.user, folder=instance):
            raise PermissionDenied('Only the folder owner or an admin can delete this folder.')

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

    def _can_manage_deletions(self, user, folder=None):
        role = getattr(user, 'role_type', None)
        if bool(user and (getattr(user, 'is_superuser', False) or role in {'admin', 'system_admin'})):
            return True

        if folder is None:
            return False

        owner_user_index = getattr(folder, 'created_by_user_id', None) or getattr(folder, 'user_index_id', None)
        return str(owner_user_index or '') == str(getattr(user, 'pk', '') or '')

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

        try:
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Download Folder ZIP',
                audit_desc=f"Downloaded folder ZIP '{root_folder.folder_name}' (folder_id={root_folder.folder_id}, files={added_files})",
                audit_status='Success'
            )
        except Exception:
            pass

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

        if not self._can_manage_deletions(request.user, folder=folder):
            return Response({'detail': 'Only the folder owner or an admin can restore this folder.'}, status=status.HTTP_403_FORBIDDEN)

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

        if not self._can_manage_deletions(request.user, folder=folder):
            return Response({'detail': 'Only the folder owner or an admin can permanently delete this folder.'}, status=status.HTTP_403_FORBIDDEN)

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

    def _can_download_document_for_user(self, document, user):
        owner_user_index = document.uploaded_by_user_id or document.user_index_id
        user_index = getattr(user, 'user_index', None)
        user_org_id = getattr(user, 'org_id', None)
        user_role = getattr(user, 'role_type', '') or ''

        if owner_user_index and owner_user_index == user_index:
            return True

        if user_role == 'admin' and user_org_id is not None and getattr(document, 'owning_org_id', None) == user_org_id:
            return True

        if not owner_user_index and user_role == 'admin' and getattr(document, 'owning_org_id', None) == user_org_id:
            return True

        if DocumentShare.objects.filter(doc=document, shared_to_user=user).exists():
            return True

        return False

    def _can_manage_deletions(self, user, document=None):
        role = getattr(user, 'role_type', None)
        if bool(user and (getattr(user, 'is_superuser', False) or role in {'admin', 'system_admin'})):
            return True

        if document is None:
            return False

        owner_user_index = getattr(document, 'uploaded_by_user_id', None) or getattr(document, 'user_index_id', None)
        return str(owner_user_index or '') == str(getattr(user, 'pk', '') or '')
    
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
        override_existing = self._parse_bool(self.request.data.get('override_existing', False))
        was_renamed = self._parse_bool(self.request.data.get('was_renamed', False))

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

        # Check if document with same name exists and handle override
        existing_doc = Document.objects.filter(
            owning_org=target_owning_org,
            folder=folder,
            doc_name=requested_doc_name,
            is_deleted=False,
            is_archived=False
        ).first()

        upload_action = 'Upload Document'
        if override_existing and existing_doc:
            # Delete the existing document
            existing_doc.is_deleted = True
            existing_doc.deleted_at = timezone.now()
            existing_doc.save(update_fields=['is_deleted', 'deleted_at'])
            upload_action = 'Upload Document (Override)'
        elif was_renamed:
            # File was renamed to avoid conflict
            upload_action = 'Upload Document (Renamed)'

        # Determine final document name
        final_doc_name = self._build_unique_doc_name(requested_doc_name, folder, target_owning_org)

        document = serializer.save(
            user_index=self.request.user,
            owning_org=target_owning_org,
            uploaded_by_user=self.request.user,
            doc_name=final_doc_name,
        )

        # Store the action type for logging in the create method
        self.request._upload_action = upload_action

        self._run_auto_categorization(document)

    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsOrgMember], url_path='download-file')
    def download_file(self, request, pk=None):
        document = self.get_object()

        if not self._can_download_document_for_user(document, request.user):
            raise PermissionDenied('You do not have permission to download this document.')

        if not document.doc_file:
            return Response({'detail': 'Document file is not available.'}, status=status.HTTP_404_NOT_FOUND)

        download_name = document.doc_name or getattr(document.doc_file, 'name', f'document_{document.doc_id}')

        try:
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Download Document',
                audit_desc=f"Downloaded document '{document.doc_name}' (doc_id={document.doc_id})",
                audit_status='Success'
            )
        except Exception:
            pass

        document.doc_file.open('rb')
        return FileResponse(document.doc_file, as_attachment=True, filename=download_name)

    @action(detail=True, methods=['get'], permission_classes=[], url_path='view-file')
    def view_file(self, request, pk=None):
        """Serve document file for inline viewing (not as attachment)
        Supports token authentication via query parameter for iframe usage.
        """
        from rest_framework_simplejwt.tokens import AccessToken
        
        # Try to authenticate from Authorization header first
        user = request.user
        
        # If not authenticated via header, try query parameter (for iframe requests)
        if not user or not user.is_authenticated:
            token = request.query_params.get('token')
            if token:
                try:
                    access_token = AccessToken(token)
                    user_id = access_token['user_id']  # This is the user_id field (CharField)
                    from authenticator.models import CustomUser
                    user = CustomUser.objects.get(user_id=user_id)
                    # Manually set user on request for permission checks
                    request.user = user
                except Exception as e:
                    return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_401_UNAUTHORIZED)
            else:
                return Response({'detail': 'Authentication credentials were not provided.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check org membership
        if not hasattr(user, 'org') or not user.org:
            return Response({'detail': 'User is not part of an organization.'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            document = self.get_object()
        except Exception:
            return Response({'detail': 'Document not found.'}, status=status.HTTP_404_NOT_FOUND)

        if not self._can_download_document_for_user(document, user):
            raise PermissionDenied('You do not have permission to view this document.')

        if not document.doc_file:
            return Response({'detail': 'Document file is not available.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            AuditLog.objects.create(
                user_index=user,
                audit_action='View Document',
                audit_desc=f"Viewed document '{document.doc_name}' (doc_id={document.doc_id})",
                audit_status='Success'
            )
        except Exception:
            pass

        document.doc_file.open('rb')
        # Serve file inline (not as attachment) so PDFs display in iframes
        return FileResponse(document.doc_file, as_attachment=False)

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
                # Get the upload action type from perform_create if it was set
                upload_action = getattr(request, '_upload_action', 'Upload Document')
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action=upload_action,
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

            if not self._can_manage_deletions(request.user, document=document):
                return Response(
                    {'detail': 'Only the document owner or an admin can delete this document.'},
                    status=status.HTTP_403_FORBIDDEN,
                )

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
    def check_file_exists(self, request):
        """Check if a file with the given name exists in the specified folder"""
        file_name = request.query_params.get('file_name', '').strip()
        folder_id = request.query_params.get('folder_id')
        
        if not file_name:
            return Response({'exists': False, 'suggested_name': None})
        
        user_org = request.user.org
        folder = None
        
        if folder_id:
            folder = Folder.objects.filter(folder_id=folder_id).first()
            if not folder:
                return Response({'error': 'Folder not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if user has access to the folder
            has_folder_access = (
                folder.owning_org_id == user_org.org_id or
                FolderShare.objects.filter(folder=folder, shared_with_org=user_org).exists()
            )
            if not has_folder_access:
                return Response({'error': 'No access to this folder'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if document with this name exists
        existing_doc = Document.objects.filter(
            owning_org=user_org,
            folder=folder,
            doc_name=file_name,
            is_deleted=False,
            is_archived=False
        ).exists()
        
        if existing_doc:
            # Generate suggested name for rename option
            suggested_name = self._build_unique_doc_name(file_name, folder, user_org)
            return Response({'exists': True, 'suggested_name': suggested_name})
        
        return Response({'exists': False, 'suggested_name': None})

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

        if not self._can_manage_deletions(request.user, document=document):
            return Response({'detail': 'Only the document owner or an admin can restore this document.'}, status=status.HTTP_403_FORBIDDEN)

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

        if not self._can_manage_deletions(request.user, document=document):
            return Response({'detail': 'Only the document owner or an admin can permanently delete this document.'}, status=status.HTTP_403_FORBIDDEN)

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

        if self._can_manage_deletions(user):
            deleted_queryset = Document.objects.filter(owning_org=user.org, is_deleted=True)
        else:
            from django.db.models import Q
            deleted_queryset = Document.objects.filter(
                owning_org=user.org,
                is_deleted=True,
            ).filter(
                Q(uploaded_by_user=user) | Q(user_index=user)
            )
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
                try:
                    target_user = getattr(existing_share.shared_to_user, 'user_id', 'Unknown User')
                    AuditLog.objects.create(
                        user_index=request.user,
                        audit_action='Share Document',
                        audit_desc=f"Share already exists for document '{document.doc_name}' to user '{target_user}'",
                        audit_status='Success'
                    )
                except Exception:
                    pass
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


class DocumentApprovalRequestViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentApprovalRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrgMember]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if not user.org:
            return DocumentApprovalRequest.objects.none()

        from django.db.models import Q
        
        # Org admins see approval requests for their org
        if getattr(user, 'role_type', None) == 'admin':
            return DocumentApprovalRequest.objects.filter(
                requested_org=user.org
            ).select_related(
                'doc', 'requested_by_user', 'reviewed_by_user',
                'requested_org', 'requesting_org', 'passed_to_org'
            )
        
        # Regular users only see their own approval requests
        return DocumentApprovalRequest.objects.filter(
            requested_by_user=user
        ).select_related(
            'doc', 'requested_by_user', 'reviewed_by_user',
            'requested_org', 'requesting_org', 'passed_to_org'
        )

    def perform_create(self, serializer):
        """
        Create a document approval request.
        
        This method handles approval requests where:
        - Regular users request document access from their own organization
        - The request is marked as pending and awaits approval from org admins
        """
        serializer.save(
            requested_by_user=self.request.user,
            requesting_org=self.request.user.org,
            requested_org=self.request.user.org
        )

    def create(self, request, *args, **kwargs):
        """Create approval request and notify org admins"""
        approval = None
        try:
            response = super().create(request, *args, **kwargs)
            
            # Notify org admins about the new approval request
            try:
                approval_id = response.data.get('approval_id')
                approval = DocumentApprovalRequest.objects.select_related(
                    'doc', 'requested_by_user', 'requested_org'
                ).get(approval_id=approval_id)
                
                # Get all admins in the requesting org
                admins = CustomUser.objects.filter(
                    org=approval.requested_org,
                    role_type='admin',
                    is_active=True
                )
                
                notif_msg = f"New document approval request from {approval.requested_by_user.get_full_name()} for document '{approval.doc.doc_name}'"
                
                for admin in admins:
                    Notification.objects.create(
                        recipient_user=admin,
                        actor_user=request.user,
                        doc=approval.doc,
                        notif_msg=notif_msg,
                    )
            except Exception as notify_error:
                # Notification delivery should not block the approval creation
                print(f"Warning: Failed to notify admins: {str(notify_error)}")

            if approval:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Request Document Approval',
                    audit_desc=f"Requested approval for document '{approval.doc.doc_name}'",
                    audit_status='Success'
                )
            return response
        except Exception as e:
            error_msg = str(e)
            # Try to extract detail from response errors
            if hasattr(e, 'detail'):
                error_msg = str(e.detail)
            
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Request Document Approval',
                audit_desc=f"Failed to request document approval: {error_msg}",
                audit_status='Failed'
            )
            raise

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def approve(self, request, pk=None):
        """Approve a document sharing request"""
        approval = self.get_object()
        
        # Only org admins can approve
        if getattr(request.user, 'role_type', None) != 'admin':
            raise PermissionDenied('Only organization admins can approve requests.')
        
        if approval.requested_org_id != request.user.org_id:
            raise PermissionDenied('You can only approve requests for your organization.')
        
        # Allow approving both pending and passed_to_higher status
        if approval.status not in ['pending', 'passed_to_higher']:
            return Response(
                {'detail': f'Cannot approve request with status {approval.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        approval.status = 'approved'
        approval.reviewed_by_user = request.user
        approval.reviewed_at = timezone.now()
        approval.review_message = request.data.get('review_message', '')
        approval.save()

        # Share the document with the requester
        try:
            DocumentShare.objects.get_or_create(
                doc=approval.doc,
                shared_by_user=request.user,
                shared_to_user=approval.requested_by_user,
                defaults={'share_msg': f"Approved via document sharing request"}
            )
        except Exception as share_error:
            print(f"Warning: Failed to create document share: {str(share_error)}")

        # Notify the requester
        Notification.objects.create(
            recipient_user=approval.requested_by_user,
            actor_user=request.user,
            doc=approval.doc,
            notif_msg=f"Your document sharing request for '{approval.doc.doc_name}' has been approved",
            approval_status='approved',
        )

        AuditLog.objects.create(
            user_index=request.user,
            audit_action='Approve Document Sharing',
            audit_desc=f"Approved document sharing request from {approval.requested_by_user.get_full_name()} for document '{approval.doc.doc_name}'",
            audit_status='Success'
        )

        serializer = self.get_serializer(approval)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def deny(self, request, pk=None):
        """Deny a document sharing request"""
        approval = self.get_object()
        
        # Only org admins can deny
        if getattr(request.user, 'role_type', None) != 'admin':
            raise PermissionDenied('Only organization admins can deny requests.')
        
        if approval.requested_org_id != request.user.org_id:
            raise PermissionDenied('You can only deny requests for your organization.')
        
        # Allow denying both pending and passed_to_higher status
        if approval.status not in ['pending', 'passed_to_higher']:
            return Response(
                {'detail': f'Cannot deny request with status {approval.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        approval.status = 'denied'
        approval.reviewed_by_user = request.user
        approval.reviewed_at = timezone.now()
        approval.review_message = request.data.get('review_message', '')
        approval.save()

        # Notify the requester
        Notification.objects.create(
            recipient_user=approval.requested_by_user,
            actor_user=request.user,
            doc=approval.doc,
            notif_msg=f"Your document sharing request for '{approval.doc.doc_name}' has been denied",
            approval_status='denied',
        )

        AuditLog.objects.create(
            user_index=request.user,
            audit_action='Deny Document Sharing',
            audit_desc=f"Denied document sharing request from {approval.requested_by_user.get_full_name()} for document '{approval.doc.doc_name}'",
            audit_status='Success'
        )

        serializer = self.get_serializer(approval)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def pass_to_higher(self, request, pk=None):
        """Pass approval request to parent organization"""
        approval = self.get_object()
        
        # Only org admins can pass to higher
        if getattr(request.user, 'role_type', None) != 'admin':
            raise PermissionDenied('Only organization admins can pass to higher authority.')
        
        if approval.requested_org_id != request.user.org_id:
            raise PermissionDenied('You can only pass requests for your organization.')
        
        if approval.status != 'pending':
            return Response(
                {'detail': f'Cannot pass request with status {approval.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if the organization has a parent (not root)
        current_org = approval.requested_org
        if not current_org.parent_org:
            return Response(
                {'detail': 'This organization is root. Cannot pass to higher authority.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Pass to parent organization
        approval.status = 'passed_to_higher'
        approval.reviewed_by_user = request.user
        approval.reviewed_at = timezone.now()
        approval.review_message = request.data.get('review_message', '')
        approval.passed_to_org = current_org.parent_org
        approval.requested_org = current_org.parent_org
        approval.save()

        # Share the document with all admins of the parent organization
        try:
            parent_admins = CustomUser.objects.filter(
                org=current_org.parent_org,
                role_type='admin',
                is_active=True
            )
            
            for admin in parent_admins:
                DocumentShare.objects.get_or_create(
                    doc=approval.doc,
                    shared_by_user=request.user,
                    shared_to_user=admin,
                    defaults={'share_msg': f"Document for approval by {current_org.parent_org.org_name}"}
                )
        except Exception as share_error:
            print(f"Warning: Failed to create document shares for parent org admins: {str(share_error)}")

        # Notify admins of the parent organization
        parent_admins = CustomUser.objects.filter(
            org=current_org.parent_org,
            role_type='admin',
            is_active=True
        )
        
        for admin in parent_admins:
            Notification.objects.create(
                recipient_user=admin,
                actor_user=request.user,
                doc=approval.doc,
                notif_msg=f"Document approval request from {current_org.org_name} requires your review for document '{approval.doc.doc_name}'",
                approval_status='passed_to_higher',
            )

        AuditLog.objects.create(
            user_index=request.user,
            audit_action='Pass Document Approval to Higher',
            audit_desc=f"Passed approval request from {approval.requested_by_user.get_full_name()} to {current_org.parent_org.org_name} for document '{approval.doc.doc_name}'",
            audit_status='Success'
        )

        serializer = self.get_serializer(approval)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def request_letter_from_parent(self, request):
        """
        Allow child organization admin to request a document letter from parent organization.
        This action creates an approval request and automatically passes it to the parent org.
        
        Expected POST data:
        {
            'doc_id': <document_id>,
            'approval_message': 'Request message'
        }
        """
        # Only org admins can use this action
        if getattr(request.user, 'role_type', None) != 'admin':
            raise PermissionDenied('Only organization admins can request documents from parent organization.')
        
        user_org = request.user.org
        if not user_org:
            raise PermissionDenied('User must belong to an organization.')
        
        # Check if the organization has a parent (is not root)
        if not user_org.parent_org:
            return Response(
                {'detail': 'Your organization is root. Cannot request from higher authority.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get document
        doc_id = request.data.get('doc_id')
        if not doc_id:
            return Response(
                {'detail': 'doc_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            doc = Document.objects.get(doc_id=doc_id)
        except Document.DoesNotExist:
            return Response(
                {'detail': f'Document with id {doc_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        approval_message = request.data.get('approval_message', '')
        
        # Check if document already has a pending request to parent org
        existing_request = DocumentApprovalRequest.objects.filter(
            doc=doc,
            requested_org=user_org.parent_org,
            status='pending'
        ).first()
        
        if existing_request:
            return Response(
                {'detail': f'A pending approval request for this document already exists for {user_org.parent_org.org_name}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create approval request
        try:
            approval = DocumentApprovalRequest.objects.create(
                doc=doc,
                requested_by_user=request.user,
                requesting_org=user_org,
                requested_org=user_org.parent_org,  # Request goes directly to parent
                approval_message=approval_message,
                status='passed_to_higher',  # Automatically passed to parent
                reviewed_by_user=request.user,
                reviewed_at=timezone.now(),
                review_message=f"Requested by {user_org.org_name} admin for parent organization",
                passed_to_org=user_org.parent_org
            )
            
            # Share the document with all admins of the parent organization
            try:
                parent_admins = CustomUser.objects.filter(
                    org=user_org.parent_org,
                    role_type='admin',
                    is_active=True
                )
                
                for admin in parent_admins:
                    DocumentShare.objects.get_or_create(
                        doc=doc,
                        shared_by_user=request.user,
                        shared_to_user=admin,
                        defaults={'share_msg': f"Document letter request from {user_org.org_name}"}
                    )
            except Exception as share_error:
                print(f"Warning: Failed to create document shares for parent org admins: {str(share_error)}")
            
            # Notify admins of the parent organization
            parent_admins = CustomUser.objects.filter(
                org=user_org.parent_org,
                role_type='admin',
                is_active=True
            )
            
            for admin in parent_admins:
                Notification.objects.create(
                    recipient_user=admin,
                    actor_user=request.user,
                    doc=doc,
                    notif_msg=f"Document letter request from {user_org.org_name} admin {request.user.get_full_name()} for document '{doc.doc_name}'",
                )
            
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Request Document Letter from Parent',
                audit_desc=f"Requested document letter from parent organization {user_org.parent_org.org_name} for document '{doc.doc_name}'",
                audit_status='Success'
            )
            
            serializer = self.get_serializer(approval)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            error_msg = str(e)
            
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Request Document Letter from Parent',
                audit_desc=f"Failed to request document letter from parent: {error_msg}",
                audit_status='Failed'
            )
            
            return Response(
                {'detail': f'Failed to create document letter request: {error_msg}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsOrgMember])
    def admin_request_from_organization(self, request):
        """
        Allow organization admin to request a document from their own organization.
        This is useful when an admin needs to formally request a document on behalf of the organization.
        
        Expected POST data:
        {
            'doc_id': <document_id>,
            'approval_message': 'Request message'
        }
        """
        # Only org admins can use this action
        if getattr(request.user, 'role_type', None) != 'admin':
            raise PermissionDenied('Only organization admins can submit organization document requests.')
        
        user_org = request.user.org
        if not user_org:
            raise PermissionDenied('User must belong to an organization.')
        
        # Get document
        doc_id = request.data.get('doc_id')
        if not doc_id:
            return Response(
                {'detail': 'doc_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            doc = Document.objects.get(doc_id=doc_id)
        except Document.DoesNotExist:
            return Response(
                {'detail': f'Document with id {doc_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        approval_message = request.data.get('approval_message', '')
        
        # Check if document already has a pending request from same org
        existing_request = DocumentApprovalRequest.objects.filter(
            doc=doc,
            requested_org=user_org,
            status='pending'
        ).first()
        
        if existing_request:
            return Response(
                {'detail': f'A pending approval request for this document already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create approval request
        try:
            approval = DocumentApprovalRequest.objects.create(
                doc=doc,
                requested_by_user=request.user,
                requesting_org=user_org,
                requested_org=user_org,  # Request is for own organization
                approval_message=approval_message,
                status='pending'  # Awaits approval from other admins
            )
            
            # Notify all admins in the organization (except the requester)
            try:
                other_admins = CustomUser.objects.filter(
                    org=user_org,
                    role_type='admin',
                    is_active=True
                ).exclude(user_index=request.user.user_index)
                
                for admin in other_admins:
                    Notification.objects.create(
                        recipient_user=admin,
                        actor_user=request.user,
                        doc=doc,
                        notif_msg=f"Admin {request.user.get_full_name()} requested approval for document '{doc.doc_name}'",
                    )
            except Exception as notify_error:
                print(f"Warning: Failed to notify admins: {str(notify_error)}")
            
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Admin Request Document from Organization',
                audit_desc=f"Requested document '{doc.doc_name}' for organization {user_org.org_name}",
                audit_status='Success'
            )
            
            serializer = self.get_serializer(approval)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            error_msg = str(e)
            
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Admin Request Document from Organization',
                audit_desc=f"Failed to request document: {error_msg}",
                audit_status='Failed'
            )
            
            return Response(
                {'detail': f'Failed to create document request: {error_msg}'},
                status=status.HTTP_400_BAD_REQUEST
            )
