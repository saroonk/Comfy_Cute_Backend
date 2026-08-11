/* ====================================
   CONTACT PAGE - FUNCTIONALITY
   ==================================== */

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  setupHeroSpacing();
  setupContactForm();
  setupMobileNav();
  setupSearch();
  setupCart();
  setupBackToTop();
});

// Setup Hero Spacing - Dynamically adjust for announcement bar
function setupHeroSpacing() {
  const header = document.querySelector('header');
  const heroEl = document.querySelector('.contact-hero');

  if (!header || !heroEl) return;

  function adjustHeroMargin() {
    const barEl = document.getElementById('announcementBar');
    const announcementHidden = document.body.classList.contains('announcement-hidden');
    const barH = barEl ? barEl.offsetHeight : 0;
    const navH = header.offsetHeight;
    const offset = announcementHidden ? navH : (barH + navH);

    // Push the hero section down so it starts below the fixed bars
    heroEl.style.marginTop = offset + 'px';
  }

  adjustHeroMargin();
  window.addEventListener('resize', adjustHeroMargin);

  // Resync on scroll when announcement bar hides
  window.addEventListener('scroll', function () {
    const announcementHidden = document.body.classList.contains('announcement-hidden');
    if (announcementHidden) {
      setTimeout(adjustHeroMargin, 100);
    }
  }, { once: false });
}

// Get CSRF token from the form
function getCSRFToken() {
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
  // If not in cookie, try to get from hidden input in form
  if (!cookieValue) {
    const token = document.querySelector('[name=csrfmiddlewaretoken]');
    if (token) {
      cookieValue = token.value;
    }
  }
  return cookieValue;
}

// Show toast notification
function showToast(message, type = 'success') {
  const toastContainer = document.getElementById('toastContainer') || createToastContainer();

  const toastEl = document.createElement('div');
  toastEl.className = `toast-notification toast-${type}`;
  toastEl.innerHTML = `
    <div class="toast-content">
      <i class="fa-solid fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
  `;

  toastContainer.appendChild(toastEl);

  // Trigger animation
  setTimeout(() => toastEl.classList.add('show'), 10);

  // Remove after 4 seconds
  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.remove(), 300);
  }, 4000);
}

// Create toast container if it doesn't exist
function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// Clear form errors
function clearFormErrors() {
  const errorElements = document.querySelectorAll('.form-error');
  errorElements.forEach(el => {
    el.textContent = '';
  });

  const formInputs = document.querySelectorAll('#contactForm .form-control');
  formInputs.forEach(el => {
    el.classList.remove('is-invalid');
  });
}

// Display form errors
function displayFormErrors(errors) {
  clearFormErrors();

  for (const [field, message] of Object.entries(errors)) {
    const errorEl = document.getElementById(`error-${field}`);
    const inputEl = document.querySelector(`[name="${field}"]`);

    if (errorEl) {
      errorEl.textContent = message;
    }
    if (inputEl) {
      inputEl.classList.add('is-invalid');
    }
  }
}

// Contact Form Submission
function handleContactSubmit(event) {
  event.preventDefault();

  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const originalBtnText = submitBtn.innerHTML;

  // Clear previous errors
  clearFormErrors();

  // Disable button and show loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

  // Get form data
  const formData = new FormData(form);
  const csrfToken = getCSRFToken();

  // Send AJAX request
  fetch('/contact/', {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrfToken,
    },
    body: formData,
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      return response.json().then(data => {
        throw data;
      });
    }
  })
  .then(data => {
    if (data.success) {
      // Success
      showToast(data.message, 'success');
      form.reset();
      clearFormErrors();
    } else {
      // Validation errors
      showToast(data.message || 'Please check the form for errors.', 'error');
      if (data.errors) {
        displayFormErrors(data.errors);
      }
    }
  })
  .catch(error => {
    console.error('Error:', error);
    showToast(error.message || 'Something went wrong. Please try again.', 'error');
    if (error.errors) {
      displayFormErrors(error.errors);
    }
  })
  .finally(() => {
    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  });
}

// Setup Contact Form
function setupContactForm() {
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', handleContactSubmit);
  }
}

// Mobile Navigation Setup
function setupMobileNav() {
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const mobileNavClose = document.querySelector('.mobile-nav-close');
  const mobileNavBackButtons = document.querySelectorAll('.mobile-nav-back');
  const mobileNavParents = document.querySelectorAll('.mobile-nav-parent');

  if (mobileNavToggle && mobileNavDrawer) {
    // Open drawer
    mobileNavToggle.addEventListener('click', function () {
      mobileNavDrawer.classList.add('active');
    });

    // Close drawer
    if (mobileNavClose) {
      mobileNavClose.addEventListener('click', function () {
        mobileNavDrawer.classList.remove('active');
      });
    }

    // Back button for panels
    mobileNavBackButtons.forEach(backBtn => {
      backBtn.addEventListener('click', function () {
        const panelName = this.dataset.openPanel;
        openMobileNavPanel(panelName);
      });
    });

    // Parent menu items
    mobileNavParents.forEach(parent => {
      parent.addEventListener('click', function (e) {
        e.preventDefault();
        const panelName = this.dataset.openPanel;
        openMobileNavPanel(panelName);
      });
    });

    // Close drawer when clicking links
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
  updateWishlistBadge();

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

// Update wishlist badge
function updateWishlistBadge() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  document.querySelectorAll('.wishlist-badge').forEach(badge => {
    badge.textContent = wishlist.length;
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

  // Add event listeners for cart buttons
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
