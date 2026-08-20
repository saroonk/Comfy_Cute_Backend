from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import AbstractUser, UserManager
from django.utils.text import slugify
from ckeditor_uploader.fields import RichTextUploadingField


class CustomUserManager(UserManager):
    """Custom manager for User model that handles email-based superuser creation."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and save a user with email-based username."""
        if not email:
            raise ValueError('The Email field must be set')

        # Use email as username, will be stored in the username field
        user = self.model(username=email, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, **extra_fields):
        """Create a superuser with email as the main identifier."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Simple custom User model extending Django's AbstractUser.
    Uses email as the login identifier while keeping the username field.
    """
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=False)
    phone_number = models.CharField(max_length=20, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    objects = CustomUserManager()

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        """Automatically set username to email if not already set."""
        if not self.username:
            self.username = self.email
        super().save(*args, **kwargs)


class Announcement(models.Model):
    """
    Model for managing dynamic announcement bar content.
    Announcements are displayed in the top announcement bar in order.
    """
    content = models.CharField(
        max_length=255,
        help_text='Announcement text to display in the announcement bar'
    )
    icon = models.CharField(
        max_length=100,
        blank=True,
        default='fa-solid fa-bell',
        help_text='FontAwesome icon class (e.g., "fa-solid fa-truck-fast", leave blank for no icon)'
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text='Display order - lower numbers appear first'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Enable/disable announcement without deleting it'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        verbose_name = 'Announcement'
        verbose_name_plural = 'Announcements'

    def __str__(self):
        return f"{self.content[:50]}... (Order: {self.order})"


class Testimonial(models.Model):
    """
    Model for storing customer testimonials/reviews.
    Only active testimonials are displayed on the homepage.
    """
    name = models.CharField(max_length=100)
    profile_image = models.ImageField(
        upload_to='testimonials/profiles/',
        blank=True,
        null=True,
        help_text='Optional customer profile image. Leave blank to show first letter avatar.'
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Rating from 1 to 5 stars'
    )
    content = models.TextField(
        help_text='Customer review/testimonial text'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Only active testimonials appear on the homepage'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Testimonial'
        verbose_name_plural = 'Testimonials'

    def __str__(self):
        return f"{self.name} - {self.rating}★"

    def get_first_initial(self):
        """Get first letter of customer name for avatar fallback."""
        return self.name[0].upper() if self.name else "?"

    def clean(self):
        """Validate testimonial data."""
        from django.core.exceptions import ValidationError
        if self.rating < 1 or self.rating > 5:
            raise ValidationError({'rating': 'Rating must be between 1 and 5 stars.'})


class ContactSubmission(models.Model):
    """
    Model for storing contact form submissions from the Contact Us page.
    """
    SUBJECT_CHOICES = [
        ('order', 'Order Inquiry'),
        ('shipping', 'Shipping & Delivery'),
        ('returns', 'Returns & Exchanges'),
        ('sizing', 'Sizing & Fit'),
        ('product', 'Product Information'),
        ('feedback', 'Feedback'),
        ('other', 'Other'),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    subject = models.CharField(max_length=50, choices=SUBJECT_CHOICES)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Contact Submission'
        verbose_name_plural = 'Contact Submissions'

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.get_subject_display()}"


class HeroBanner(models.Model):
    """
    Model for managing homepage hero slider banners.
    Each banner contains desktop and mobile images for responsive display.
    """
    desktop_image = models.ImageField(
        upload_to='hero_banners/desktop/',
        help_text='Image displayed on desktop and tablet devices (1920x600px recommended)'
    )
    mobile_image = models.ImageField(
        upload_to='hero_banners/mobile/',
        help_text='Image displayed on mobile devices (540x800px recommended)'
    )
    hero_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text='Destination URL when user clicks the hero slide. Leave blank to use Products page.'
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text='Order in which the slide appears. Lower numbers appear first.'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Enable/disable this slide without deleting it'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']
        verbose_name = 'Hero Banner'
        verbose_name_plural = 'Hero Banners'

    def __str__(self):
        return f"Hero Banner #{self.order}"


class Category(models.Model):
    """
    Model for product categories (Baby, Girl, Boy, Women).
    Each category can have multiple subcategories.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text='Category name (e.g., Baby, Girl, Boy, Women)'
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text='URL-friendly identifier (e.g., baby, girl, boy, women)'
    )
    image = models.ImageField(
        upload_to='categories/',
        blank=True,
        null=True,
        help_text='Category image/icon for display in navigation'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class SubCategory(models.Model):
    """
    Model for product subcategories.
    Each subcategory belongs to exactly one category.
    Examples:
    - Baby → Baby Boy, Baby Girl, Night Wear, Essentials, Gift Sets
    - Girl → Co-Ord Sets - Pants, Co-Ord Sets - Shorts, Frocks, etc.
    """
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='subcategories',
        help_text='Parent category'
    )
    name = models.CharField(
        max_length=100,
        help_text='Subcategory name (e.g., Baby Boy, Cotton Churidar)'
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text='URL-friendly identifier (e.g., baby-boy, cotton-churidar)'
    )
    image = models.ImageField(
        upload_to='subcategories/',
        blank=True,
        null=True,
        help_text='Subcategory image for display in navigation'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']
        verbose_name = 'Sub Category'
        verbose_name_plural = 'Sub Categories'

    def __str__(self):
        return f"{self.category.name} → {self.name}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


# ==========================================
# PRODUCT-RELATED MODELS
# ==========================================

class Fabric(models.Model):
    """
    Model for product fabrics/materials.
    Examples: Cotton, Linen, Silk, Rayon, Blend
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text='Fabric name (e.g., Cotton, Linen, Silk)'
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text='URL-friendly identifier'
    )

    class Meta:
        ordering = ['name']
        verbose_name = 'Fabric'
        verbose_name_plural = 'Fabrics'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Collection(models.Model):
    """
    Model for product collections.
    A product can belong to multiple collections.
    Examples: New Arrivals, Featured, Party Wear, Baby Collection
    """
    name = models.CharField(
        max_length=150,
        help_text='Collection name'
    )
    slug = models.SlugField(
        max_length=150,
        unique=True,
        help_text='URL-friendly identifier'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Enable/disable collection without deleting it'
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text='Display order - lower numbers appear first'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']
        verbose_name = 'Collection'
        verbose_name_plural = 'Collections'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Color(models.Model):
    """
    Model for product colors.
    Reusable across all products and variants.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text='Color name (e.g., Red, Blue, Pink)'
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text='URL-friendly identifier'
    )
    hex_code = models.CharField(
        max_length=7,
        blank=True,
        null=True,
        help_text='Hex color code (e.g., #FF5733)'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name = 'Color'
        verbose_name_plural = 'Colors'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Size(models.Model):
    """
    Model for product sizes.
    Reusable across all products and variants.
    Supports both children's sizes and standard clothing sizes.
    Examples: 0-3 Months, 3-6 Months, S, M, L, XL, Free Size
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text='Size name (e.g., S, M, L, 0-3 Months)'
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        help_text='URL-friendly identifier'
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text='Display order - lower numbers appear first'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', 'name']
        verbose_name = 'Size'
        verbose_name_plural = 'Sizes'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    """
    Main product model representing the catalog product.
    Example: Girls Cotton T-Shirt

    A Product contains common information shared by all variants.
    Variants differ in color, size, and stock.
    """
    name = models.CharField(
        max_length=255,
        help_text='Product name (e.g., Girls Cotton T-Shirt)'
    )
    slug = models.SlugField(
        max_length=255,
        unique=True,
        help_text='URL-friendly identifier'
    )
    main_image = models.ImageField(
        upload_to='products/main/',
        help_text='Main product listing/card image'
    )
    short_description = models.TextField(
        blank=True,
        null=True,
        help_text='Brief product description for product cards'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='products',
        help_text='Product category (required)'
    )
    subcategory = models.ForeignKey(
        SubCategory,
        on_delete=models.PROTECT,
        related_name='products',
        help_text='Product subcategory (required)'
    )
    fabric = models.ForeignKey(
        Fabric,
        on_delete=models.PROTECT,
        related_name='products',
        help_text='Fabric/material (required)'
    )
    collections = models.ManyToManyField(
        Collection,
        blank=True,
        related_name='products',
        help_text='Collections this product belongs to'
    )
    old_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text='Original/marked price (optional)'
    )
    selling_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Current selling price (required)'
    )
    full_description = RichTextUploadingField(
        blank=True,
        null=True,
        help_text='Detailed product description'
    )
    fabric_and_care = RichTextUploadingField(
        blank=True,
        null=True,
        help_text='Fabric information and care instructions'
    )
    shipping_and_returns = RichTextUploadingField(
        blank=True,
        null=True,
        help_text='Shipping and returns information'
    )
    manufactured_by = RichTextUploadingField(
        blank=True,
        null=True,
        help_text='Manufacturing information'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Enable/disable product without deleting it'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Product'
        verbose_name_plural = 'Products'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    def get_default_variant(self):
        """Get the default variant for this product."""
        return self.variants.filter(is_default=True).first()


class ProductVariant(models.Model):
    """
    Model for product variants.
    A variant represents a specific version of a product (e.g., color variation).

    Example:
    Product: Girls Cotton T-Shirt
    Variants: Red, Blue, Pink
    """
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='variants',
        help_text='Parent product'
    )
    color = models.ForeignKey(
        Color,
        on_delete=models.PROTECT,
        related_name='variants',
        help_text='Variant color'
    )
    is_default = models.BooleanField(
        default=False,
        help_text='Set as default variant for product detail page'
    )
    old_price_override = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text='Override product old price for this variant (optional)'
    )
    selling_price_override = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text='Override product selling price for this variant (optional)'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Enable/disable variant without deleting it'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['product', 'color']
        verbose_name = 'Product Variant'
        verbose_name_plural = 'Product Variants'

    def __str__(self):
        return f"{self.product.name} - {self.color.name}"

    def get_selling_price(self):
        """Get effective selling price (override or product price)."""
        return self.selling_price_override or self.product.selling_price

    def get_old_price(self):
        """Get effective old price (override or product price)."""
        return self.old_price_override or self.product.old_price


class ProductVariantImage(models.Model):
    """
    Model for variant images.
    A variant can have multiple images (e.g., front, back, side views).
    """
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='images',
        help_text='Variant these images belong to'
    )
    image = models.ImageField(
        upload_to='products/variants/',
        help_text='Variant image (e.g., front, back, side view)'
    )
    display_order = models.PositiveIntegerField(
        default=0,
        help_text='Display order - lower numbers appear first'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['variant', 'display_order']
        verbose_name = 'Product Variant Image'
        verbose_name_plural = 'Product Variant Images'

    def __str__(self):
        return f"{self.variant} - Image #{self.display_order}"


class VariantSizeStock(models.Model):
    """
    Model connecting ProductVariant + Size + Stock.
    Represents available stock for a specific size of a variant.

    Example:
    Red T-Shirt Variant:
    - Size S: 10 units
    - Size M: 15 units
    - Size L: 8 units
    """
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='size_stocks',
        help_text='Product variant'
    )
    size = models.ForeignKey(
        Size,
        on_delete=models.PROTECT,
        related_name='variant_stocks',
        help_text='Size'
    )
    stock = models.PositiveIntegerField(
        default=0,
        help_text='Available stock quantity'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['variant', 'size']
        verbose_name = 'Variant Size Stock'
        verbose_name_plural = 'Variant Size Stocks'
        # Prevent duplicate size entries for the same variant
        constraints = [
            models.UniqueConstraint(
                fields=['variant', 'size'],
                name='unique_variant_size'
            )
        ]

    def __str__(self):
        return f"{self.variant} - {self.size.name} ({self.stock} units)"


# ==========================================
# WISHLIST MODEL
# ==========================================

class Wishlist(models.Model):
    """
    Model for storing wishlist items.
    Supports both authenticated users and anonymous sessions.

    A wishlist item can belong to either:
    - An authenticated user (user is set, session_id is NULL)
    - An anonymous session (session_id is set, user is NULL)

    The same owner cannot wishlist the same product twice (enforced by constraints).
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='wishlist_items',
        null=True,
        blank=True,
        help_text='Authenticated user (NULL for anonymous sessions)'
    )
    session_id = models.CharField(
        max_length=40,
        null=True,
        blank=True,
        help_text='Session ID for anonymous users (NULL for authenticated users)'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='wishlist_entries',
        help_text='Product in wishlist'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Wishlist Item'
        verbose_name_plural = 'Wishlist Items'
        # Enforce uniqueness constraints
        constraints = [
            models.UniqueConstraint(
                condition=models.Q(user__isnull=False),
                fields=['user', 'product'],
                name='unique_user_product_wishlist'
            ),
            models.UniqueConstraint(
                condition=models.Q(session_id__isnull=False),
                fields=['session_id', 'product'],
                name='unique_session_product_wishlist'
            ),
        ]

    def __str__(self):
        owner = self.user.email if self.user else f"Session {self.session_id}"
        return f"{owner} - {self.product.name}"


# ==========================================
# CART MODELS
# ==========================================

class Cart(models.Model):
    """
    Model for shopping carts.
    Supports both authenticated users and anonymous sessions.

    A cart can belong to either:
    - An authenticated user (user is set, session_id is NULL)
    - An anonymous session (session_id is set, user is NULL)

    One active cart per owner is recommended but not enforced at database level
    to allow for cart history/restoration scenarios.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='carts',
        null=True,
        blank=True,
        help_text='Authenticated user (NULL for anonymous sessions)'
    )
    session_id = models.CharField(
        max_length=40,
        null=True,
        blank=True,
        help_text='Session ID for anonymous users (NULL for authenticated users)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Cart'
        verbose_name_plural = 'Carts'
        # Enforce ownership constraints
        constraints = [
            models.UniqueConstraint(
                condition=models.Q(user__isnull=False),
                fields=['user'],
                name='unique_user_active_cart',
            ),
            models.UniqueConstraint(
                condition=models.Q(session_id__isnull=False),
                fields=['session_id'],
                name='unique_session_active_cart',
            ),
            # Prevent carts with both user and session_id
            models.CheckConstraint(
                check=models.Q(user__isnull=False, session_id__isnull=True)
                | models.Q(user__isnull=True, session_id__isnull=False),
                name='cart_must_have_owner',
            ),
        ]

    def __str__(self):
        owner = self.user.email if self.user else f"Session {self.session_id}"
        return f"Cart - {owner}"

    @property
    def total_quantity(self):
        """Get total number of items in cart (sum of all quantities)."""
        from django.db.models import Sum
        result = self.items.aggregate(total=Sum('quantity'))
        return result['total'] or 0

    @property
    def subtotal(self):
        """Get cart subtotal (sum of all item subtotals)."""
        from decimal import Decimal
        total = Decimal('0.00')
        for item in self.items.all():
            total += item.subtotal
        return total

    @property
    def is_empty(self):
        """Check if cart has any items."""
        return self.items.count() == 0

    @property
    def item_count(self):
        """Get number of distinct CartItems (different from total_quantity)."""
        return self.items.count()


class CartItem(models.Model):
    """
    Model for individual items in a cart.
    Represents a specific product/variant/size combination.

    A CartItem must identify the exact purchasable product selection:
    - Product (required)
    - ProductVariant/Color (required - the specific color variant)
    - Size (required - the specific size)
    - Quantity (required, >= 1)

    Stock is validated against VariantSizeStock.stock at the time of operations.
    Price is fetched from ProductVariant (with override) or Product at the time of operations.
    """
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items',
        help_text='Parent cart'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='cart_items',
        help_text='Product'
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name='cart_items',
        help_text='Product variant (color)'
    )
    size = models.ForeignKey(
        Size,
        on_delete=models.CASCADE,
        related_name='cart_items',
        help_text='Selected size'
    )
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text='Quantity (must be >= 1)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Cart Item'
        verbose_name_plural = 'Cart Items'
        # Prevent duplicate product/variant/size combinations in same cart
        constraints = [
            models.UniqueConstraint(
                fields=['cart', 'product', 'variant', 'size'],
                name='unique_cart_product_variant_size'
            ),
        ]

    def __str__(self):
        return f"{self.cart} - {self.product.name} ({self.variant.color.name}, {self.size.name}) x{self.quantity}"

    def get_variant_size_stock(self):
        """
        Get the VariantSizeStock object for this cart item.
        Returns the database record that holds the actual available stock.
        """
        from django.core.exceptions import ObjectDoesNotExist
        try:
            return VariantSizeStock.objects.get(variant=self.variant, size=self.size)
        except ObjectDoesNotExist:
            return None

    @property
    def available_stock(self):
        """
        Get currently available stock for this product/variant/size.
        Returns 0 if the combination doesn't exist in inventory.
        """
        vss = self.get_variant_size_stock()
        return vss.stock if vss else 0

    def has_sufficient_stock(self):
        """
        Check if there is enough stock to fulfill this cart item's quantity.
        Returns True if available_stock >= quantity, False otherwise.
        """
        return self.available_stock >= self.quantity

    def validate_stock(self):
        """
        Validate that sufficient stock is available.
        Raises ValidationError if stock is insufficient.
        """
        from django.core.exceptions import ValidationError
        if not self.has_sufficient_stock():
            raise ValidationError(
                f"Insufficient stock for {self.product.name} ({self.variant.color.name}, "
                f"{self.size.name}). Requested: {self.quantity}, Available: {self.available_stock}"
            )

    def get_unit_price(self):
        """
        Get the current selling price for this item.
        Uses variant override if available, falls back to product price.
        Returns a Decimal value.
        """
        return self.variant.get_selling_price()

    @property
    def unit_price(self):
        """Convenience property for unit price."""
        return self.get_unit_price()

    @property
    def subtotal(self):
        """
        Calculate subtotal for this cart item.
        subtotal = unit_price × quantity
        """
        return self.unit_price * self.quantity


# ==========================================
# ORDER MODELS
# ==========================================

class Order(models.Model):
    """
    Model for customer orders.
    Supports both authenticated users and anonymous sessions.

    An order can belong to either:
    - An authenticated user (user is set, session_id is NULL)
    - An anonymous session (session_id is set, user is NULL)

    An order preserves both the financial snapshot and customer/shipping information at the time of purchase:
    - subtotal: sum of all OrderItem totals
    - shipping_charge: calculated based on item count (1-3: ₹40, 4+: ₹0)
    - total_amount: final amount to be paid (subtotal + shipping_charge)
    - Customer details: first_name, last_name, email, phone_number
    - Shipping address: address, address_2, city, state, postal_code

    Razorpay references are stored for payment processing.
    """
    ORDER_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    # Order ownership (user OR session, but not both)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='orders',
        null=True,
        blank=True,
        help_text='Authenticated user (NULL for anonymous sessions)'
    )
    session_id = models.CharField(
        max_length=40,
        null=True,
        blank=True,
        help_text='Session ID for anonymous users (NULL for authenticated users)'
    )

    # Order identification
    order_number = models.CharField(
        max_length=50,
        unique=True,
        help_text='Unique order number for customer reference (e.g., ORD-20240101-001)'
    )

    # Customer information (snapshot at time of order)
    first_name = models.CharField(
        max_length=100,
        default='',
        help_text='Customer first name'
    )
    last_name = models.CharField(
        max_length=100,
        default='',
        help_text='Customer last name'
    )
    email = models.EmailField(
        default='',
        help_text='Customer email address'
    )
    phone_number = models.CharField(
        max_length=20,
        default='',
        help_text='Customer phone number'
    )

    # Shipping address (snapshot at time of order)
    address = models.TextField(
        default='',
        help_text='Street address'
    )
    address_2 = models.TextField(
        blank=True,
        null=True,
        help_text='Apartment, suite, etc. (optional)'
    )
    city = models.CharField(
        max_length=100,
        default='',
        help_text='City'
    )
    state = models.CharField(
        max_length=100,
        default='',
        help_text='State'
    )
    postal_code = models.CharField(
        max_length=20,
        default='',
        help_text='PIN code / Postal code'
    )

    # Order status
    status = models.CharField(
        max_length=20,
        choices=ORDER_STATUS_CHOICES,
        default='pending',
        help_text='Current order fulfillment status'
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default='pending',
        help_text='Current payment status'
    )

    # Financial snapshot at time of order creation
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text='Order subtotal (sum of all item totals)'
    )
    shipping_charge = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text='Shipping charge (1-3 items: ₹40, 4+ items: ₹0)'
    )
    total_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text='Final total amount to be paid (subtotal + shipping_charge)'
    )

    # Razorpay payment integration
    razorpay_order_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text='Razorpay order ID generated during payment initialization'
    )
    razorpay_payment_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text='Razorpay payment ID returned after successful payment'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Order'
        verbose_name_plural = 'Orders'
        # Prevent orders with both user and session_id
        constraints = [
            models.CheckConstraint(
                check=models.Q(user__isnull=False, session_id__isnull=True)
                | models.Q(user__isnull=True, session_id__isnull=False),
                name='order_must_have_owner',
            ),
        ]

    def __str__(self):
        owner = self.user.email if self.user else f"Session {self.session_id}"
        return f"Order {self.order_number} - {owner}"

    @property
    def item_count(self):
        """Get total number of items in this order (sum of quantities)."""
        from django.db.models import Sum
        result = self.items.aggregate(total=Sum('quantity'))
        return result['total'] or 0

    @property
    def is_paid(self):
        """Check if order has been paid."""
        return self.payment_status == 'paid'

    @property
    def is_delivered(self):
        """Check if order has been delivered."""
        return self.status == 'delivered'


class OrderItem(models.Model):
    """
    Model for individual items in an order.
    Preserves the exact product/variant/size/price configuration at purchase time.

    Represents a specific product/variant/size combination with its purchased quantity
    and the price that was charged at the time of order creation.

    Example:
    Order: ORD-20240101-001
    Items:
      - Product: Girls Cotton T-Shirt, Variant: Red, Size: M, Qty: 2, Unit Price: ₹699
      - Product: Boys Cotton Set, Variant: Blue, Size: 6-12 Months, Qty: 1, Unit Price: ₹749

    The prices are snapshots - they don't change even if product prices change later.
    """
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        help_text='Parent order'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.PROTECT,
        related_name='order_items',
        help_text='Product in order (protected to maintain order history)'
    )
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.PROTECT,
        related_name='order_items',
        help_text='Product variant (color) at time of purchase'
    )
    size = models.ForeignKey(
        Size,
        on_delete=models.PROTECT,
        related_name='order_items',
        help_text='Selected size at time of purchase'
    )

    # Quantity and pricing snapshot
    quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text='Quantity purchased'
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Unit price at time of order creation (includes variant overrides)'
    )
    total_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text='Total price for this item (unit_price × quantity)'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Order Item'
        verbose_name_plural = 'Order Items'

    def __str__(self):
        return f"{self.order.order_number} - {self.product.name} ({self.variant.color.name}, {self.size.name}) x{self.quantity}"

    def save(self, *args, **kwargs):
        """Automatically calculate total_price before saving."""
        if not self.total_price:
            self.total_price = self.unit_price * self.quantity
        super().save(*args, **kwargs)
