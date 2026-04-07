from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from authenticator.views import (
    CustomTokenObtainPairView, 
    CustomTokenRefreshView,
    RegisterView, 
    UserProfileView,
    UserViewSet,
    OrganizationViewSet,
    IdFormatViewSet,
    LogoutView
)
from documents.views import DocumentViewSet, DocumentShareViewSet, OcrDataViewSet
from monitoring.views import AuditLogViewSet, NotificationViewSet
from system_config.views import SystemThemeViewSet

# Create a router and register all viewsets
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'organizations', OrganizationViewSet, basename='organization')
router.register(r'id-formats', IdFormatViewSet, basename='id-format')
router.register(r'documents', DocumentViewSet, basename='document')
router.register(r'document-shares', DocumentShareViewSet, basename='document-share')
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
    path('auth/profile/', UserProfileView.as_view(), name='user_profile'),
    
    # API routes (organizations, documents, etc.)
    path('api/', include(router.urls)),
]

