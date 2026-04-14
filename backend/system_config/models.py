from django.db import models
from django.core.validators import FileExtensionValidator

class SystemTheme(models.Model):
    sys_id = models.AutoField(primary_key=True)
    sys_name = models.CharField(max_length=255)
    sys_abbr = models.CharField(max_length=50)
    sys_logo = models.FileField(
        upload_to='system/', 
        blank=True, 
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'])]
    )
    sys_backg = models.ImageField(upload_to='system/', blank=True, null=True)
    sidebar_color = models.CharField(max_length=7, default='#4F46E5', help_text='Color name (blue, indigo, etc) or hex code (#RRGGBB)')
    is_theme_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'system_themes'

    def __str__(self):
        return self.sys_name