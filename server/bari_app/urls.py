from django.urls import path

from .views import (
    ProductListCreateAPIView, 
    ProductDetailAPIView, 
    UserRegistrationAPIView, 
    UserLoginAPIView, 
    UserProfileAPIView, 
    CartAPIView, 
    CartItemDetailAPIView,
    CheckoutAPIView,
    OrderListAPIView, 
    AddressListCreateAPIView,
    AddressDetailAPIView, 
    FeaturedProductListAPIView,
    # --- ADDED THESE IMPORTS ---
    RazorpayOrderCreateAPIView,
    RazorpayPaymentVerifyAPIView
)

urlpatterns = [

    path('products/', ProductListCreateAPIView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
    path('featured-products/', FeaturedProductListAPIView.as_view(), name='featured-products'),
    
    # User APIs
    path('users/register/', UserRegistrationAPIView.as_view(), name='user-register'),
    path('users/login/', UserLoginAPIView.as_view(), name='user-login'),
    path('users/profile/', UserProfileAPIView.as_view(), name='user-profile'),
    
    # Cart APIs
    path('cart/', CartAPIView.as_view(), name='cart-detail'),
    path('cart/<int:item_id>/', CartItemDetailAPIView.as_view(), name='cart-item-detail'),
    
    # Order APIs
    path('checkout/', CheckoutAPIView.as_view(), name='checkout'), # For COD
    path('orders/', OrderListAPIView.as_view(), name='order-list'),
    
    # Address APIs
    path('addresses/', AddressListCreateAPIView.as_view(), name='address-list'),
    path('addresses/<int:pk>/', AddressDetailAPIView.as_view(), name='address-detail'),

    # --- RAZORPAY API URLS ---
    path('payment/create/', RazorpayOrderCreateAPIView.as_view(), name='razorpay-create'),
    path('payment/verify/', RazorpayPaymentVerifyAPIView.as_view(), name='razorpay-verify'),
]