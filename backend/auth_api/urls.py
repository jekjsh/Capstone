from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'organization-units', views.OrganizationUnitViewSet, basename='organization-unit')
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'audit-logs', views.AuditLogViewSet, basename='audit-log')
router.register(r'documents', views.DocumentViewSet, basename='document')
router.register(r'folders', views.FolderViewSet, basename='folder')
router.register(r'tags', views.TagViewSet, basename='tag')
router.register(r'organization-shares', views.OrganizationShareViewSet, basename='organization-share')
router.register(r'system-settings', views.SystemSettingsViewSet, basename='system-settings')
urlpatterns = [
    path("login/", views.login_view, name="login"),
    path("verify-password/", views.verify_password, name="verify-password"),
    path("active-sessions/", views.active_sessions_view, name="active-sessions"),
    path("", include(router.urls)),
]