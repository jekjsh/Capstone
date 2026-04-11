from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0002_folder_document_folder_foldershare'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='doc_file',
            field=models.FileField(blank=True, null=True, upload_to='documents/%Y/%m/%d/'),
        ),
        migrations.AddField(
            model_name='document',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
