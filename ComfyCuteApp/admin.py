from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db import IntegrityError
from django import forms
from django.db.models import Q
from .models import (
    HeroBanner, ContactSubmission, Testimonial, User, Announcement,
    Category, SubCategory, Product, ProductVariant, ProductVariantImage,
    VariantSizeStock, Collection, Fabric, Color, Size, Wishlist,
    Cart, CartItem, Order, OrderItem
)
from unfold.admin import ModelAdmin, TabularInline, StackedInline


@admin.register(Announcement)
class AnnouncementAdmin(ModelAdmin):
    list_display = ['content', 'order', 'is_active', 'created_at']
    list_editable = ['order', 'is_active']
    list_filter = ['is_active', 'created_at']
    search_fields = ['content']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Announcement Content', {
            'fields': ('content', 'icon')
        }),
        ('Configuration', {
            'fields': ('order', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['order']


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    """
    User Admin for managing user accounts.
    """
    list_display = ['email', 'full_name', 'phone_number', 'is_active', 'date_joined']
    list_filter = ['is_active', 'is_staff', 'is_superuser', 'date_joined']
    search_fields = ['email', 'full_name', 'phone_number']
    ordering = ['-date_joined']
    readonly_fields = ['date_joined', 'last_login']


@admin.register(Testimonial)
class TestimonialAdmin(ModelAdmin):
    list_display = ['name', 'rating', 'is_active', 'created_at']
    list_filter = ['is_active', 'rating', 'created_at']
    search_fields = ['name', 'content']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Customer Information', {
            'fields': ('name', 'profile_image')
        }),
        ('Review', {
            'fields': ('rating', 'content')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-created_at']


@admin.register(ContactSubmission)
class ContactSubmissionAdmin(ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'phone', 'subject', 'created_at']
    list_filter = ['subject', 'created_at']
    search_fields = ['first_name', 'last_name', 'email', 'subject']
    readonly_fields = ['created_at']
    fieldsets = (
        ('Contact Information', {
            'fields': ('first_name', 'last_name', 'email', 'phone')
        }),
        ('Message Details', {
            'fields': ('subject', 'message')
        }),
        ('Submission Info', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-created_at']

    def has_add_permission(self, request):
        # Prevent direct admin creation of contact submissions
        return False

    def has_delete_permission(self, request, obj=None):
        # Allow deletion of submissions
        return True


@admin.register(HeroBanner)
class HeroBannerAdmin(ModelAdmin):
    list_display = ['id','order', 'is_active', 'created_at']
    list_display_links = ['desktop_image_preview','id']
    list_editable = ['order', 'is_active']
    list_filter = ['is_active', 'created_at']
    fieldsets = (
        ('Images', {
            'fields': ('desktop_image', 'mobile_image')
        }),
        ('Configuration', {
            'fields': ('hero_url', 'order', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['order']

    def desktop_image_preview(self, obj):
        if obj.desktop_image:
            return f'<img src="{obj.desktop_image.url}" width="100" height="auto" />'
        return 'No image'
    desktop_image_preview.short_description = 'Desktop Preview'
    desktop_image_preview.allow_tags = True

    def mobile_image_preview(self, obj):
        if obj.mobile_image:
            return f'<img src="{obj.mobile_image.url}" width="50" height="auto" />'
        return 'No image'
    mobile_image_preview.short_description = 'Mobile Preview'
    mobile_image_preview.allow_tags = True


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ['name', 'slug', 'created_at', 'updated_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Category Information', {
            'fields': ('name', 'slug', 'image')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['name']

    def save_model(self, request, obj, form, change):
        """
        Override save_model to handle admin logging foreign key constraint issues
        when using custom user models.
        """
        try:
            super().save_model(request, obj, form, change)
        except IntegrityError as e:
            if 'django_admin_log' in str(e) and 'user_id' in str(e):
                # Admin logging failed due to custom user model FK issue
                # Save the object directly without logging
                obj.save()
                # Display a warning message to the user
                self.message_user(
                    request,
                    f'✓ {obj._meta.verbose_name} "{obj}" saved successfully (admin logging skipped)',
                    level=admin.messages.WARNING
                )
            else:
                raise

    def image_preview(self, obj):
        if obj.image:
            return f'<img src="{obj.image.url}" width="80" height="auto" />'
        return 'No image'
    image_preview.short_description = 'Image Preview'
    image_preview.allow_tags = True


@admin.register(SubCategory)
class SubCategoryAdmin(ModelAdmin):
    list_display = ['name', 'category', 'slug', 'created_at']
    list_filter = ['category', 'created_at']
    prepopulated_fields = {'slug': ('name',)}
    search_fields = ['name', 'slug', 'category__name']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Subcategory Information', {
            'fields': ('category', 'name', 'slug', 'image')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['category', 'name']

    def save_model(self, request, obj, form, change):
        """
        Override save_model to handle admin logging foreign key constraint issues
        when using custom user models.
        """
        try:
            super().save_model(request, obj, form, change)
        except IntegrityError as e:
            if 'django_admin_log' in str(e) and 'user_id' in str(e):
                # Admin logging failed due to custom user model FK issue
                # Save the object directly without logging
                obj.save()
                # Display a warning message to the user
                self.message_user(
                    request,
                    f'✓ {obj._meta.verbose_name} "{obj}" saved successfully (admin logging skipped)',
                    level=admin.messages.WARNING
                )
            else:
                raise

    def image_preview(self, obj):
        if obj.image:
            return f'<img src="{obj.image.url}" width="80" height="auto" />'
        return 'No image'
    image_preview.short_description = 'Image Preview'
    image_preview.allow_tags = True


# ==========================================
# PRODUCT-RELATED ADMIN CLASSES
# ==========================================

@admin.register(Fabric)
class FabricAdmin(ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['name']


@admin.register(Collection)
class CollectionAdmin(ModelAdmin):
    list_display = ['name', 'is_active', 'display_order', 'created_at']
    list_editable = ['is_active', 'display_order']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('Collection Information', {
            'fields': ('name', 'slug')
        }),
        ('Configuration', {
            'fields': ('display_order', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['display_order', 'name']


@admin.register(Color)
class ColorAdmin(ModelAdmin):
    list_display = ['name', 'hex_code', 'slug']
    search_fields = ['name', 'slug', 'hex_code']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['name']


@admin.register(Size)
class SizeAdmin(ModelAdmin):
    list_display = ['name', 'display_order', 'slug']
    list_editable = ['display_order']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['display_order', 'name']


# Nested inlines for complete product workflow using Django Unfold
class VariantSizeStockInline(TabularInline):
    """Inline admin for VariantSizeStock - manages size and stock for each variant."""
    model = VariantSizeStock
    extra = 1
    fields = ['size', 'stock']
    verbose_name = 'Size & Stock'
    verbose_name_plural = 'Sizes & Stock'


class ProductVariantImageInline(TabularInline):
    """Inline admin for ProductVariantImage - manages images for each variant."""
    model = ProductVariantImage
    extra = 1
    fields = ['image', 'display_order']
    ordering = ['display_order']
    verbose_name = 'Variant Image'
    verbose_name_plural = 'Variant Images'


class ProductVariantInline(StackedInline):
    """Inline admin for ProductVariant with nested images and sizes."""
    model = ProductVariant
    extra = 1
    fields = ['color', 'is_default', 'old_price_override', 'selling_price_override', 'is_active']
    inlines = [ProductVariantImageInline, VariantSizeStockInline]
    verbose_name = 'Variant'
    verbose_name_plural = 'Variants'
@admin.register(Product)
class ProductAdmin(ModelAdmin):
    list_display = ['name', 'category', 'subcategory', 'fabric', 'selling_price', 'is_active', 'created_at']
    list_filter = ['is_active', 'category', 'subcategory', 'fabric', 'collections', 'created_at']
    search_fields = ['name', 'slug', 'category__name', 'subcategory__name']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ProductVariantInline]

    fieldsets = (
        ('Product Information', {
            'fields': ('name', 'slug', 'main_image', 'short_description')
        }),
        ('Classification', {
            'fields': ('category', 'subcategory', 'fabric', 'collections')
        }),
        ('Pricing', {
            'fields': ('old_price', 'selling_price')
        }),
        ('Detailed Information', {
            'fields': ('full_description', 'fabric_and_care', 'shipping_and_returns', 'manufactured_by'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-created_at']

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        """
        Customize Collection field to use a cleaner multi-select widget.
        """
        if db_field.name == 'collections':
            # Use a simple select multiple widget instead of filter_horizontal
            kwargs['widget'] = forms.CheckboxSelectMultiple

        return super().formfield_for_manytomany(db_field, request, **kwargs)

    class Media:
        js = ('admin/js/category_subcategory_filter.js',)


@admin.register(ProductVariant)
class ProductVariantAdmin(ModelAdmin):
    list_display = ['product', 'color', 'is_default', 'is_active', 'selling_price_override']
    list_filter = ['is_active', 'is_default', 'product', 'color']
    search_fields = ['product__name', 'color__name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ProductVariantImageInline, VariantSizeStockInline]

    fieldsets = (
        ('Variant Information', {
            'fields': ('product', 'color', 'is_default')
        }),
        ('Price Override', {
            'fields': ('old_price_override', 'selling_price_override'),
            'description': 'Leave blank to use product prices'
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['product', 'color']


@admin.register(ProductVariantImage)
class ProductVariantImageAdmin(ModelAdmin):
    list_display = ['variant', 'display_order', 'image_preview']
    list_editable = ['display_order']
    list_filter = ['variant__product', 'display_order']
    search_fields = ['variant__product__name', 'variant__color__name']
    ordering = ['variant', 'display_order']

    def image_preview(self, obj):
        if obj.image:
            return f'<img src="{obj.image.url}" width="50" height="auto" />'
        return 'No image'
    image_preview.short_description = 'Preview'
    image_preview.allow_tags = True


@admin.register(VariantSizeStock)
class VariantSizeStockAdmin(ModelAdmin):
    list_display = ['variant', 'size', 'stock']
    list_editable = ['stock']
    list_filter = ['variant__product', 'size']
    search_fields = ['variant__product__name', 'variant__color__name', 'size__name']
    ordering = ['variant', 'size']


# ==========================================
# WISHLIST ADMIN
# ==========================================

@admin.register(Wishlist)
class WishlistAdmin(ModelAdmin):
    list_display = ['product', 'owner_display', 'created_at']
    list_filter = ['created_at']
    search_fields = ['product__name', 'user__email', 'session_id']
    readonly_fields = ['created_at', 'updated_at', 'session_id']

    fieldsets = (
        ('Wishlist Item', {
            'fields': ('product', 'user', 'session_id')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-created_at']

    def owner_display(self, obj):
        """Display the owner of the wishlist item (user or session)."""
        if obj.user:
            return f"User: {obj.user.email}"
        return f"Session: {obj.session_id[:8]}..." if obj.session_id else "Unknown"
    owner_display.short_description = 'Owner'

    def has_add_permission(self, request):
        # Wishlist items are typically added via frontend, not admin
        return False


# ==========================================
# CART ADMIN
# ==========================================

class CartItemInline(TabularInline):
    """Inline admin for CartItem - manages items in a cart."""
    model = CartItem
    extra = 0
    fields = ['product', 'variant', 'size', 'quantity', 'unit_price_display', 'subtotal_display']
    readonly_fields = ['unit_price_display', 'subtotal_display', 'product', 'variant', 'size']
    can_delete = True
    verbose_name = 'Cart Item'
    verbose_name_plural = 'Cart Items'

    def unit_price_display(self, obj):
        """Display the unit price for this item."""
        return f"₹{obj.unit_price}"
    unit_price_display.short_description = 'Unit Price'

    def subtotal_display(self, obj):
        """Display the subtotal for this item."""
        return f"₹{obj.subtotal}"
    subtotal_display.short_description = 'Subtotal'


@admin.register(Cart)
class CartAdmin(ModelAdmin):
    list_display = ['owner_display', 'item_count_display', 'total_quantity_display', 'subtotal_display', 'updated_at']
    list_filter = ['updated_at', 'created_at']
    search_fields = ['user__email', 'session_id']
    readonly_fields = ['created_at', 'updated_at', 'session_id', 'total_quantity_display', 'subtotal_display', 'item_count_display']
    inlines = [CartItemInline]

    fieldsets = (
        ('Cart Owner', {
            'fields': ('user', 'session_id')
        }),
        ('Cart Summary', {
            'fields': ('item_count_display', 'total_quantity_display', 'subtotal_display')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-updated_at']

    def owner_display(self, obj):
        """Display the owner of the cart (user or session)."""
        if obj.user:
            return f"User: {obj.user.email}"
        return f"Session: {obj.session_id[:8]}..." if obj.session_id else "Unknown"
    owner_display.short_description = 'Owner'

    def item_count_display(self, obj):
        """Display the number of distinct cart items."""
        return obj.item_count
    item_count_display.short_description = 'Items'

    def total_quantity_display(self, obj):
        """Display the total quantity of products in cart."""
        return obj.total_quantity
    total_quantity_display.short_description = 'Total Quantity'

    def subtotal_display(self, obj):
        """Display the cart subtotal."""
        return f"₹{obj.subtotal}"
    subtotal_display.short_description = 'Subtotal'

    def has_add_permission(self, request):
        # Carts are typically created via frontend, not admin
        return False


@admin.register(CartItem)
class CartItemAdmin(ModelAdmin):
    list_display = ['cart_owner_display', 'product', 'variant_color_display', 'size', 'quantity', 'unit_price_display', 'subtotal_display', 'stock_status_display']
    list_filter = ['cart__user', 'product', 'created_at']
    search_fields = ['cart__user__email', 'cart__session_id', 'product__name', 'variant__color__name', 'size__name']
    readonly_fields = ['created_at', 'updated_at', 'unit_price_display', 'subtotal_display', 'available_stock_display', 'stock_status_display']

    fieldsets = (
        ('Cart Reference', {
            'fields': ('cart',)
        }),
        ('Product Selection', {
            'fields': ('product', 'variant', 'size', 'quantity')
        }),
        ('Pricing', {
            'fields': ('unit_price_display', 'subtotal_display')
        }),
        ('Stock Information', {
            'fields': ('available_stock_display', 'stock_status_display')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-created_at']

    def cart_owner_display(self, obj):
        """Display the cart owner."""
        if obj.cart.user:
            return f"User: {obj.cart.user.email}"
        return f"Session: {obj.cart.session_id[:8]}..." if obj.cart.session_id else "Unknown"
    cart_owner_display.short_description = 'Cart Owner'

    def variant_color_display(self, obj):
        """Display variant color."""
        return obj.variant.color.name if obj.variant else "N/A"
    variant_color_display.short_description = 'Variant (Color)'

    def unit_price_display(self, obj):
        """Display the unit price."""
        return f"₹{obj.unit_price}"
    unit_price_display.short_description = 'Unit Price'

    def subtotal_display(self, obj):
        """Display the subtotal."""
        return f"₹{obj.subtotal}"
    subtotal_display.short_description = 'Subtotal'

    def available_stock_display(self, obj):
        """Display available stock for this size/variant."""
        stock = obj.available_stock
        return f"{stock} units"
    available_stock_display.short_description = 'Available Stock'

    def stock_status_display(self, obj):
        """Display stock status (sufficient/insufficient)."""
        if obj.has_sufficient_stock():
            return "✓ Sufficient"
        return f"✗ Insufficient (need {obj.quantity}, have {obj.available_stock})"
    stock_status_display.short_description = 'Stock Status'

    def has_add_permission(self, request):
        # Cart items are typically added via frontend, not admin
        return False


# ==========================================
# ORDER ADMIN
# ==========================================

class OrderItemInline(TabularInline):
    """Inline admin for OrderItem - manages items in an order."""
    model = OrderItem
    extra = 0
    fields = ['product', 'variant', 'size', 'quantity', 'unit_price_display', 'total_price_display']
    readonly_fields = ['product', 'variant', 'size', 'quantity', 'unit_price_display', 'total_price_display', 'created_at']
    can_delete = False
    verbose_name = 'Order Item'
    verbose_name_plural = 'Order Items'

    def unit_price_display(self, obj):
        """Display the unit price for this item."""
        return f"₹{obj.unit_price}"
    unit_price_display.short_description = 'Unit Price'

    def total_price_display(self, obj):
        """Display the total price for this item."""
        return f"₹{obj.total_price}"
    total_price_display.short_description = 'Total Price'


@admin.register(Order)
class OrderAdmin(ModelAdmin):
    list_display = ['order_number', 'customer_name_display', 'status', 'payment_status_display', 'total_amount_display', 'created_at', 'download_invoice_button']
    list_filter = ['status', 'payment_status', 'created_at']
    search_fields = ['order_number', 'email', 'phone_number', 'first_name', 'last_name', 'user__email', 'session_id', 'razorpay_order_id', 'razorpay_payment_id']
    readonly_fields = ['order_number', 'created_at', 'updated_at', 'session_id', 'item_count_display', 'subtotal_display', 'shipping_display', 'total_amount_display']
    inlines = [OrderItemInline]
    list_editable = ['status']
    actions = ['download_invoice_action']

    fieldsets = (
        ('Order Identification', {
            'fields': ('order_number', 'user', 'session_id', 'created_at')
        }),
        ('Customer Information', {
            'fields': ('first_name', 'last_name', 'email', 'phone_number')
        }),
        ('Shipping Address', {
            'fields': ('address', 'address_2', 'city', 'state', 'postal_code')
        }),
        ('Order Status', {
            'fields': ('status', 'payment_status')
        }),
        ('Financial Summary', {
            'fields': ('item_count_display', 'subtotal_display', 'shipping_display', 'total_amount_display')
        }),
        ('Razorpay Integration', {
            'fields': ('razorpay_order_id', 'razorpay_payment_id'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('updated_at',),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-created_at']

    def customer_name_display(self, obj):
        """Display the customer name."""
        return f"{obj.first_name} {obj.last_name}"
    customer_name_display.short_description = 'Customer'

    def status_display(self, obj):
        """Display the order status with color."""
        status_colors = {
            'pending': '🟡',
            'confirmed': '🟢',
            'processing': '🔵',
            'shipped': '📦',
            'delivered': '✅',
            'cancelled': '❌',
        }
        return f"{status_colors.get(obj.status, '')} {obj.get_status_display()}"
    status_display.short_description = 'Status'

    def payment_status_display(self, obj):
        """Display the payment status with color."""
        payment_colors = {
            'pending': '🟡 Pending',
            'paid': '✅ Paid',
            'failed': '❌ Failed',
            'refunded': '🔄 Refunded',
        }
        return payment_colors.get(obj.payment_status, obj.get_payment_status_display())
    payment_status_display.short_description = 'Payment'

    def total_amount_display(self, obj):
        """Display the total order amount."""
        return f"₹{obj.total_amount}"
    total_amount_display.short_description = 'Total'

    def item_count_display(self, obj):
        """Display the total item count."""
        return obj.item_count
    item_count_display.short_description = 'Items'

    def subtotal_display(self, obj):
        """Display the subtotal."""
        return f"₹{obj.subtotal}"
    subtotal_display.short_description = 'Subtotal'

    def shipping_display(self, obj):
        """Display the shipping charge."""
        return f"₹{obj.shipping_charge}"
    shipping_display.short_description = 'Shipping'

    def has_add_permission(self, request):
        # Orders are created via checkout, not admin
        return False

    def has_delete_permission(self, request, obj=None):
        # Orders should not be deleted for audit trail
        return False

    def download_invoice_button(self, obj):
        """Display invoice download button in list view."""
        from django.urls import reverse
        from django.utils.html import format_html

        # Use public token-based URL (works without session/auth)
        url = reverse('ComfyCuteApp:download_invoice_public', args=[obj.invoice_token])
        return format_html(
            '<a class="button" href="{}" target="_blank" style="background-color: #8CBDBC; color: white; padding: 5px 15px; border-radius: 4px; text-decoration: none;">Download Invoice</a>',
            url
        )
    download_invoice_button.short_description = 'Download Invoice'

    def download_invoice_action(self, request, queryset):
        """Admin action to download first selected order's invoice."""
        from .invoice_service import InvoiceGenerator
        from django.http import HttpResponse

        if queryset.count() == 0:
            self.message_user(request, 'No orders selected.', level=admin.messages.ERROR)
            return

        # Download the first selected order's invoice
        order = queryset.first()

        try:
            pdf_buffer = InvoiceGenerator.generate_pdf(order)
            response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="COMFY-CUTE-Invoice-{order.order_number}.pdf"'
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'

            self.message_user(request, f'Invoice for {order.order_number} is being downloaded.', level=admin.messages.SUCCESS)
            return response

        except Exception as e:
            self.message_user(request, f'Error generating invoice: {str(e)}', level=admin.messages.ERROR)

    download_invoice_action.short_description = 'Download invoice for selected order'


@admin.register(OrderItem)
class OrderItemAdmin(ModelAdmin):
    list_display = ['order_number_display', 'product', 'variant_color_display', 'size', 'quantity', 'unit_price_display', 'total_price_display']
    list_filter = ['order__created_at', 'order__status', 'product']
    search_fields = ['order__order_number', 'product__name', 'variant__color__name', 'size__name']
    readonly_fields = ['order', 'product', 'variant', 'size', 'quantity', 'unit_price_display', 'total_price_display', 'created_at']

    fieldsets = (
        ('Order Reference', {
            'fields': ('order',)
        }),
        ('Product Details', {
            'fields': ('product', 'variant', 'size', 'quantity')
        }),
        ('Pricing Snapshot', {
            'fields': ('unit_price_display', 'total_price_display')
        }),
        ('Metadata', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-created_at']

    def order_number_display(self, obj):
        """Display the order number."""
        return obj.order.order_number
    order_number_display.short_description = 'Order #'

    def variant_color_display(self, obj):
        """Display variant color."""
        return obj.variant.color.name if obj.variant else "N/A"
    variant_color_display.short_description = 'Color'

    def unit_price_display(self, obj):
        """Display the unit price."""
        return f"₹{obj.unit_price}"
    unit_price_display.short_description = 'Unit Price'

    def total_price_display(self, obj):
        """Display the total price."""
        return f"₹{obj.total_price}"
    total_price_display.short_description = 'Total Price'

    def has_add_permission(self, request):
        # Order items are created during order creation, not admin
        return False

    def has_delete_permission(self, request, obj=None):
        # Order items should not be deleted for audit trail
        return False
