from .models import Announcement, Category, Wishlist, Cart


def announcements(request):
    """
    Context processor to make active announcements available to all templates.
    """
    active_announcements = Announcement.objects.filter(is_active=True).order_by('order')
    return {
        'announcements': active_announcements
    }


def wishlist_context(request):
    """
    Context processor to provide wishlist information globally to all templates.

    Handles both authenticated users and anonymous sessions.
    For authenticated users, uses request.user.
    For anonymous users, uses request.session.session_key.

    Provides:
    - wishlist_product_ids: List of product IDs in the current wishlist
    - wishlist_count: Total count of wishlist items
    - wishlist_products: QuerySet of wishlisted products (optional, for detailed display)
    """
    wishlist_product_ids = []
    wishlist_count = 0
    wishlist_products = []

    # Determine owner: authenticated user or session
    if request.user.is_authenticated:
        # Authenticated user
        wishlist_qs = Wishlist.objects.filter(user=request.user).select_related('product')
    else:
        # Anonymous user: ensure session exists
        if not request.session.session_key:
            request.session.create()

        session_key = request.session.session_key
        wishlist_qs = Wishlist.objects.filter(session_id=session_key).select_related('product')

    # Extract product IDs and count
    wishlist_product_ids = list(wishlist_qs.values_list('product_id', flat=True))
    wishlist_count = wishlist_qs.count()
    wishlist_products = [item.product for item in wishlist_qs]

    return {
        'wishlist_product_ids': wishlist_product_ids,
        'wishlist_count': wishlist_count,
        'wishlist_products': wishlist_products,
    }


def cart_context(request):
    """
    Context processor to provide cart count globally to all templates.

    Handles both authenticated users and anonymous sessions.
    For authenticated users, uses request.user.
    For anonymous users, uses request.session.session_key.

    Provides:
    - cart_count: Total quantity of items in cart
    """
    cart_count = 0

    # Determine owner: authenticated user or session
    if request.user.is_authenticated:
        # Authenticated user
        try:
            cart = Cart.objects.get(user=request.user)
            cart_count = cart.total_quantity
        except Cart.DoesNotExist:
            cart_count = 0
    else:
        # Anonymous user: ensure session exists
        if not request.session.session_key:
            request.session.create()

        session_key = request.session.session_key
        try:
            cart = Cart.objects.get(session_id=session_key)
            cart_count = cart.total_quantity
        except Cart.DoesNotExist:
            cart_count = 0

    return {
        'cart_count': cart_count,
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
