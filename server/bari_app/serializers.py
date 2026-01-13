from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Product, UserProfile, CartItem, Order, OrderItem, Address, FeaturedProduct, ProductImage
from rest_framework_simplejwt.tokens import RefreshToken

# --- PRODUCT SERIALIZERS ---
class ProductSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)
    
    # NEW: Add a method field to get the list of gallery image URLs
    images = serializers.SerializerMethodField()

    class Meta:
        model = Product
        # NEW: Added 'images' to this list
        fields = ['id', 'name', 'description', 'price', 'image', 'images', 'stock', 'weight', 'tag', 'rating', 'created_at']

    # NEW: Logic to build the list of URLs
    def get_images(self, obj):
        request = self.context.get('request')
        # Start with the main image
        image_list = []
        if obj.image:
            # Check if request exists to build absolute URI, otherwise fallback to relative
            image_list.append(request.build_absolute_uri(obj.image.url) if request else obj.image.url)
        
        # Add the gallery images
        for img in obj.images.all():
            if img.image:
                url = request.build_absolute_uri(img.image.url) if request else img.image.url
                image_list.append(url)
        
        return image_list

class FeaturedProductSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = FeaturedProduct
        fields = ('id', 'product', 'is_active')

# --- USER & PROFILE SERIALIZERS ---

class UserProfileSerializer(serializers.ModelSerializer):
    # Explicitly map User model fields so they appear in the Profile API
    username = serializers.CharField(source='user.username', read_only=True)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'address', 'phone', 'gender', 'date_of_birth']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        
        user = instance.user
        if 'first_name' in user_data:
            user.first_name = user_data.get('first_name')
        if 'last_name' in user_data:
            user.last_name = user_data.get('last_name')
        user.save()

        return super().update(instance, validated_data)

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

# --- CART & ORDER SERIALIZERS ---
class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = CartItem
        fields = ('id', 'product', 'quantity', 'added_at')

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'quantity', 'price_at_purchase')

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'user', 'items', 'total_price', 'status', 'payment_method', 'created_at')
        read_only_fields = ('user', 'total_price', 'created_at')

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'
        read_only_fields = ('user',)