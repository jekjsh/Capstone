from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0016_documentarchive_folderarchive'),
    ]

    operations = [
        migrations.AddField(
            model_name='documentarchive',
            name='archive_batch_id',
            field=models.CharField(blank=True, db_index=True, max_length=36, null=True),
        ),
        migrations.AddField(
            model_name='folderarchive',
            name='archive_batch_id',
            field=models.CharField(blank=True, db_index=True, max_length=36, null=True),
        ),
    ]
