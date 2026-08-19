// ====================================
// PRODUCT DETAIL PAGE - FUNCTIONALITY
// ====================================

let selectedSize = '';
let selectedVariantId = null;
let selectedVariant = '';
let quantity = 1;

// Store variant data passed from Django template
let variantsData = {};

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
  // Initialize default variant if one is already active
  const activeVariantBtn = document.querySelector('.variant-btn.active');
  if (activeVariantBtn) {
    selectedVariantId = parseInt(activeVariantBtn.dataset.variantId);
    selectedVariant = activeVariantBtn.dataset.variant;
  }

  // Initialize price and sizes for the default variant
  if (selectedVariantId) {
    updatePriceForVariant(selectedVariantId);
    updateSizesForVariant(selectedVariantId);
  }

  // Size button click handler for manual size changes
  const sizeButtons = document.querySelectorAll('.size-btn');
  sizeButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      if (!this.disabled) {
        sizeButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedSize = this.dataset.size;
      }
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

  // Get variant ID and name from the clicked element
  selectedVariantId = element.dataset.variantId;
  selectedVariant = element.dataset.variant;
  const selectedLabel = document.getElementById('selectedVariant');
  if (selectedLabel) {
    selectedLabel.textContent = selectedVariant;
  }

  // Update price for the selected variant
  updatePriceForVariant(selectedVariantId);

  // Update carousel images for the selected variant
  updateCarouselForVariant(selectedVariantId);

  // Update sizes based on the selected variant
  updateSizesForVariant(selectedVariantId);
}

// Update product price for selected variant
function updatePriceForVariant(variantId) {
  const variantData = window.variantsData && window.variantsData[variantId];
  if (!variantData) {
    return;
  }

  // Update selling price
  const priceCurrentEl = document.querySelector('.price-current');
  if (priceCurrentEl && variantData.sellingPrice) {
    priceCurrentEl.textContent = '₹' + Math.round(variantData.sellingPrice);
  }

  // Update old price (if it exists)
  const priceOriginalEl = document.querySelector('.price-original');
  if (variantData.oldPrice && variantData.oldPrice > 0) {
    if (!priceOriginalEl) {
      // Create the old price element if it doesn't exist
      const priceDiv = document.querySelector('.product-price');
      if (priceDiv) {
        const newPriceEl = document.createElement('span');
        newPriceEl.className = 'price-original';
        newPriceEl.textContent = '₹' + Math.round(variantData.oldPrice);
        priceDiv.appendChild(newPriceEl);
      }
    } else {
      // Update existing old price element
      priceOriginalEl.textContent = '₹' + Math.round(variantData.oldPrice);
    }
  } else if (priceOriginalEl) {
    // Remove old price element if variant has no old price
    priceOriginalEl.remove();
  }
}

// Update carousel images for selected variant
function updateCarouselForVariant(variantId) {
  const variantData = window.variantsData && window.variantsData[variantId];
  if (!variantData || !variantData.images || variantData.images.length === 0) {
    return;
  }

  const $carousel = jQuery('#productCarousel');
  if ($carousel.length === 0) return;

  try {
    // Destroy existing carousel
    const carouselData = $carousel.data('owl.carousel');
    if (carouselData) {
      $carousel.trigger('destroy.owl.carousel');
    }

    // Clear carousel items
    $carousel.empty();

    // Add new images to carousel
    variantData.images.forEach(imageUrl => {
      $carousel.append(`
        <div class="carousel-item">
          <img src="${imageUrl}" alt="Variant Image" data-variant-id="${variantId}">
        </div>
      `);
    });

    // Reinitialize carousel
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

    // Reset carousel to first image
    $carousel.trigger('to.owl.carousel', [0, 500]);
    setTimeout(updateThumbnails, 100);

    // Update thumbnails for this variant
    updateThumbnailsForVariant(variantId);

    console.log(`Carousel updated for variant ${variantId} with ${variantData.images.length} images`);
  } catch (error) {
    console.error('Error updating carousel:', error);
  }
}

// Update thumbnail gallery for selected variant
function updateThumbnailsForVariant(variantId) {
  const variantData = window.variantsData && window.variantsData[variantId];
  if (!variantData || !variantData.images || variantData.images.length === 0) {
    return;
  }

  const thumbnailsContainer = document.querySelector('.gallery-thumbnails');
  if (!thumbnailsContainer) return;

  // Clear existing thumbnails
  thumbnailsContainer.innerHTML = '';

  // Add new thumbnails for variant images
  variantData.images.forEach((imageUrl, index) => {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = `Variant Image ${index + 1}`;
    img.className = `thumbnail ${index === 0 ? 'active' : ''}`;
    img.dataset.index = index;
    img.dataset.variantId = variantId;
    img.onclick = () => goToSlide(index);
    thumbnailsContainer.appendChild(img);
  });

  console.log(`Thumbnails updated for variant ${variantId} with ${variantData.images.length} images`);
}

// Update sizes based on selected variant
function updateSizesForVariant(variantId) {
  const variantData = window.variantsData && window.variantsData[variantId];
  if (!variantData) {
    console.error(`Variant data not found for ID: ${variantId}`);
    return;
  }

  const sizeContainer = document.querySelector('.size-options');
  if (!sizeContainer) return;

  // Clear existing size buttons
  sizeContainer.innerHTML = '';

  // Add size buttons from variant data
  if (variantData.sizes && variantData.sizes.length > 0) {
    variantData.sizes.forEach((sizeInfo, index) => {
      const isFirstAvailable = index === 0 && sizeInfo.stock > 0;
      const isOutOfStock = sizeInfo.stock === 0;

      const button = document.createElement('button');
      button.className = `size-btn ${isFirstAvailable ? 'active' : ''}`;
      button.dataset.size = sizeInfo.slug;
      button.dataset.sizeId = sizeInfo.id;
      button.dataset.stock = sizeInfo.stock;

      if (isOutOfStock) {
        button.disabled = true;
        button.textContent = `${sizeInfo.name} (Out of Stock)`;
        button.style.opacity = '0.5';
      } else {
        button.textContent = sizeInfo.name;
      }

      button.addEventListener('click', function () {
        if (!this.disabled) {
          // Remove active class from all size buttons
          sizeContainer.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.remove('active');
          });
          // Add active class to clicked button
          this.classList.add('active');
          selectedSize = this.dataset.size;
        }
      });

      sizeContainer.appendChild(button);
    });

    // Set first available size as selected
    const firstAvailableBtn = sizeContainer.querySelector('.size-btn:not([disabled])');
    if (firstAvailableBtn) {
      firstAvailableBtn.classList.add('active');
      selectedSize = firstAvailableBtn.dataset.size;
    }
  }

  console.log(`Sizes updated for variant ${variantId}`);
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

// Get product ID from the page (from window.variantsData if available)
function getProductId() {
  if (window.variantsData && Object.keys(window.variantsData).length > 0) {
    const variantId = Object.keys(window.variantsData)[0];
    const variantData = window.variantsData[variantId];
    // Extract product ID from variant data if available
    // For now, we'll get it from the first variant's context
    // The product ID should be available from the page context
  }
  // Fallback: parse from URL or look for a data attribute
  const productIdElem = document.querySelector('[data-product-id]');
  if (productIdElem) {
    return parseInt(productIdElem.dataset.productId);
  }
  // As a last resort, we'll get it from variantsData structure
  return null;
}

// Get CSRF token from cookie for API requests
function getCsrfToken() {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Add to cart with backend API
function addToCart() {
  // Require size and variant selection
  if (!selectedSize || !selectedVariant || !selectedVariantId) {
    alert('Please select a variant and size before adding to cart.');
    return;
  }

  // Get size ID from the selected size button
  const selectedSizeBtn = document.querySelector('.size-btn.active');
  if (!selectedSizeBtn) {
    alert('Please select a size.');
    return;
  }

  const sizeId = parseInt(selectedSizeBtn.dataset.sizeId);
  if (!sizeId) {
    alert('Invalid size selection.');
    return;
  }

  // We need the product ID from the page context
  // Since we have variantsData with variant information, we can extract it
  // The product ID is needed for the API call
  const productBtn = document.querySelector('[data-product-id]');
  let productId = productBtn ? parseInt(productBtn.dataset.productId) : null;

  // Alternative: Try to get product ID from URL or meta tag
  if (!productId) {
    const metaTag = document.querySelector('meta[data-product-id]');
    if (metaTag) {
      productId = parseInt(metaTag.dataset.productId);
    }
  }

  // If still no product ID, we'll need to extract it from the page context
  // For now, we'll use a workaround by getting it from the window object if it exists
  if (!productId && window.productId) {
    productId = window.productId;
  }

  if (!productId) {
    alert('Product ID not found. Please refresh the page.');
    return;
  }

  const btn = document.querySelector('.btn-add-to-cart');
  btn.disabled = true;

  // Send add to cart request to backend API
  fetch('/api/cart/add/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    body: JSON.stringify({
      product_id: productId,
      variant_id: selectedVariantId,
      size_id: sizeId,
      quantity: quantity
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      // Show success message
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Added to Cart';
      btn.style.backgroundColor = 'var(--color-primary-hover)';

      // Update cart badge and drawer
      updateCartBadgeFromResponse(data);
      renderCartItemsFromResponse(data.items);

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.backgroundColor = '';
        btn.disabled = false;
      }, 2000);
    } else {
      alert('Error: ' + (data.message || 'Could not add to cart'));
      btn.disabled = false;
    }
  })
  .catch(error => {
    console.error('Error adding to cart:', error);
    alert('Error adding to cart. Please try again.');
    btn.disabled = false;
  });
}

// Toggle wishlist
function toggleWishlist() {
  const btn = document.getElementById('btn-wishlist');
  btn.classList.toggle('active');

  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  // Use the product name and variant as unique identifier
  const productName = document.querySelector('.product-title')?.textContent || 'product';
  const productId = `${productName}-${selectedVariant || 'default'}`.toLowerCase().replace(/\s+/g, '-');

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

// Update cart badge from API response
function updateCartBadgeFromResponse(cartData) {
  const count = cartData.cart_count || 0;
  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.textContent = count;
  });
}

// Update cart badge (legacy - loads from API)
function updateCartBadge() {
  // Fetch current cart data from backend
  fetch('/api/cart/get/')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        updateCartBadgeFromResponse(data);
      }
    })
    .catch(error => console.error('Error fetching cart:', error));
}

// Update wishlist badge
function updateWishlistBadge() {
  // Note: Wishlist badge is now handled by wishlist-system.js
  // This function kept for compatibility
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

// Render cart items from API response
function renderCartItemsFromResponse(items) {
  const container = document.querySelector('.cart-items-container');

  if (!items || items.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: var(--color-text);">Your cart is empty</div>';
    return;
  }

  container.innerHTML = items.map((item) => `
    <div class="cart-item" style="display: flex; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--color-border);">
      <img src="${item.image || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=150&auto=format&fit=crop'}" alt="${item.product_name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
      <div style="flex: 1;">
        <h6 style="margin: 0 0 4px 0; font-weight: 600;">${item.product_name}</h6>
        <p style="margin: 0; font-size: 0.85rem; color: var(--color-text);">Size: ${item.size_name} | Variant: ${item.variant_name}</p>
        <p style="margin: 8px 0 0 0; font-weight: 600;">₹${item.subtotal}</p>
        <div style="display: flex; gap: 8px; margin-top: 8px;">
          <button style="padding: 4px 8px; border: 1px solid var(--color-border); background: white; cursor: pointer; border-radius: 4px; font-size: 0.8rem;" onclick="updateCartQtyBackend(${item.id}, ${item.quantity - 1})">−</button>
          <span style="padding: 4px 8px;">${item.quantity}</span>
          <button style="padding: 4px 8px; border: 1px solid var(--color-border); background: white; cursor: pointer; border-radius: 4px; font-size: 0.8rem;" onclick="updateCartQtyBackend(${item.id}, ${item.quantity + 1})">+</button>
          <button style="padding: 4px 8px; border: 1px solid #e74c3c; background: white; color: #e74c3c; cursor: pointer; border-radius: 4px; font-size: 0.8rem; margin-left: auto;" onclick="removeFromCartBackend(${item.id})">Remove</button>
        </div>
      </div>
    </div>
  `).join('');

  updateCartSubtotalFromResponse();
}

// Render cart items (legacy - fetches from backend)
function renderCartItems() {
  const container = document.querySelector('.cart-items-container');
  if (!container) return;

  fetch('/api/cart/get/')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        renderCartItemsFromResponse(data.items);
      }
    })
    .catch(error => console.error('Error fetching cart:', error));
}

// Update cart quantity via backend API
function updateCartQtyBackend(cartItemId, newQuantity) {
  if (newQuantity < 1) {
    removeFromCartBackend(cartItemId);
    return;
  }

  fetch('/api/cart/update/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    body: JSON.stringify({
      cart_item_id: cartItemId,
      quantity: newQuantity
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      updateCartBadgeFromResponse(data);
      renderCartItemsFromResponse(data.items);
    } else {
      alert('Error: ' + (data.message || 'Could not update cart'));
    }
  })
  .catch(error => {
    console.error('Error updating cart:', error);
    alert('Error updating cart. Please try again.');
  });
}

// Remove from cart via backend API
function removeFromCartBackend(cartItemId) {
  fetch('/api/cart/remove/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCsrfToken(),
    },
    body: JSON.stringify({
      cart_item_id: cartItemId
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      updateCartBadgeFromResponse(data);
      renderCartItemsFromResponse(data.items);
    } else {
      alert('Error: ' + (data.message || 'Could not remove item'));
    }
  })
  .catch(error => {
    console.error('Error removing from cart:', error);
    alert('Error removing from cart. Please try again.');
  });
}

// Update cart subtotal from API response data stored in cart drawer
function updateCartSubtotalFromResponse() {
  const subtotalElement = document.querySelector('.cart-subtotal-price');
  if (subtotalElement) {
    // The subtotal should already be displayed from renderCartItemsFromResponse
    // But we can also fetch it fresh if needed
    fetch('/api/cart/get/')
      .then(response => response.json())
      .then(data => {
        if (data.success && subtotalElement) {
          subtotalElement.textContent = '₹' + data.cart_total;
        }
      })
      .catch(error => console.error('Error fetching cart subtotal:', error));
  }
}

// Legacy function for compatibility
function updateCartQty(index, change) {
  // This function is called from old rendering - we don't have cart item IDs here
  // Need to fetch cart data first
  fetch('/api/cart/get/')
    .then(response => response.json())
    .then(data => {
      if (data.success && data.items && data.items[index]) {
        const cartItem = data.items[index];
        updateCartQtyBackend(cartItem.id, cartItem.quantity + change);
      }
    })
    .catch(error => console.error('Error fetching cart:', error));
}

// Legacy function for compatibility
function removeFromCart(index) {
  // This function is called from old rendering - we don't have cart item IDs here
  // Need to fetch cart data first
  fetch('/api/cart/get/')
    .then(response => response.json())
    .then(data => {
      if (data.success && data.items && data.items[index]) {
        const cartItem = data.items[index];
        removeFromCartBackend(cartItem.id);
      }
    })
    .catch(error => console.error('Error fetching cart:', error));
}

// Legacy function for compatibility
function updateCartSubtotal() {
  updateCartSubtotalFromResponse();
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
      loop: false,
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
