from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Organization, IdFormat, UserCreationRequest

User = get_user_model()

# 1. User Details Serializer (What the frontend sees)
class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['user_index', 'user_id', 'name', 'first_name', 'middle_name', 'last_name', 'suffix', 'user_pos', 'user_contact', 'user_birthdate', 'email_add', 'role_type', 'org', 'is_active', 'joined_at']
        # We don't include the password here for security
    
    def get_name(self, obj):
        """Return full name with middle initial and suffix"""
        return obj.get_full_name()

# 1b. User Create/Update Serializer (Handles password for create/update)
class UserCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ['user_id', 'first_name', 'middle_name', 'last_name', 'suffix', 'user_pos', 'user_contact', 'user_birthdate', 'email_add', 'password', 'role_type', 'org', 'is_active', 'joined_at']
    
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(
            user_id=validated_data['user_id'],
            email_add=validated_data['email_add'],
            first_name=validated_data.get('first_name', ''),
            middle_name=validated_data.get('middle_name', ''),
            last_name=validated_data.get('last_name', ''),
            suffix=validated_data.get('suffix', ''),
            user_pos=validated_data.get('user_pos', ''),
            user_contact=validated_data.get('user_contact', ''),
            user_birthdate=validated_data.get('user_birthdate', None),
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
        instance.middle_name = validated_data.get('middle_name', instance.middle_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.suffix = validated_data.get('suffix', instance.suffix)
        instance.user_pos = validated_data.get('user_pos', instance.user_pos)
        instance.user_contact = validated_data.get('user_contact', instance.user_contact)
        instance.user_birthdate = validated_data.get('user_birthdate', instance.user_birthdate)
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
        fields = ['user_id', 'first_name', 'last_name', 'email_add', 'password', 'role_type', 'org', 'user_contact', 'user_birthdate']

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
            org=validated_data.get('org', None),
            user_contact=validated_data.get('user_contact', ''),
            user_birthdate=validated_data.get('user_birthdate', None)
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
    prefix = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = IdFormat
        fields = ['format_id', 'org', 'prefix', 'admin_separator', 'user_separator', 'segment1_len', 'segment2_len', 'segment3_len', 'is_active']


# 6. User Creation Request Serializer
class UserCreationRequestSerializer(serializers.ModelSerializer):
    org_code = serializers.CharField(source='org.org_code', read_only=True)
    org_name = serializers.CharField(source='org.org_name', read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()
    claimed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = UserCreationRequest
        fields = [
            'request_id', 'first_name', 'middle_name', 'last_name', 'suffix',
            'email_add', 'user_pos', 'user_contact', 'user_birthdate', 'org', 'org_code', 'org_name',
            'status', 'created_at', 'created_by',
            'claimed_by', 'claimed_by_name', 'claimed_at',
            'reviewed_by', 'reviewed_by_name', 'reviewed_at',
            'assigned_user_id', 'denial_reason'
        ]
        read_only_fields = ['request_id', 'created_at', 'reviewed_at', 'org_code', 'org_name', 'reviewed_by_name', 'claimed_by_name', 'claimed_at']
    
    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}".strip()
        return None
    
    def get_claimed_by_name(self, obj):
        if obj.claimed_by:
            return f"{obj.claimed_by.first_name} {obj.claimed_by.last_name}".strip()
        return None


# 7. User Creation Request Create Serializer (for registration)
class UserCreationRequestCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserCreationRequest
        fields = ['first_name', 'middle_name', 'last_name', 'suffix', 'email_add', 'user_pos', 'user_contact', 'user_birthdate', 'org', 'created_by']
    
    def create(self, validated_data):
        import uuid
        # Generate a unique request ID
        request_id = f"REQ-{uuid.uuid4().hex[:12].upper()}"
        
        user_creation_request = UserCreationRequest.objects.create(
            request_id=request_id,
            first_name=validated_data['first_name'],
            middle_name=validated_data.get('middle_name', ''),
            last_name=validated_data['last_name'],
            suffix=validated_data.get('suffix', ''),
            email_add=validated_data['email_add'],
            user_pos=validated_data['user_pos'],
            user_contact=validated_data.get('user_contact', ''),
            user_birthdate=validated_data.get('user_birthdate', None),
            org=validated_data['org'],
            created_by=validated_data['created_by'],
            status='pending'
        )
        return user_creation_request