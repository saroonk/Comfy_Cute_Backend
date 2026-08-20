from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-your-secret-key-change-this-in-production'
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'unfold',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'ckeditor',
    'ckeditor_uploader',
    'ComfyCuteApp',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ComfyCute.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'ComfyCuteApp.context_processors.announcements',
                'ComfyCuteApp.context_processors.navbar_categories',
                'ComfyCuteApp.context_processors.wishlist_context',
                'ComfyCuteApp.context_processors.cart_context',
            ],
        },
    },
]

WSGI_APPLICATION = 'ComfyCute.wsgi.application'

# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'comfycute_db',
        'USER': 'root',
        'PASSWORD': 'root',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


from django.utils import timezone

now = timezone.now()
LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Kolkata'

USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files configuration (for uploaded content like hero banners)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'saroonsharu@gmail.com'
EMAIL_HOST_PASSWORD = 'rtpobhetadmayvul'
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# Store email for order notifications (admin/store alerts)
STORE_EMAIL = 'saroonsharu@gmail.com'  # Change this to your store's email address

# Custom User Model Configuration
AUTH_USER_MODEL = 'ComfyCuteApp.User'

# Authentication Backends
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

# Login/Logout URLs
LOGIN_URL = 'ComfyCuteApp:login'
LOGIN_REDIRECT_URL = 'ComfyCuteApp:home'
LOGOUT_REDIRECT_URL = 'ComfyCuteApp:home'

# CKEditor Configuration
CKEDITOR_BASEPATH = '/static/ckeditor/ckeditor/'
CKEDITOR_UPLOAD_PATH = 'uploads/ckeditor/'
CKEDITOR_ALLOW_NONIMAGE_FILES = False
CKEDITOR_RESTRICT_BY_USER = False

CKEDITOR_CONFIGS = {
    'default': {
        'toolbar': 'full',
        'toolbar_full': [
            ['Styles', 'Format', 'Bold', 'Italic', 'Underline', 'Strike', 'SpellChecker', 'Undo', 'Redo'],
            ['NumberedList', 'BulletedList', 'Outdent', 'Indent', 'Blockquote'],
            ['JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'],
            ['Link', 'Unlink', 'Anchor', 'Image', 'Table', 'HorizontalRule'],
            ['Source', 'Maximize', 'ShowBlocks'],
        ],
        'height': 300,
        'width': 'auto',
        'tabSpaces': 4,
        'extraPlugins': 'codesnippet',
    }
}

# ==========================================
# RAZORPAY PAYMENT CONFIGURATION
# ==========================================
RAZORPAY_KEY_ID = 'rzp_test_SLFGCvb0VMW4Dl'  # Add your Razorpay Key ID here
RAZORPAY_KEY_SECRET = '1t5NKclonzMGs1mD9smIywJ3'  # Add your Razorpay Key Secret here
# WARNING: Keep RAZORPAY_KEY_SECRET server-side only. Never expose to frontend.

# RAZORPAY_KEY_ID = "rzp_test_SLFGCvb0VMW4Dl"
# RAZORPAY_SECRET = "1t5NKclonzMGs1mD9smIywJ3"