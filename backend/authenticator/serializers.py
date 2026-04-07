from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Organization, IdFormat

User = get_user_model()

# 1. User Details Serializer (What the frontend sees)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_index', 'user_id', 'first_name', 'last_name', 'email_add', 'role_type', 'org', 'is_active', 'joined_at']
        # We don't include the password here for security

# 1b. User Create/Update Serializer (Handles password for create/update)
class UserCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ['user_id', 'first_name', 'last_name', 'email_add', 'password', 'role_type', 'org', 'is_active', 'joined_at']
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(
            user_id=validated_data['user_id'],
            email_add=validated_data['email_add'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role_type=validated_data.get('role_type', 'user'),
            org=validated_data.get('org', None),
            is_active=validated_data.get('is_active', True)
        )
        if password:
            user.set_password(password)
            user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        # Update fields
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.email_add = validated_data.get('email_add', instance.email_add)
        instance.role_type = validated_data.get('role_type', instance.role_type)
        instance.org = validated_data.get('org', instance.org)
        instance.is_active = validated_data.get('is_active', instance.is_active)
        
        # Update password if provided
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance

# 2. Registration Serializer (Handling new signups)
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['user_id', 'first_name', 'last_name', 'email_add', 'password', 'role_type', 'org']

    def create(self, validated_data):
        # This is where your custom ID logic will eventually go!
        # For now, it accepts the user_id from the frontend and securely hashes the password.
        user = User.objects.create_user(
            user_id=validated_data['user_id'],
            email_add=validated_data['email_add'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role_type=validated_data.get('role_type', 'user'),
            org=validated_data.get('org', None)
        )
        return user

# 3. Custom JWT Serializer (Adding custom data to the token)
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims (so the frontend instantly knows who logged in)
        token['user_id'] = user.user_id
        token['role_type'] = user.role_type
        token['first_name'] = user.first_name

        return token


# 4. Organization Serializer
class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['org_id', 'parent_org', 'org_name', 'org_desc', 'org_code', 'org_type']
        read_only_fields = ['org_id']  # org_id cannot be changed


# 5. IdFormat Serializer
class IdFormatSerializer(serializers.ModelSerializer):
    org = serializers.PrimaryKeyRelatedField(
        queryset=Organization.objects.all(),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = IdFormat
        fields = ['format_id', 'org', 'prefix', 'admin_separator', 'user_separator', 'segment1_len', 'segment2_len', 'segment3_len', 'is_active']