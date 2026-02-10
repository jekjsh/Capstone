from django.contrib import admin
from .models import OrganizationUnit, UserProfile, AuditLog, Document


@admin.register(OrganizationUnit)
class OrganizationUnitAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'code', 'parent', 'created_at']
    list_filter = ['type', 'created_at']
    search_fields = ['name', 'code', 'description']
    ordering = ['name']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'job_title', 'department', 'status', 'organization_unit']
    list_filter = ['role', 'status', 'created_at']
    search_fields = ['user__username', 'user__email', 'job_title', 'department']
    ordering = ['user__username']


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'user', 'action', 'resource', 'status', 'ip_address']
    list_filter = ['status', 'action', 'timestamp']
    search_fields = ['user', 'action', 'resource']
    ordering = ['-timestamp']
    readonly_fields = ['timestamp']


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['title', 'format', 'created_by', 'is_deleted', 'created_at']
    list_filter = ['format', 'is_deleted', 'created_at']
    search_fields = ['title', 'description', 'created_by__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
