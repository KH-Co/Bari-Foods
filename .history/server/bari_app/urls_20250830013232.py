from django.urls import path
from .views import ProductListCreateAPIView, ProductDetailAPIView, UserRegistrationAPIView, UserLoginAPIView, UserProfileAPIView, CartAPIView, CartItemDetailAPIView

urlpatterns = [
    path('products/', ProductListCreateAPIView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
    
    # User APIs
    path('users/register/', UserRegistrationAPIView.as_view(), name='user-register'),
    path('users/login/', UserLoginAPIView.as_view(), name='user-login'),
    path('users/profile/', UserProfileAPIView.as_view(), name='user-profile'),
    
    
    #cart api
    path('cart/', CartAPIView.as_view(), name='cart-detail'),
    path('cart/<int:item_id>/', CartItemDetailAPIView.as_view(), name='cart-item-detail'),
]
