from rest_framework import serializers
from .models import Document, DocumentShare, OcrData, Folder, FolderShare, Category, DocumentCategory
from authenticator.serializers import UserSerializer


class FolderSerializer(serializers.ModelSerializer):
    user_index = UserSerializer(read_only=True)
    created_by_user = UserSerializer(read_only=True)
    parent_folder_name = serializers.CharField(source='parent_folder.folder_name', read_only=True, allow_null=True)
    document_count = serializers.SerializerMethodField()
    owning_org_name = serializers.CharField(source='owning_org.org_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Folder
        fields = ['folder_id', 'user_index', 'created_by_user', 'parent_folder', 'parent_folder_name', 'org', 'owning_org', 'owning_org_name', 'folder_name', 'folder_path', 'folder_color', 'is_deleted', 'deleted_at', 'is_archived', 'archived_at', 'created_at', 'updated_at', 'document_count']
        read_only_fields = ['folder_id', 'user_index', 'created_by_user', 'owning_org', 'is_deleted', 'deleted_at', 'is_archived', 'archived_at', 'created_at', 'updated_at']
    
    def get_document_count(self, obj):
        return obj.documents.count()


class DocumentSerializer(serializers.ModelSerializer):
    user_index = UserSerializer(read_only=True)
    uploaded_by_user = UserSerializer(read_only=True)
    folder_name = serializers.CharField(source='folder.folder_name', read_only=True, allow_null=True)
    doc_file_url = serializers.SerializerMethodField()
    categories = serializers.SerializerMethodField()
    owning_org_name = serializers.CharField(source='owning_org.org_name', read_only=True, allow_null=True)
    
    class Meta:
        model = Document
        fields = ['doc_id', 'user_index', 'uploaded_by_user', 'owning_org', 'owning_org_name', 'folder', 'folder_name', 'doc_name', 'doc_desc', 'doc_path', 'doc_file', 'doc_file_url', 'is_deleted', 'deleted_at', 'is_archived', 'archived_at', 'doc_uploaded', 'updated_at', 'categories']
        read_only_fields = ['doc_id', 'user_index', 'uploaded_by_user', 'owning_org', 'is_deleted', 'deleted_at', 'is_archived', 'archived_at', 'doc_uploaded', 'updated_at']
    
    def get_categories(self, obj):
        """Return categories linked to this document"""
        doc_categories = obj.categories.all()
        return [
            {
                'category_id': dc.category.category_id,
                'category_name': dc.category.category_name,
                'doc_category_id': dc.doc_category_id
            }
            for dc in doc_categories
        ]
    
    def get_doc_file_url(self, obj):
        """Return the URL for the uploaded file"""
        if not self._can_open_document(obj):
            return None

        if obj.doc_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.doc_file.url)
            return obj.doc_file.url
        return None

    def _can_open_document(self, obj):
        request = self.context.get('request')
        if not request or not hasattr(request, 'user'):
            return False

        user = request.user
        if not user or not getattr(user, 'is_authenticated', False):
            return False

        user_org_id = getattr(user, 'org_id', None)
        if user_org_id is None:
            return False

        if obj.owning_org_id == user_org_id:
            return True

        if obj.folder_id and getattr(obj.folder, 'owning_org_id', None) == user_org_id:
            return True

        if DocumentShare.objects.filter(doc=obj, shared_to_user=user).exists():
            return True

        return False

    def to_representation(self, instance):
        data = super().to_representation(instance)
        can_open = self._can_open_document(instance)
        data['can_open'] = can_open
        if not can_open:
            data['doc_file'] = None
            data['doc_file_url'] = None
        return data
    
    def validate_doc_file(self, value):
        """Validate uploaded file"""
        if not value:
            return value
        
        # Check file size (max 50 MB)
        max_size = 50 * 1024 * 1024  # 50 MB
        if value.size > max_size:
            raise serializers.ValidationError(f"File size must not exceed {max_size / (1024*1024):.1f} MB")
        
        # Check file extension
        allowed_extensions = ['.pdf', '.docx', '.doc', '.txt', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.bmp']
        file_name = value.name.lower()
        if not any(file_name.endswith(ext) for ext in allowed_extensions):
            raise serializers.ValidationError(f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}")
        
        return value


class DocumentShareSerializer(serializers.ModelSerializer):
    shared_by = serializers.CharField(source='shared_by_user.user_id', read_only=True)
    shared_to = serializers.CharField(source='shared_to_user.user_id', read_only=True)
    doc_name = serializers.CharField(source='doc.doc_name', read_only=True)
    
    class Meta:
        model = DocumentShare
        fields = ['share_id', 'doc', 'doc_name', 'share_msg', 'shared_by_user', 'shared_by', 'shared_to_user', 'shared_to', 'share_timestamp']
        read_only_fields = ['share_id', 'share_timestamp', 'shared_by_user', 'shared_by', 'shared_to']


class FolderShareSerializer(serializers.ModelSerializer):
    shared_by_org_name = serializers.CharField(source='shared_by_org.org_name', read_only=True, allow_null=True)
    shared_with_org_name = serializers.CharField(source='shared_with_org.org_name', read_only=True, allow_null=True)
    folder_name = serializers.CharField(source='folder.folder_name', read_only=True)
    folder_data = FolderSerializer(source='folder', read_only=True)
    shared_by_org_details = serializers.SerializerMethodField()
    
    class Meta:
        model = FolderShare
        fields = [
            'share_id',
            'folder',
            'folder_name',
            'folder_data',
            'share_msg',
            'shared_by_org',
            'shared_by_org_name',
            'shared_by_org_details',
            'shared_with_org',
            'shared_with_org_name',
            'created_at',
        ]
        read_only_fields = ['share_id', 'created_at', 'shared_by_org', 'shared_by_org_name', 'shared_with_org_name']

    def get_shared_by_org_details(self, obj):
        org = obj.shared_by_org
        if not org:
            return None
        return {
            'org_id': org.org_id,
            'org_name': org.org_name,
            'org_code': org.org_code,
            'org_type': org.org_type,
        }


class OcrDataSerializer(serializers.ModelSerializer):
    doc_name = serializers.CharField(source='doc.doc_name', read_only=True)
    
    class Meta:
        model = OcrData
        fields = ['ocr_id', 'doc', 'doc_name', 'ocr_extract']
        read_only_fields = ['ocr_id']


class CategorySerializer(serializers.ModelSerializer):
    user_index = UserSerializer(read_only=True)
    
    class Meta:
        model = Category
        fields = ['category_id', 'user_index', 'org', 'category_name', 'category_desc', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['category_id', 'user_index', 'created_at', 'updated_at']


class DocumentCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.category_name', read_only=True)
    
    class Meta:
        model = DocumentCategory
        fields = ['doc_category_id', 'doc', 'category', 'category_name', 'added_at']
        read_only_fields = ['doc_category_id', 'added_at']
