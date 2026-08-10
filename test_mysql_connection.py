#!/usr/bin/env python
"""
Test MySQL connection and perform database migration.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ComfyCute.settings')
django.setup()

from django.db import connection
from django.core.management import call_command
from ComfyCuteApp.models import HeroBanner
import json

print("\n" + "=" * 70)
print("MYSQL DATABASE MIGRATION PROCESS")
print("=" * 70 + "\n")

# Step 1: Test MySQL connection
print("STEP 1: TESTING MYSQL CONNECTION")
print("-" * 70)
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"✓ MySQL connection successful!")
        print(f"✓ MySQL Version: {version[0]}\n")
except Exception as e:
    print(f"✗ MySQL connection failed!")
    print(f"Error: {e}\n")
    exit(1)

# Step 2: Read existing HeroBanner data from SQLite BEFORE applying migrations
print("\nSTEP 2: BACKING UP EXISTING HEROBANNER DATA")
print("-" * 70)

# Temporarily switch to SQLite to read existing data
import sys
from django.conf import settings

old_db_config = settings.DATABASES['default'].copy()
sqlite_db_config = {
    'ENGINE': 'django.db.backends.sqlite3',
    'NAME': 'db.sqlite3',
}

# Try to read from SQLite first
hero_data_backup = []
try:
    # Change to SQLite temporarily
    settings.DATABASES['default'] = sqlite_db_config
    connection.close()

    # Force reconnect to SQLite
    from django.db import connections
    connections.close_all()

    # Now query SQLite
    sqlite_banners = HeroBanner.objects.using('default').all()

    for banner in sqlite_banners:
        hero_data_backup.append({
            'order': banner.order,
            'desktop_image': banner.desktop_image.name if banner.desktop_image else '',
            'mobile_image': banner.mobile_image.name if banner.mobile_image else '',
            'is_active': banner.is_active,
            'hero_url': banner.hero_url or '',
        })

    print(f"✓ Backed up {len(hero_data_backup)} HeroBanner records from SQLite")
    for idx, data in enumerate(hero_data_backup, 1):
        print(f"  {idx}. Order {data['order']}: desktop={data['desktop_image']}, mobile={data['mobile_image']}, url={data['hero_url'] or 'default'}")

except Exception as e:
    print(f"Note: Could not read from SQLite (may not have data yet)")
    print(f"Details: {e}\n")

# Step 3: Restore MySQL connection
print("\nSTEP 3: RESTORING MYSQL CONNECTION")
print("-" * 70)
settings.DATABASES['default'] = old_db_config
from django.db import connections
connections.close_all()
connection.close()
print("✓ Switched back to MySQL\n")

# Step 4: Apply migrations to MySQL
print("\nSTEP 4: APPLYING MIGRATIONS TO MYSQL")
print("-" * 70)
try:
    call_command('migrate', verbosity=2)
    print("\n✓ All migrations applied successfully to MySQL\n")
except Exception as e:
    print(f"\n✗ Migration failed: {e}\n")
    exit(1)

# Step 5: Verify MySQL tables
print("\nSTEP 5: VERIFYING MYSQL TABLES")
print("-" * 70)
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'comfycute_db'")
        tables = cursor.fetchall()
        print(f"✓ MySQL tables in comfycute_db:")
        for table in tables:
            print(f"  - {table[0]}")

        # Specifically check for HeroBanner table
        hero_table_exists = any('herobanner' in table[0].lower() for table in tables)
        if hero_table_exists:
            print(f"\n✓ HeroBanner table successfully created in MySQL\n")
        else:
            print(f"\n✗ HeroBanner table NOT found in MySQL\n")
except Exception as e:
    print(f"Error checking tables: {e}\n")

# Step 6: Import backed-up HeroBanner data into MySQL
print("\nSTEP 6: IMPORTING HEROBANNER DATA INTO MYSQL")
print("-" * 70)

if hero_data_backup:
    try:
        # Clear existing records (if any)
        HeroBanner.objects.all().delete()
        print("✓ Cleared any existing HeroBanner records\n")

        # Create new records from backup
        for data in hero_data_backup:
            banner = HeroBanner.objects.create(
                order=data['order'],
                desktop_image=data['desktop_image'],
                mobile_image=data['mobile_image'],
                is_active=data['is_active'],
                hero_url=data['hero_url'] if data['hero_url'] else None,
            )
            print(f"✓ Created HeroBanner #{data['order']} in MySQL")

        print(f"\n✓ Successfully imported {len(hero_data_backup)} HeroBanner records to MySQL\n")
    except Exception as e:
        print(f"✗ Failed to import data: {e}\n")
else:
    print("No backup data to import (SQLite was empty or inaccessible)\n")

# Step 7: Verify imported data
print("\nSTEP 7: VERIFYING IMPORTED DATA IN MYSQL")
print("-" * 70)
try:
    banners = HeroBanner.objects.all().order_by('order')
    print(f"✓ Total HeroBanner records in MySQL: {banners.count()}\n")

    for banner in banners:
        print(f"  Order #{banner.order}:")
        print(f"    Desktop: {banner.desktop_image.name}")
        print(f"    Mobile:  {banner.mobile_image.name}")
        print(f"    URL:     {banner.hero_url or '(default: /products/)'}")
        print(f"    Active:  {banner.is_active}\n")
except Exception as e:
    print(f"Error verifying data: {e}\n")

print("=" * 70)
print("MIGRATION PROCESS COMPLETE")
print("=" * 70)
print("\nNext steps:")
print("1. Run: python manage.py check")
print("2. Test the homepage to verify hero slider displays correctly")
print("3. Check Django Admin to verify HeroBanner records\n")
