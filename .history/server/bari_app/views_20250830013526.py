# bari_foods_backend/bari_app/views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User 
from django.contrib.auth import authenticate, login

from .models import Product, UserProfile, CartItem
from .serializers import (
    ProductSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    CartItemSerializer,
    
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
    
    
class CartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart_items = CartItem.objects.filter(user=request.user)
        serializer = CartItemSerializer(cart_items, many=True)
        return Response(serializer.data)

    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity', 1)

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({"detail": "Product not found."}, status=status.HTTP_404_NOT_FOUND)

        cart_item, created = CartItem.objects.get_or_create(
            user=request.user, product=product,
            defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity += int(quantity)
            cart_item.save()

        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CartItemDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, item_id):
        try:
            cart_item = CartItem.objects.get(id=item_id, user=request.user)
        except CartItem.DoesNotExist:
            return Response({"detail": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

        quantity = request.data.get('quantity')
        if quantity is None or not isinstance(quantity, int) or quantity <= 0:
            return Response({"detail": "Quantity must be a positive integer."}, status=status.HTTP_400_BAD_REQUEST)

        cart_item.quantity = quantity
        cart_item.save()
        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, item_id):
        try:
            cart_item = CartItem.objects.get(id=item_id, user=request.user)
        except CartItem.DoesNotExist:
            return Response({"detail": "Cart item not found."}, status=status.HTTP_404_NOT_FOUND)

        cart_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)