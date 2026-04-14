from rest_framework import serializers
from .models import SystemTheme


class SystemThemeSerializer(serializers.ModelSerializer):
    sys_logo = serializers.FileField(required=False, allow_null=True)
    sys_backg = serializers.ImageField(required=False, allow_null=True)
    
    def validate_sys_logo(self, value):
        """Validate sys_logo accepts images and SVG files"""
        if value:
            # Check file extension
            allowed_extensions = ['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp']
            file_extension = value.name.split('.')[-1].lower()
            
            if file_extension not in allowed_extensions:
                raise serializers.ValidationError(
                    f"Invalid file type. Allowed types: {', '.join(allowed_extensions)}"
                )
            
            # Check file size (max 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError("File size exceeds 5MB limit.")
        
        return value
    
    class Meta:
        model = SystemTheme
        fields = ['sys_id', 'sys_name', 'sys_abbr', 'sys_logo', 'sys_backg', 'sidebar_color', 'is_theme_active', 'created_at', 'updated_at']
        read_only_fields = ['sys_id', 'created_at', 'updated_at']
