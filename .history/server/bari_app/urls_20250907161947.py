from django.urls import path
from .views import (ProductListCreateAPIView, ProductDetailAPIView,PopularProductList, UserRegistrationAPIView, UserLoginAPIView, UserProfileAPIView, CartAPIView, CartItemDetailAPIView,CheckoutAPIView,OrderListAPIView, AddressListCreateAPIView,AddressDetailAPIView )

urlpatterns = [
    path('products/', ProductListCreateAPIView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
    path('products/popular/', PopularProductList.as_view(), name='popular-products-list'),
    
    # User APIs
    path('users/register/', UserRegistrationAPIView.as_view(), name='user-register'),
    path('users/login/', UserLoginAPIView.as_view(), name='user-login'),
    path('users/profile/', UserProfileAPIView.as_view(), name='user-profile'),
    
    
    #cart api
    path('cart/', CartAPIView.as_view(), name='cart-detail'),
    path('cart/<int:item_id>/', CartItemDetailAPIView.as_view(), name='cart-item-detail'),
    
    #order api
    path('checkout/', CheckoutAPIView.as_view(), name='checkout'),
    path('orders/', OrderListAPIView.as_view(), name='order-list'),
    path('addresses/', AddressListCreateAPIView.as_view(), name='address-list'),
    path('addresses/<int:pk>/', AddressDetailAPIView.as_view(), name='address-detail'),
]
