from django.contrib import admin
from .models import Document, DocumentShare, OcrData


class DocumentAdmin(admin.ModelAdmin):
    list_display = ['doc_id', 'doc_name', 'user_index', 'doc_uploaded']
    search_fields = ['doc_name', 'user_index__user_id']
    list_filter = ['doc_uploaded']
    ordering = ['-doc_uploaded']


class DocumentShareAdmin(admin.ModelAdmin):
    list_display = ['share_id', 'doc', 'shared_by_user', 'shared_to_user', 'share_timestamp']
    search_fields = ['doc__doc_name', 'shared_by_user__user_id', 'shared_to_user__user_id']
    list_filter = ['share_timestamp']


class OcrDataAdmin(admin.ModelAdmin):
    list_display = ['ocr_id', 'doc', 'ocr_extract']
    search_fields = ['doc__doc_name']


admin.site.register(Document, DocumentAdmin)
admin.site.register(DocumentShare, DocumentShareAdmin)
admin.site.register(OcrData, OcrDataAdmin)
