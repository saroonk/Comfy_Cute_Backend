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

    # Wishlist API endpoints
    path('api/wishlist/toggle/<int:product_id>/', views.wishlist_toggle, name='wishlist_toggle'),

    # Cart API endpoints
    path('api/cart/add/', views.cart_add, name='cart_add'),
    path('api/cart/update/', views.cart_update, name='cart_update'),
    path('api/cart/remove/', views.cart_remove, name='cart_remove'),
    path('api/cart/get/', views.cart_get, name='cart_get'),
    path('api/checkout-data/', views.checkout_data, name='checkout_data'),

    # Order and Payment endpoints
    path('api/place-order/', views.place_order, name='place_order'),
    path('api/verify-payment/', views.verify_order_payment, name='verify_order_payment'),
    path('api/payment-failure/', views.payment_failure, name='payment_failure'),
    path('invoice/download/<str:invoice_token>/', views.download_invoice_public, name='download_invoice_public'),
    path('order-success/', views.order_success, name='order_success'),

    # Admin API endpoints
    path('api/product-subcategories/', views.admin_api_subcategories, name='admin_api_subcategories'),

    # Product Detail page
    path('products/<slug:slug>/', views.product_detail, name='product_detail'),
]
