from rest_framework import serializers
from .models import SystemTheme


class SystemThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemTheme
        fields = ['sys_id', 'sys_name', 'sys_abbr', 'sys_logo', 'sys_backg', 'is_theme_active']
