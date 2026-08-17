from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.utils import timezone
from datetime import timedelta
import threading
import logging
from .models import (
    HeroBanner, ContactSubmission, Testimonial, Product, Category, SubCategory,
    Fabric, Size, VariantSizeStock
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

    # Get all categories and sizes for filter options
    categories = Category.objects.all()
    sizes = Size.objects.all()
    fabrics = Fabric.objects.all()

    # Get initial subcategories (will be filtered by category selection)
    # IMPORTANT: This must be restored from the CURRENT request, not stale values
    selected_category_id = request.GET.get('category', '').strip() if request.GET.get('category') else None

    if selected_category_id:
        try:
            # Ensure category_id is valid before filtering
            category_exists = Category.objects.filter(id=selected_category_id).exists()
            if category_exists:
                subcategories = SubCategory.objects.filter(category_id=selected_category_id).order_by('name')
                products_qs = products_qs.filter(category_id=selected_category_id)
            else:
                # Invalid category ID, ignore it
                subcategories = SubCategory.objects.all().order_by('name')
                selected_category_id = None
        except (ValueError, TypeError):
            # Error converting category ID, load all subcategories
            subcategories = SubCategory.objects.all().order_by('name')
            selected_category_id = None
    else:
        # No category selected, show all subcategories
        subcategories = SubCategory.objects.all().order_by('name')

    # Apply Subcategory filter (must belong to selected category if category is selected)
    selected_subcategory_id = request.GET.get('subcategory')
    if selected_subcategory_id:
        try:
            # Validate that subcategory belongs to selected category (if category is selected)
            if selected_category_id:
                # Verify subcategory belongs to this category
                subcategory_obj = SubCategory.objects.filter(
                    id=selected_subcategory_id,
                    category_id=selected_category_id
                ).first()
                if subcategory_obj:
                    products_qs = products_qs.filter(subcategory_id=selected_subcategory_id)
                # else: subcategory doesn't belong to selected category, ignore it
            else:
                # No category selected, apply subcategory filter directly
                products_qs = products_qs.filter(subcategory_id=selected_subcategory_id)
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

        # Selected values (for maintaining state)
        'selected_category': selected_category_id,
        'selected_subcategory': selected_subcategory_id,
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
    }

    return render(request, 'products.html', context)

def product_detail(request, slug):
    """
    Display detailed information for a specific product.

    Only active products are displayed.
    Uses product slug for URL identification.
    """
    from django.shortcuts import get_object_or_404

    product = get_object_or_404(Product, slug=slug, is_active=True)
    context = {
        'product': product,
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



def checkout(request):
    """
    Checkout page view.
    Displays the checkout form where users can enter their billing and shipping information.
    Cart data is handled client-side via JavaScript and localStorage.
    """
    return render(request, 'checkout.html')


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
# ADMIN API ENDPOINTS
# ==========================================

@require_http_methods(["GET"])
def admin_api_subcategories(request):
    """
    API endpoint for Product admin dependent dropdown.
    Returns subcategories filtered by category_id.

    Query parameters:
    - category_id: ID of the category to get subcategories for
    - all: If 'true', returns all categories with their subcategories
    """
    from .models import Category, SubCategory

    category_id = request.GET.get('category_id')
    all_data = request.GET.get('all', 'false').lower() == 'true'

    if all_data:
        # Return all categories with their subcategories
        categories = []
        for category in Category.objects.all():
            cat_data = {
                'id': category.id,
                'name': category.name,
                'subcategories': list(
                    category.subcategories.values('id', 'name').order_by('name')
                )
            }
            categories.append(cat_data)
        return JsonResponse({'categories': categories})

    if not category_id:
        return JsonResponse({'error': 'category_id parameter required'}, status=400)

    try:
        category = Category.objects.get(id=category_id)
        subcategories = list(
            category.subcategories.values('id', 'name').order_by('name')
        )
        return JsonResponse({'subcategories': subcategories})
    except Category.DoesNotExist:
        return JsonResponse({'error': 'Category not found'}, status=404)
