from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

UserModel = get_user_model()

class CustomUserBackend(ModelBackend):
    """
    Custom authentication backend that uses 'user_id' instead of 'username'
    """
    def authenticate(self, request, user_id=None, password=None, **kwargs):
        try:
            user = UserModel.objects.get(user_id=user_id)
        except UserModel.DoesNotExist:
            return None
        
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
    
    def get_user(self, user_id):
        try:
            return UserModel.objects.get(user_id=user_id)
        except UserModel.DoesNotExist:
            return None
