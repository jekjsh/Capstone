from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('authenticator', '0009_usercreationrequest_user_birthdate_and_more'),
        ('documents', '0015_folder_document_soft_delete_fields'),
    ]

    operations = [
        migrations.CreateModel(
            name='FolderArchive',
            fields=[
                ('archive_id', models.AutoField(primary_key=True, serialize=False)),
                ('source_folder_id', models.IntegerField(db_index=True)),
                ('folder_name', models.CharField(max_length=255)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('archived_at', models.DateTimeField(auto_now_add=True)),
                ('snapshot', models.JSONField(blank=True, default=dict)),
                ('owning_org', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='authenticator.organization')),
            ],
            options={
                'db_table': 'folder_archive',
                'indexes': [models.Index(fields=['source_folder_id'], name='folder_archi_source__74cb0c_idx')],
            },
        ),
        migrations.CreateModel(
            name='DocumentArchive',
            fields=[
                ('archive_id', models.AutoField(primary_key=True, serialize=False)),
                ('source_doc_id', models.IntegerField(db_index=True)),
                ('doc_name', models.CharField(max_length=255)),
                ('doc_desc', models.TextField(blank=True, null=True)),
                ('doc_path', models.CharField(blank=True, max_length=500, null=True)),
                ('doc_file_path', models.CharField(blank=True, max_length=500, null=True)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('archived_at', models.DateTimeField(auto_now_add=True)),
                ('snapshot', models.JSONField(blank=True, default=dict)),
                ('owning_org', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='authenticator.organization')),
            ],
            options={
                'db_table': 'document_archive',
                'indexes': [models.Index(fields=['source_doc_id'], name='document_arc_source__e58d7e_idx')],
            },
        ),
    ]
