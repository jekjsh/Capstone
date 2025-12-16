from django.contrib import admin
from django.urls import path, include
from authenticator.views import (
    CreateUserView, UserProfileView, UserListView, 
    active_sessions_view, login_event_view, logout_event_view, recent_activity_view, log_activity_view
)
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('auth/register/', CreateUserView.as_view(), name='register'),
    path('auth/token/', TokenObtainPairView.as_view(), name='get_token'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='refresh'),
    path('auth/profile/', UserProfileView.as_view(), name='user_profile'),
    path('auth/users/', UserListView.as_view(), name='user_list'),
    path('auth/active-sessions/', active_sessions_view, name='active_sessions'),
    path('auth/login-event/', login_event_view, name='login_event'),
    path('auth/logout-event/', logout_event_view, name='logout_event'),
    path('auth/recent-activity/', recent_activity_view, name='recent_activity'),
    path('auth/log-activity/', log_activity_view, name='log_activity'),
    path('auth/', include('rest_framework.urls')),
]
