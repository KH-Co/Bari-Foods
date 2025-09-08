from django.contrib import admin
from .models import Product, UserProfile,FeaturedProduct
# Register your models here.

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'stock', 'weight', 'tag', 'rating', 'created_at', 'updated_at')
    list_filter = ('tag','created_at')
    search_fields = ('name', 'description', 'tag')
    
@admin.register(FeaturedProduct)
class FeaturedProductAdmin(admin.ModelAdmin):
    list_display = ('product', 'is_active', 'created_at')
    list_filter = ('is_active',)
    raw_id_fields = ('product',)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'address', 'phone')
    search_fields = ('user__username', 'phone')