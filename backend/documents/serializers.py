from rest_framework import serializers
from .models import Document, DocumentShare, OcrData


class DocumentSerializer(serializers.ModelSerializer):
    owner = serializers.StringRelatedField(source='user_index', read_only=True)
    
    class Meta:
        model = Document
        fields = ['doc_id', 'user_index', 'owner', 'doc_name', 'doc_desc', 'doc_path', 'doc_uploaded']
        read_only_fields = ['doc_id', 'user_index', 'doc_uploaded']


class DocumentShareSerializer(serializers.ModelSerializer):
    shared_by = serializers.StringRelatedField(source='shared_by_user', read_only=True)
    shared_to = serializers.StringRelatedField(source='shared_to_user', read_only=True)
    doc_name = serializers.CharField(source='doc.doc_name', read_only=True)
    
    class Meta:
        model = DocumentShare
        fields = ['share_id', 'doc', 'doc_name', 'shared_by', 'shared_to', 'share_timestamp']
        read_only_fields = ['share_id', 'share_timestamp', 'shared_by', 'shared_to']


class OcrDataSerializer(serializers.ModelSerializer):
    doc_name = serializers.CharField(source='doc.doc_name', read_only=True)
    
    class Meta:
        model = OcrData
        fields = ['ocr_id', 'doc', 'doc_name', 'ocr_extract']
        read_only_fields = ['ocr_id']
