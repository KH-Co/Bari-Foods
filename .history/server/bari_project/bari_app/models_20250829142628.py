from django.db import models

# Create your models here.
class Product(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    weight = models.DecimalField(max_digits=6, decimal_places=2) 
    image = models.ImageField(upload_to='products/')
    rating = models.FloatField(default=0.0)
    stock_quantity = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True)

    def __str__(self):
        return self.name