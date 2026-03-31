from django.contrib import admin
from .models import SystemTheme


class SystemThemeAdmin(admin.ModelAdmin):
    list_display = ['sys_id', 'sys_name', 'sys_abbr', 'is_theme_active']
    search_fields = ['sys_name', 'sys_abbr']
    list_filter = ['is_theme_active']
    fieldsets = (
        ('Theme Information', {'fields': ('sys_name', 'sys_abbr')}),
        ('Media', {'fields': ('sys_logo', 'sys_backg')}),
        ('Status', {'fields': ('is_theme_active',)}),
    )


admin.site.register(SystemTheme, SystemThemeAdmin)
