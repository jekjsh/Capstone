from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from auth_api.models import UserProfile


class Command(BaseCommand):
    help = 'Create sample users for different dashboard types'

    def handle(self, *args, **options):
        users_to_create = [
            {
                'username': 'TUPM*01*0001',
                'password': 'sysadmin123',
                'first_name': 'System',
                'last_name': 'Administrator',
                'email': 'sysadmin@example.com',
                'is_staff': True,
                'is_superuser': True,
                'type': 'System Admin',
                'role': 'Admin'
            },
            {
                'username': 'TUPM_01_0001',
                'password': 'admin123',
                'first_name': 'Organization',
                'last_name': 'Admin',
                'email': 'admin@example.com',
                'is_staff': True,
                'is_superuser': False,
                'type': 'Admin',
                'role': 'Admin'
            },
            {
                'username': 'TUPM-01-0001',
                'password': 'user123',
                'first_name': 'John',
                'last_name': 'User',
                'email': 'user@example.com',
                'is_staff': False,
                'is_superuser': False,
                'type': 'User',
                'role': 'User'
            },
        ]

        for user_data in users_to_create:
            username = user_data['username']
            user_type = user_data.pop('type')
            role = user_data.pop('role')
            
            if User.objects.filter(username=username).exists():
                self.stdout.write(
                    self.style.WARNING(f'{user_type} user "{username}" already exists')
                )
                # Update profile if it exists
                user = User.objects.get(username=username)
                if hasattr(user, 'profile'):
                    user.profile.role = role
                    user.profile.save()
            else:
                password = user_data.pop('password')
                user = User.objects.create_user(**user_data)
                user.set_password(password)
                user.save()
                
                # Update profile
                if hasattr(user, 'profile'):
                    user.profile.role = role
                    user.profile.save()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Created {user_type} user: {username} (password: {password})'
                    )
                )

        self.stdout.write(self.style.SUCCESS('\n=== Login Credentials ==='))
        self.stdout.write('System Admin: TUPM*01*0001 / sysadmin123')
        self.stdout.write('Admin: TUPM_01_0001 / admin123')
        self.stdout.write('User: TUPM-01-0001 / user123')
