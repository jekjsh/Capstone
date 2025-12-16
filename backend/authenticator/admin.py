from django.contrib import admin
from .models import CustomUser, LoginLog, ActivityLog

@admin.register(CustomUser)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'is_system_admin', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')

@admin.register(LoginLog)
class LoginLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'login_time', 'logout_time', 'ip_address')
    search_fields = ('user__username',)
    list_filter = ('login_time', 'logout_time')

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'target_doc', 'log_timestamp', 'ip_address')
    search_fields = ('user__username', 'target_doc', 'action')
    list_filter = ('action', 'log_timestamp')
    readonly_fields = ('user', 'action', 'target_doc', 'log_timestamp', 'ip_address')
