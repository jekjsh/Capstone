from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0009_documentcategory'),
    ]

    operations = [
        migrations.AddField(
            model_name='documentshare',
            name='share_msg',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='foldershare',
            name='share_msg',
            field=models.TextField(blank=True, null=True),
        ),
    ]
