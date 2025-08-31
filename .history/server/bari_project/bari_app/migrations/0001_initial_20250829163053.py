
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('price', models.DecimalField(decimal_places=2, max_digits=10)),
                ('weight', models.DecimalField(decimal_places=2, max_digits=6)),
                ('image', models.ImageField(upload_to='products/')),
                ('rating', models.DecimalField(decimal_places=2, default=0.0, max_digits=3)),
                ('rating_count', models.IntegerField(default=0)),
                ('stock_quantity', models.IntegerField(default=0)),
                ('is_available', models.BooleanField(default=True)),
            ],
        ),
    ]
