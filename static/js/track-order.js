/* ====================================
   TRACK ORDER PAGE - FUNCTIONALITY
   ==================================== */

// Sample order data for demo
const sampleOrders = {
  'CC-123456': {
    orderID: 'CC-123456',
    email: 'customer@example.com',
    deliveryDate: 'Thursday, Oct 26',
    trackingNumber: '1Z999999999999999',
    status: 'shipped'
  },
  'CC-847291': {
    orderID: 'CC-847291',
    email: 'user@comfy.com',
    deliveryDate: 'Thursday, Oct 26',
    trackingNumber: '1Z999999999999999',
    status: 'shipped'
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  setupTrackOrderForm();
  setupMobileNav();
  setupSearch();
  setupCart();
  setupBackToTop();
  setupHeroSpacing();
});

/* ==========================================
   TRACK ORDER FORM
   ========================================== */
function setupTrackOrderForm() {
  const form = document.getElementById('trackOrderFormElement');
  if (form) {
    form.addEventListener('submit', handleTrackOrderSubmit);
  }
}

function handleTrackOrderSubmit(e) {
  e.preventDefault();

  const orderID = document.getElementById('orderID').value.trim().toUpperCase();
  const emailOrPhone = document.getElementById('emailOrPhone').value.trim();

  // Validate inputs
  if (!orderID || !emailOrPhone) {
    showAlert('error', 'Please fill in all fields.');
    return;
  }

  // Check if order exists in sample data
  if (sampleOrders[orderID]) {
    // Simulate API call
    displayOrderStatus(sampleOrders[orderID]);
    document.getElementById('orderStatusSection').scrollIntoView({ behavior: 'smooth' });
  } else {
    showAlert('error', 'Order not found. Please check your Order ID and try again.');
  }
}

function displayOrderStatus(order) {
  const statusSection = document.getElementById('orderStatusSection');

  // Update order details
  document.getElementById('displayOrderID').textContent = order.orderID;
  document.getElementById('deliveryDate').textContent = order.deliveryDate;
  document.getElementById('trackingNumber').textContent = order.trackingNumber;

  // Update timeline based on order status
  updateTimeline(order.status);

  // Show the status section
  statusSection.style.display = 'block';
}

function updateTimeline(status) {
  // Define status progression
  const statusStages = ['confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery', 'delivered'];
  const currentIndex = statusStages.indexOf(status);

  // Update each timeline item
  statusStages.forEach((stage, index) => {
    const element = document.getElementById(`status-${stage}`);
    if (element) {
      if (index < currentIndex) {
        element.classList.remove('active');
        element.classList.add('completed');
      } else if (index === currentIndex) {
        element.classList.remove('completed');
        element.classList.add('active');
      } else {
        element.classList.remove('active', 'completed');
      }
    }
  });
}

/* ==========================================
   MOBILE NAVIGATION SETUP
   ========================================== */
function setupMobileNav() {
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const mobileNavClose = document.querySelector('.mobile-nav-close');

  if (mobileNavToggle && mobileNavDrawer) {
    mobileNavToggle.addEventListener('click', function () {
      mobileNavDrawer.classList.add('active');
    });

    if (mobileNavClose) {
      mobileNavClose.addEventListener('click', function () {
        mobileNavDrawer.classList.remove('active');
      });
    }

    const navLinks = mobileNavDrawer.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function () {
        mobileNavDrawer.classList.remove('active');
      });
    });
  }
}

/* ==========================================
   SEARCH FUNCTIONALITY
   ========================================== */
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

/* ==========================================
   CART FUNCTIONALITY
   ========================================== */
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

/* ==========================================
   BACK TO TOP BUTTON
   ========================================== */
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

/* ==========================================
   HERO SPACING - DYNAMIC ADJUSTMENT
   ========================================== */
function setupHeroSpacing() {
  const header = document.querySelector('header');
  const heroEl = document.querySelector('.track-order-hero');

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

/* ==========================================
   ALERT NOTIFICATION SYSTEM
   ========================================== */
function showAlert(type, message) {
  // Create alert container
  const alertContainer = document.createElement('div');
  alertContainer.className = `alert-notification alert-${type}`;

  // Set icon based on type
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';

  // Set content
  alertContainer.innerHTML = `
    <div class="alert-content">
      <i class="fa-solid ${icon}"></i>
      <span>${message}</span>
      <button class="alert-close" type="button">
        <i class="fa-solid fa-times"></i>
      </button>
    </div>
  `;

  // Add to page
  document.body.appendChild(alertContainer);

  // Trigger animation
  setTimeout(() => {
    alertContainer.classList.add('show');
  }, 10);

  // Close button functionality
  const closeBtn = alertContainer.querySelector('.alert-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      alertContainer.classList.remove('show');
      setTimeout(() => {
        alertContainer.remove();
      }, 300);
    });
  }

  // Auto-close after 5 seconds for success, 7 seconds for error
  const duration = type === 'success' ? 5000 : 7000;
  setTimeout(() => {
    if (alertContainer.parentElement) {
      alertContainer.classList.remove('show');
      setTimeout(() => {
        alertContainer.remove();
      }, 300);
    }
  }, duration);
}
