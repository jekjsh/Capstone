from rest_framework import serializers
from .models import SystemTheme


class SystemThemeSerializer(serializers.ModelSerializer):
    sys_logo = serializers.ImageField(required=False, allow_null=True)
    sys_backg = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = SystemTheme
        fields = ['sys_id', 'sys_name', 'sys_abbr', 'sys_logo', 'sys_backg', 'sidebar_color', 'is_theme_active', 'created_at', 'updated_at']
        read_only_fields = ['sys_id', 'created_at', 'updated_at']
