from django.db import models

class SystemTheme(models.Model):
    sys_id = models.AutoField(primary_key=True)
    sys_name = models.CharField(max_length=255)
    sys_abbr = models.CharField(max_length=50)
    sys_logo = models.CharField(max_length=500, blank=True, null=True)
    sys_backg = models.CharField(max_length=500, blank=True, null=True)
    is_theme_active = models.BooleanField(default=False)

    class Meta:
        db_table = 'system_themes'