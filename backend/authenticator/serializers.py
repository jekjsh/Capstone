#backend logic here

from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser, Office

# 1. Office Serializer (So we see "College of Science" instead of just "ID: 5")
class OfficeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Office
        fields = ['id', 'office_name', 'office_code']

# 2. User Serializer
class UserSerializer(serializers.ModelSerializer):
    # Validations
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=CustomUser.objects.all())]
    )
    password = serializers.CharField(write_only=True, min_length=8)
    
    # Handling the Office Relationship
    # Input: Accepts an ID (e.g., 5) when creating a user
    office_id = serializers.PrimaryKeyRelatedField(
        queryset=Office.objects.all(), source='office', write_only=True, required=False
    )
    # Output: Returns the full Office object details when viewing a user
    office_details = OfficeSerializer(source='office', read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "profile_pic",
            # Hierarchy Fields
            "office_id",      # Input (Write Only)
            "office_details", # Output (Read Only)
            "is_office_head",
            "position_title",
            # System Role
            "is_system_admin",
        ]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        # Pop password to hash it properly
        password = validated_data.pop("password")
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        # Allow updating password securely if provided
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
        
        return super().update(instance, validated_data)