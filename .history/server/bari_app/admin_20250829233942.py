from django.contrib import admin
from .models import Product
# Register your models here.

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name','description', 'price', 'stock', 'weight', 'rating', 'created_at', 'updated_at')
    list_filter = ( 'is_available', 'created_at')
    search_fields = ('name', 'description')
    