from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.db import IntegrityError
from .models import HeroBanner, ContactSubmission, Testimonial, User, Announcement, Category, SubCategory
from unfold.admin import ModelAdmin


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
