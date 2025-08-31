from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product , UserProfile

class ProductSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)
    
    class Meta:
        model = Product
        fields = '__all__'   
        
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'profile')


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    address = serializers.CharField(write_only=True, required=False)
    phone = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'address', 'phone')

    def create(self, validated_data):
        address = validated_data.pop('address', '')
        phone = validated_data.pop('phone', '')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user, address=address, phone=phone)
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)