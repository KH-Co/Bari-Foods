from django.contrib import admin
from .models import Product, UserProfile, PopularProducts
# Register your models here.

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'stock', 'weight', 'tag', 'rating', 'created_at', 'updated_at')
    list_filter = ('tag','created_at')
    search_fields = ('name', 'description', 'tag')
    
@admin.register(PopularProducts)
class PopularProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'stock', 'weight', 'tag', 'rating', 'created_at', 'updated_at')
    list_filter = ('tag','created_at')
    search_fields = ('name', 'description', 'tag')

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'address', 'phone')
    search_fields = ('user__username', 'phone')