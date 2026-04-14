# Generated migration to update sys_logo to FileField to support SVG

from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('system_config', '0006_alter_systemtheme_sidebar_color'),
    ]

    operations = [
        migrations.AlterField(
            model_name='systemtheme',
            name='sys_logo',
            field=models.FileField(
                blank=True,
                null=True,
                upload_to='system/',
                validators=[django.core.validators.FileExtensionValidator(allowed_extensions=['svg', 'png', 'jpg', 'jpeg', 'gif', 'webp'])]
            ),
        ),
    ]
