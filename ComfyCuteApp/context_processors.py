from .models import Announcement, Category


def announcements(request):
    """
    Context processor to make active announcements available to all templates.
    """
    active_announcements = Announcement.objects.filter(is_active=True).order_by('order')
    return {
        'announcements': active_announcements
    }


def navbar_categories(request):
    """
    Context processor to make dynamic categories and subcategories available
    to navbar templates. Also provides Shop By Age data for each category.
    """

    # Define Shop By Age options for each category
    # Note: Women has no Shop By Age section
    shop_by_age = {
        'Baby': [
            '0–3 Months',
            '3–6 Months',
            '6–12 Months',
        ],
        'Girl': [
            '0–2 Years',
            '3–5 Years',
            '6–8 Years',
            '9–12 Years',
            '13+ Years',
        ],
        'Boy': [
            '0–2 Years',
            '3–5 Years',
            '6–8 Years',
            '9–12 Years',
            '13+ Years',
        ],
        'Women': [],  # No Shop By Age for Women
    }

    # Get all categories with their subcategories
    # Using select_related and prefetch_related for efficiency
    categories = Category.objects.prefetch_related('subcategories').order_by('name')

    # Build category data with Shop By Age
    categories_with_age = []
    for category in categories:
        categories_with_age.append({
            'name': category.name,
            'slug': category.slug,
            'image': category.image,
            'subcategories': category.subcategories.all().order_by('name'),
            'shop_by_age': shop_by_age.get(category.name, []),
        })

    return {
        'navbar_categories': categories_with_age,
    }
