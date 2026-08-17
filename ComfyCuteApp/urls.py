from django.urls import path
from . import views

app_name = 'ComfyCuteApp'

urlpatterns = [
    path('', views.home, name='home'),
    path('products/', views.products, name='products'),
    path('contact/', views.contact, name='contact'),
    path('about/', views.about_us, name='about_us'),
    path('wishlist/', views.wishlist, name='wishlist'),
    path('track-order/', views.track_order, name='track_order'),
    path('privacy-policy/', views.privacy_policy, name='privacy_policy'),
    path('terms-of-service/', views.terms_of_service, name='terms_of_service'),
    path('refund-policy/', views.refund_policy, name='refund_policy'),
    path('shipping-policy/', views.shipping_policy, name='shipping_policy'),
    path('return-exchange/', views.return_exchange, name='return_exchange'),
    path('checkout/', views.checkout, name='checkout'),

    # Authentication URLs
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # Admin API endpoints
    path('api/product-subcategories/', views.admin_api_subcategories, name='admin_api_subcategories'),

    # Product Detail page
    path('products/<slug:slug>/', views.product_detail, name='product_detail'),
]
