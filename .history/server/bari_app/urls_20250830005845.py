from django.urls import path
from .views import ProductListCreateAPIView, ProductDetailAPIView, UserRegistrationAPIView, UserLoginAPIView, UserProfileAPIView

urlpatterns = [
    path('products/', ProductListCreateAPIView.as_view(), name='product-list'),
    path('products/<int:pk>/', ProductDetailAPIView.as_view(), name='product-detail'),
    
    # User APIs
    path('users/register/', UserRegistrationAPIView.as_view(), name='user-register'),
    path('users/login/', UserLoginAPIView.as_view(), name='user-login'),
    path('users/profile/', UserProfileAPIView.as_view(), name='user-profile'),
]
