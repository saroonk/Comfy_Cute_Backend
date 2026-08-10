from django.contrib import admin
from .models import HeroBanner


from unfold.admin import ModelAdmin

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
