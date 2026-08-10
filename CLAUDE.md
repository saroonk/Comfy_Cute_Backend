# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Comfy Cute** is a Django-based e-commerce web application for a clothing brand selling women's and baby wear. The project was recently converted from a static HTML/CSS/JavaScript frontend to a Django web application. The frontend design, styling, and functionality have been preserved exactly as they were.

### Current State
- **Framework**: Django 4.2.7
- **Database**: SQLite (default, configured for development)
- **Frontend**: 14 HTML templates with preserved original design
- **Status**: Template/view layer only — no database models or backend logic implemented yet

## Quick Start Commands

### Run Development Server
```bash
python manage.py runserver
# Starts at http://localhost:8000/
```

### Database Operations
```bash
python manage.py migrate          # Apply migrations
python manage.py makemigrations   # Create migrations for model changes
python manage.py createsuperuser  # Create admin user
```

### Verify Configuration
```bash
python manage.py check            # Check for configuration errors
python manage.py check --deploy   # Pre-deployment checks
```

### Static Files (Production)
```bash
python manage.py collectstatic    # Collect static files for production deployment
```

### Django Shell (Interactive Python with Django loaded)
```bash
python manage.py shell
```

## Architecture

### High-Level Structure

```
ComfyCute/          — Django project configuration
  settings.py       — Database, templates, static files, installed apps
  urls.py           — Route includes ComfyCuteApp.urls
  wsgi.py / asgi.py — Production deployment entry points

ComfyCuteApp/       — Main application
  views.py          — 14 simple render views (one per page)
  urls.py           — 14 URL routes matching pages
  models.py         — Empty (for future model definitions)
  admin.py          — Empty (for future admin registration)

templates/          — Django HTML templates (14 pages)
  All use {% load static %} and {% static '...' %} for file references

static/
  css/              — 9 CSS stylesheets (paths: ../images/)
  js/               — 8 JavaScript files
  images/           — 33 image assets
```

### Request Flow

1. HTTP request arrives at Django
2. `ComfyCute/urls.py` routes to `ComfyCuteApp/urls.py`
3. `ComfyCuteApp/urls.py` matches path to view function
4. View function in `ComfyCuteApp/views.py` renders corresponding template
5. Template renders with `{% load static %}` and `{% static '...' %}` for CSS/JS/images
6. Static files served from `static/` directory

### Pages & Routes

| Route | View | Template | Purpose |
|-------|------|----------|---------|
| `/` | `home()` | `index.html` | Homepage with hero slider, collections, reviews |
| `/products/` | `products()` | `products.html` | Products listing page |
| `/product-detail/` | `product_detail()` | `product-detail.html` | Individual product details |
| `/contact/` | `contact()` | `contact.html` | Contact form page |
| `/about/` | `about_us()` | `about-us.html` | About us / company info |
| `/wishlist/` | `wishlist()` | `wishlist.html` | User wishlist page |
| `/login/` | `login()` | `login.html` | Login / register page |
| `/track-order/` | `track_order()` | `track-order.html` | Order tracking page |
| `/privacy-policy/` | `privacy_policy()` | `privacy-policy.html` | Privacy policy |
| `/terms-of-service/` | `terms_of_service()` | `terms-of-service.html` | Terms of service |
| `/refund-policy/` | `refund_policy()` | `refund-policy.html` | Refund policy |
| `/shipping-policy/` | `shipping_policy()` | `shipping-policy.html` | Shipping policy |
| `/return-exchange/` | `return_exchange()` | `return-exchange.html` | Return & exchange policy |
| `/c/` | `c_page()` | `c.html` | Category page |

## Configuration Details

### Static Files Configuration
- **Development**: Django serves files from `static/` via `STATICFILES_DIRS`
- **Production**: Run `python manage.py collectstatic` to copy files to `STATIC_ROOT`
- **URL Prefix**: All static files accessed via `/static/` URL

### Templates Configuration
- **Location**: `templates/` directory at project root
- **Template Engine**: Django's built-in template engine
- **Static File References**: All templates use `{% load static %}` and `{% static '...' %}` tags
- **Context Processors**: `debug`, `request`, `auth`, `messages` available in all templates

### Database
- **Engine**: SQLite3 (`db.sqlite3`)
- **Connection**: Automatic via settings.py
- **Migrations**: Apply with `python manage.py migrate`
- **Models**: Currently only Django built-in models (auth, admin, etc.)

## Adding New Features

### Add a New Page
1. Create HTML template in `templates/` (ensure it uses `{% load static %}`)
2. Add view function in `ComfyCuteApp/views.py`
3. Add URL route in `ComfyCuteApp/urls.py`
4. Add link to navigation in relevant templates

### Add Database Models
1. Define models in `ComfyCuteApp/models.py`
2. Run `python manage.py makemigrations`
3. Run `python manage.py migrate`
4. Register in `ComfyCuteApp/admin.py` if needed for admin panel

### Add Static Assets
- **CSS**: Add to `static/css/`, reference as `{% static 'css/filename.css' %}`
- **JS**: Add to `static/js/`, reference as `{% static 'js/filename.js' %}`
- **Images**: Add to `static/images/`, reference as `{% static 'images/filename' %}`

### Add URL Parameters
Use Django URL patterns with converters:
```python
path('product/<int:id>/', views.product_detail, name='product_detail')
```
Then access in view: `def product_detail(request, id):`

## Important Notes

### Frontend Preservation
- The original frontend design, CSS, JavaScript, and HTML structure have been preserved exactly
- No visual or functional changes should be made without careful consideration
- All 14 pages render their original content identically to the static version

### Before Production
1. Change `SECRET_KEY` in `settings.py` to a new generated key
2. Set `DEBUG = False` in `settings.py`
3. Update `ALLOWED_HOSTS` with actual domain names
4. Consider migrating to PostgreSQL or MySQL instead of SQLite
5. Run `python manage.py check --deploy`
6. Set up proper web server (Nginx/Apache) with Gunicorn

### Current Limitations
- No user authentication implemented
- No shopping cart backend
- No order management system
- No payment processing
- All views are simple template renders (no context data)

## Development Tips

### Debug Mode
- `DEBUG = True` in settings.py shows detailed error pages
- Never run production with DEBUG=True
- Use Django's debug toolbar for development insights

### URL Reversal
In templates, use `{% url 'ComfyCuteApp:home' %}` to generate URLs dynamically instead of hardcoding paths.

### Template Inheritance
For shared layout components (navbar, footer), consider creating a base template and extending it from all pages.

### Static Files in CSS
CSS background images use relative paths: `url('../images/filename.webp')`  
This works because CSS is in `static/css/` and images are in `static/images/`

## Django Admin

Access at `http://localhost:8000/admin/` after creating a superuser:
```bash
python manage.py createsuperuser
```

Currently empty (no custom models registered), but ready for future features.
