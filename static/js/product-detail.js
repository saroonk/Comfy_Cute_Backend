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
  // Initialize size selection from default variant
  const sizeButtons = document.querySelectorAll('.size-btn');

  // Set first non-disabled size as selected
  if (sizeButtons.length > 0) {
    for (let btn of sizeButtons) {
      if (!btn.disabled) {
        btn.classList.add('active');
        selectedSize = btn.dataset.size;
        break;
      }
    }
  }

  // Size button click handler
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

  // Update carousel images for the selected variant
  updateCarouselForVariant(selectedVariantId);

  // Update sizes based on the selected variant
  updateSizesForVariant(selectedVariantId);
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

// Add to cart
function addToCart() {
  // Get product information from the page
  const productName = document.querySelector('.product-title')?.textContent || 'Product';
  const priceText = document.querySelector('.price-current')?.textContent || '₹0';
  const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
  const qty = quantity;

  // Get product image from carousel
  const $carousel = jQuery('#productCarousel');
  const currentImg = $carousel.find('.owl-item.active img').attr('src');

  // Require size and variant selection
  if (!selectedSize || !selectedVariant) {
    alert('Please select a variant and size before adding to cart.');
    return;
  }

  const cartItem = {
    id: Date.now(),
    name: productName,
    price: price,
    quantity: qty,
    size: selectedSize,
    variant: selectedVariant,
    variantId: selectedVariantId,
    image: currentImg || 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=150&auto=format&fit=crop'
  };

  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existingItem = cart.find(item =>
    item.name === productName &&
    item.size === selectedSize &&
    item.variant === selectedVariant &&
    item.variantId === selectedVariantId
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
