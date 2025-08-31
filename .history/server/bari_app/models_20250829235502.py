from django.db import models

# Create your models here.
class Product(models.Model):
    name= models.CharField(max_length=250)
    description= models.TextField()
    price= models.DecimalField(max_digits=10, decimal_places=2)
    stock= models.IntegerField(default=0)
    image = models.ImageField(upload_to='products/')
    weight = models.DecimalField(max_digits=6, decimal_places=2, help_text="Weight in kg")
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    tag = models.CharField(max_length=50, blank=True, null=True
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name