from django.db import models
from django.conf import settings

class Document(models.Model):
    doc_id = models.AutoField(primary_key=True)
    user_index = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_docs')
    doc_name = models.CharField(max_length=255)
    doc_desc = models.TextField(blank=True, null=True)
    doc_path = models.CharField(max_length=500) # Storing the file path
    doc_uploaded = models.DateTimeField(auto_now_add=True)

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

class OcrData(models.Model):
    ocr_id = models.AutoField(primary_key=True)
    doc = models.OneToOneField(Document, on_delete=models.CASCADE)
    ocr_extract = models.TextField()

    class Meta:
        db_table = 'ocr_data'