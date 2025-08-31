# bari_foods_backend/bari_app/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User # <-- Add this line
from django.contrib.auth import authenticate, login

from .models import Product, UserProfile
from .serializers import (
    ProductSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
)

class ProductListCreateAPIView(generics.ListCreateAPIView):

    queryset = Product.objects.all() # Changed to .all() to allow creation
    serializer_class = ProductSerializer
    permission_classes = [AllowAny] 

class ProductDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    
    
# Additional views for user registration and login can be added here as needed.
class UserRegistrationAPIView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

class UserLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.userprofile