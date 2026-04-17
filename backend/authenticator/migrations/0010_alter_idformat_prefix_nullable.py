from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authenticator', '0009_usercreationrequest_user_birthdate_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='idformat',
            name='prefix',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
    ]
