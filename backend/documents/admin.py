from django.contrib import admin
from .models import Document, DocumentShare, OcrData, Folder, FolderShare, Category


class FolderAdmin(admin.ModelAdmin):
    list_display = ['folder_id', 'folder_name', 'user_index', 'parent_folder', 'folder_color', 'created_at']
    search_fields = ['folder_name', 'user_index__user_id']
    list_filter = ['folder_color', 'created_at']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    fieldsets = (
        ('Folder Information', {
            'fields': ('folder_name', 'folder_color', 'user_index', 'parent_folder', 'org')
        }),
        ('Details', {
            'fields': ('folder_path', 'created_at', 'updated_at')
        }),
    )


class FolderShareAdmin(admin.ModelAdmin):
    list_display = ['share_id', 'folder', 'shared_by_user', 'shared_to_user', 'created_at']
    search_fields = ['folder__folder_name', 'shared_by_user__user_id', 'shared_to_user__user_id']
    list_filter = ['created_at']
    readonly_fields = ['created_at']
    ordering = ['-created_at']


class DocumentAdmin(admin.ModelAdmin):
    list_display = ['doc_id', 'doc_name', 'user_index', 'folder', 'doc_uploaded']
    search_fields = ['doc_name', 'user_index__user_id']
    list_filter = ['doc_uploaded', 'folder']
    ordering = ['-doc_uploaded']
    fieldsets = (
        ('Document Information', {
            'fields': ('doc_name', 'doc_desc', 'user_index', 'folder')
        }),
        ('File Details', {
            'fields': ('doc_path', 'doc_uploaded')
        }),
    )


class DocumentShareAdmin(admin.ModelAdmin):
    list_display = ['share_id', 'doc', 'shared_by_user', 'shared_to_user', 'share_timestamp']
    search_fields = ['doc__doc_name', 'shared_by_user__user_id', 'shared_to_user__user_id']
    list_filter = ['share_timestamp']


class OcrDataAdmin(admin.ModelAdmin):
    list_display = ['ocr_id', 'doc', 'ocr_extract']
    search_fields = ['doc__doc_name']


class CategoryAdmin(admin.ModelAdmin):
    list_display = ['category_id', 'category_name', 'user_index', 'org', 'is_active', 'created_at']
    search_fields = ['category_name', 'user_index__user_id']
    list_filter = ['is_active', 'created_at']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    fieldsets = (
        ('Category Information', {
            'fields': ('category_name', 'category_desc', 'user_index', 'org')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )


admin.site.register(Folder, FolderAdmin)
admin.site.register(FolderShare, FolderShareAdmin)
admin.site.register(Document, DocumentAdmin)
admin.site.register(DocumentShare, DocumentShareAdmin)
admin.site.register(OcrData, OcrDataAdmin)
admin.site.register(Category, CategoryAdmin)
