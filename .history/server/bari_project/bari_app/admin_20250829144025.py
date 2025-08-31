from django.contrib import admin
from .models import Product

# Register your models here.
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'stock_quantity', 'is_available','rating', 'rating_count',)
    search_fields = ('name', 'description')
    list_filter = ('is_available',)
    
    