from django.contrib import admin
from django.utils.html import format_html 
from .models import Product, UserProfile, FeaturedProduct, Order, OrderItem, Address, ProductImage

# --- NEW: Product Image Inline ---
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1

# --- 1. Product Management ---
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    # Added 'list_editable' so you can change price/stock without opening the item
    list_display = ('name', 'price', 'stock', 'weight', 'tag', 'rating', 'created_at')
    list_filter = ('tag', 'created_at')
    search_fields = ('name', 'description', 'tag')
    list_editable = ('price', 'stock')
    
    # NEW: Add the inline here so you can upload extra images
    inlines = [ProductImageInline]

# --- 2. Order Management ---

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'quantity', 'price_at_purchase')
    can_delete = False

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_info', 'total_price', 'status', 'payment_method', 'created_at')
    list_filter = ('status', 'created_at', 'payment_method')
    search_fields = ('id', 'user__email', 'user__username', 'user__first_name')
    list_editable = ('status',)
    inlines = [OrderItemInline]

    readonly_fields = ('customer_address_info', 'created_at')

    fieldsets = (
        ('Order Information', {
            'fields': ('user', 'status', 'total_price', 'payment_method', 'created_at')
        }),
        ('Shipping Details', {
            'fields': ('customer_address_info',)
        }),
    )

    def user_info(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name} ({obj.user.email})"
    user_info.short_description = 'Customer'

    def customer_address_info(self, obj):
        # Fetch all addresses for this customer
        addresses = Address.objects.filter(user=obj.user)
        
        if not addresses.exists():
            return format_html('<span style="color: red;">No address found for this customer.</span>')
        
        # Create HTML to show them nicely
        html_content = ""
        for addr in addresses:
            html_content += f"""
            <div style="
                background: #f8f9fa; 
                padding: 15px; 
                margin-bottom: 10px; 
                border-left: 4px solid #2c3e50; 
                border-radius: 4px; 
                color: #333;">
                <strong style="color: #2c3e50; font-size: 14px;">{addr.type.upper()} ({addr.name})</strong><br>
                <span style="display: inline-block; margin-top: 5px;">
                    {addr.street}<br>
                    {addr.city}, {addr.state} - <strong>{addr.pincode}</strong><br>
                    <i class="fas fa-phone"></i> {addr.phone}
                </span>
            </div>
            """
        return format_html(html_content)
    
    customer_address_info.short_description = "Delivery Destination"

# --- 3. Address Management ---
@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ('user', 'name', 'city', 'type', 'pincode')
    list_filter = ('city', 'type')
    search_fields = ('user__username', 'name', 'city', 'pincode')

# --- 4. User Profile Management ---
@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone', 'gender')
    search_fields = ('user__username', 'phone')

# --- 5. Featured Products ---
@admin.register(FeaturedProduct)
class FeaturedProductAdmin(admin.ModelAdmin):
    list_display = ('product', 'is_active', 'created_at')
    list_filter = ('is_active',)
    raw_id_fields = ('product',)