from django.shortcuts import render
from rest_framework import generics
from .serializers import UserSerializer
from .models import CustomUser
from rest_framework.permissions import IsAuthenticated, AllowAny


from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import get_user_model

from .serializers import UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer, OrganizationSerializer
from monitoring.models import AuditLog

User = get_user_model()

# 1. Login View (Uses our custom token serializer)
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = (AllowAny,)
    
    def post(self, request, *args, **kwargs):
        """Handle login and log the action"""
        try:
            response = super().post(request, *args, **kwargs)
            # Get the user who just logged in
            username = request.data.get('user_id') or request.data.get('username')
            try:
                user = User.objects.get(user_id=username)
                # Log successful login
                AuditLog.objects.create(
                    user_index=user,
                    audit_action='Login',
                    audit_desc=f"User logged in",
                    audit_status='Success'
                )
            except User.DoesNotExist:
                pass
            return response
        except Exception:
            # Log failed login
            username = request.data.get('user_id') or request.data.get('username')
            try:
                user = User.objects.get(user_id=username)
                AuditLog.objects.create(
                    user_index=user,
                    audit_action='Login',
                    audit_desc=f"Failed login attempt",
                    audit_status='Failed'
                )
            except User.DoesNotExist:
                pass
            raise

# 2. Token Refresh View
class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = (AllowAny,)

# Logout View
class LogoutView(generics.GenericAPIView):
    """Handle user logout and log the action"""
    permission_classes = (IsAuthenticated,)
    
    def post(self, request, *args, **kwargs):
        """Log logout action and return success response"""
        try:
            # Log successful logout
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Logout',
                audit_desc=f"User logged out",
                audit_status='Success'
            )
            return Response(
                {'detail': 'Successfully logged out.'}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            # Log failed logout attempt
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Logout',
                audit_desc=f"Failed logout: {str(e)}",
                audit_status='Failed'
            )
            return Response(
                {'detail': 'Logout failed.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

# 3. Registration View
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,) # Anyone can access the registration page
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        """Create user on registration and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            # Log successful registration
            user_id = response.data.get('user_id', 'unknown')
            try:
                user = User.objects.get(user_id=user_id)
                AuditLog.objects.create(
                    user_index=user,
                    audit_action='Register',
                    audit_desc=f"User registered",
                    audit_status='Success'
                )
            except User.DoesNotExist:
                pass
            return response
        except Exception as e:
            # Log failed registration
            AuditLog.objects.create(
                user_index=None,
                audit_action='Register',
                audit_desc=f"Failed to register: {str(e)}",
                audit_status='Failed'
            )
            raise

# 4. User Profile View (Protected)
class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,) # Must have a valid JWT token to access

    def get_object(self):
        # Automatically returns the data of the user attached to the token
        return self.request.user

# 5. User ViewSet (Create, Read, Update, Delete)
from rest_framework.viewsets import ModelViewSet
from .models import Organization
from .serializers import UserCreateUpdateSerializer

class UserViewSet(ModelViewSet):
    queryset = CustomUser.objects.all()
    permission_classes = (IsAuthenticated,)  # Must be logged in
    lookup_field = 'user_id'
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action in ['create', 'update', 'partial_update']:
            return UserCreateUpdateSerializer
        return UserSerializer
    
    def create(self, request, *args, **kwargs):
        """Create user and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            # Log successful user creation
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Create User',
                audit_desc=f"Created user {response.data.get('user_id', 'unknown')}",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed user creation
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Create User',
                audit_desc=f"Failed to create user: {str(e)}",
                audit_status='Failed'
            )
            raise
    
    def update(self, request, *args, **kwargs):
        """Update user and log the action"""
        try:
            response = super().update(request, *args, **kwargs)
            # Log successful user update
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Update User',
                audit_desc=f"Updated user {self.kwargs.get('user_id', 'unknown')}",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed user update
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Update User',
                audit_desc=f"Failed to update user: {str(e)}",
                audit_status='Failed'
            )
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Delete user and log the action"""
        try:
            user_id = self.kwargs.get('user_id', 'unknown')
            response = super().destroy(request, *args, **kwargs)
            # Log successful user deletion
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Delete User',
                audit_desc=f"Deleted user {user_id}",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed user deletion
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Delete User',
                audit_desc=f"Failed to delete user: {str(e)}",
                audit_status='Failed'
            )
            raise

# 6. Organization ViewSet (Create, Read, Update, Delete)
class OrganizationViewSet(ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = (IsAuthenticated,)  # Must be logged in
    lookup_field = 'org_id'
    
    def create(self, request, *args, **kwargs):
        """Create organization and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            # Log successful organization creation
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Create Organization',
                audit_desc=f"Created organization {response.data.get('org_name', 'unknown')}",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed organization creation
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Create Organization',
                audit_desc=f"Failed to create organization: {str(e)}",
                audit_status='Failed'
            )
            raise
    
    def update(self, request, *args, **kwargs):
        """Update organization and log the action"""
        try:
            response = super().update(request, *args, **kwargs)
            # Log successful organization update
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Update Organization',
                audit_desc=f"Updated organization {self.kwargs.get('org_id', 'unknown')}",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed organization update
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Update Organization',
                audit_desc=f"Failed to update organization: {str(e)}",
                audit_status='Failed'
            )
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Delete organization and log the action"""
        try:
            org_id = self.kwargs.get('org_id', 'unknown')
            response = super().destroy(request, *args, **kwargs)
            # Log successful organization deletion
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Delete Organization',
                audit_desc=f"Deleted organization {org_id}",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed organization deletion
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Delete Organization',
                audit_desc=f"Failed to delete organization: {str(e)}",
                audit_status='Failed'
            )
            raise