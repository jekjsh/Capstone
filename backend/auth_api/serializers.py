from rest_framework import serializers
from django.contrib.auth.models import User
from .models import OrganizationUnit, UserProfile, AuditLog, Document, SystemSettings, Folder, Tag, OrganizationShare


class OrganizationUnitSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = OrganizationUnit
        fields = ['id', 'name', 'type', 'code', 'description', 'head_position', 'parent', 'children', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_children(self, obj):
        """Recursively serialize children"""
        children = obj.children.all()
        if children:
            return OrganizationUnitSerializer(children, many=True).data
        return []


class OrganizationUnitCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating org units without recursive children"""
    
    class Meta:
        model = OrganizationUnit
        fields = ['id', 'name', 'type', 'code', 'description', 'head_position', 'parent']
        read_only_fields = ['id']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['job_title', 'department', 'organization_unit', 'organization_position', 'status', 'role']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User with profile fields"""
    profile = UserProfileSerializer(required=False)
    organizationUnitId = serializers.IntegerField(source='profile.organization_unit_id', required=False, allow_null=True)
    jobTitle = serializers.CharField(source='profile.job_title', required=False, allow_blank=True)
    department = serializers.CharField(source='profile.department', required=False, allow_blank=True)
    organizationPosition = serializers.CharField(source='profile.organization_position', required=False, allow_blank=True)
    status = serializers.CharField(source='profile.status', required=False)
    role = serializers.CharField(source='profile.role', required=False)
    userId = serializers.CharField(source='username', required=False)
    firstName = serializers.CharField(source='first_name', required=False)
    lastName = serializers.CharField(source='last_name', required=False)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'userId', 'first_name', 'firstName', 'last_name', 'lastName', 
                  'email', 'is_staff', 'is_active', 'profile', 'organizationUnitId', 
                  'jobTitle', 'department', 'organizationPosition', 'status', 'role']
        read_only_fields = ['id']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def create(self, validated_data):
        profile_data = {}
        
        # Extract profile fields
        if 'profile' in validated_data:
            profile_data = validated_data.pop('profile')
        
        # Create user
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        
        if password:
            user.set_password(password)
            user.save()
        
        # Update profile
        if profile_data:
            for key, value in profile_data.items():
                setattr(user.profile, key, value)
            user.profile.save()
        
        return user
    
    def update(self, instance, validated_data):
        profile_data = {}
        
        # Extract profile fields
        if 'profile' in validated_data:
            profile_data = validated_data.pop('profile')
        
        # Update user fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Handle password separately
        password = validated_data.get('password')
        if password:
            instance.set_password(password)
        
        instance.save()
        
        # Update profile
        if profile_data:
            for key, value in profile_data.items():
                setattr(instance.profile, key, value)
            instance.profile.save()
        
        return instance


class UserCreateSerializer(serializers.Serializer):
    """Serializer for creating users with password"""
    username = serializers.CharField(required=True, max_length=150)
    password = serializers.CharField(required=True, write_only=True, min_length=6)
    first_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    last_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    job_title = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    organization_unit_id = serializers.IntegerField(required=False, allow_null=True)
    organization_position = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(choices=['Active', 'Inactive'], default='Active')
    role = serializers.ChoiceField(choices=['Admin', 'User', 'System Admin'], default='User')
    
    def create(self, validated_data):
        # Extract profile fields
        profile_fields = {
            'job_title': validated_data.pop('job_title', ''),
            'department': validated_data.pop('department', ''),
            'organization_unit_id': validated_data.pop('organization_unit_id', None),
            'organization_position': validated_data.pop('organization_position', ''),
            'status': validated_data.pop('status', 'Active'),
            'role': validated_data.pop('role', 'User'),
        }
        
        # Create user
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        
        # Set is_superuser and is_staff flags based on role
        if profile_fields['role'] == 'System Admin':
            user.is_superuser = True
            user.is_staff = True
        elif profile_fields['role'] == 'Admin':
            user.is_staff = True
            user.is_superuser = False
        else:  # User
            user.is_staff = False
            user.is_superuser = False
        
        user.save()
        
        # Update profile
        for key, value in profile_fields.items():
            setattr(user.profile, key, value)
        user.profile.save()
        
        return user


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for audit logs"""
    time = serializers.DateTimeField(source='timestamp', format='%Y-%m-%d %H:%M:%S', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'action', 'resource', 'status', 'timestamp', 'time', 'ip_address']
        read_only_fields = ['id', 'timestamp', 'time']


class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for documents"""
    createdBy = serializers.CharField(source='created_by.username', read_only=True)
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M', read_only=True)
    deletedAt = serializers.DateTimeField(source='deleted_at', format='%Y-%m-%d %H:%M', read_only=True, allow_null=True)
    folderId = serializers.CharField(source='folder_id', required=False, allow_null=True, allow_blank=True)
    fileData = serializers.CharField(source='file_data', required=False, allow_null=True, allow_blank=True)
    ocrContent = serializers.CharField(source='ocr_content', required=False, allow_null=True, allow_blank=True)
    personalInfo = serializers.JSONField(source='personal_info', required=False, default=dict)
    customFieldValues = serializers.JSONField(source='custom_field_values', required=False, default=dict)
    sharedWith = serializers.JSONField(source='shared_with', required=False, default=list)
    isDeleted = serializers.BooleanField(source='is_deleted', required=False, default=False)
    
    class Meta:
        model = Document
        fields = ['id', 'title', 'description', 'format', 'createdBy', 'created_by', 
                  'folderId', 'folder_id', 'fileData', 'file_data', 'content', 
                  'ocrContent', 'ocr_content', 'personalInfo', 'personal_info',
                  'customFieldValues', 'custom_field_values', 'tags', 'sharedWith', 
                  'shared_with', 'isDeleted', 'is_deleted', 'createdAt', 'created_at',
                  'deletedAt', 'deleted_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by', 'deleted_at']
    
    def create(self, validated_data):
        # Get the user from the request context
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        else:
            raise serializers.ValidationError("Authentication required to create document")
        return super().create(validated_data)


class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializer for system settings"""
    settingKey = serializers.CharField(source='setting_key')
    settingValue = serializers.JSONField(source='setting_value')
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M:%S', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', format='%Y-%m-%d %H:%M:%S', read_only=True)
    
    class Meta:
        model = SystemSettings
        fields = ['id', 'setting_key', 'settingKey', 'setting_value', 'settingValue', 'created_at', 'createdAt', 'updated_at', 'updatedAt']
        read_only_fields = ['id', 'created_at', 'updated_at']


class FolderSerializer(serializers.ModelSerializer):
    """Serializer for user folders"""
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M:%S', read_only=True)
    updatedAt = serializers.DateTimeField(source='updated_at', format='%Y-%m-%d %H:%M:%S', read_only=True)
    
    class Meta:
        model = Folder
        fields = ['id', 'name', 'color', 'owner', 'created_at', 'createdAt', 'updated_at', 'updatedAt']
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set the owner to the current user
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['owner'] = request.user
        else:
            raise serializers.ValidationError("Authentication required to create folder")
        return super().create(validated_data)

class TagSerializer(serializers.ModelSerializer):
    """Serializer for tags"""
    showInDocuments = serializers.BooleanField(source='show_in_documents')
    createdAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M', read_only=True)
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'type', 'showInDocuments', 'show_in_documents', 'created_at', 'createdAt', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Set the owner to the current user
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['owner'] = request.user
        else:
            raise serializers.ValidationError("Authentication required to create tag")
        return super().create(validated_data)


class OrganizationShareSerializer(serializers.ModelSerializer):
    """Serializer for organization-wide document shares"""
    document = DocumentSerializer(read_only=True)
    documentId = serializers.PrimaryKeyRelatedField(source='document', queryset=Document.objects.all(), write_only=True)
    sentBy = serializers.CharField(source='sent_by.username', read_only=True)
    sentById = serializers.CharField(source='sent_by.username', read_only=True)
    sentFrom = serializers.IntegerField(source='sent_from_id', required=False, allow_null=True)
    distributionMode = serializers.CharField(source='distribution_mode', required=False)
    selectedUnits = serializers.JSONField(source='selected_units', required=False, default=list)
    sentAt = serializers.DateTimeField(source='created_at', format='%Y-%m-%d %H:%M', read_only=True)

    class Meta:
        model = OrganizationShare
        fields = [
            'id',
            'document',
            'documentId',
            'sentBy',
            'sentById',
            'sent_from',
            'sentFrom',
            'distribution_mode',
            'distributionMode',
            'recipients',
            'selected_units',
            'selectedUnits',
            'message',
            'created_at',
            'sentAt'
        ]
        read_only_fields = ['id', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['sent_by'] = request.user
            if not validated_data.get('sent_from'):
                profile = getattr(request.user, 'profile', None)
                if profile and profile.organization_unit_id:
                    validated_data['sent_from_id'] = profile.organization_unit_id
        else:
            raise serializers.ValidationError("Authentication required to create organization share")
        return super().create(validated_data)