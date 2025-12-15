from django.contrib import admin

# Register your models here.
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, OrganizationUnit, CustomField, Folder,
    Document, DirectShare, OrganizationShare,
    AuditLog, SystemCustomization, UserIdFormat
)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['user_id', 'first_name', 'last_name', 'email', 'role', 'status', 'created_at']
    list_filter = ['role', 'status', 'is_staff', 'is_superuser']
    search_fields = ['user_id', 'first_name', 'last_name', 'email']
    ordering = ['-created_at']
    
    fieldsets = (
        (None, {'fields': ('user_id', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Organization', {'fields': ('role', 'job_title', 'organization_unit', 'organization_position')}),
        ('Status', {'fields': ('status', 'is_active', 'is_staff', 'is_superuser')}),
        ('Permissions', {'fields': ('groups', 'user_permissions')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('user_id', 'first_name', 'last_name', 'email', 'password1', 'password2', 'role'),
        }),
    )

@admin.register(OrganizationUnit)
class OrganizationUnitAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'code', 'parent', 'created_at']
    list_filter = ['type']
    search_fields = ['name', 'code']
    ordering = ['name']

@admin.register(CustomField)
class CustomFieldAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'field_type', 'show_in_documents', 'required', 'created_at']
    list_filter = ['field_type', 'show_in_documents', 'required']
    search_fields = ['name', 'user__user_id']
    ordering = ['-created_at']

@admin.register(Folder)
class FolderAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'color', 'created_at']
    list_filter = ['color']
    search_fields = ['name', 'user__user_id']
    ordering = ['-created_at']

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'format', 'folder', 'is_deleted', 'created_at']
    list_filter = ['format', 'is_deleted']
    search_fields = ['title', 'user__user_id']
    ordering = ['-created_at']

@admin.register(DirectShare)
class DirectShareAdmin(admin.ModelAdmin):
    list_display = ['document', 'shared_by', 'permission', 'shared_at']
    list_filter = ['permission']
    search_fields = ['document__title', 'shared_by__user_id']
    ordering = ['-shared_at']

@admin.register(OrganizationShare)
class OrganizationShareAdmin(admin.ModelAdmin):
    list_display = ['document', 'sent_by', 'sent_from', 'distribution_mode', 'sent_at']
    list_filter = ['distribution_mode']
    search_fields = ['document__title', 'sent_by__user_id']
    ordering = ['-sent_at']

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['user_info', 'action', 'status', 'timestamp']
    list_filter = ['status', 'action']
    search_fields = ['user_info', 'action', 'resource']
    ordering = ['-timestamp']
    readonly_fields = ['user', 'user_info', 'action', 'resource', 'status', 'timestamp']

@admin.register(SystemCustomization)
class SystemCustomizationAdmin(admin.ModelAdmin):
    list_display = ['system_name', 'primary_color', 'updated_at']
    
    def has_add_permission(self, request):
        # Only allow one instance
        return SystemCustomization.objects.count() == 0
    
    def has_delete_permission(self, request, obj=None):
        # Don't allow deletion
        return False

@admin.register(UserIdFormat)
class UserIdFormatAdmin(admin.ModelAdmin):
    list_display = ['prefix', 'custom_format', 'updated_at']
    
    def has_add_permission(self, request):
        # Only allow one instance
        return UserIdFormat.objects.count() == 0
    
    def has_delete_permission(self, request, obj=None):
        # Don't allow deletion
        return False