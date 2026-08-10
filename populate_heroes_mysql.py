#!/usr/bin/env python
"""
Recreate HeroBanner records in MySQL with existing image files.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ComfyCute.settings')
django.setup()

from ComfyCuteApp.models import HeroBanner
from django.conf import settings

print("\n" + "=" * 70)
print("RECREATING HEROBANNER RECORDS IN MYSQL")
print("=" * 70 + "\n")

# Step 1: Verify media files exist
print("STEP 1: VERIFYING HERO IMAGE FILES")
print("-" * 70)

media_root = settings.MEDIA_ROOT
hero_desktop_dir = os.path.join(media_root, 'hero_banners', 'desktop')
hero_mobile_dir = os.path.join(media_root, 'hero_banners', 'mobile')

desktop_files = []
mobile_files = []

if os.path.exists(hero_desktop_dir):
    desktop_files = sorted([f for f in os.listdir(hero_desktop_dir) if f.endswith('.webp')])
    print(f"✓ Found {len(desktop_files)} desktop hero images:")
    for f in desktop_files:
        print(f"    - {f}")
else:
    print(f"✗ Desktop directory not found: {hero_desktop_dir}")

if os.path.exists(hero_mobile_dir):
    mobile_files = sorted([f for f in os.listdir(hero_mobile_dir) if f.endswith('.webp')])
    print(f"\n✓ Found {len(mobile_files)} mobile hero images:")
    for f in mobile_files:
        print(f"    - {f}")
else:
    print(f"✗ Mobile directory not found: {hero_mobile_dir}")

# Step 2: Create HeroBanner records with existing image mappings
print("\n\nSTEP 2: CREATING HEROBANNER RECORDS IN MYSQL")
print("-" * 70)

# Define the hero banners data
banners_data = [
    {
        'order': 1,
        'desktop_image': 'hero_banners/desktop/hero_slide_desktop1.webp',
        'mobile_image': 'hero_banners/mobile/hero_slide_mobile3.webp',
        'hero_url': '',  # Default URL
        'is_active': True,
    },
    {
        'order': 2,
        'desktop_image': 'hero_banners/desktop/hero_slide_desktop2.webp',
        'mobile_image': 'hero_banners/mobile/hero_slide_mobile2.webp',
        'hero_url': '',  # Default URL
        'is_active': True,
    },
    {
        'order': 3,
        'desktop_image': 'hero_banners/desktop/hero_slide_desktop3.webp',
        'mobile_image': 'hero_banners/mobile/hero_slide_mobile1.webp',
        'hero_url': '',  # Default URL
        'is_active': True,
    },
]

# Clear any existing records
existing_count = HeroBanner.objects.count()
if existing_count > 0:
    HeroBanner.objects.all().delete()
    print(f"✓ Cleared {existing_count} existing HeroBanner records\n")

# Create new records
created_count = 0
for data in banners_data:
    try:
        # Verify images exist
        desktop_path = os.path.join(media_root, data['desktop_image'])
        mobile_path = os.path.join(media_root, data['mobile_image'])

        if not os.path.exists(desktop_path):
            print(f"✗ Desktop image not found: {data['desktop_image']}")
            continue

        if not os.path.exists(mobile_path):
            print(f"✗ Mobile image not found: {data['mobile_image']}")
            continue

        banner = HeroBanner.objects.create(
            order=data['order'],
            desktop_image=data['desktop_image'],
            mobile_image=data['mobile_image'],
            hero_url=data['hero_url'] if data['hero_url'] else None,
            is_active=data['is_active'],
        )
        created_count += 1
        print(f"✓ Created HeroBanner #{data['order']}")
        print(f"    Desktop: {banner.desktop_image.name}")
        print(f"    Mobile:  {banner.mobile_image.name}")
        print(f"    URL:     {banner.hero_url or '(default: /products/)'}")
        print(f"    Active:  {banner.is_active}\n")

    except Exception as e:
        print(f"✗ Failed to create HeroBanner #{data['order']}: {e}\n")

# Step 3: Verify all records were created
print("\nSTEP 3: VERIFYING CREATED RECORDS")
print("-" * 70)

final_banners = HeroBanner.objects.all().order_by('order')
print(f"✓ Total HeroBanner records in MySQL: {final_banners.count()}")

if final_banners.count() == 0:
    print("\n✗ No records created!")
else:
    print()
    for banner in final_banners:
        print(f"  #{banner.order}: {banner.desktop_image.name} | {banner.mobile_image.name}")

print("\n" + "=" * 70)
print("HEROBANNER RECREATION COMPLETE")
print("=" * 70 + "\n")

if created_count == len(banners_data):
    print(f"✓ Successfully created all {created_count} hero banners in MySQL")
    print("✓ All hero images are available in media directories")
    print("✓ Homepage hero slider is ready to use\n")
else:
    print(f"⚠ Only {created_count} of {len(banners_data)} banners were created\n")
