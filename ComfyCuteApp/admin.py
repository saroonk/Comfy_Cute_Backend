from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db import IntegrityError
from django import forms
from django.db.models import Q
from .models import (
    HeroBanner, ContactSubmission, Testimonial, User, Announcement,
    Category, SubCategory, Product, ProductVariant, ProductVariantImage,
    VariantSizeStock, Collection, Fabric, Color, Size, Wishlist
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
