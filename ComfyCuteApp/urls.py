from django.urls import path
from . import views

app_name = 'ComfyCuteApp'

urlpatterns = [
    path('', views.home, name='home'),
    path('products/', views.products, name='products'),
    path('product-detail/', views.product_detail, name='product_detail'),
    path('contact/', views.contact, name='contact'),
    path('about/', views.about_us, name='about_us'),
    path('wishlist/', views.wishlist, name='wishlist'),
    path('login/', views.login, name='login'),
    path('track-order/', views.track_order, name='track_order'),
    path('privacy-policy/', views.privacy_policy, name='privacy_policy'),
    path('terms-of-service/', views.terms_of_service, name='terms_of_service'),
    path('refund-policy/', views.refund_policy, name='refund_policy'),
    path('shipping-policy/', views.shipping_policy, name='shipping_policy'),
    path('return-exchange/', views.return_exchange, name='return_exchange'),
    path('c/', views.c_page, name='c_page'),
]
