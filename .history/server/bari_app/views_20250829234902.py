# bari_foods_backend/bari_app/views.py

from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import Product
from .serializers import ProductSerializer

class ProductListCreateAPIView(generics.ListCreateAPIView):

    queryset = Product.objects.all() # Changed to .all() to allow creation
    serializer_class = ProductSerializer
    permission_classes = [AllowAny] 

class ProductDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]