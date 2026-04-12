from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Document, DocumentShare, OcrData, Folder, FolderShare, Category, DocumentCategory
from .serializers import DocumentSerializer, DocumentShareSerializer, OcrDataSerializer, FolderSerializer, FolderShareSerializer, CategorySerializer
from .ocr_utils import process_document_ocr
from monitoring.models import AuditLog
import os
import logging

logger = logging.getLogger(__name__)


class FolderViewSet(viewsets.ModelViewSet):
    serializer_class = FolderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['folder_name']
    ordering_fields = ['created_at', 'folder_name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Users see only their own folders
        return Folder.objects.filter(user_index=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user_index=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create folder and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            # Log successful folder creation (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Create Folder',
                    audit_desc=f"Created folder {response.data.get('folder_name', 'unknown')}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed folder creation (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Create Folder',
                    audit_desc=f"Failed to create folder: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
    
    def update(self, request, *args, **kwargs):
        """Update folder and log the action"""
        try:
            response = super().update(request, *args, **kwargs)
            # Log successful folder update (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Update Folder',
                    audit_desc=f"Updated folder {self.kwargs.get('pk', 'unknown')}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed folder update (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Update Folder',
                    audit_desc=f"Failed to update folder: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Delete folder and log the action"""
        try:
            folder_id = self.kwargs.get('pk', 'unknown')
            response = super().destroy(request, *args, **kwargs)
            # Log successful folder deletion (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Folder',
                    audit_desc=f"Deleted folder {folder_id}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed folder deletion (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Folder',
                    audit_desc=f"Failed to delete folder: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def documents(self, request, pk=None):
        """Get all documents in a folder"""
        folder = self.get_object()
        documents = folder.documents.all()
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def root_folders(self, request):
        """Get root folders (folders without parent)"""
        folders = self.get_queryset().filter(parent_folder__isnull=True)
        serializer = self.get_serializer(folders, many=True)
        return Response(serializer.data)


class FolderShareViewSet(viewsets.ModelViewSet):
    serializer_class = FolderShareSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Users see shares they sent or received
        user = self.request.user
        return FolderShare.objects.filter(shared_by_user=user) | FolderShare.objects.filter(shared_to_user=user)
    
    def perform_create(self, serializer):
        serializer.save(shared_by_user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create folder share and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            # Log successful folder share
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Share Folder',
                audit_desc=f"Shared folder with user",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed folder share
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Share Folder',
                audit_desc=f"Failed to share folder: {str(e)}",
                audit_status='Failed'
            )
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Delete folder share and log the action"""
        try:
            response = super().destroy(request, *args, **kwargs)
            # Log successful share removal
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Revoke Folder Share',
                audit_desc=f"Revoked folder share",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed share removal
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Revoke Folder Share',
                audit_desc=f"Failed to revoke folder share: {str(e)}",
                audit_status='Failed'
            )
            raise


class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['doc_name', 'doc_desc', 'extracted_text']  # Include OCR text in search
    ordering_fields = ['doc_uploaded', 'doc_name', 'validity_date']
    ordering = ['-doc_uploaded']
    
    def initial(self, request, *args, **kwargs):
        """Called at the beginning of every viewset action"""
        super().initial(request, *args, **kwargs)
    
    def get_queryset(self):
        user = self.request.user
        # Admins see all documents in their organization
        if hasattr(user, 'role_type') and user.role_type == 'admin':
            return Document.objects.filter(user_index__org=user.org)
        # Regular users see only their own documents
        return Document.objects.filter(user_index=user)
    
    def perform_create(self, serializer):
        serializer.save(user_index=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create document, process OCR, and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            
            # Get the created document instance
            document_id = response.data.get('doc_id')
            logger.info(f"Created document ID: {document_id}")
            
            document = Document.objects.get(doc_id=document_id)
            logger.info(f"Document retrieved: {document.doc_name}, has_file: {bool(document.doc_file)}")
            
            # Process OCR if document has a file
            if document.doc_file:
                file_path = document.doc_file.path
                logger.info(f"Starting OCR for document {document.doc_id}: {document.doc_name}")
                logger.info(f"File path: {file_path}")
                logger.info(f"File exists: {os.path.exists(file_path)}")
                logger.info(f"File size: {os.path.getsize(file_path) if os.path.exists(file_path) else 'N/A'} bytes")
                
                # Run OCR processing
                try:
                    ocr_result = process_document_ocr(document, file_path)
                    logger.info(f"OCR result status: {ocr_result.get('status')}")
                    logger.info(f"Extracted text length: {len(ocr_result.get('extracted_text', ''))}")
                except Exception as ocr_error:
                    logger.error(f"OCR Error for document {document.doc_id}: {str(ocr_error)}", exc_info=True)
                    import traceback
                    traceback.print_exc()
                    ocr_result = {
                        'status': 'error',
                        'error': str(ocr_error),
                        'extracted_text': '',
                        'detected_fields': {},
                        'category': None,
                        'confidence': 0.0,
                        'duplicates': []
                    }
            else:
                logger.warning(f"Document {document.doc_id} has no file - skipping OCR")
            
            # Log OCR result (OUTSIDE if/else - applies to all documents with OCR attempt)
            if 'ocr_result' in locals():
                ocr_status = 'Success' if ocr_result['status'] == 'success' else 'Warning' if ocr_result['status'] == 'warning' else 'Failed'
                try:
                    AuditLog.objects.create(
                        user_index=request.user,
                        audit_action='Process OCR',
                        audit_desc=f"OCR processed for document '{document.doc_name}': {ocr_result.get('error', 'Successful')}",
                        audit_status=ocr_status
                    )
                except:
                    pass
                
                # Auto-add category if confidence is high enough
                if ocr_result.get('category') and ocr_result.get('confidence', 0) > 0.7:
                    try:
                        # Try to find or create category
                        category, _ = Category.objects.get_or_create(
                            category_name=ocr_result['category'],
                            org=request.user.org,
                            defaults={'user_index': request.user, 'category_desc': f'Auto-created from OCR classification'}
                        )
                        # Link category to document
                        DocumentCategory.objects.get_or_create(doc=document, category=category)
                    except Exception as e:
                        logger.warning(f"Failed to auto-add category: {str(e)}")
                
                # Alert if duplicate detected
                if ocr_result.get('duplicates'):
                    try:
                        AuditLog.objects.create(
                            user_index=request.user,
                            audit_action='Duplicate Detected',
                            audit_desc=f"Potential duplicate detected for document '{document.doc_name}'",
                            audit_status='Warning'
                        )
                    except:
                        pass
            
            # Alert if validity date is approaching (separate from OCR handling)
            if document.validity_date:
                from datetime import timedelta, date
                days_until_expiry = (document.validity_date - date.today()).days
                if 0 <= days_until_expiry <= 30:
                    try:
                        AuditLog.objects.create(
                            user_index=request.user,
                            audit_action='Expiry Alert',
                            audit_desc=f"Document '{document.doc_name}' expires in {days_until_expiry} days",
                            audit_status='Warning'
                        )
                    except:
                        pass
            
            # Log successful document creation
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Upload Document',
                    audit_desc=f"Uploaded document {response.data.get('doc_name', 'unknown')}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                logger.warning(f"Failed to create audit log: {str(audit_error)}")
            
            # Return refreshed document data with OCR results
            document.refresh_from_db()
            response_data = DocumentSerializer(document, context={'request': request}).data
            response.data = response_data
            
            return response
        except Exception as e:
            # Log failed document creation
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Upload Document',
                    audit_desc=f"Failed to upload document: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass
            raise
    
    def update(self, request, *args, **kwargs):
        """Update document and log the action"""
        try:
            response = super().update(request, *args, **kwargs)
            # Log successful document update (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Update Document',
                    audit_desc=f"Updated document {self.kwargs.get('pk', 'unknown')}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed document update (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Update Document',
                    audit_desc=f"Failed to update document: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Delete document and log the action"""
        try:
            doc_id = self.kwargs.get('pk', 'unknown')
            response = super().destroy(request, *args, **kwargs)
            # Log successful document deletion (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Document',
                    audit_desc=f"Deleted document {doc_id}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed document deletion (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Document',
                    audit_desc=f"Failed to delete document: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
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
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_category(self, request, pk=None):
        """Add a category to a document"""
        document = self.get_object()
        category_id = request.data.get('category_id')
        
        if not category_id:
            return Response({'error': 'category_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            category = Category.objects.get(category_id=category_id, user_index=request.user)
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Create DocumentCategory if it doesn't already exist
        doc_category, created = DocumentCategory.objects.get_or_create(
            doc=document,
            category=category
        )
        
        if created:
            # Log the action
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Add Category to Document',
                    audit_desc=f"Added category '{category.category_name}' to document '{document.doc_name}'",
                    audit_status='Success'
                )
            except:
                pass
            return Response({'message': 'Category added to document'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': 'Category already added to this document'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def remove_category(self, request, pk=None):
        """Remove a category from a document"""
        document = self.get_object()
        doc_category_id = request.data.get('doc_category_id')
        
        if not doc_category_id:
            return Response({'error': 'doc_category_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            doc_category = DocumentCategory.objects.get(doc_category_id=doc_category_id, doc=document)
        except DocumentCategory.DoesNotExist:
            return Response({'error': 'DocumentCategory not found'}, status=status.HTTP_404_NOT_FOUND)
        
        category_name = doc_category.category.category_name
        doc_category.delete()
        
        # Log the action
        try:
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Remove Category from Document',
                audit_desc=f"Removed category '{category_name}' from document '{document.doc_name}'",
                audit_status='Success'
            )
        except:
            pass
        
        return Response({'message': 'Category removed from document'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def process_ocr_manual(self, request, pk=None):
        """Manually trigger OCR processing for a document"""
        document = self.get_object()
        
        # Check permission: user can only process OCR on their own documents
        if document.user_index != request.user:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        if not document.doc_file:
            return Response({'error': 'Document has no file'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            file_path = document.doc_file.path
            ocr_result = process_document_ocr(document, file_path)
            
            return Response({
                'status': ocr_result['status'],
                'message': 'OCR processing completed',
                'data': {
                    'extracted_text_length': len(ocr_result.get('extracted_text', '')),
                    'detected_fields': ocr_result.get('detected_fields', {}),
                    'validity_date': str(ocr_result.get('validity_date', 'None')),
                    'category': ocr_result.get('category'),
                    'confidence': ocr_result.get('confidence'),
                    'duplicates': ocr_result.get('duplicates', []),
                    'error': ocr_result.get('error')
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def expiring_documents(self, request):
        """Get documents with validity dates approaching (within 30 days)"""
        from datetime import date, timedelta
        
        queryset = self.get_queryset()
        today = date.today()
        thirty_days = today + timedelta(days=30)
        
        # Filter documents with validity dates within the next 30 days
        expiring_docs = queryset.filter(
            validity_date__isnull=False,
            validity_date__gte=today,
            validity_date__lte=thirty_days
        ).order_by('validity_date')
        
        serializer = self.get_serializer(expiring_docs, many=True)
        return Response({
            'count': len(expiring_docs),
            'documents': serializer.data
        })
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def duplicate_documents(self, request):
        """Get documents marked as duplicates"""
        queryset = self.get_queryset()
        duplicates = queryset.filter(is_duplicate=True)
        serializer = self.get_serializer(duplicates, many=True)
        return Response({
            'count': len(duplicates),
            'documents': serializer.data
        })
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def search_ocr_content(self, request):
        """Search within OCR extracted text of documents"""
        search_query = request.data.get('search_query', '')
        
        if not search_query or len(search_query) < 2:
            return Response({'error': 'Search query must be at least 2 characters'}, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = self.get_queryset()
        
        # Search in OCR extracted text
        results = queryset.filter(extracted_text__icontains=search_query)
        
        # Also include basic document search results
        results = results | queryset.filter(doc_name__icontains=search_query)
        results = results.distinct()
        
        serializer = self.get_serializer(results, many=True)
        return Response({
            'search_query': search_query,
            'count': len(results),
            'documents': serializer.data
        })


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


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['category_name']
    ordering_fields = ['created_at', 'category_name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        # Users see only categories in their organization
        user_org = self.request.user.org
        if user_org:
            return Category.objects.filter(org=user_org)
        # If user has no organization, return empty queryset (no access to categories)
        return Category.objects.none()
    
    def perform_create(self, serializer):
        # Automatically set organization and user when creating a category
        serializer.save(user_index=self.request.user, org=self.request.user.org)
    
    def create(self, request, *args, **kwargs):
        """Create category and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            # Log successful category creation (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Create Category',
                    audit_desc=f"Created category {response.data.get('category_name', 'unknown')}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed category creation (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Create Category',
                    audit_desc=f"Failed to create category: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
    
    def update(self, request, *args, **kwargs):
        """Update category and log the action"""
        try:
            response = super().update(request, *args, **kwargs)
            # Log successful category update (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Update Category',
                    audit_desc=f"Updated category {self.kwargs.get('pk', 'unknown')}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed category update (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Update Category',
                    audit_desc=f"Failed to update category: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Delete category and log the action"""
        try:
            category_id = self.kwargs.get('pk', 'unknown')
            response = super().destroy(request, *args, **kwargs)
            # Log successful category deletion (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Category',
                    audit_desc=f"Deleted category {category_id}",
                    audit_status='Success'
                )
            except Exception as audit_error:
                print(f"Warning: Failed to create audit log: {str(audit_error)}")
            return response
        except Exception as e:
            # Log failed category deletion (non-blocking)
            try:
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Category',
                    audit_desc=f"Failed to delete category: {str(e)}",
                    audit_status='Failed'
                )
            except:
                pass  # Ignore audit log failures
            raise
