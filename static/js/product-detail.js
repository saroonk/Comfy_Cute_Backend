// ====================================
// PRODUCT DETAIL PAGE - FUNCTIONALITY
// ====================================

let selectedSize = 'M';
let selectedVariant = 'Sage Green';
let quantity = 1;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  // Initialize Owl Carousel only after jQuery is available
  if (typeof jQuery !== 'undefined') {
    initializeCarousel();
    initializeRelatedProductsCarousel();
  } else {
    console.error('jQuery not loaded');
  }

  initializeProductDetail();
  setupMobileNav();
  setupSearch();
  setupCart();
  setupBackToTop();
});

// Initialize Owl Carousel
function initializeCarousel() {
  try {
    const $carousel = jQuery('#productCarousel');

    if ($carousel.length === 0) {
      console.error('Carousel element #productCarousel not found');
      return;
    }

    console.log('Initializing Owl Carousel...');

    $carousel.owlCarousel({
      items: 1,
      loop: false,
      dots: false,
      nav: false,
      autoplay: false,
      margin: 0,
      smartSpeed: 500,
      lazyLoad: false
    });

    console.log('Owl Carousel initialized successfully');

    // Setup carousel navigation buttons
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');

    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.preventDefault();
        $carousel.trigger('prev.owl.carousel');
        setTimeout(updateThumbnails, 100);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.preventDefault();
        $carousel.trigger('next.owl.carousel');
        setTimeout(updateThumbnails, 100);
      });
    }
  } catch (error) {
    console.error('Error initializing Owl Carousel:', error);
  }
}

// Update thumbnail active state
function updateThumbnails() {
  const $carousel = jQuery('#productCarousel');
  const carouselData = $carousel.data('owl.carousel');

  if (!carouselData) return;

  const currentIndex = carouselData.current();
  const thumbnails = document.querySelectorAll('.thumbnail');

  thumbnails.forEach((thumb, index) => {
    thumb.classList.toggle('active', index === currentIndex);
  });
}

// Go to slide when thumbnail clicked
function goToSlide(index) {
  const $carousel = jQuery('#productCarousel');

  if ($carousel.length === 0) {
    console.error('Carousel not found');
    return;
  }

  $carousel.trigger('to.owl.carousel', [index, 500]);
  setTimeout(updateThumbnails, 100);
}

// Initialize product detail interactions
function initializeProductDetail() {
  // Size button selection
  const sizeButtons = document.querySelectorAll('.size-btn');
  sizeButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      sizeButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      selectedSize = this.dataset.size.toUpperCase();
    });
  });
}

// Select variant
function selectVariant(element) {
  // First, remove active class from ALL variant buttons
  const allVariantBtns = document.querySelectorAll('.variant-btn');
  allVariantBtns.forEach(btn => {
    btn.classList.remove('active');
  });

  // Then add active class only to the clicked element
  element.classList.add('active');

  // Update selected variant
  selectedVariant = element.dataset.variant;
  const selectedLabel = document.getElementById('selectedVariant');
  if (selectedLabel) {
    selectedLabel.textContent = selectedVariant;
  }

  // Navigate carousel to corresponding variant index
  const variantIndex = Array.from(allVariantBtns).indexOf(element);
  if (variantIndex >= 0) {
    goToSlide(variantIndex);
  }
}

// Quantity functions
function increaseQty() {
  const input = document.getElementById('quantityInput');
  input.value = parseInt(input.value) + 1;
  quantity = parseInt(input.value);
}

function decreaseQty() {
  const input = document.getElementById('quantityInput');
  if (parseInt(input.value) > 1) {
    input.value = parseInt(input.value) - 1;
    quantity = parseInt(input.value);
  }
}

// Add to cart
function addToCart() {
  const productName = 'Elegant Linen Blend Midi Dress';
  const price = 2499;
  const qty = quantity;

  const $carousel = jQuery('#productCarousel');
  const currentImg = $carousel.find('.owl-item.active img').attr('src');

  const cartItem = {
    id: Date.now(),
    name: productName,
    price: price,
    quantity: qty,
    size: selectedSize,
    variant: selectedVariant,
    image: currentImg || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=150&auto=format&fit=crop'
  };

  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existingItem = cart.find(item =>
    item.name === productName &&
    item.size === selectedSize &&
    item.variant === selectedVariant
  );

  if (existingItem) {
    existingItem.quantity += qty;
  } else {
    cart.push(cartItem);
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();

  const btn = document.querySelector('.btn-add-to-cart');
  const originalText = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-check"></i> Added to Cart';
  btn.style.backgroundColor = 'var(--color-primary-hover)';

  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.style.backgroundColor = '';
  }, 2000);
}

// Toggle wishlist
function toggleWishlist() {
  const btn = document.getElementById('btn-wishlist');
  btn.classList.toggle('active');

  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const productId = 'elegant-linen-dress';

  if (btn.classList.contains('active')) {
    if (!wishlist.includes(productId)) {
      wishlist.push(productId);
    }
  } else {
    wishlist = wishlist.filter(id => id !== productId);
  }

  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishlistBadge();
}

// Update cart badge
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.textContent = count;
  });
}

// Update wishlist badge
function updateWishlistBadge() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  document.querySelectorAll('.wishlist-badge').forEach(badge => {
    badge.textContent = wishlist.length;
  });
}

// Search functionality
function setupSearch() {
  const searchBtn = document.querySelector('.btn-search');
  const searchOverlay = document.querySelector('.search-overlay');
  const searchOverlayClose = document.querySelector('.search-overlay-close');

  if (searchBtn && searchOverlay) {
    searchBtn.addEventListener('click', function () {
      searchOverlay.classList.add('active');
    });

    if (searchOverlayClose) {
      searchOverlayClose.addEventListener('click', function () {
        searchOverlay.classList.remove('active');
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchOverlay.classList.remove('active');
      }
    });
  }
}

// Cart functionality
function setupCart() {
  updateCartBadge();
  updateWishlistBadge();

  const cartDrawer = document.getElementById('cartDrawer');
  if (cartDrawer) {
    cartDrawer.addEventListener('show.bs.offcanvas', function () {
      renderCartItems();
    });
  }
}

// Render cart items
function renderCartItems() {
  const container = document.querySelector('.cart-items-container');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (cart.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--color-text);">Your cart is empty</div>';
    return;
  }

  container.innerHTML = cart.map((item, index) => `
    <div class="cart-item" style="display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--color-border);">
      <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
      <div style="flex: 1;">
        <h6 style="margin: 0 0 4px 0; font-weight: 600;">${item.name}</h6>
        <p style="margin: 0; font-size: 0.85rem; color: var(--color-text);">Size: ${item.size} | Variant: ${item.variant}</p>
        <p style="margin: 8px 0 0 0; font-weight: 600;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</p>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button style="padding: 4px 8px; border: 1px solid var(--color-border); background: white; cursor: pointer; border-radius: 4px; font-size: 0.8rem;" onclick="updateCartQty(${index}, -1)">−</button>
          <span style="padding: 4px 8px;">${item.quantity}</span>
          <button style="padding: 4px 8px; border: 1px solid var(--color-border); background: white; cursor: pointer; border-radius: 4px; font-size: 0.8rem;" onclick="updateCartQty(${index}, 1)">+</button>
          <button style="padding: 4px 8px; border: 1px solid #e74c3c; background: white; color: #e74c3c; cursor: pointer; border-radius: 4px; font-size: 0.8rem; margin-left: auto;" onclick="removeFromCart(${index})">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  updateCartSubtotal();
}

// Update cart quantity
function updateCartQty(index, change) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart[index].quantity += change;

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
  renderCartItems();
}

// Remove from cart
function removeFromCart(index) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
  renderCartItems();
}

// Update cart subtotal
function updateCartSubtotal() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const subtotalElement = document.querySelector('.cart-subtotal-price');
  if (subtotalElement) {
    subtotalElement.textContent = '₹' + subtotal.toLocaleString('en-IN');
  }
}

// Back to top button
function setupBackToTop() {
  const backToTopBtn = document.querySelector('.btn-back-to-top');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 300) {
      backToTopBtn.style.display = 'flex';
    } else {
      backToTopBtn.style.display = 'none';
    }
  });

  backToTopBtn.addEventListener('click', function () {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// Related Products Carousel
function initializeRelatedProductsCarousel() {
  if (typeof jQuery === 'undefined') {
    console.error('jQuery not loaded for related products carousel');
    return;
  }

  const $carousel = jQuery('.related-products-carousel');
  if ($carousel.length === 0) {
    return;
  }

  try {
    $carousel.owlCarousel({
      items: 4,
      loop: true,
      dots: false,
      nav: false,
      autoplay: false,
      margin: 24,
      smartSpeed: 500,
      lazyLoad: false,
      responsive: {
        0: {
          items: 2
        },
        576: {
          items: 2
        },
        768: {
          items: 3
        },
        992: {
          items: 4
        },
        1200: {
          items: 4
        }
      }
    });

    // Setup carousel navigation buttons
    const prevBtn = document.getElementById('relatedCarouselPrev');
    const nextBtn = document.getElementById('relatedCarouselNext');

    if (prevBtn) {
      prevBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $carousel.trigger('prev.owl.carousel');
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $carousel.trigger('next.owl.carousel');
      });
    }
  } catch (error) {
    console.error('Error initializing related products carousel:', error);
  }
}
