from django.contrib import admin
from .models import SystemTheme


class SystemThemeAdmin(admin.ModelAdmin):
    list_display = ['sys_id', 'sys_name', 'sys_abbr', 'sidebar_color', 'is_theme_active']
    search_fields = ['sys_name', 'sys_abbr']
    list_filter = ['is_theme_active', 'sidebar_color']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Theme Information', {'fields': ('sys_name', 'sys_abbr')}),
        ('Appearance', {'fields': ('sidebar_color',)}),
        ('Media', {'fields': ('sys_logo', 'sys_backg')}),
        ('Status', {'fields': ('is_theme_active',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at')}),
    )


admin.site.register(SystemTheme, SystemThemeAdmin)
