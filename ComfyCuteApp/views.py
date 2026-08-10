from django.shortcuts import render

def home(request):
    return render(request, 'index.html')

def products(request):
    return render(request, 'products.html')

def product_detail(request):
    return render(request, 'product-detail.html')

def contact(request):
    return render(request, 'contact.html')

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

def c_page(request):
    return render(request, 'c.html')
