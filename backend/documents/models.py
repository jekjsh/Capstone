from django.db import models
from django.conf import settings

class Folder(models.Model):
    folder_id = models.AutoField(primary_key=True)
    user_index = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_folders')
    parent_folder = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subfolders')
    org = models.ForeignKey('authenticator.Organization', on_delete=models.CASCADE, null=True, blank=True)
    folder_name = models.CharField(max_length=255)
    folder_path = models.CharField(max_length=500, blank=True, null=True)
    folder_color = models.CharField(max_length=20, default='blue')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'folders'

    def __str__(self):
        return self.folder_name

class Document(models.Model):
    doc_id = models.AutoField(primary_key=True)
    user_index = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_docs')
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, null=True, blank=True, related_name='documents')
    doc_name = models.CharField(max_length=255)
    doc_desc = models.TextField(blank=True, null=True)
    doc_path = models.CharField(max_length=500, blank=True, null=True) # Legacy: storing the file path as string
    doc_file = models.FileField(upload_to='documents/%Y/%m/%d/', null=True, blank=True) # New: actual file upload
    doc_uploaded = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # OCR Metadata Fields
    extracted_text = models.TextField(blank=True, null=True) # Full OCR output text
    detected_fields = models.JSONField(default=dict, blank=True) # Structured field extraction (names, dates, ref numbers, doc types)
    validity_date = models.DateField(blank=True, null=True) # Extracted validity/expiration date
    is_duplicate = models.BooleanField(default=False) # Flag for duplicate detection
    duplicate_of = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='duplicates')
    auto_category_confidence = models.FloatField(default=0.0) # Confidence score for auto-tagging (0.0 to 1.0)
    ocr_processed = models.BooleanField(default=False) # Whether OCR has been run on this document

    class Meta:
        db_table = 'documents'

class DocumentShare(models.Model):
    share_id = models.AutoField(primary_key=True)
    doc = models.ForeignKey(Document, on_delete=models.CASCADE)
    shared_by_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shares_sent')
    shared_to_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shares_received')
    share_timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'document_shares'

class FolderShare(models.Model):
    share_id = models.AutoField(primary_key=True)
    folder = models.ForeignKey(Folder, on_delete=models.CASCADE, related_name='shares')
    shared_by_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='folder_shares_sent')
    shared_to_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='folder_shares_received')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'folder_shares'

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