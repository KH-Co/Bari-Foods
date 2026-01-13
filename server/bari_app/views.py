from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction # Needed for atomic transactions
from django.conf import settings # <--- ADDED: To access RAZORPAY_KEY_ID
import razorpay # <--- ADDED: Razorpay library

# Import all models
from .models import Product, CartItem, Order, OrderItem, Address, FeaturedProduct, UserProfile

# Import all serializers
from .serializers import (
    ProductSerializer, 
    UserRegistrationSerializer, 
    UserLoginSerializer, 
    UserProfileSerializer,
    CartItemSerializer,
    OrderSerializer,
    AddressSerializer,
    FeaturedProductSerializer
)
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

# --- PRODUCT VIEWS ---
class ProductListCreateAPIView(generics.ListCreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny] 

class ProductDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

class FeaturedProductListAPIView(generics.ListAPIView):
    queryset = FeaturedProduct.objects.filter(is_active=True)
    serializer_class = FeaturedProductSerializer
    permission_classes = [AllowAny]

# --- USER VIEWS ---
@method_decorator(csrf_exempt, name='dispatch')
class UserRegistrationAPIView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

@method_decorator(csrf_exempt, name='dispatch')
class UserLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user = authenticate(username=username, password=password)
            
            if user:
                refresh = RefreshToken.for_user(user)
                profile, created = UserProfile.objects.get_or_create(user=user)
                
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'mobile': profile.phone if profile else "",
                    'gender': profile.gender if profile else "",
                    'date_of_birth': str(profile.date_of_birth) if profile and profile.date_of_birth else ""
                }, status=status.HTTP_200_OK)
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        obj, created = UserProfile.objects.get_or_create(user=self.request.user)
        return obj

# --- CART VIEWS ---
class CartAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart_items = CartItem.objects.filter(user=request.user)
        serializer = CartItemSerializer(cart_items, many=True)
        return Response(serializer.data)

    def post(self, request):
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            product = Product.objects.get(id=product_id)
            cart_item, created = CartItem.objects.get_or_create(
                user=request.user, 
                product=product
            )
            if not created:
                cart_item.quantity += quantity
            else:
                cart_item.quantity = quantity
            cart_item.save()
            return Response({'message': 'Item added to cart'}, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

class CartItemDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, item_id):
        try:
            cart_item = CartItem.objects.get(id=item_id, user=request.user)
            quantity = request.data.get('quantity')
            
            if quantity is not None:
                cart_item.quantity = int(quantity)
                cart_item.save()
                return Response(CartItemSerializer(cart_item).data, status=status.HTTP_200_OK)
            
            return Response({'error': 'Quantity is required'}, status=status.HTTP_400_BAD_REQUEST)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, item_id):
        try:
            cart_item = CartItem.objects.get(id=item_id, user=request.user)
            cart_item.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)

# --- ORDER VIEWS (STANDARD COD) ---
class OrderListAPIView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')

class CheckoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cart_items = CartItem.objects.filter(user=request.user)
        if not cart_items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        total_price = sum(item.product.price * item.quantity for item in cart_items)
        payment_method = request.data.get('payment_method', 'cod')

        with transaction.atomic():
            order = Order.objects.create(
                user=request.user,
                total_price=total_price,
                status='Pending',
                payment_method=payment_method
            )

            for item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price_at_purchase=item.product.price
                )
            
            cart_items.delete()

        return Response({'message': 'Order placed successfully', 'order_id': order.id}, status=status.HTTP_201_CREATED)

# --- ADDRESS VIEWS ---
class AddressListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AddressSerializer

    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class AddressDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = AddressSerializer
    
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)


# ==========================================
#        RAZORPAY INTEGRATION VIEWS
# ==========================================

# 1. Initiate Payment (Create Razorpay Order ID)
class RazorpayOrderCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        cart_items = CartItem.objects.filter(user=request.user)
        if not cart_items.exists():
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate Total
        total_price = sum(item.product.price * item.quantity for item in cart_items)
        
        # Initialize Razorpay Client
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
        # Create Order (Amount must be in Paise: 100 INR = 10000 Paise)
        data = {
            "amount": int(total_price * 100),
            "currency": "INR",
            "receipt": f"order_rcptid_{request.user.id}",
            "payment_capture": 1
        }
        razorpay_order = client.order.create(data=data)
        
        return Response({
            'order_id': razorpay_order['id'],
            'amount': razorpay_order['amount'],
            'key': settings.RAZORPAY_KEY_ID,
            'user_email': request.user.email,
            'user_phone': request.user.userprofile.phone if hasattr(request.user, 'userprofile') else ""
        })

# 2. Verify Payment (Create Local Order after Success)
class RazorpayPaymentVerifyAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

        try:
            # Verify the signature
            params_dict = {
                'razorpay_order_id': data.get('razorpay_order_id'),
                'razorpay_payment_id': data.get('razorpay_payment_id'),
                'razorpay_signature': data.get('razorpay_signature')
            }
            client.utility.verify_payment_signature(params_dict)

            # --- SIGNATURE VALID: Create Order in Database ---
            with transaction.atomic():
                cart_items = CartItem.objects.filter(user=request.user)
                if not cart_items.exists():
                     return Response({'error': 'Cart empty or already processed'}, status=400)

                total_price = sum(item.product.price * item.quantity for item in cart_items)

                # Create Order
                order = Order.objects.create(
                    user=request.user,
                    total_price=total_price,
                    status='Pending',
                    payment_method='razorpay' # Mark as Razorpay
                )

                # Move items
                for item in cart_items:
                    OrderItem.objects.create(
                        order=order,
                        product=item.product,
                        quantity=item.quantity,
                        price_at_purchase=item.product.price
                    )
                
                # Clear Cart
                cart_items.delete()

            return Response({'message': 'Payment Successful', 'order_id': order.id}, status=status.HTTP_201_CREATED)

        except razorpay.errors.SignatureVerificationError:
            return Response({'error': 'Payment verification failed'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)