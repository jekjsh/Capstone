from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

class Organization(models.Model):
    org_id = models.AutoField(primary_key=True)
    parent_org = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_offices')
    org_name = models.CharField(max_length=255)
    org_desc = models.TextField(blank=True, null=True)
    org_code = models.CharField(max_length=50)
    org_type = models.CharField(max_length=100) # Hardcoded from Dropbox in frontend

    class Meta:
        db_table = 'organizations'

    def __str__(self):
        return self.org_code

class IdFormat(models.Model):
    format_id = models.AutoField(primary_key=True)
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    prefix = models.CharField(max_length=20)
    admin_separator = models.CharField(max_length=5)
    user_separator = models.CharField(max_length=5)
    segment1_len = models.IntegerField()
    segment2_len = models.IntegerField()
    segment3_len = models.IntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'id_format'

# Custom Manager required for createsuperuser (as discussed previously)
class CustomUserManager(BaseUserManager):
    def create_user(self, user_id, email_add, password=None, **extra_fields):
        if not user_id: raise ValueError("User ID required")
        email_add = self.normalize_email(email_add)
        user = self.model(user_id=user_id, email_add=email_add, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, user_id, email_add, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role_type', 'admin')
        return self.create_user(user_id, email_add, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    user_index = models.AutoField(primary_key=True)
    org = models.ForeignKey(Organization, on_delete=models.SET_NULL, null=True, blank=True)
    user_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    last_name = models.CharField(max_length=100)
    suffix = models.CharField(max_length=20, blank=True, null=True)
    user_pos = models.CharField(max_length=255, blank=True, null=True)
    email_add = models.EmailField(unique=True)
    role_type = models.CharField(max_length=50, default='user')
    joined_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'user_id'
    REQUIRED_FIELDS = ['email_add', 'first_name', 'last_name']

    class Meta:
        db_table = 'users'