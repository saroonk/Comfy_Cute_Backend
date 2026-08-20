from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.cache import cache_control
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.utils import timezone
from datetime import timedelta
import threading
import logging
from .models import (
    HeroBanner, ContactSubmission, Testimonial, Product, Category, SubCategory,
    Fabric, Size, VariantSizeStock, Wishlist, Cart, CartItem, ProductVariant
)
from .forms import ContactSubmissionForm, RegistrationForm, EmailAuthenticationForm

logger = logging.getLogger(__name__)

def home(request):
    # Fetch hero banners and testimonials
    hero_banners = HeroBanner.objects.filter(is_active=True).order_by('order')
    testimonials = Testimonial.objects.filter(is_active=True)

    # Fetch New Arrivals (products created in the last 24 hours)
    twenty_four_hours_ago = timezone.now() - timedelta(hours=24)
    new_arrivals = Product.objects.filter(
        is_active=True,
        created_at__gte=twenty_four_hours_ago
    ).order_by('-created_at')[:12]

    # Fetch Women's Collection (Category = Woman)
    try:
        woman_category = Category.objects.get(name='Women')
        women_products = Product.objects.filter(
            is_active=True,
            category=woman_category
        ).order_by('-created_at')[:8]
    except Category.DoesNotExist:
        women_products = []

    # Fetch Kids Collection (Category = Girl OR Boy, excluding Baby)
    try:
        girl_category = Category.objects.get(name='Girl')
        boy_category = Category.objects.get(name='Boy')
        kids_products = Product.objects.filter(
            is_active=True,
            category__in=[girl_category, boy_category]
        ).order_by('-created_at')[:8]
    except Category.DoesNotExist:
        kids_products = []

    context = {
        'hero_banners': hero_banners,
        'testimonials': testimonials,
        'new_arrivals': new_arrivals,
        'women_products': women_products,
        'kids_products': kids_products,
    }
    return render(request, 'index.html', context)



def products(request):
    """
    Display products listing page with dynamic filtering, sorting, and pagination.

    Supports:
    - Category and Subcategory filtering
    - Price range filtering (min_price, max_price)
    - Size filtering (through product variants)
    - Fabric filtering
    - Availability filtering (in-stock/out-of-stock)
    - Sorting (price_low, price_high, newest, oldest)
    - Pagination
    """
    from django.db.models import Q, Min, Exists, OuterRef
    from django.core.paginator import Paginator

    # Start with active products
    products_qs = Product.objects.filter(is_active=True)

    # Apply Search filter (case-insensitive, searches name and short_description)
    search_query = request.GET.get('q', '').strip() if request.GET.get('q') else None
    if search_query:
        from django.db.models import Q
        products_qs = products_qs.filter(
            Q(name__icontains=search_query) |
            Q(short_description__icontains=search_query)
        )

    # Get all categories and sizes for filter options
    categories = Category.objects.all()
    sizes = Size.objects.all()
    fabrics = Fabric.objects.all()

    # Get initial subcategories (will be filtered by category selection)
    # IMPORTANT: This must be restored from the CURRENT request, not stale values
    # Use slug-based identification instead of ID
    selected_category_slug = request.GET.get('category', '').strip() if request.GET.get('category') else None
    selected_category = None

    if selected_category_slug:
        try:
            # Ensure category_slug is valid before filtering
            selected_category = Category.objects.get(slug=selected_category_slug)
            subcategories = selected_category.subcategories.all().order_by('name')
            products_qs = products_qs.filter(category=selected_category)
        except Category.DoesNotExist:
            # Invalid category slug, ignore it
            subcategories = SubCategory.objects.all().order_by('name')
            selected_category_slug = None
            selected_category = None
    else:
        # No category selected, show all subcategories
        subcategories = SubCategory.objects.all().order_by('name')

    # Apply Subcategory filter (must belong to selected category if category is selected)
    # Use slug-based identification
    selected_subcategory_slug = request.GET.get('subcategory')
    if selected_subcategory_slug:
        try:
            # Validate that subcategory belongs to selected category (if category is selected)
            if selected_category:
                # Verify subcategory belongs to this category
                subcategory_obj = selected_category.subcategories.filter(
                    slug=selected_subcategory_slug
                ).first()
                if subcategory_obj:
                    products_qs = products_qs.filter(subcategory=subcategory_obj)
                # else: subcategory doesn't belong to selected category, ignore it
            else:
                # No category selected, apply subcategory filter directly
                products_qs = products_qs.filter(subcategory__slug=selected_subcategory_slug)
        except (ValueError, TypeError):
            pass

    # Apply Price filters
    min_price = request.GET.get('min_price', '').strip() if request.GET.get('min_price') else None
    max_price = request.GET.get('max_price', '').strip() if request.GET.get('max_price') else None

    if min_price:
        try:
            min_price_float = float(min_price)
            if min_price_float > 0:  # Only apply if value is positive
                products_qs = products_qs.filter(selling_price__gte=min_price_float)
        except (ValueError, TypeError):
            min_price = None

    if max_price:
        try:
            max_price_float = float(max_price)
            if max_price_float > 0:  # Only apply if value is positive
                products_qs = products_qs.filter(selling_price__lte=max_price_float)
        except (ValueError, TypeError):
            max_price = None

    # Apply Fabric filter (supporting multiple selections)
    selected_fabrics = request.GET.getlist('fabric')
    selected_fabrics = [f.strip() for f in selected_fabrics if f.strip()]
    if selected_fabrics:
        products_qs = products_qs.filter(fabric__slug__in=selected_fabrics)

    # Apply Size filter (supporting multiple selections through variants and size stocks)
    selected_sizes = request.GET.getlist('size')
    selected_sizes = [s.strip() for s in selected_sizes if s.strip()]
    if selected_sizes:
        # Get variants that have any of these sizes
        from .models import VariantSizeStock
        size_stocks_exist = VariantSizeStock.objects.filter(
            variant__product=OuterRef('pk'),
            size__slug__in=selected_sizes
        )
        products_qs = products_qs.annotate(
            has_size=Exists(size_stocks_exist)
        ).filter(has_size=True)

    # Apply Availability filter (supporting multiple selections)
    selected_availabilities = request.GET.getlist('availability')
    selected_availabilities = [a.strip() for a in selected_availabilities if a.strip()]
    if selected_availabilities:
        from .models import VariantSizeStock
        if 'available' in selected_availabilities and 'out-of-stock' in selected_availabilities:
            # Both options selected, no filtering needed
            pass
        elif 'available' in selected_availabilities:
            # Products with at least one variant/size combo with stock > 0
            has_stock = VariantSizeStock.objects.filter(
                variant__product=OuterRef('pk'),
                stock__gt=0
            )
            products_qs = products_qs.annotate(
                in_stock=Exists(has_stock)
            ).filter(in_stock=True)
        elif 'out-of-stock' in selected_availabilities:
            # Products with no stock or no variants
            has_no_stock = VariantSizeStock.objects.filter(
                variant__product=OuterRef('pk'),
                stock__gt=0
            )
            products_qs = products_qs.annotate(
                has_inventory=Exists(has_no_stock)
            ).filter(has_inventory=False)

    # Apply Sorting
    sort_by = request.GET.get('sort', 'newest')
    if sort_by == 'price_low':
        products_qs = products_qs.order_by('selling_price')
    elif sort_by == 'price_high':
        products_qs = products_qs.order_by('-selling_price')
    elif sort_by == 'oldest':
        products_qs = products_qs.order_by('created_at')
    else:  # 'newest' or default
        products_qs = products_qs.order_by('-created_at')

    # Get product count before pagination
    total_products = products_qs.count()

    # Apply Pagination
    paginator = Paginator(products_qs, 12)  # 12 products per page
    page_number = request.GET.get('page', 1)
    try:
        page_obj = paginator.page(page_number)
    except:
        page_obj = paginator.page(1)

    # Construct query string for pagination links
    query_params = request.GET.copy()
    if 'page' in query_params:
        del query_params['page']
    filter_query = query_params.urlencode()

    # Prepare context
    context = {
        'products': page_obj.object_list,
        'page_obj': page_obj,
        'paginator': paginator,
        'total_products': total_products,

        # Filter options
        'categories': categories,
        'subcategories': subcategories,
        'sizes': sizes,
        'fabrics': fabrics,

        # Selected values (for maintaining state) - now using slugs
        'selected_category': selected_category,  # Pass the category object for hero title
        'selected_category_slug': selected_category_slug,  # Pass slug for filter state
        'selected_subcategory_slug': selected_subcategory_slug,
        'selected_sizes': selected_sizes,
        'selected_fabrics': selected_fabrics,
        'selected_availabilities': selected_availabilities,
        'selected_sort': sort_by,
        'selected_min_price': min_price,
        'selected_max_price': max_price,
        'selected_size': selected_sizes[0] if selected_sizes else '',
        'selected_fabric': selected_fabrics[0] if selected_fabrics else '',
        'selected_availability': selected_availabilities[0] if selected_availabilities else '',
        'filter_query': filter_query,
        'search_query': search_query,  # Pass search query for display and state
    }

    return render(request, 'products.html', context)

def product_detail(request, slug):
    """
    Display detailed information for a specific product.

    Only active products are displayed.
    Uses product slug for URL identification.
    Includes variants, related products, and all dynamic content.
    """
    from django.shortcuts import get_object_or_404
    from django.db.models import Prefetch

    # Get the product by slug
    product = get_object_or_404(Product, slug=slug, is_active=True)

    # Get all active variants for this product with related data
    variants = product.variants.filter(is_active=True).prefetch_related(
        'images',
        'size_stocks__size',
        'color'
    )

    # Get default variant or first active variant
    default_variant = product.get_default_variant()
    if not default_variant and variants.exists():
        default_variant = variants.first()

    # Get related products from the same category (excluding current product)
    # Order by newest first
    related_products = Product.objects.filter(
        category=product.category,
        is_active=True
    ).exclude(
        id=product.id
    ).order_by('-created_at')[:6]

    context = {
        'product': product,
        'variants': variants,
        'default_variant': default_variant,
        'related_products': related_products,
    }
    return render(request, 'product-detail.html', context)

def send_contact_notification_email(contact_submission):
    """
    Send an email notification to the admin when a contact form is submitted.
    Runs in a background thread to avoid blocking the response.
    """
    try:
        subject = f"New Contact Form Submission - {contact_submission.get_subject_display()}"

        # Create email context
        context = {
            'first_name': contact_submission.first_name,
            'last_name': contact_submission.last_name,
            'email': contact_submission.email,
            'phone': contact_submission.phone or 'Not provided',
            'subject': contact_submission.get_subject_display(),
            'message': contact_submission.message,
            'submitted_at': contact_submission.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        }

        # Render email template
        html_message = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
                .header h2 {{ margin: 0; color: #333; }}
                .content {{ margin-bottom: 20px; }}
                .field {{ margin-bottom: 15px; }}
                .label {{ font-weight: bold; color: #555; }}
                .value {{ margin-top: 5px; color: #333; }}
                .message-box {{ background-color: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; border-radius: 3px; }}
                .footer {{ color: #999; font-size: 12px; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>📬 New Contact Form Submission</h2>
                </div>

                <div class="content">
                    <div class="field">
                        <div class="label">Name:</div>
                        <div class="value">{context['first_name']} {context['last_name']}</div>
                    </div>

                    <div class="field">
                        <div class="label">Email:</div>
                        <div class="value"><a href="mailto:{context['email']}">{context['email']}</a></div>
                    </div>

                    <div class="field">
                        <div class="label">Phone:</div>
                        <div class="value">{context['phone']}</div>
                    </div>

                    <div class="field">
                        <div class="label">Subject:</div>
                        <div class="value">{context['subject']}</div>
                    </div>

                    <div class="field">
                        <div class="label">Message:</div>
                        <div class="message-box">{context['message']}</div>
                    </div>

                    <div class="field">
                        <div class="label">Submitted At:</div>
                        <div class="value">{context['submitted_at']}</div>
                    </div>
                </div>

                <div class="footer">
                    <p>This email was generated by the COMFY CUTE Contact Form system.</p>
                </div>
            </div>
        </body>
        </html>
        """

        send_mail(
            subject=subject,
            message='',  # Plain text fallback
            html_message=html_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.DEFAULT_FROM_EMAIL],
            fail_silently=False,
        )

        logger.info(f"Contact notification email sent for submission from {contact_submission.email}")
    except Exception as e:
        logger.error(f"Failed to send contact notification email: {str(e)}")


@require_http_methods(["GET", "POST"])
def contact(request):
    """
    Handle contact form requests.
    GET: Render the contact page with an empty form.
    POST: Process the form submission and send email.
    """
    if request.method == 'POST':
        # Handle AJAX form submission
        form = ContactSubmissionForm(request.POST)

        if form.is_valid():
            # Save the contact submission
            contact_submission = form.save()

            # Send email notification in background thread
            email_thread = threading.Thread(
                target=send_contact_notification_email,
                args=(contact_submission,),
                daemon=True
            )
            email_thread.start()

            # Return JSON response for AJAX
            return JsonResponse({
                'success': True,
                'message': 'Thank you for your message! We\'ll get back to you within 24 hours.',
                'submission_id': contact_submission.id,
            })
        else:
            # Return validation errors as JSON
            errors = {}
            for field, error_list in form.errors.items():
                errors[field] = error_list[0] if error_list else 'Invalid input'

            return JsonResponse({
                'success': False,
                'message': 'Please correct the errors below.',
                'errors': errors,
            }, status=400)

    # GET request: render the contact form
    form = ContactSubmissionForm()
    return render(request, 'contact.html', {'form': form})

def about_us(request):
    return render(request, 'about-us.html')

def wishlist(request):
    return render(request, 'wishlist.html')

def login(request):
    return render(request, 'login.html')

def track_order(request):
    return render(request, 'track-order.html')

def privacy_policy(request):
    return render(request, 'privacy-policy.html')

def terms_of_service(request):
    return render(request, 'terms-of-service.html')

def refund_policy(request):
    return render(request, 'refund-policy.html')

def shipping_policy(request):
    return render(request, 'shipping-policy.html')

def return_exchange(request):
    return render(request, 'return-exchange.html')



@cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0)
def checkout(request):
    """
    Checkout page view.
    Displays the checkout form and order summary with actual cart data.

    Cart data is fetched from the database for authenticated users or session-based carts.
    """
    from decimal import Decimal
    import json

    # Get the user's cart
    cart = None
    cart_items = []
    cart_subtotal = Decimal('0.00')
    total_quantity = 0
    shipping_charge = Decimal('0.00')
    total_amount = Decimal('0.00')
    has_cart = False

    if request.user.is_authenticated:
        # Fetch authenticated user's cart
        cart = Cart.objects.filter(user=request.user).first()
    else:
        # Fetch session-based cart
        # Ensure we use the CURRENT session (from cookie if available)
        # Accessing request.session triggers Django to load the session from the cookie
        _ = request.session.session_key  # Access the session to load it from cookie
        session_id = request.session.session_key

        if session_id:
            # Use existing session from cookie
            cart = Cart.objects.filter(session_id=session_id).first()
        else:
            # No existing session - this is a fresh visit
            # Create a new session for anonymous user
            request.session.create()
            session_id = request.session.session_key
            if session_id:
                cart = Cart.objects.filter(session_id=session_id).first()

    # Check if cart is empty - redirect if so
    if not cart or cart.is_empty:
        # Cart is empty - redirect to products page
        return redirect('ComfyCuteApp:products')

    # Process cart items
    has_cart = True
    cart_items = cart.items.all()
    total_quantity = cart.total_quantity
    cart_subtotal = cart.subtotal

    # Calculate shipping based on total quantity
    # 1-3 pieces: ₹40, 4+ pieces: FREE
    if total_quantity <= 3:
        shipping_charge = Decimal('40.00')
    else:
        shipping_charge = Decimal('0.00')

    # Calculate total
    total_amount = cart_subtotal + shipping_charge

    # Prepare cart data for JavaScript (JSON format)
    cart_data_json = '[]'
    if has_cart:
        cart_items_list = []
        for item in cart_items:
            item_data = {
                'id': item.id,
                'name': item.product.name,
                'price': float(item.unit_price),
                'quantity': item.quantity,
                'size': item.size.name if item.size else '',
                'color': item.variant.color.name if item.variant else '',
                'image': item.product.main_image.url if item.product.main_image else '',
            }
            cart_items_list.append(item_data)
        cart_data_json = json.dumps(cart_items_list)

    context = {
        'cart': cart,
        'cart_items': cart_items,
        'has_cart': has_cart,
        'total_quantity': total_quantity,
        'cart_subtotal': cart_subtotal,
        'shipping_charge': shipping_charge,
        'total_amount': total_amount,
        'cart_data_json': cart_data_json,  # JSON string for JavaScript
    }

    return render(request, 'checkout.html', context)


# ==========================================
# AUTHENTICATION VIEWS
# ==========================================

@require_http_methods(["GET", "POST"])
def register(request):
    """
    User registration view.
    POST: Process registration form and create account
    """
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            # Auto-login user after registration
            auth_login(request, user)
            return redirect('ComfyCuteApp:home')
        # Registration failed - show errors in register form and keep it active
        login_form = EmailAuthenticationForm()
        context = {'login_form': login_form, 'register_form': form, 'register_active': True}
        return render(request, 'login.html', context)

    # GET request - show both forms
    login_form = EmailAuthenticationForm()
    register_form = RegistrationForm()
    context = {'login_form': login_form, 'register_form': register_form}
    return render(request, 'login.html', context)


@require_http_methods(["GET", "POST"])
def login_view(request):
    """
    User login view.
    GET: Display login page with login and register forms
    POST: Process login form (email + password)
    """
    if request.user.is_authenticated:
        return redirect('ComfyCuteApp:home')

    if request.method == 'POST':
        login_form = EmailAuthenticationForm(request=request, data=request.POST)
        if login_form.is_valid():
            email = login_form.cleaned_data.get('username')
            password = login_form.cleaned_data.get('password')
            user = authenticate(request, username=email, password=password)
            if user is not None:
                auth_login(request, user)
                return redirect('ComfyCuteApp:home')
        # Login failed - show errors in login form and keep it active
        register_form = RegistrationForm()
        context = {'login_form': login_form, 'register_form': register_form, 'login_active': True}
        return render(request, 'login.html', context)

    # GET request - show both forms
    login_form = EmailAuthenticationForm()
    register_form = RegistrationForm()
    context = {'login_form': login_form, 'register_form': register_form}
    return render(request, 'login.html', context)


@require_http_methods(["GET"])
def logout_view(request):
    """
    User logout view.
    Logs out the user and redirects to home.
    """
    auth_logout(request)
    return redirect('ComfyCuteApp:home')


# ==========================================
# WISHLIST ENDPOINTS
# ==========================================

@require_http_methods(["POST"])
def wishlist_toggle(request, product_id):
    """
    AJAX endpoint for toggling wishlist items.

    Handles both authenticated users and anonymous sessions.
    - If product is not wishlisted: adds it and returns wishlisted=true
    - If product is already wishlisted: removes it and returns wishlisted=false

    Returns JSON with:
    - success: True/False
    - wishlisted: True/False (current state after toggle)
    - wishlist_count: Updated count from database
    """
    from django.shortcuts import get_object_or_404

    try:
        # Get the product
        product = get_object_or_404(Product, id=product_id, is_active=True)

        # Determine owner: authenticated user or session
        if request.user.is_authenticated:
            owner_user = request.user
            owner_session = None
        else:
            owner_user = None
            # Ensure session exists for anonymous users
            if not request.session.session_key:
                request.session.create()
            owner_session = request.session.session_key

        # Check if product is already in wishlist
        if owner_user:
            wishlist_item = Wishlist.objects.filter(user=owner_user, product=product).first()
        else:
            wishlist_item = Wishlist.objects.filter(session_id=owner_session, product=product).first()

        # Toggle: delete if exists, create if doesn't exist
        if wishlist_item:
            wishlist_item.delete()
            wishlisted = False
        else:
            Wishlist.objects.create(
                user=owner_user,
                session_id=owner_session,
                product=product
            )
            wishlisted = True

        # Get updated count from database
        if owner_user:
            wishlist_count = Wishlist.objects.filter(user=owner_user).count()
        else:
            wishlist_count = Wishlist.objects.filter(session_id=owner_session).count()

        return JsonResponse({
            'success': True,
            'wishlisted': wishlisted,
            'wishlist_count': wishlist_count,
        })

    except Exception as e:
        logger.error(f"Error toggling wishlist: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': 'An error occurred while updating your wishlist.',
        }, status=500)


# ==========================================
# ADMIN API ENDPOINTS
# ==========================================

@require_http_methods(["GET"])
def admin_api_subcategories(request):
    """
    API endpoint for dynamic subcategory loading.
    Returns subcategories filtered by category_slug (not ID).

    Query parameters:
    - category_id: ID of the category to get subcategories for (for admin compatibility)
    - category_slug: Slug of the category to get subcategories for (preferred)
    - all: If 'true', returns all categories with their subcategories
    """
    from .models import Category, SubCategory

    category_id = request.GET.get('category_id')
    category_slug = request.GET.get('category_slug')
    all_data = request.GET.get('all', 'false').lower() == 'true'

    if all_data:
        # Return all categories with their subcategories
        categories = []
        for category in Category.objects.all():
            cat_data = {
                'id': category.id,
                'slug': category.slug,
                'name': category.name,
                'subcategories': list(
                    category.subcategories.values('id', 'slug', 'name').order_by('name')
                )
            }
            categories.append(cat_data)
        return JsonResponse({'categories': categories})

    # Try slug first (preferred), then fall back to ID for compatibility
    category = None
    if category_slug:
        try:
            category = Category.objects.get(slug=category_slug)
        except Category.DoesNotExist:
            return JsonResponse({'error': 'Category not found'}, status=404)
    elif category_id:
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            return JsonResponse({'error': 'Category not found'}, status=404)
    else:
        return JsonResponse({'error': 'category_slug or category_id parameter required'}, status=400)

    subcategories = list(
        category.subcategories.values('id', 'slug', 'name').order_by('name')
    )
    return JsonResponse({'subcategories': subcategories})


# ==========================================
# CART API ENDPOINTS — PHASE 2
# ==========================================

def get_or_create_user_cart(request):
    """
    Get or create a cart for the current user/session.

    Returns:
        Cart object
        None if user is not authenticated and session is not set
    """
    if request.user.is_authenticated:
        # Authenticated user - get their cart
        cart, created = Cart.objects.get_or_create(user=request.user)
        return cart
    else:
        # Anonymous user - use session
        if not request.session.session_key:
            request.session.create()

        session_key = request.session.session_key
        cart, created = Cart.objects.get_or_create(session_id=session_key)
        return cart


def format_cart_response(cart):
    """
    Format cart data for JSON response.

    Returns dict with:
    - cart_count: Total quantity of items
    - cart_total: Total price of all items
    - items: List of cart item data
    """
    items = []
    for item in cart.items.all().select_related('product', 'variant', 'size'):
        items.append({
            'id': item.id,
            'product_id': item.product.id,
            'product_name': item.product.name,
            'variant_id': item.variant.id,
            'variant_name': item.variant.color.name,
            'size_id': item.size.id,
            'size_name': item.size.name,
            'quantity': item.quantity,
            'unit_price': str(item.unit_price),
            'subtotal': str(item.subtotal),
            'available_stock': item.available_stock,
            'image': item.variant.images.first().image.url if item.variant.images.exists() else item.product.main_image.url if item.product.main_image else None,
        })

    return {
        'cart_count': cart.total_quantity,
        'cart_total': str(cart.subtotal),
        'items': items,
    }


@require_http_methods(["POST"])
def cart_add(request):
    """
    Add a product to the cart or increase quantity if already exists.

    POST Parameters (JSON):
    - product_id: ID of the product
    - variant_id: ID of the product variant (color)
    - size_id: ID of the size
    - quantity: Quantity to add (default 1)

    Returns JSON with:
    - success: boolean
    - message: error/success message
    - cart_count: updated total quantity
    - cart_total: updated total price
    - items: updated cart items
    """
    import json
    from django.core.exceptions import ValidationError

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)

    # Get and validate input
    try:
        product_id = int(data.get('product_id'))
        variant_id = int(data.get('variant_id'))
        size_id = int(data.get('size_id'))
        quantity = int(data.get('quantity', 1))
    except (TypeError, ValueError):
        return JsonResponse({'success': False, 'message': 'Invalid product/variant/size IDs or quantity'}, status=400)

    if quantity < 1:
        return JsonResponse({'success': False, 'message': 'Quantity must be at least 1'}, status=400)

    try:
        # Validate product exists
        product = Product.objects.get(id=product_id, is_active=True)
    except Product.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Product not found'}, status=404)

    try:
        # Validate variant exists and belongs to product
        variant = ProductVariant.objects.get(id=variant_id, product=product, is_active=True)
    except ProductVariant.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Invalid variant for this product'}, status=404)

    try:
        # Validate size exists
        size = Size.objects.get(id=size_id)
    except Size.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Size not found'}, status=404)

    try:
        # Validate size/stock record exists for this variant
        variant_size_stock = VariantSizeStock.objects.get(variant=variant, size=size)
    except VariantSizeStock.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'This size is not available for this variant'}, status=404)

    # Check stock availability
    current_stock = variant_size_stock.stock

    # Get or create cart
    cart = get_or_create_user_cart(request)

    # Check if same product/variant/size already in cart
    try:
        existing_item = CartItem.objects.get(
            cart=cart,
            product=product,
            variant=variant,
            size=size
        )
        # Item exists - validate total quantity
        new_quantity = existing_item.quantity + quantity
        if new_quantity > current_stock:
            return JsonResponse({
                'success': False,
                'message': f'Only {current_stock} units available. You already have {existing_item.quantity} in cart.'
            }, status=400)

        # Update quantity
        existing_item.quantity = new_quantity
        existing_item.save()
        cart_item = existing_item

    except CartItem.DoesNotExist:
        # New item - validate quantity
        if quantity > current_stock:
            return JsonResponse({
                'success': False,
                'message': f'Only {current_stock} units available'
            }, status=400)

        # Create new cart item
        cart_item = CartItem.objects.create(
            cart=cart,
            product=product,
            variant=variant,
            size=size,
            quantity=quantity
        )

    # Return updated cart
    cart_data = format_cart_response(cart)
    cart_data['success'] = True
    cart_data['message'] = 'Product added to cart'

    return JsonResponse(cart_data)


@require_http_methods(["POST"])
def cart_update(request):
    """
    Update quantity of an item in the cart.

    POST Parameters (JSON):
    - cart_item_id: ID of the CartItem to update
    - quantity: New quantity (must be >= 1)

    Returns JSON with updated cart data
    """
    import json
    from django.core.exceptions import ValidationError

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)

    try:
        cart_item_id = int(data.get('cart_item_id'))
        quantity = int(data.get('quantity', 1))
    except (TypeError, ValueError):
        return JsonResponse({'success': False, 'message': 'Invalid cart_item_id or quantity'}, status=400)

    if quantity < 1:
        return JsonResponse({'success': False, 'message': 'Quantity must be at least 1'}, status=400)

    # Get current user's cart
    cart = get_or_create_user_cart(request)

    try:
        cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
    except CartItem.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Cart item not found'}, status=404)

    # Validate stock
    available_stock = cart_item.available_stock
    if quantity > available_stock:
        return JsonResponse({
            'success': False,
            'message': f'Only {available_stock} units available'
        }, status=400)

    # Update quantity
    cart_item.quantity = quantity
    cart_item.save()

    # Return updated cart
    cart_data = format_cart_response(cart)
    cart_data['success'] = True
    cart_data['message'] = 'Cart item updated'

    return JsonResponse(cart_data)


@require_http_methods(["POST"])
def cart_remove(request):
    """
    Remove an item from the cart.

    POST Parameters (JSON):
    - cart_item_id: ID of the CartItem to remove

    Returns JSON with updated cart data
    """
    import json

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'message': 'Invalid JSON'}, status=400)

    try:
        cart_item_id = int(data.get('cart_item_id'))
    except (TypeError, ValueError):
        return JsonResponse({'success': False, 'message': 'Invalid cart_item_id'}, status=400)

    # Get current user's cart
    cart = get_or_create_user_cart(request)

    try:
        cart_item = CartItem.objects.get(id=cart_item_id, cart=cart)
    except CartItem.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'Cart item not found'}, status=404)

    # Delete the item
    cart_item.delete()

    # Return updated cart
    cart_data = format_cart_response(cart)
    cart_data['success'] = True
    cart_data['message'] = 'Item removed from cart'

    return JsonResponse(cart_data)


@require_http_methods(["GET"])
def cart_get(request):
    """
    Get current cart data (read-only).

    Returns JSON with current cart items and totals
    """
    cart = get_or_create_user_cart(request)
    cart_data = format_cart_response(cart)
    cart_data['success'] = True

    return JsonResponse(cart_data)


@cache_control(no_cache=True, no_store=True, must_revalidate=True, max_age=0)
@require_http_methods(["GET"])
def checkout_data(request):
    """
    Get current checkout data - cart items and totals.

    Used by checkout.html to keep Order Summary in sync with actual Cart.
    Always returns fresh data (no caching).

    Returns JSON with:
    - items: Current CartItems with product details
    - subtotal: Cart subtotal
    - total_quantity: Total number of pieces
    - shipping_charge: Calculated shipping
    - total_amount: Grand total
    - success: True/False
    """
    from decimal import Decimal
    import json

    # Determine which cart to fetch
    cart = None
    if request.user.is_authenticated:
        cart = Cart.objects.filter(user=request.user).first()
    else:
        # IMPORTANT: Use the EXACT same session logic as checkout() view
        # Access session key to load from cookie first, before creating
        _ = request.session.session_key
        session_id = request.session.session_key

        if session_id:
            # Use existing session from cookie
            cart = Cart.objects.filter(session_id=session_id).first()
        else:
            # No existing session - create new one only as fallback
            request.session.create()
            session_id = request.session.session_key
            if session_id:
                cart = Cart.objects.filter(session_id=session_id).first()

    # Prepare response
    response_data = {
        'success': False,
        'items': [],
        'subtotal': 0,
        'total_quantity': 0,
        'shipping_charge': 0,
        'total_amount': 0,
    }

    # If no cart or empty cart, return empty data
    if not cart or cart.is_empty:
        return JsonResponse(response_data)

    # Build items list with full product details
    items_list = []
    for item in cart.items.all():
        item_data = {
            'id': item.id,
            'name': item.product.name,
            'price': float(item.unit_price),
            'quantity': item.quantity,
            'size': item.size.name if item.size else '',
            'color': item.variant.color.name if item.variant else '',
            'image': item.product.main_image.url if item.product.main_image else '',
        }
        items_list.append(item_data)

    # Calculate totals
    total_quantity = cart.total_quantity
    cart_subtotal = float(cart.subtotal)

    # Calculate shipping (1-3: ₹40, 4+: FREE)
    if total_quantity <= 3:
        shipping_charge = 40.00
    else:
        shipping_charge = 0.00

    total_amount = cart_subtotal + shipping_charge

    # Build successful response
    response_data = {
        'success': True,
        'items': items_list,
        'subtotal': cart_subtotal,
        'total_quantity': total_quantity,
        'shipping_charge': shipping_charge,
        'total_amount': total_amount,
    }

    return JsonResponse(response_data)
