from django.core.management.base import BaseCommand
from records.models import User, OrganizationUnit, SystemCustomization, UserIdFormat

class Command(BaseCommand):
    help = 'Creates sample data for testing'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating sample data...')
        
        # Create system customization
        SystemCustomization.objects.get_or_create(
            id=1,
            defaults={
                'system_name': 'Record Keeping Management System',
                'primary_color': '#4F46E5',
                'sidebar_gradient_start': '#4F46E5',
                'sidebar_gradient_end': '#7C3AED'
            }
        )
        
        # Create user ID format
        UserIdFormat.objects.get_or_create(
            id=1,
            defaults={
                'prefix': 'TUPM',
                'admin_separator': '_',
                'user_separator': '-',
                'segment_count': 2,
                'segment_lengths': [2, 4],
                'custom_format': False,
                'custom_pattern_admin': 'TUPM_XX_XXXX',
                'custom_pattern_user': 'TUPM-XX-XXXX'
            }
        )
        
        # Create organization units
        org_unit1, _ = OrganizationUnit.objects.get_or_create(
            id='org-001',
            defaults={
                'name': 'Office of the President',
                'type': 'Office',
                'code': 'PRES',
                'head_position': 'President'
            }
        )
        
        org_unit2, _ = OrganizationUnit.objects.get_or_create(
            id='org-002',
            defaults={
                'name': 'College of Computer Studies',
                'type': 'College',
                'code': 'COCS',
                'head_position': 'Dean',
                'parent': org_unit1
            }
        )
        
        # Create default admin user
        if not User.objects.filter(user_id='TUPM_01_0001').exists():
            admin_user = User.objects.create_user(
                user_id='TUPM_01_0001',
                password='admin123',
                first_name='Admin',
                last_name='User',
                email='admin@example.com',
                role='Admin',
                status='Active',
                is_staff=True,
                is_superuser=True
            )
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {admin_user.user_id}'))
        
        # Create default regular user
        if not User.objects.filter(user_id='TUPM-01-0001').exists():
            regular_user = User.objects.create_user(
                user_id='TUPM-01-0001',
                password='User@123',
                first_name='John',
                last_name='Doe',
                email='john@example.com',
                role='User',
                job_title='Professor',
                organization_unit=org_unit2,
                organization_position='Faculty Member',
                status='Active'
            )
            self.stdout.write(self.style.SUCCESS(f'Created regular user: {regular_user.user_id}'))
        
        self.stdout.write(self.style.SUCCESS('Sample data created successfully!'))
        self.stdout.write(self.style.WARNING('\nDefault credentials:'))
        self.stdout.write(self.style.WARNING('Admin - User ID: TUPM_01_0001, Password: admin123'))
        self.stdout.write(self.style.WARNING('User  - User ID: TUPM-01-0001, Password: User@123'))