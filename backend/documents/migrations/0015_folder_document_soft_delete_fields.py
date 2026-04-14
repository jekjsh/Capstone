from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0014_document_archived_at_document_is_archived_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='document',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='folder',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='folder',
            name='is_deleted',
            field=models.BooleanField(default=False),
        ),
    ]
