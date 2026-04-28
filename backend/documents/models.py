from django.db import models
from django.conf import settings

class Folder(models.Model):
    folder_id = models.AutoField(primary_key=True)
    owning_org = models.ForeignKey('authenticator.Organization', on_delete=models.CASCADE, related_name='owned_folders')
    created_by_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='created_folders', null=True, blank=True)
    user_index = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_folders')  # Legacy: keeping for backward compatibility
    parent_folder = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subfolders')
    org = models.ForeignKey('authenticator.Organization', on_delete=models.CASCADE, null=True, blank=True)  # Legacy field
    folder_name = models.CharField(max_length=255)
    folder_path = models.CharField(max_length=500, blank=True, null=True)
    folder_color = models.CharField(max_length=20, default='blue')
    folder_category = models.ForeignKey('Category', on_delete=models.SET_NULL, null=True, blank=True, related_name='folders')
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'folders'

    def __str__(self):
        return self.folder_name

class Document(models.Model):
    doc_id = models.AutoField(primary_key=True)
    owning_org = models.ForeignKey('authenticator.Organization', on_delete=models.CASCADE, related_name='owned_documents')
    uploaded_by_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='uploaded_docs', null=True, blank=True)
    user_index = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_docs')  # Legacy: keeping for backward compatibility during transition
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, null=True, blank=True, related_name='documents')
    doc_name = models.CharField(max_length=255)
    doc_desc = models.TextField(blank=True, null=True)
    doc_path = models.CharField(max_length=500, blank=True, null=True) # Legacy: storing the file path as string
    doc_file = models.FileField(upload_to='documents/%Y/%m/%d/', null=True, blank=True) # New: actual file upload
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    doc_uploaded = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'documents'

class DocumentShare(models.Model):
    share_id = models.AutoField(primary_key=True)
    doc = models.ForeignKey(Document, on_delete=models.CASCADE)
    shared_by_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shares_sent')
    shared_to_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shares_received')
    share_msg = models.TextField(blank=True, null=True)
    share_timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'document_shares'

class FolderShare(models.Model):
    share_id = models.AutoField(primary_key=True)
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, related_name='org_shares')
    shared_by_org = models.ForeignKey('authenticator.Organization', on_delete=models.CASCADE, related_name='folders_shared_by', null=True, blank=True)
    shared_with_org = models.ForeignKey('authenticator.Organization', on_delete=models.CASCADE, related_name='folders_shared_with', null=True, blank=True)
    share_msg = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'folder_shares'
        unique_together = ('folder', 'shared_with_org')  # Each org can only receive one share per folder

class OcrData(models.Model):
    ocr_id = models.AutoField(primary_key=True)
    doc = models.OneToOneField(Document, on_delete=models.CASCADE)
    ocr_extract = models.TextField()

    class Meta:
        db_table = 'ocr_data'

class Category(models.Model):
    category_id = models.AutoField(primary_key=True)
    user_index = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='categories')
    org = models.ForeignKey('authenticator.Organization', on_delete=models.CASCADE, null=True, blank=True)
    category_name = models.CharField(max_length=255)
    category_desc = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'categories'

    def __str__(self):
        return self.category_name

class DocumentCategory(models.Model):
    doc_category_id = models.AutoField(primary_key=True)
    doc = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='categories')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='documents')
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'document_categories'
        unique_together = ('doc', 'category')


class FolderArchive(models.Model):
    archive_id = models.AutoField(primary_key=True)
    archive_batch_id = models.CharField(max_length=36, null=True, blank=True, db_index=True)
    source_folder_id = models.IntegerField(db_index=True)
    owning_org = models.ForeignKey('authenticator.Organization', on_delete=models.SET_NULL, null=True, blank=True)
    folder_name = models.CharField(max_length=255)
    deleted_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(auto_now_add=True)
    snapshot = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'folder_archive'
        indexes = [models.Index(fields=['source_folder_id'])]


class DocumentArchive(models.Model):
    archive_id = models.AutoField(primary_key=True)
    archive_batch_id = models.CharField(max_length=36, null=True, blank=True, db_index=True)
    source_doc_id = models.IntegerField(db_index=True)
    owning_org = models.ForeignKey('authenticator.Organization', on_delete=models.SET_NULL, null=True, blank=True)
    doc_name = models.CharField(max_length=255)
    doc_desc = models.TextField(blank=True, null=True)
    doc_path = models.CharField(max_length=500, blank=True, null=True)
    doc_file_path = models.CharField(max_length=500, blank=True, null=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    archived_at = models.DateTimeField(auto_now_add=True)
    snapshot = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'document_archive'
        indexes = [models.Index(fields=['source_doc_id'])]


class DocumentApprovalRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
        ('passed_to_higher', 'Passed to Higher'),
    ]
    
    approval_id = models.AutoField(primary_key=True)
    doc = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='approval_requests')
    requested_by_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='approval_requests_sent')
    requested_org = models.ForeignKey('authenticator.Organization', on_delete=models.CASCADE, related_name='approval_requests_received')
    requesting_org = models.ForeignKey('authenticator.Organization', on_delete=models.CASCADE, related_name='approval_requests_made', null=True, blank=True)
    approval_message = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='approvals_reviewed', null=True, blank=True)
    review_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    passed_to_org = models.ForeignKey('authenticator.Organization', on_delete=models.SET_NULL, related_name='approval_requests_received_higher', null=True, blank=True)

    class Meta:
        db_table = 'document_approval_requests'
        
    def __str__(self):
        return f"Approval for {self.doc.doc_name} - {self.status}"