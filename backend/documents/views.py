from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Document, DocumentShare, OcrData
from .serializers import DocumentSerializer, DocumentShareSerializer, OcrDataSerializer
from monitoring.models import AuditLog


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['doc_name', 'doc_desc']
    ordering_fields = ['doc_uploaded', 'doc_name']
    ordering = ['-doc_uploaded']
    
    def get_queryset(self):
        # Users see only their own documents
        return Document.objects.filter(user_index=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user_index=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create document and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            # Log successful document creation
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Upload Document',
                audit_desc=f"Uploaded document {response.data.get('doc_name', 'unknown')}",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed document creation
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Upload Document',
                audit_desc=f"Failed to upload document: {str(e)}",
                audit_status='Failed'
            )
            raise
    
    def update(self, request, *args, **kwargs):
        """Update document and log the action"""
        try:
            response = super().update(request, *args, **kwargs)
            # Log successful document update
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Update Document',
                audit_desc=f"Updated document {self.kwargs.get('pk', 'unknown')}",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed document update
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Update Document',
                audit_desc=f"Failed to update document: {str(e)}",
                audit_status='Failed'
            )
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Delete document and log the action"""
        try:
            doc_id = self.kwargs.get('pk', 'unknown')
            response = super().destroy(request, *args, **kwargs)
            # Log successful document deletion
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Delete Document',
                audit_desc=f"Deleted document {doc_id}",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed document deletion
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Delete Document',
                audit_desc=f"Failed to delete document: {str(e)}",
                audit_status='Failed'
            )
            raise
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def ocr_data(self, request, pk=None):
        """Get OCR data for a document"""
        document = self.get_object()
        try:
            ocr = OcrData.objects.get(doc=document)
            serializer = OcrDataSerializer(ocr)
            return Response(serializer.data)
        except OcrData.DoesNotExist:
            return Response({'error': 'OCR data not found'}, status=status.HTTP_404_NOT_FOUND)


class DocumentShareViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentShareSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users see shares they sent or received
        user = self.request.user
        return DocumentShare.objects.filter(shared_by_user=user) | DocumentShare.objects.filter(shared_to_user=user)
    
    def perform_create(self, serializer):
        serializer.save(shared_by_user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create document share and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            # Log successful document share
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Share Document',
                audit_desc=f"Shared document with user",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed document share
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Share Document',
                audit_desc=f"Failed to share document: {str(e)}",
                audit_status='Failed'
            )
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Delete document share and log the action"""
        try:
            response = super().destroy(request, *args, **kwargs)
            # Log successful share removal
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Revoke Document Share',
                audit_desc=f"Revoked document share",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed share removal
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Revoke Document Share',
                audit_desc=f"Failed to revoke document share: {str(e)}",
                audit_status='Failed'
            )
            raise


class OcrDataViewSet(viewsets.ModelViewSet):
    serializer_class = OcrDataSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users see OCR for their own documents
        return OcrData.objects.filter(doc__user_index=self.request.user)
