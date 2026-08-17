"""
Django management command to populate sample product data for testing.

Usage:
    python manage.py populate_sample_products

This command creates:
- Sample Fabrics (Cotton, Linen)
- Sample Colors (Red, Blue, Pink, Black)
- Sample Sizes (S, M, L, 0-3 Months, 3-6 Months, etc.)
- Sample Collections (New Arrivals, Girls Collection, etc.)
- 3-4 Sample Products with variants, sizes, and stock
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from ComfyCuteApp.models import (
    Product, ProductVariant, ProductVariantImage, VariantSizeStock,
    Collection, Fabric, Color, Size, Category, SubCategory
)


class Command(BaseCommand):
    help = 'Populate the database with sample product data for testing'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting sample data population...'))

        try:
            with transaction.atomic():
                # Create/Get Fabrics
                self.stdout.write('Creating fabrics...')
                fabrics = self._create_fabrics()

                # Create/Get Colors
                self.stdout.write('Creating colors...')
                colors = self._create_colors()

                # Create/Get Sizes
                self.stdout.write('Creating sizes...')
                sizes = self._create_sizes()

                # Create/Get Collections
                self.stdout.write('Creating collections...')
                collections = self._create_collections()

                # Get existing categories and subcategories
                self.stdout.write('Fetching existing categories and subcategories...')
                categories = self._get_categories()

                # Create Sample Products
                self.stdout.write('Creating sample products...')
                self._create_sample_products(fabrics, colors, sizes, collections, categories)

                self.stdout.write(self.style.SUCCESS('Sample data population completed successfully!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
            raise

    def _create_fabrics(self):
        """Create or get fabric records."""
        fabric_data = [
            {'name': 'Cotton', 'slug': ''},
            {'name': 'Linen', 'slug': ''},
            {'name': 'Organic Cotton', 'slug': ''},
            {'name': 'Blend', 'slug': ''},
        ]

        fabrics = {}
        for data in fabric_data:
            fabric, created = Fabric.objects.get_or_create(
                name=data['name'],
                defaults={'slug': ''}
            )
            fabrics[data['name']] = fabric
            status = 'Created' if created else 'Exists'
            self.stdout.write(f"  - {data['name']}: {status}")

        return fabrics

    def _create_colors(self):
        """Create or get color records."""
        color_data = [
            {'name': 'Red', 'hex_code': '#FF0000'},
            {'name': 'Blue', 'hex_code': '#0000FF'},
            {'name': 'Pink', 'hex_code': '#FFC0CB'},
            {'name': 'Black', 'hex_code': '#000000'},
            {'name': 'White', 'hex_code': '#FFFFFF'},
            {'name': 'Green', 'hex_code': '#008000'},
            {'name': 'Yellow', 'hex_code': '#FFFF00'},
        ]

        colors = {}
        for data in color_data:
            color, created = Color.objects.get_or_create(
                name=data['name'],
                defaults={'hex_code': data['hex_code'], 'slug': ''}
            )
            colors[data['name']] = color
            status = 'Created' if created else 'Exists'
            self.stdout.write(f"  - {data['name']}: {status}")

        return colors

    def _create_sizes(self):
        """Create or get size records."""
        size_data = [
            {'name': 'S', 'display_order': 10},
            {'name': 'M', 'display_order': 20},
            {'name': 'L', 'display_order': 30},
            {'name': 'XL', 'display_order': 40},
            {'name': '0-3 Months', 'display_order': 1},
            {'name': '3-6 Months', 'display_order': 2},
            {'name': '6-9 Months', 'display_order': 3},
            {'name': '0-2 Years', 'display_order': 4},
            {'name': '3-5 Years', 'display_order': 5},
            {'name': '6-8 Years', 'display_order': 6},
            {'name': '9-12 Years', 'display_order': 7},
        ]

        sizes = {}
        for data in size_data:
            size, created = Size.objects.get_or_create(
                name=data['name'],
                defaults={'display_order': data['display_order'], 'slug': ''}
            )
            sizes[data['name']] = size
            status = 'Created' if created else 'Exists'
            self.stdout.write(f"  - {data['name']}: {status}")

        return sizes

    def _create_collections(self):
        """Create or get collection records."""
        collection_data = [
            {'name': 'New Arrivals', 'display_order': 1},
            {'name': 'Girls Collection', 'display_order': 2},
            {'name': 'Baby Collection', 'display_order': 3},
            {'name': 'Boys Collection', 'display_order': 4},
            {'name': 'Featured Collection', 'display_order': 5},
        ]

        collections = {}
        for data in collection_data:
            collection, created = Collection.objects.get_or_create(
                name=data['name'],
                defaults={'display_order': data['display_order'], 'slug': '', 'is_active': True}
            )
            collections[data['name']] = collection
            status = 'Created' if created else 'Exists'
            self.stdout.write(f"  - {data['name']}: {status}")

        return collections

    def _get_categories(self):
        """Get existing categories and subcategories."""
        categories = {}

        try:
            # Baby category
            baby_cat = Category.objects.get(name='Baby')
            baby_subcats = {}
            for subcat in baby_cat.subcategories.all():
                baby_subcats[subcat.name] = subcat
            categories['Baby'] = {
                'category': baby_cat,
                'subcategories': baby_subcats
            }
            self.stdout.write("  - Baby category found")

            # Girl category
            girl_cat = Category.objects.get(name='Girl')
            girl_subcats = {}
            for subcat in girl_cat.subcategories.all():
                girl_subcats[subcat.name] = subcat
            categories['Girl'] = {
                'category': girl_cat,
                'subcategories': girl_subcats
            }
            self.stdout.write("  - Girl category found")

            # Boy category
            boy_cat = Category.objects.get(name='Boy')
            boy_subcats = {}
            for subcat in boy_cat.subcategories.all():
                boy_subcats[subcat.name] = subcat
            categories['Boy'] = {
                'category': boy_cat,
                'subcategories': boy_subcats
            }
            self.stdout.write("  - Boy category found")

            # Women category
            women_cat = Category.objects.get(name='Women')
            women_subcats = {}
            for subcat in women_cat.subcategories.all():
                women_subcats[subcat.name] = subcat
            categories['Women'] = {
                'category': women_cat,
                'subcategories': women_subcats
            }
            self.stdout.write("  - Women category found")

        except Category.DoesNotExist as e:
            self.stdout.write(self.style.WARNING(f'Warning: {str(e)}'))
            self.stdout.write(self.style.WARNING('Some categories/subcategories not found. Make sure category data exists.'))

        return categories

    def _create_sample_products(self, fabrics, colors, sizes, collections, categories):
        """Create sample products with variants and stock."""

        # Product 1: Girls Cotton T-Shirt
        if 'Girl' in categories and 'T-Shirts' in categories['Girl']['subcategories']:
            self._create_product(
                name='Girls Cotton T-Shirt',
                category=categories['Girl']['category'],
                subcategory=categories['Girl']['subcategories'].get('T-Shirts'),
                fabric=fabrics.get('Cotton'),
                collections=[collections.get('Girls Collection'), collections.get('New Arrivals')],
                short_description='Comfortable cotton t-shirt for girls',
                old_price=999.00,
                selling_price=799.00,
                full_description='Soft and breathable cotton t-shirt perfect for everyday wear. Available in multiple colors.',
                fabric_and_care='100% Cotton. Hand wash in cold water. Avoid bleach.',
                shipping_and_returns='Free shipping on orders above ₹999. 30-day returns accepted.',
                manufactured_by='ComfyCute Manufacturing',
                variants=[
                    {
                        'color': 'Red',
                        'is_default': True,
                        'sizes': {'S': 10, 'M': 15, 'L': 8},
                    },
                    {
                        'color': 'Blue',
                        'is_default': False,
                        'sizes': {'S': 5, 'M': 12, 'L': 6},
                    },
                    {
                        'color': 'Pink',
                        'is_default': False,
                        'sizes': {'S': 7, 'M': 10, 'L': 4},
                    },
                ]
            )
            self.stdout.write("  - Girls Cotton T-Shirt created")

        # Product 2: Baby Gift Set
        if 'Baby' in categories and 'Gift Sets' in categories['Baby']['subcategories']:
            self._create_product(
                name='Baby Organic Cotton Gift Set',
                category=categories['Baby']['category'],
                subcategory=categories['Baby']['subcategories'].get('Gift Sets'),
                fabric=fabrics.get('Organic Cotton'),
                collections=[collections.get('Baby Collection'), collections.get('Featured Collection')],
                short_description='Premium organic cotton gift set for newborns',
                old_price=1499.00,
                selling_price=1299.00,
                full_description='Perfect gift set for newborns including rompers and essentials. Made with premium organic cotton.',
                fabric_and_care='100% Organic Cotton. Gentle wash recommended. Tumble dry on low.',
                shipping_and_returns='Free shipping. Exchange available within 15 days.',
                manufactured_by='ComfyCute Premium',
                variants=[
                    {
                        'color': 'White',
                        'is_default': True,
                        'sizes': {'0-3 Months': 8, '3-6 Months': 12},
                    },
                    {
                        'color': 'Pink',
                        'is_default': False,
                        'sizes': {'0-3 Months': 6, '3-6 Months': 10},
                    },
                ]
            )
            self.stdout.write("  - Baby Organic Cotton Gift Set created")

        # Product 3: Boys Co-Ord Set
        if 'Boy' in categories and 'Co-Ord Sets - Pants' in categories['Boy']['subcategories']:
            self._create_product(
                name='Boys Cotton Co-Ord Set Pants',
                category=categories['Boy']['category'],
                subcategory=categories['Boy']['subcategories'].get('Co-Ord Sets - Pants'),
                fabric=fabrics.get('Cotton'),
                collections=[collections.get('Boys Collection'), collections.get('New Arrivals')],
                short_description='Stylish co-ord set pants for boys',
                old_price=899.00,
                selling_price=699.00,
                full_description='Comfortable and stylish co-ord set pants with matching top. Perfect for casual outings.',
                fabric_and_care='85% Cotton, 15% Polyester. Machine wash in cold water.',
                shipping_and_returns='Free shipping on all orders. 30-day return policy.',
                manufactured_by='ComfyCute Kids',
                variants=[
                    {
                        'color': 'Black',
                        'is_default': True,
                        'sizes': {'3-5 Years': 10, '6-8 Years': 8, '9-12 Years': 6},
                    },
                    {
                        'color': 'Blue',
                        'is_default': False,
                        'sizes': {'3-5 Years': 7, '6-8 Years': 9, '9-12 Years': 5},
                    },
                ]
            )
            self.stdout.write("  - Boys Cotton Co-Ord Set Pants created")

        # Product 4: Girl Frocks/Dress
        if 'Girl' in categories and 'Frocks' in categories['Girl']['subcategories']:
            self._create_product(
                name='Girls Cotton Frock Dress',
                category=categories['Girl']['category'],
                subcategory=categories['Girl']['subcategories'].get('Frocks'),
                fabric=fabrics.get('Cotton'),
                collections=[collections.get('Girls Collection'), collections.get('Featured Collection')],
                short_description='Elegant cotton frock dress for girls',
                old_price=1199.00,
                selling_price=899.00,
                full_description='Charming cotton frock dress with comfortable fit. Ideal for occasions and daily wear.',
                fabric_and_care='100% Cotton. Hand wash recommended. Iron on low heat.',
                shipping_and_returns='Free shipping on orders above ₹999. Easy returns within 30 days.',
                manufactured_by='ComfyCute Premium',
                variants=[
                    {
                        'color': 'Pink',
                        'is_default': True,
                        'sizes': {'3-5 Years': 6, '6-8 Years': 8, '9-12 Years': 5},
                    },
                    {
                        'color': 'Green',
                        'is_default': False,
                        'sizes': {'3-5 Years': 5, '6-8 Years': 7, '9-12 Years': 4},
                    },
                ]
            )
            self.stdout.write("  - Girls Cotton Frock Dress created")

    def _create_product(self, name, category, subcategory, fabric, collections, short_description,
                       old_price, selling_price, full_description, fabric_and_care,
                       shipping_and_returns, manufactured_by, variants):
        """Create a product with variants and stock."""

        if not category or not subcategory or not fabric:
            self.stdout.write(self.style.WARNING(f'Skipping {name}: Missing category, subcategory, or fabric'))
            return

        # Create product
        product, created = Product.objects.get_or_create(
            name=name,
            defaults={
                'category': category,
                'subcategory': subcategory,
                'fabric': fabric,
                'short_description': short_description,
                'old_price': old_price,
                'selling_price': selling_price,
                'full_description': full_description,
                'fabric_and_care': fabric_and_care,
                'shipping_and_returns': shipping_and_returns,
                'manufactured_by': manufactured_by,
                'is_active': True,
                'slug': ''
            }
        )

        if created:
            # Add collections
            for collection in collections:
                if collection:
                    product.collections.add(collection)

            # Create variants
            for variant_data in variants:
                color_name = variant_data['color']
                is_default = variant_data['is_default']
                sizes = variant_data['sizes']

                # Get color
                color = Color.objects.filter(name=color_name).first()
                if not color:
                    self.stdout.write(self.style.WARNING(f'Color {color_name} not found'))
                    continue

                # Create variant
                variant, _ = ProductVariant.objects.get_or_create(
                    product=product,
                    color=color,
                    defaults={
                        'is_default': is_default,
                        'is_active': True
                    }
                )

                # Create size stocks
                for size_name, stock_qty in sizes.items():
                    size = Size.objects.filter(name=size_name).first()
                    if not size:
                        self.stdout.write(self.style.WARNING(f'Size {size_name} not found'))
                        continue

                    VariantSizeStock.objects.get_or_create(
                        variant=variant,
                        size=size,
                        defaults={'stock': stock_qty}
                    )

            self.stdout.write(f"    Product '{name}' created with variants and stock")
        else:
            self.stdout.write(f"    Product '{name}' already exists")
