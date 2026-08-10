/* ====================================
   WISHLIST PAGE - FUNCTIONALITY
   ==================================== */

// Sample products data
const sampleProducts = [
  {
    id: 1,
    name: 'Linen Summer Dress',
    price: 2499,
    oldPrice: 4999,
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=500&auto=format&fit=crop',
    badge: 'New'
  },
  {
    id: 2,
    name: 'Organic Cotton Kurti',
    price: 1899,
    oldPrice: 3799,
    image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=500&auto=format&fit=crop',
    badge: 'Sale'
  },
  {
    id: 3,
    name: 'Premium Silk Top',
    price: 1599,
    oldPrice: 3199,
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=500&auto=format&fit=crop',
    badge: 'Sale'
  },
  {
    id: 4,
    name: 'Casual Linen Shirt',
    price: 1799,
    oldPrice: 3599,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: 5,
    name: 'Elegance Party Gown',
    price: 3499,
    oldPrice: 6999,
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: 6,
    name: 'Comfort Linen Pants',
    price: 1999,
    oldPrice: 3999,
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=500&auto=format&fit=crop',
    badge: 'Best Seller'
  },
  {
    id: 7,
    name: 'Organic Cotton Blend Tee',
    price: 899,
    oldPrice: 1799,
    image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=500&auto=format&fit=crop'
  },
  {
    id: 8,
    name: 'Flowy Rayon Dress',
    price: 2199,
    oldPrice: 4399,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=500&auto=format&fit=crop'
  }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  setupHeroSpacing();
  renderWishlistProducts();
  setupMobileNav();
  setupSearch();
  setupCart();
  setupBackToTop();
});

// Setup Hero Spacing - Dynamically adjust for announcement bar
function setupHeroSpacing() {
  const header = document.querySelector('header');
  const heroEl = document.querySelector('.wishlist-hero');

  if (!header || !heroEl) return;

  function adjustHeroMargin() {
    const barEl = document.getElementById('announcementBar');
    const announcementHidden = document.body.classList.contains('announcement-hidden');
    const barH = barEl ? barEl.offsetHeight : 0;
    const navH = header.offsetHeight;
    const offset = announcementHidden ? navH : (barH + navH);

    heroEl.style.marginTop = offset + 'px';
  }

  adjustHeroMargin();
  window.addEventListener('resize', adjustHeroMargin);

  window.addEventListener('scroll', function () {
    const announcementHidden = document.body.classList.contains('announcement-hidden');
    if (announcementHidden) {
      setTimeout(adjustHeroMargin, 100);
    }
  }, { once: false });
}

// Render Wishlist Products
function renderWishlistProducts() {
  const grid = document.getElementById('wishlistProductsGrid');
  const emptyState = document.getElementById('emptyWishlistState');

  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

  // If wishlist is empty, show empty state
  if (wishlist.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  // Filter products that are in wishlist
  const wishlistProducts = sampleProducts.filter(product => wishlist.includes(product.id));

  if (wishlistProducts.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  // Show grid and hide empty state
  grid.style.display = 'grid';
  emptyState.style.display = 'none';

  // Render products
  grid.innerHTML = wishlistProducts.map(product => `
    <div class="arrival-product-card">
      <div class="arrival-img-container">
        <img src="${product.image}" alt="${product.name}" class="arrival-product-img">
        ${product.badge ? `<div class="product-badge-group"><span class="product-badge badge-${product.badge.toLowerCase()}">${product.badge}</span></div>` : ''}
        <button class="arrival-wishlist-btn active" data-id="${product.id}" aria-label="Remove from Wishlist">
          <i class="fa-solid fa-heart"></i>
        </button>
      </div>
      <div class="arrival-product-name">${product.name}</div>
      <div class="arrival-price">₹${product.price.toLocaleString('en-IN')}</div>
    </div>
  `).join('');

  // Add event listeners to wishlist buttons
  setupWishlistButtons();
  updateWishlistBadge();
}

// Setup Wishlist Buttons
function setupWishlistButtons() {
  const wishlistBtns = document.querySelectorAll('.arrival-wishlist-btn');

  wishlistBtns.forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const productId = parseInt(this.dataset.id);
      let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

      if (wishlist.includes(productId)) {
        wishlist = wishlist.filter(id => id !== productId);
        this.classList.remove('active');
      } else {
        wishlist.push(productId);
        this.classList.add('active');
      }

      localStorage.setItem('wishlist', JSON.stringify(wishlist));
      updateWishlistBadge();
      renderWishlistProducts();
    });
  });
}

// Update Wishlist Badge
function updateWishlistBadge() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const count = wishlist.length;

  document.querySelectorAll('.wishlist-badge').forEach(badge => {
    badge.textContent = count;
    if (count === 0) {
      badge.style.display = 'none';
    } else {
      badge.style.display = 'flex';
    }
  });
}

// Mobile Navigation Setup
function setupMobileNav() {
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const mobileNavClose = document.querySelector('.mobile-nav-close');
  const mobileNavBackButtons = document.querySelectorAll('.mobile-nav-back');
  const mobileNavParents = document.querySelectorAll('.mobile-nav-parent');

  if (mobileNavToggle && mobileNavDrawer) {
    mobileNavToggle.addEventListener('click', function () {
      mobileNavDrawer.classList.add('active');
    });

    if (mobileNavClose) {
      mobileNavClose.addEventListener('click', function () {
        mobileNavDrawer.classList.remove('active');
      });
    }

    mobileNavBackButtons.forEach(backBtn => {
      backBtn.addEventListener('click', function () {
        const panelName = this.dataset.openPanel;
        openMobileNavPanel(panelName);
      });
    });

    mobileNavParents.forEach(parent => {
      parent.addEventListener('click', function (e) {
        e.preventDefault();
        const panelName = this.dataset.openPanel;
        openMobileNavPanel(panelName);
      });
    });

    const navLinks = mobileNavDrawer.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function () {
        mobileNavDrawer.classList.remove('active');
      });
    });
  }
}

// Open Mobile Nav Panel
function openMobileNavPanel(panelName) {
  const drawer = document.getElementById('mobileNavDrawer');
  const panels = drawer.querySelectorAll('.mobile-nav-panel');

  panels.forEach(panel => {
    if (panel.dataset.panel === panelName) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });
}

// Search Functionality
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

// Cart Functionality
function setupCart() {
  updateCartBadge();

  const cartDrawer = document.getElementById('cartDrawer');
  if (cartDrawer) {
    cartDrawer.addEventListener('show.bs.offcanvas', function () {
      renderCartItems();
    });
  }
}

// Update cart badge
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.textContent = count;
  });
}

// Render cart items
function renderCartItems() {
  const container = document.querySelector('.cart-items-container');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5">
        <i class="fa-solid fa-bag-shopping mb-3" style="font-size: 3rem; color: var(--color-border)"></i>
        <h5 class="mb-2">Your cart is empty</h5>
        <p class="text-muted mb-4 small">Looks like you haven't added anything yet.</p>
        <button class="btn btn-premium btn-premium-primary btn-sm" data-bs-dismiss="offcanvas">Shop Now</button>
      </div>
    `;
    return;
  }

  container.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-img">
      <div class="cart-item-info">
        <h6 class="cart-item-title">${item.name}</h6>
        <div class="cart-item-meta">Size: ${item.size} | Variant: ${item.variant}</div>
        <div class="d-flex justify-content-between align-items-center">
          <span class="cart-item-price">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
          <div class="cart-item-qty">
            <button class="cart-qty-btn qty-minus" data-index="${index}">-</button>
            <span class="cart-qty-val">${item.quantity}</span>
            <button class="cart-qty-btn qty-plus" data-index="${index}">+</button>
          </div>
        </div>
      </div>
      <button class="cart-item-remove" data-index="${index}">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join('');

  updateCartSubtotal();
  setupCartEventListeners();
}

// Setup cart event listeners
function setupCartEventListeners() {
  const container = document.querySelector('.cart-items-container');
  if (!container) return;

  container.addEventListener('click', function (e) {
    const target = e.target;
    const btn = target.closest('.cart-qty-btn, .cart-item-remove');
    if (!btn) return;

    const index = parseInt(btn.dataset.index);
    if (isNaN(index)) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (index < 0 || index >= cart.length) return;

    if (btn.classList.contains('qty-plus')) {
      cart[index].quantity += 1;
    } else if (btn.classList.contains('qty-minus')) {
      if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
      } else {
        cart.splice(index, 1);
      }
    } else if (btn.classList.contains('cart-item-remove')) {
      cart.splice(index, 1);
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    renderCartItems();
  });
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
