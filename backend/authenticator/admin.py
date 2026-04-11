from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Organization, IdFormat, CustomUser

class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['org_id', 'org_name', 'org_code', 'org_type', 'parent_org']
    search_fields = ['org_name', 'org_code']
    list_filter = ['org_type']
    readonly_fields = ['org_id']  # org_id cannot be changed
    fieldsets = (
        ('Organization ID', {
            'fields': ('org_id',),
        }),
        ('Organization Info', {
            'fields': ('org_name', 'org_desc', 'org_code', 'org_type'),
        }),
        ('Hierarchy', {
            'fields': ('parent_org',),
        }),
    )

class IdFormatAdmin(admin.ModelAdmin):
    list_display = ['format_id', 'org', 'prefix', 'is_active']
    search_fields = ['prefix']
    list_filter = ['is_active', 'org']

class CustomUserAdmin(BaseUserAdmin):
    model = CustomUser
    list_display = ['user_id', 'first_name', 'last_name', 'email_add', 'user_pos', 'org', 'role_type', 'is_active']
    list_filter = ['is_active', 'is_staff', 'role_type', 'org']
    search_fields = ['user_id', 'email_add', 'first_name', 'last_name']
    ordering = ['user_id']
    fieldsets = (
        (None, {'fields': ('user_id', 'password', 'email_add')}),
        ('Personal info', {'fields': ('first_name', 'middle_name', 'last_name', 'suffix', 'user_pos')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Organization', {'fields': ('org', 'role_type')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('user_id', 'email_add', 'password1', 'password2', 'first_name', 'last_name', 'org', 'role_type'),
        }),
    )

admin.site.register(Organization, OrganizationAdmin)
admin.site.register(IdFormat, IdFormatAdmin)
admin.site.register(CustomUser, CustomUserAdmin)
