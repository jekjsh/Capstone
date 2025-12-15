
from rest_framework import serializers
from .models import (
    User, OrganizationUnit, CustomField, Folder, 
    Document, DirectShare, OrganizationShare, 
    AuditLog, SystemCustomization, UserIdFormat
)

class OrganizationUnitSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = OrganizationUnit
        fields = '__all__'
    
    def get_children(self, obj):
        children = obj.children.all()
        return OrganizationUnitSerializer(children, many=True).data

class UserSerializer(serializers.ModelSerializer):
    name = serializers.ReadOnlyField()
    organization_unit_name = serializers.CharField(source='organization_unit.name', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'user_id', 'first_name', 'last_name', 'name', 'email', 
            'role', 'job_title', 'organization_unit', 'organization_unit_name',
            'organization_position', 'status', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def create(self, validated_data):
        password = self.context.get('password')
        user = User.objects.create_user(
            user_id=validated_data['user_id'],
            password=password,
            **{k: v for k, v in validated_data.items() if k != 'user_id'}
        )
        return user

class CustomFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomField
        fields = '__all__'

class FolderSerializer(serializers.ModelSerializer):
    document_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Folder
        fields = '__all__'
    
    def get_document_count(self, obj):
        return obj.documents.filter(is_deleted=False).count()

class DocumentSerializer(serializers.ModelSerializer):
    folder_name = serializers.CharField(source='folder.name', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    
    class Meta:
        model = Document
        fields = '__all__'

class DirectShareSerializer(serializers.ModelSerializer):
    document_data = DocumentSerializer(source='document', read_only=True)
    shared_by_name = serializers.CharField(source='shared_by.name', read_only=True)
    shared_with_ids = serializers.ListField(write_only=True)
    shared_with_data = UserSerializer(source='shared_with', many=True, read_only=True)
    
    class Meta:
        model = DirectShare
        fields = '__all__'
    
    def create(self, validated_data):
        shared_with_ids = validated_data.pop('shared_with_ids', [])
        share = DirectShare.objects.create(**validated_data)
        share.shared_with.set(User.objects.filter(user_id__in=shared_with_ids))
        return share

class OrganizationShareSerializer(serializers.ModelSerializer):
    document_data = DocumentSerializer(source='document', read_only=True)
    sent_by_name = serializers.CharField(source='sent_by.name', read_only=True)
    sent_from_name = serializers.CharField(source='sent_from.name', read_only=True)
    recipient_ids = serializers.ListField(write_only=True)
    recipient_data = UserSerializer(source='recipients', many=True, read_only=True)
    
    class Meta:
        model = OrganizationShare
        fields = '__all__'
    
    def create(self, validated_data):
        recipient_ids = validated_data.pop('recipient_ids', [])
        share = OrganizationShare.objects.create(**validated_data)
        share.recipients.set(User.objects.filter(user_id__in=recipient_ids))
        return share

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'

class SystemCustomizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemCustomization
        fields = '__all__'

class UserIdFormatSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserIdFormat
        fields = '__all__'

class LoginSerializer(serializers.Serializer):
    user_id = serializers.CharField(max_length=50)
    password = serializers.CharField(max_length=128, write_only=True)
    
    def validate(self, data):
        user_id = data.get('user_id')
        password = data.get('password')
        
        try:
            user = User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid credentials')
        
        if not user.check_password(password):
            raise serializers.ValidationError('Invalid credentials')
        
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled')
        
        data['user'] = user
        return data

class PasswordChangeSerializer(serializers.Serializer):
    user_id = serializers.CharField(max_length=50)
    new_password = serializers.CharField(max_length=128, write_only=True)
    admin_password = serializers.CharField(max_length=128, write_only=True)
    
    def validate(self, data):
        # Verify admin password
        admin_password = data.get('admin_password')
        request_user = self.context.get('request').user
        
        if not request_user.check_password(admin_password):
            raise serializers.ValidationError({'admin_password': 'Incorrect admin password'})
        
        return data