from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Product(models.Model):
    name= models.CharField(max_length=250)
    description= models.TextField()
    price= models.DecimalField(max_digits=10, decimal_places=2)
    stock= models.IntegerField(default=0)
    image = models.ImageField(upload_to='products/')
    weight = models.DecimalField(max_digits=6, decimal_places=2, help_text="Weight in kg")
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    tag = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    

    
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    address = models.TextField(blank=True, null=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.user.username
    
    
class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity} x {self.product.name} for {self.user.username}"
    