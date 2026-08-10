#!/usr/bin/env python
"""
Script to populate HeroBanner database with existing hero images.
Run from project root: python populate_heroes.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ComfyCute.settings')
django.setup()

from ComfyCuteApp.models import HeroBanner

# Define hero banners data
banners_data = [
    {
        'order': 1,
        'desktop_image': 'hero_banners/desktop/hero_slide_desktop1.webp',
        'mobile_image': 'hero_banners/mobile/hero_slide_mobile3.webp',
        'is_active': True,
    },
    {
        'order': 2,
        'desktop_image': 'hero_banners/desktop/hero_slide_desktop2.webp',
        'mobile_image': 'hero_banners/mobile/hero_slide_mobile2.webp',
        'is_active': True,
    },
    {
        'order': 3,
        'desktop_image': 'hero_banners/desktop/hero_slide_desktop3.webp',
        'mobile_image': 'hero_banners/mobile/hero_slide_mobile1.webp',
        'is_active': True,
    },
]

# Delete existing banners to avoid duplicates
HeroBanner.objects.all().delete()
print("✓ Cleared existing hero banners.")

# Create new banners
for data in banners_data:
    banner = HeroBanner.objects.create(
        desktop_image=data['desktop_image'],
        mobile_image=data['mobile_image'],
        order=data['order'],
        is_active=data['is_active'],
    )
    print(f"✓ Created HeroBanner #{data['order']}: {banner.desktop_image.name}")

print("\n" + "="*60)
print("Hero banners migration completed successfully!")
print("="*60)
print(f"Total banners created: {HeroBanner.objects.count()}\n")

# Verify
print("Verifying database records:")
for banner in HeroBanner.objects.all().order_by('order'):
    print(f"  Order {banner.order}:")
    print(f"    Desktop: {banner.desktop_image.name}")
    print(f"    Mobile:  {banner.mobile_image.name}")
    print(f"    Active:  {banner.is_active}")
