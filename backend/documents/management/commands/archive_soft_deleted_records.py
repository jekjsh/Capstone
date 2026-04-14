from datetime import timedelta
import uuid

from django.core.management.base import BaseCommand
from django.utils import timezone

from documents.models import Document, Folder, DocumentArchive, FolderArchive


class Command(BaseCommand):
    help = 'Move soft-deleted records older than retention window to archive (cold storage).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Retention window in days before moving soft-deleted records to archive (default: 30).',
        )

    def handle(self, *args, **options):
        days = max(1, int(options['days']))
        threshold = timezone.now() - timedelta(days=days)

        folder_batch_map = self._build_folder_batch_map(threshold)
        archived_docs = self._archive_documents(threshold, folder_batch_map)
        archived_folders = self._archive_folders(threshold, folder_batch_map)

        self.stdout.write(
            self.style.SUCCESS(
                f'Archive complete. Documents moved: {archived_docs}, Folders moved: {archived_folders}, threshold: {threshold.isoformat()}'
            )
        )

    def _build_folder_batch_map(self, threshold):
        folder_ids = list(
            Folder.objects.filter(is_deleted=True, deleted_at__isnull=False, deleted_at__lte=threshold)
            .values_list('folder_id', flat=True)
        )
        return {folder_id: str(uuid.uuid4()) for folder_id in folder_ids}

    def _archive_documents(self, threshold, folder_batch_map):
        queryset = Document.objects.filter(is_deleted=True, deleted_at__isnull=False, deleted_at__lte=threshold)
        count = 0

        for doc in queryset.iterator():
            batch_id = folder_batch_map.get(doc.folder_id)
            existing = DocumentArchive.objects.filter(source_doc_id=doc.doc_id).first()

            if existing is not None:
                if batch_id and not existing.archive_batch_id:
                    existing.archive_batch_id = batch_id
                    existing.save(update_fields=['archive_batch_id'])
            else:
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
            doc.delete()
            count += 1

        return count

    def _archive_folders(self, threshold, folder_batch_map):
        queryset = Folder.objects.filter(is_deleted=True, deleted_at__isnull=False, deleted_at__lte=threshold)
        count = 0

        for folder in queryset.iterator():
            batch_id = folder_batch_map.get(folder.folder_id)
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
            folder.delete()
            count += 1

        return count
