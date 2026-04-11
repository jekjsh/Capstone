from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from authenticator.views import (
    CustomTokenObtainPairView, 
    CustomTokenRefreshView,
    RegisterView, 
    UserProfileView,
    VerifyPasswordView,
    UserViewSet,
    OrganizationViewSet,
    IdFormatViewSet,
    LogoutView,
    UserCreationRequestViewSet,
    UserRegistrationRequestView
)
from documents.views import DocumentViewSet, DocumentShareViewSet, OcrDataViewSet, FolderViewSet, FolderShareViewSet, CategoryViewSet
from monitoring.views import AuditLogViewSet, NotificationViewSet
from system_config.views import SystemThemeViewSet

# Create a router and register all viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'id-formats', IdFormatViewSet, basename='id-format')
router.register(r'user-creation-requests', UserCreationRequestViewSet, basename='user-creation-request')
router.register(r'folders', FolderViewSet, basename='folder')
router.register(r'folder-shares', FolderShareViewSet, basename='folder-share')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'document-shares', DocumentShareViewSet, basename='document-share')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'ocr-data', OcrDataViewSet, basename='ocr-data')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'system-themes', SystemThemeViewSet, basename='system-theme')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication endpoints
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/register-request/', UserRegistrationRequestView.as_view(), name='register_request'),
    path('auth/profile/', UserProfileView.as_view(), name='user_profile'),
    path('auth/verify-password/', VerifyPasswordView.as_view(), name='verify_password'),
    
    # API routes (organizations, documents, etc.)
    path('api/', include(router.urls)),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

