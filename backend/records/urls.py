from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'organization-units', views.OrganizationUnitViewSet, basename='organization-unit')
router.register(r'custom-fields', views.CustomFieldViewSet, basename='custom-field')
router.register(r'folders', views.FolderViewSet, basename='folder')
router.register(r'documents', views.DocumentViewSet, basename='document')
router.register(r'direct-shares', views.DirectShareViewSet, basename='direct-share')
router.register(r'organization-shares', views.OrganizationShareViewSet, basename='organization-share')
router.register(r'audit-logs', views.AuditLogViewSet, basename='audit-log')
router.register(r'system-customization', views.SystemCustomizationViewSet, basename='system-customization')
router.register(r'user-id-format', views.UserIdFormatViewSet, basename='user-id-format')

urlpatterns = [
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('', include(router.urls)),
]