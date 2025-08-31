from django.shortcuts import render

from django.http import HttpResponse
from .models import Product
# Create your views here.

def home(request):
    return HttpResponse("Hello, world. You're at the bari_app.")

def product_list(request):
    products = Product.objects.all()
    return render(request, 'products.html', {'products': products})