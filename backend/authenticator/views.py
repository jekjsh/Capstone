from django.shortcuts import render
from rest_framework import generics
from rest_framework.decorators import action
from .serializers import UserSerializer
from .models import CustomUser, IdFormat, UserCreationRequest
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.viewsets import ModelViewSet

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model, authenticate
from django.conf import settings
from django.db.models import Q
from pathlib import Path

from .serializers import UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer, OrganizationSerializer, IdFormatSerializer, UserCreationRequestSerializer, UserCreationRequestCreateSerializer, VerifyOTPSerializer
from .two_factor_utils import create_and_send_otp, verify_otp
from monitoring.models import AuditLog, Notification

User = get_user_model()

BASE_ORGANIZATION_TYPE_OPTIONS = [
    'Board',
    'Administrator',
    'Office',
    'Department',
    'Division',
]
ORGANIZATION_TYPE_FILE_PATH = Path(settings.BASE_DIR) / 'organization_unit_types.txt'


def _read_custom_organization_types():
    if not ORGANIZATION_TYPE_FILE_PATH.exists():
        return []

    custom_types = []
    seen = set()

    with ORGANIZATION_TYPE_FILE_PATH.open('r', encoding='utf-8') as handle:
        for raw_line in handle:
            item = raw_line.strip()
            if not item:
                continue

            normalized = item.lower()
            if normalized in seen:
                continue

            seen.add(normalized)
            custom_types.append(item)

    return custom_types


def _write_custom_organization_types(custom_types):
    ORGANIZATION_TYPE_FILE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with ORGANIZATION_TYPE_FILE_PATH.open('w', encoding='utf-8') as handle:
        for item in custom_types:
            handle.write(f'{item}\n')


class OrganizationUnitTypeView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        return Response({'types': _read_custom_organization_types()}, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        name = (request.data.get('name') or '').strip()
        if not name:
            return Response({'detail': 'Type name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        normalized_name = name.lower()
        reserved = {item.lower() for item in BASE_ORGANIZATION_TYPE_OPTIONS}
        if normalized_name in reserved:
            return Response({'detail': 'This type is already part of the default list.'}, status=status.HTTP_400_BAD_REQUEST)

        custom_types = _read_custom_organization_types()
        existing = {item.lower() for item in custom_types}
        if normalized_name in existing:
            return Response({'detail': 'This custom type already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        custom_types.append(name)
        _write_custom_organization_types(custom_types)
        return Response({'types': custom_types}, status=status.HTTP_201_CREATED)

    def delete(self, request, *args, **kwargs):
        name = (request.data.get('name') or '').strip()
        if not name:
            return Response({'detail': 'Type name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        custom_types = _read_custom_organization_types()
        remaining = [item for item in custom_types if item.lower() != name.lower()]
        if len(remaining) == len(custom_types):
            return Response({'detail': 'Custom type not found.'}, status=status.HTTP_404_NOT_FOUND)

        _write_custom_organization_types(remaining)
        return Response({'types': remaining}, status=status.HTTP_200_OK)

# 1. Login View (Uses our custom token serializer - Step 1 of 2FA: Send OTP)
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = (AllowAny,)
    
    def post(self, request, *args, **kwargs):
        """
        Step 1 of 2FA: Verify credentials and send OTP code
        Returns: {'message': 'OTP sent', 'user_id': 'xxx'} instead of tokens
        """
        username = request.data.get('user_id') or request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'detail': 'user_id and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(user_id=username)
        except User.DoesNotExist:
            AuditLog.objects.create(
                user_index=None,
                audit_action='Login',
                audit_desc=f"Failed login attempt - user not found: {username}",
                audit_status='Failed'
            )
            return Response(
                {'detail': 'Invalid user_id or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Verify password
        if not user.check_password(password):
            AuditLog.objects.create(
                user_index=user,
                audit_action='Login',
                audit_desc=f"Failed login attempt - invalid password",
                audit_status='Failed'
            )
            return Response(
                {'detail': 'Invalid user_id or password.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user is active
        if not user.is_active:
            AuditLog.objects.create(
                user_index=user,
                audit_action='Login',
                audit_desc=f"Failed login attempt - user inactive",
                audit_status='Failed'
            )
            return Response(
                {'detail': 'User account is inactive.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Credentials are valid, send OTP
        otp_code = create_and_send_otp(user)
        
        if otp_code is None:
            AuditLog.objects.create(
                user_index=user,
                audit_action='Login',
                audit_desc=f"Failed login attempt - OTP email send failed",
                audit_status='Failed'
            )
            return Response(
                {'detail': 'Failed to send OTP. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        AuditLog.objects.create(
            user_index=user,
            audit_action='Login',
            audit_desc=f"OTP sent for 2FA",
            audit_status='Success'
        )
        
        return Response(
            {
                'message': 'OTP code sent to your email.',
                'user_id': user.user_id,
                'email': user.email_add,
                'requires_2fa': True
            },
            status=status.HTTP_200_OK
        )


# 1b. OTP Verification View (Step 2 of 2FA: Verify OTP and issue tokens)
class VerifyOTPView(generics.GenericAPIView):
    """
    Step 2 of 2FA: Verify OTP code and issue JWT tokens
    """
    permission_classes = (AllowAny,)
    serializer_class = VerifyOTPSerializer
    
    def post(self, request, *args, **kwargs):
        """
        Verify OTP code and return JWT tokens if valid
        Expected input: {'user_id': 'xxx', 'otp_code': '123456'}
        """
        user_id = request.data.get('user_id')
        otp_code = request.data.get('otp_code')
        
        if not user_id or not otp_code:
            return Response(
                {'detail': 'user_id and otp_code are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Invalid user_id or OTP code.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Verify OTP
        is_valid, message = verify_otp(user, otp_code)
        
        if not is_valid:
            AuditLog.objects.create(
                user_index=user,
                audit_action='Login',
                audit_desc=f"Failed OTP verification - {message}",
                audit_status='Failed'
            )
            return Response(
                {'detail': message},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # OTP is valid, issue JWT tokens
        from rest_framework_simplejwt.tokens import RefreshToken
        
        refresh = RefreshToken.for_user(user)
        
        # Add custom claims to access token
        access_token = refresh.access_token
        access_token['user_id'] = user.user_id
        access_token['role_type'] = user.role_type
        access_token['first_name'] = user.first_name
        
        AuditLog.objects.create(
            user_index=user,
            audit_action='Login',
            audit_desc=f"User logged in successfully after 2FA",
            audit_status='Success'
        )
        
        return Response(
            {
                'access': str(access_token),
                'refresh': str(refresh),
                'user_id': user.user_id,
                'role_type': user.role_type,
                'first_name': user.first_name,
                'must_change_password': user.must_change_password,
                'message': 'Login successful!'
            },
            status=status.HTTP_200_OK
        )


# 1c. Test Email Endpoint (Development/Debugging)
class TestEmailView(generics.GenericAPIView):
    """
    Test endpoint for debugging email configuration
    POST with {'email': 'test@example.com'} to send a test email
    """
    permission_classes = (AllowAny,)
    
    def post(self, request, *args, **kwargs):
        """Send a test email"""
        test_email = request.data.get('email', 'test@example.com')
        
        from django.core.mail import send_mail
        
        print(f"\n{'='*60}")
        print(f"[TEST EMAIL]")
        print(f"To: {test_email}")
        print(f"From: {settings.DEFAULT_FROM_EMAIL}")
        print(f"Host: {settings.EMAIL_HOST}:{settings.EMAIL_PORT}")
        print(f"User: {settings.EMAIL_HOST_USER}")
        print(f"TLS: {settings.EMAIL_USE_TLS}")
        print(f"{'='*60}\n")
        
        try:
            send_mail(
                subject='Test Email from RKMS',
                message='This is a test email to verify your email configuration is working.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[test_email],
                fail_silently=False
            )
            print(f"✓ Test email sent successfully to {test_email}")
            return Response(
                {'message': f'Test email sent to {test_email}'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            print(f"\n✗ TEST EMAIL FAILED")
            print(f"Error: {str(e)}")
            print(f"{'='*60}\n")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# 2. Token Refresh View
class CustomTokenRefreshView(TokenRefreshView):
    permission_classes = (AllowAny,)

# Logout View
class LogoutView(generics.GenericAPIView):
    """Handle user logout and log the action"""
    permission_classes = (AllowAny,)
    
    def post(self, request, *args, **kwargs):
        """Log logout action and return success response"""
        try:
            # Log successful logout only if user is authenticated
            if request.user and request.user.is_authenticated:
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
            # Log failed logout attempt only if user is authenticated
            if request.user and request.user.is_authenticated:
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

# 4a. Update User Profile View (Protected) - for users to update their own profile
class UpdateUserProfileView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def patch(self, request, *args, **kwargs):
        """Allow users to update their own profile"""
        user = request.user
        
        # Only allow updating these fields
        allowed_fields = ['first_name', 'middle_name', 'last_name', 'suffix', 'email_add', 'user_contact', 'user_birthdate']
        
        for field in allowed_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        
        try:
            user.save()
        except Exception as e:
            return Response(
                {'detail': f'Failed to save profile: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Return updated user data
        return Response({
            'user_id': user.user_id,
            'first_name': user.first_name,
            'middle_name': user.middle_name,
            'last_name': user.last_name,
            'suffix': user.suffix,
            'email_add': user.email_add,
            'user_contact': user.user_contact,
            'user_birthdate': user.user_birthdate,
            'user_pos': user.user_pos,
            'role_type': user.role_type,
        }, status=status.HTTP_200_OK)

# 4b. Verify Password View (Protected)
class VerifyPasswordView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request, *args, **kwargs):
        """Verify the current user's password"""
        password = request.data.get('password')
        
        if not password:
            return Response(
                {'valid': False, 'detail': 'Password is required.'}, 
                status=status.HTTP_200_OK
            )
        
        # Debug: Log who we think is logged in
        print(f"DEBUG: Checking password for user_id={request.user.user_id}, user_index={request.user.pk}")
        print(f"DEBUG: Is authenticated: {request.user.is_authenticated}")
        
        # Check if the provided password matches the user's current password
        if request.user.check_password(password):
            return Response(
                {'valid': True, 'message': 'Password is correct.', 'logged_in_user': request.user.user_id},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {'valid': False, 'detail': 'Password is incorrect.', 'logged_in_user': request.user.user_id},
                status=status.HTTP_200_OK
            )

# 5. User ViewSet (Create, Read, Update, Delete)
from rest_framework.viewsets import ModelViewSet
from .models import Organization
from .serializers import UserCreateUpdateSerializer

class UserViewSet(ModelViewSet):
    queryset = CustomUser.objects.all()
    permission_classes = (IsAuthenticated,)  # Must be logged in
    lookup_field = 'user_id'

    def _run_access_disable_safeguard(self, target_user, actor_user):
        """Notify org admins and audit record recoverability when user access is disabled."""
        if not target_user or not target_user.org_id:
            return

        from documents.models import Folder, Document

        active_folder_count = Folder.objects.filter(
            created_by_user=target_user,
            owning_org_id=target_user.org_id,
            is_archived=False,
        ).count()
        active_document_count = Document.objects.filter(
            uploaded_by_user=target_user,
            owning_org_id=target_user.org_id,
            is_archived=False,
        ).count()

        msg = (
            f"Access-disable safeguard: user {target_user.user_id} was set inactive. "
            f"Org-owned records remain recoverable. "
            f"Active records created by user: {active_folder_count} folder(s), {active_document_count} document(s)."
        )

        # Inform active org admins except the actor to avoid redundant notifications.
        admin_users = CustomUser.objects.filter(
            org_id=target_user.org_id,
            is_active=True,
        ).filter(
            Q(role_type__in=['admin', 'system_admin']) | Q(is_staff=True) | Q(is_superuser=True)
        ).exclude(user_index=getattr(actor_user, 'user_index', None))

        for admin_user in admin_users:
            Notification.objects.create(
                recipient_user=admin_user,
                actor_user=actor_user,
                notif_msg=msg[:255],
            )

        AuditLog.objects.create(
            user_index=actor_user,
            audit_action='User Access Disabled Safeguard',
            audit_desc=msg,
            audit_status='Success'
        )
    
    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action in ['create', 'update', 'partial_update']:
            return UserCreateUpdateSerializer
        return UserSerializer
    
    def create(self, request, *args, **kwargs):
        """Create user and log the action"""
        try:
            response = super().create(request, *args, **kwargs)

            # Notify the newly created user to change their initial password immediately.
            try:
                created_user_id = response.data.get('user_id')
                created_user = User.objects.filter(user_id=created_user_id).first()
                if created_user is not None and request.user and request.user.is_authenticated:
                    Notification.objects.create(
                        recipient_user=created_user,
                        actor_user=request.user,
                        notif_msg='Your account is ready. Please change your password immediately after first login.'[:255],
                    )
            except Exception:
                # Notification delivery should not block user creation.
                pass

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
        target_user = self.get_object()
        was_active = target_user.is_active

        is_active_input = request.data.get('is_active', None)
        deactivating = False
        if is_active_input is not None:
            deactivating = was_active and str(is_active_input).strip().lower() in ['false', '0', 'no', 'off']

        try:
            response = super().update(request, *args, **kwargs)

            if deactivating:
                try:
                    target_user.refresh_from_db(fields=['is_active'])
                    if target_user.is_active is False:
                        self._run_access_disable_safeguard(target_user, request.user)
                except Exception as safeguard_error:
                    AuditLog.objects.create(
                        user_index=request.user,
                        audit_action='User Access Disabled Safeguard',
                        audit_desc=f"Failed to run safeguard for {target_user.user_id}: {str(safeguard_error)}",
                        audit_status='Failed'
                    )

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
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request, *args, **kwargs):
        """Change user password"""
        user = self.get_object()
        
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not current_password or not new_password or not confirm_password:
            return Response(
                {'detail': 'All fields are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != confirm_password:
            return Response(
                {'detail': 'New passwords do not match.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(current_password):
            return Response(
                {'detail': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user.set_password(new_password)
            user.must_change_password = False
            user.password_changed_at = timezone.now()
            user.save()
            
            # Log password change
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Change Password',
                audit_desc=f"Changed password for user {user.user_id}",
                audit_status='Success'
            )
            
            return Response(
                {'detail': 'Password changed successfully.'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Change Password',
                audit_desc=f"Failed to change password for user {user.user_id}: {str(e)}",
                audit_status='Failed'
            )
            return Response(
                {'detail': f'Failed to change password: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

# 6. Organization ViewSet (Create, Read, Update, Delete)
class OrganizationViewSet(ModelViewSet):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    lookup_field = 'org_id'
    
    def get_permissions(self):
        """Allow public read access, but require authentication for modifications"""
        if self.action in ['list', 'retrieve']:
            # Allow anyone to read organizations (needed for registration)
            permission_classes = [AllowAny]
        else:
            # Require authentication for create, update, delete
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
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
            org = self.get_object()
            org_id = self.kwargs.get('org_id', 'unknown')

            # Safeguard: prevent deleting orgs that still own records.
            from documents.models import Folder, Document
            folder_count = Folder.objects.filter((Q(owning_org=org) | Q(org=org)) & Q(is_archived=False)).count()
            document_count = Document.objects.filter(owning_org=org, is_archived=False).count()

            if folder_count > 0 or document_count > 0:
                msg = (
                    f"Cannot delete organization {org_id}. "
                    f"It still has {folder_count} folder(s) and {document_count} document(s). "
                    "Reassign or archive them first."
                )
                AuditLog.objects.create(
                    user_index=request.user,
                    audit_action='Delete Organization',
                    audit_desc=msg,
                    audit_status='Failed'
                )
                return Response({'detail': msg}, status=status.HTTP_400_BAD_REQUEST)

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

# 7. IdFormat ViewSet (Create, Read, Update, Delete)
class IdFormatViewSet(ModelViewSet):
    queryset = IdFormat.objects.all()
    serializer_class = IdFormatSerializer
    permission_classes = (IsAuthenticated,)  # Must be logged in
    lookup_field = 'format_id'
    
    def create(self, request, *args, **kwargs):
        """Create ID format and log the action"""
        try:
            response = super().create(request, *args, **kwargs)
            # Log successful ID format creation
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Create ID Format',
                audit_desc=f"Created ID format for organization",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed ID format creation
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Create ID Format',
                audit_desc=f"Failed to create ID format: {str(e)}",
                audit_status='Failed'
            )
            raise
    
    def update(self, request, *args, **kwargs):
        """Update ID format and log the action"""
        try:
            response = super().update(request, *args, **kwargs)
            # Log successful ID format update
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Update ID Format',
                audit_desc=f"Updated ID format {self.kwargs.get('format_id', 'unknown')}",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed ID format update
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Update ID Format',
                audit_desc=f"Failed to update ID format: {str(e)}",
                audit_status='Failed'
            )
            raise
    
    def destroy(self, request, *args, **kwargs):
        """Delete ID format and log the action"""
        try:
            format_id = self.kwargs.get('format_id', 'unknown')
            response = super().destroy(request, *args, **kwargs)
            # Log successful ID format deletion
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Delete ID Format',
                audit_desc=f"Deleted ID format {format_id}",
                audit_status='Success'
            )
            return response
        except Exception as e:
            # Log failed ID format deletion
            AuditLog.objects.create(
                user_index=request.user,
                audit_action='Delete ID Format',
                audit_desc=f"Failed to delete ID format: {str(e)}",
                audit_status='Failed'
            )
            raise


# 8. User Creation Request ViewSet
class UserCreationRequestViewSet(ModelViewSet):
    queryset = UserCreationRequest.objects.all()
    serializer_class = UserCreationRequestSerializer
    permission_classes = (AllowAny,)  # Public access - no JWT required
    lookup_field = 'request_id'
    
    def get_queryset(self):
        """Return all pending requests for system admins"""
        return UserCreationRequest.objects.all()
    
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def claim(self, request, request_id=None):
        """Claim a request for reviewing (first-come-first-serve)"""
        from django.db import transaction
        from django.utils import timezone
        
        try:
            user_creation_request = self.get_object()
            
            # Check if request is still pending
            if user_creation_request.status != 'pending':
                return Response(
                    {'detail': f'Request is already {user_creation_request.status}.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if already claimed
            if user_creation_request.claimed_by is not None:
                return Response(
                    {
                        'detail': 'This request is already being reviewed.',
                        'claimed_by': user_creation_request.claimed_by.user_id,
                        'claimed_by_name': f"{user_creation_request.claimed_by.first_name} {user_creation_request.claimed_by.last_name}",
                        'claimed_at': user_creation_request.claimed_at
                    },
                    status=status.HTTP_409_CONFLICT
                )
            
            # Get the admin name from request data
            admin_name = request.data.get('admin_name', 'System Admin')
            try:
                claiming_admin = User.objects.get(user_id=admin_name)
            except User.DoesNotExist:
                return Response(
                    {'detail': f'Admin user {admin_name} not found.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Use atomic transaction to ensure only one claim succeeds
            with transaction.atomic():
                # Select for update to lock the row
                locked_request = UserCreationRequest.objects.select_for_update().get(request_id=request_id)
                
                # Double-check claim status hasn't changed
                if locked_request.claimed_by is not None:
                    return Response(
                        {
                            'detail': 'This request was just claimed by another admin.',
                            'claimed_by': locked_request.claimed_by.user_id,
                            'claimed_by_name': f"{locked_request.claimed_by.first_name} {locked_request.claimed_by.last_name}",
                        },
                        status=status.HTTP_409_CONFLICT
                    )
                
                # Set claim
                locked_request.claimed_by = claiming_admin
                locked_request.claimed_at = timezone.now()
                locked_request.save()
            
            # Log the claim
            AuditLog.objects.create(
                user_index=claiming_admin,
                audit_action='Claim User Creation Request',
                audit_desc=f"Claimed user creation request {request_id} for {user_creation_request.email_add}",
                audit_status='Success'
            )
            
            serializer = self.get_serializer(locked_request)
            return Response(
                {
                    'detail': 'Request claimed successfully. You have this request locked.',
                    'request': serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'detail': f'Error claiming request: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def approve(self, request, request_id=None):
        """Approve a user creation request"""
        user_creation_request = self.get_object()
        
        # Check if request is still pending
        if user_creation_request.status != 'pending':
            return Response(
                {'detail': f'Request is already {user_creation_request.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if claimed by someone (anyone can approve if claimed, but we track who)
        if user_creation_request.claimed_by is None:
            return Response(
                {'detail': 'Request must be claimed before approval.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reviewer_user_id = request.data.get('reviewer_user_id')
        if not reviewer_user_id:
            return Response(
                {'detail': 'reviewer_user_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user_creation_request.claimed_by.user_id != reviewer_user_id:
            return Response(
                {'detail': 'Only the admin who claimed this request can approve it.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Verify organization exists
        if not user_creation_request.org:
            return Response(
                {'detail': 'Organization not found.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            reviewer = user_creation_request.claimed_by

            # Get the assigned user ID from request data
            assigned_user_id = request.data.get('assigned_user_id')
            if not assigned_user_id:
                return Response(
                    {'detail': 'assigned_user_id is required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            role_type = request.data.get('role_type', 'user')
            if role_type not in ['user', 'admin']:
                return Response(
                    {'detail': 'role_type must be either "user" or "admin".'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if user ID already exists
            if User.objects.filter(user_id=assigned_user_id).exists():
                return Response(
                    {'detail': f'User ID {assigned_user_id} already exists.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create the new user from the request data
            new_user = User.objects.create_user(
                user_id=assigned_user_id,
                email_add=user_creation_request.email_add,
                password='TEMP_PASSWORD_12!',  # Temporary password, user should reset
                first_name=user_creation_request.first_name,
                middle_name=user_creation_request.middle_name,
                last_name=user_creation_request.last_name,
                suffix=user_creation_request.suffix,
                user_pos=user_creation_request.user_pos,
                user_contact=user_creation_request.user_contact,
                user_birthdate=user_creation_request.user_birthdate,
                org=user_creation_request.org,
                role_type=role_type,
                is_active=True
            )
            
            # Update the request status
            from django.utils import timezone
            user_creation_request.status = 'approved'
            user_creation_request.reviewed_by = user_creation_request.claimed_by  # Use whoever claimed it
            user_creation_request.reviewed_at = timezone.now()
            user_creation_request.assigned_user_id = assigned_user_id
            user_creation_request.claimed_by = None  # Clear claim
            user_creation_request.claimed_at = None
            user_creation_request.save()

            # Notify the approved user to change their temporary password immediately.
            try:
                actor = reviewer or user_creation_request.reviewed_by
                if actor is not None:
                    Notification.objects.create(
                        recipient_user=new_user,
                        actor_user=actor,
                        notif_msg='Your account request was approved. Please change your temporary password immediately after login.'[:255],
                    )
            except Exception:
                # Notification delivery should not block approval flow.
                pass
            
            # Log the approval in audit log
            AuditLog.objects.create(
                user_index=user_creation_request.reviewed_by,
                audit_action='Approve User Creation Request',
                audit_desc=f"Approved user creation request {request_id} for {user_creation_request.email_add}. Assigned User ID: {assigned_user_id}",
                audit_status='Success'
            )
            
            serializer = self.get_serializer(user_creation_request)
            return Response(
                {
                    'detail': f'User creation request approved. New user ID: {assigned_user_id}',
                    'request': serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            # Log the failed approval
            AuditLog.objects.create(
                user_index=user_creation_request.claimed_by,
                audit_action='Approve User Creation Request',
                audit_desc=f"Failed to approve user creation request {request_id}: {str(e)}",
                audit_status='Failed'
            )
            return Response(
                {'detail': f'Error approving request: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def deny(self, request, request_id=None):
        """Deny a user creation request"""
        user_creation_request = self.get_object()
        
        # Check if request is still pending
        if user_creation_request.status != 'pending':
            return Response(
                {'detail': f'Request is already {user_creation_request.status}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if claimed by someone
        if user_creation_request.claimed_by is None:
            return Response(
                {'detail': 'Request must be claimed before denial.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reviewer_user_id = request.data.get('reviewer_user_id')
        if not reviewer_user_id:
            return Response(
                {'detail': 'reviewer_user_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if user_creation_request.claimed_by.user_id != reviewer_user_id:
            return Response(
                {'detail': 'Only the admin who claimed this request can deny it.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Get the denial reason from request data
            denial_reason = request.data.get('denial_reason', '')
            
            # Update the request status
            from django.utils import timezone
            user_creation_request.status = 'denied'
            user_creation_request.reviewed_by = user_creation_request.claimed_by  # Use whoever claimed it
            user_creation_request.reviewed_at = timezone.now()
            user_creation_request.denial_reason = denial_reason
            user_creation_request.claimed_by = None  # Clear claim
            user_creation_request.claimed_at = None
            user_creation_request.save()
            
            # Log the denial in audit log
            AuditLog.objects.create(
                user_index=user_creation_request.reviewed_by,
                audit_action='Deny User Creation Request',
                audit_desc=f"Denied user creation request {request_id} for {user_creation_request.email_add}. Reason: {denial_reason}",
                audit_status='Success'
            )
            
            serializer = self.get_serializer(user_creation_request)
            return Response(
                {
                    'detail': 'User creation request denied.',
                    'request': serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            # Log the failed denial
            AuditLog.objects.create(
                user_index=user_creation_request.claimed_by,
                audit_action='Deny User Creation Request',
                audit_desc=f"Failed to deny user creation request {request_id}: {str(e)}",
                audit_status='Failed'
            )
            return Response(
                {'detail': f'Error denying request: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


# 9. User Registration Request View (for public registration)
class UserRegistrationRequestView(generics.CreateAPIView):
    """Create a user creation request (public registration)"""
    queryset = UserCreationRequest.objects.all()
    serializer_class = UserCreationRequestCreateSerializer
    permission_classes = (AllowAny,)
    
    def create(self, request, *args, **kwargs):
        """Create user creation request and log the action"""
        try:
            # Validate organization
            org_id = request.data.get('org')
            from .models import Organization
            try:
                organization = Organization.objects.get(org_id=org_id)
            except Organization.DoesNotExist:
                return Response(
                    {'detail': 'Organization not found.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if email already registered or has pending request
            email = request.data.get('email_add')
            if User.objects.filter(email_add=email).exists():
                return Response(
                    {'detail': 'This email is already registered.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            if UserCreationRequest.objects.filter(email_add=email, status='pending').exists():
                return Response(
                    {'detail': 'A registration request with this email is already pending.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            denied_request = UserCreationRequest.objects.filter(
                email_add=email,
                status='denied'
            ).order_by('-created_at').first()

            if denied_request:
                # Re-open denied request using validated latest submitted data.
                data = dict(request.data)
                data['created_by'] = data.get('email_add')
                serializer = self.get_serializer(denied_request, data=data)
                serializer.is_valid(raise_exception=True)
                validated = serializer.validated_data

                denied_request.first_name = validated.get('first_name', denied_request.first_name)
                denied_request.middle_name = validated.get('middle_name', denied_request.middle_name)
                denied_request.last_name = validated.get('last_name', denied_request.last_name)
                denied_request.suffix = validated.get('suffix', denied_request.suffix)
                denied_request.user_pos = validated.get('user_pos', denied_request.user_pos)
                denied_request.user_contact = validated.get('user_contact', denied_request.user_contact)
                denied_request.user_birthdate = validated.get('user_birthdate', denied_request.user_birthdate)
                denied_request.org = validated.get('org', organization)
                denied_request.created_by = validated.get('created_by', email)
                denied_request.status = 'pending'
                denied_request.claimed_by = None
                denied_request.claimed_at = None
                denied_request.reviewed_by = None
                denied_request.reviewed_at = None
                denied_request.assigned_user_id = None
                denied_request.denial_reason = ''
                denied_request.save()

                created_request = denied_request
                headers = {}
            else:
                # Create a mutable copy of request data with created_by field
                data = dict(request.data)
                data['created_by'] = data.get('email_add')

                # Create the serializer with the modified data
                serializer = self.get_serializer(data=data)
                serializer.is_valid(raise_exception=True)
                self.perform_create(serializer)
                headers = self.get_success_headers(serializer.data)
                created_request = serializer.instance

            # Notify system admins that a new user creation request is waiting for review.
            admin_users = User.objects.filter(is_active=True).filter(
                Q(is_superuser=True) | Q(role_type='system_admin')
            ).distinct()
            for admin_user in admin_users:
                Notification.objects.get_or_create(
                    recipient_user=admin_user,
                    notif_msg=(
                        f"New user creation request {created_request.request_id} "
                        f"from {created_request.email_add}."
                    ),
                    defaults={'actor_user': admin_user}
                )
            
            # Log successful registration request
            AuditLog.objects.create(
                user_index=None,
                audit_action='Create User Registration Request',
                audit_desc=f"User registration request created for {email}",
                audit_status='Success'
            )
            
            return Response(
                {
                    'detail': 'Registration request submitted successfully. Please coordinate with the IS Manager for activation.',
                    'request_id': created_request.request_id
                },
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        except Exception as e:
            # Log failed registration request
            AuditLog.objects.create(
                user_index=None,
                audit_action='Create User Registration Request',
                audit_desc=f"Failed to create registration request: {str(e)}",
                audit_status='Failed'
            )
            return Response(
                {'detail': f'Error creating registration request: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )