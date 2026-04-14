from django.contrib import admin
from .models import Document, DocumentShare, OcrData, Folder, FolderShare, Category, DocumentCategory, DocumentArchive, FolderArchive


class FolderAdmin(admin.ModelAdmin):
    list_display = ['folder_id', 'folder_name', 'owning_org', 'created_by_user', 'parent_folder', 'folder_color', 'created_at']
    search_fields = ['folder_name', 'owning_org__org_name', 'created_by_user__user_id']
    list_filter = ['folder_color', 'created_at', 'owning_org']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    fieldsets = (
        ('Folder Information', {
            'fields': ('folder_name', 'folder_color', 'owning_org', 'created_by_user', 'user_index', 'parent_folder', 'org')
        }),
        ('Details', {
            'fields': ('folder_path', 'created_at', 'updated_at')
        }),
    )


class FolderShareAdmin(admin.ModelAdmin):
    list_display = ['share_id', 'folder', 'shared_by_org', 'shared_with_org', 'created_at']
    search_fields = ['folder__folder_name', 'shared_by_org__org_name', 'shared_with_org__org_name']
    list_filter = ['created_at']
    readonly_fields = ['created_at']
    ordering = ['-created_at']


class DocumentCategoryInline(admin.TabularInline):
    model = DocumentCategory
    extra = 1
    fields = ['category', 'added_at']
    readonly_fields = ['added_at']


class DocumentAdmin(admin.ModelAdmin):
    list_display = ['doc_id', 'doc_name', 'user_index', 'owning_org', 'uploaded_by_user', 'folder', 'category_count', 'doc_uploaded', 'updated_at']
    search_fields = ['doc_name', 'doc_desc', 'user_index__user_id', 'user_index__first_name', 'user_index__last_name', 'owning_org__org_name']
    list_filter = ['doc_uploaded', 'updated_at', 'folder__org', 'owning_org']
    ordering = ['-doc_uploaded']
    inlines = [DocumentCategoryInline]
    readonly_fields = ['doc_uploaded', 'updated_at', 'display_categories']
    fieldsets = (
        ('Document Information', {
            'fields': ('doc_name', 'doc_desc', 'user_index', 'uploaded_by_user', 'owning_org', 'folder')
        }),
        ('File Details', {
            'fields': ('doc_path', 'doc_file', 'doc_uploaded', 'updated_at')
        }),
        ('Categories & Organization', {
            'fields': ('display_categories',)
        }),
    )
    
    def category_count(self, obj):
        return obj.categories.count()
    category_count.short_description = 'Categories'
    
    def display_categories(self, obj):
        categories = obj.categories.all()
        if categories:
            return ', '.join([cat.category.category_name for cat in categories])
        return 'No categories assigned'
    display_categories.short_description = 'Assigned Categories'


class DocumentShareAdmin(admin.ModelAdmin):
    list_display = ['share_id', 'doc', 'shared_by_user', 'shared_to_user', 'share_timestamp']
    search_fields = ['doc__doc_name', 'shared_by_user__user_id', 'shared_to_user__user_id']
    list_filter = ['share_timestamp']


class OcrDataAdmin(admin.ModelAdmin):
    list_display = ['ocr_id', 'doc', 'ocr_extract']
    search_fields = ['doc__doc_name']


class CategoryAdmin(admin.ModelAdmin):
    list_display = ['category_id', 'category_name', 'user_index', 'document_count', 'is_active', 'created_at']
    search_fields = ['category_name', 'user_index__user_id', 'category_desc']
    list_filter = ['is_active', 'created_at', 'org']
    readonly_fields = ['created_at', 'updated_at', 'display_documents']
    ordering = ['-created_at']
    fieldsets = (
        ('Category Information', {
            'fields': ('category_name', 'category_desc', 'user_index', 'org')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Documents in this Category', {
            'fields': ('display_documents',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def document_count(self, obj):
        return obj.documents.count()
    document_count.short_description = 'Documents'
    
    def display_documents(self, obj):
        docs = obj.documents.all()
        if docs:
            doc_links = '<br>'.join([f"• {doc.doc.doc_name} (ID: {doc.doc_id})" for doc in docs])
            return doc_links
        return 'No documents in this category'
    display_documents.short_description = 'Assigned Documents'
    display_documents.allow_tags = True


class DocumentCategoryAdmin(admin.ModelAdmin):
    list_display = ['doc_category_id', 'doc', 'category', 'added_at']
    search_fields = ['doc__doc_name', 'category__category_name']
    list_filter = ['added_at', 'category__org']
    readonly_fields = ['added_at']
    ordering = ['-added_at']


class DocumentArchiveAdmin(admin.ModelAdmin):
    list_display = ['archive_id', 'archive_batch_id', 'source_doc_id', 'doc_name', 'owning_org', 'deleted_at', 'archived_at']
    search_fields = ['source_doc_id', 'doc_name', 'archive_batch_id', 'owning_org__org_name']
    list_filter = ['archived_at', 'deleted_at', 'owning_org']
    readonly_fields = ['archived_at', 'snapshot']
    ordering = ['-archived_at']


class FolderArchiveAdmin(admin.ModelAdmin):
    list_display = ['archive_id', 'archive_batch_id', 'source_folder_id', 'folder_name', 'owning_org', 'deleted_at', 'archived_at']
    search_fields = ['source_folder_id', 'folder_name', 'archive_batch_id', 'owning_org__org_name']
    list_filter = ['archived_at', 'deleted_at', 'owning_org']
    readonly_fields = ['archived_at', 'snapshot']
    ordering = ['-archived_at']


admin.site.register(Folder, FolderAdmin)
admin.site.register(FolderShare, FolderShareAdmin)
admin.site.register(Document, DocumentAdmin)
admin.site.register(DocumentShare, DocumentShareAdmin)
admin.site.register(OcrData, OcrDataAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(DocumentCategory, DocumentCategoryAdmin)
admin.site.register(DocumentArchive, DocumentArchiveAdmin)
admin.site.register(FolderArchive, FolderArchiveAdmin)
