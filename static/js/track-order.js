/* ====================================
   TRACK ORDER PAGE - FUNCTIONALITY
   ==================================== */

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  setupTrackOrderForm();
  setupMobileNav();
  setupSearch();
  setupCart();
  setupBackToTop();
  setupHeroSpacing();
  initializeTimelineProgress();
});

/* ==========================================
   INITIALIZE TIMELINE PROGRESS FOR ALL CARDS
   ========================================== */
function initializeTimelineProgress() {
  // Find all timeline-track elements on the page
  const timelineTracks = document.querySelectorAll('.timeline-track');

  timelineTracks.forEach(track => {
    updateTimelineProgress(track);
  });
}

function updateTimelineProgress(timelineTrack) {
  // Find all timeline steps in this track
  const timelineSteps = timelineTrack.querySelectorAll('.timeline-step');
  const timelineLine = timelineTrack.querySelector('.timeline-line');

  if (!timelineLine) return;

  // Count completed and active steps to determine progress
  let maxCompletedIndex = -1;

  timelineSteps.forEach((step, index) => {
    if (step.classList.contains('completed') || step.classList.contains('active')) {
      maxCompletedIndex = index;
    }
  });

  // Calculate progress width
  let progressWidth;
  if (maxCompletedIndex < 0) {
    progressWidth = '0%';  // No progress
  } else {
    // Progress extends to current stage: (maxCompletedIndex + 1) / totalStages * 100
    progressWidth = ((maxCompletedIndex + 1) / timelineSteps.length) * 100 + '%';
  }

  // Set the CSS variable for this timeline line
  timelineLine.style.setProperty('--progress-width', progressWidth);
}

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

  // Validate: at least one field must be filled
  if (!orderID && !emailOrPhone) {
    showAlert('error', 'Please enter your order number, email address, or phone number.');
    return;
  }

  // Show loading state
  const submitBtn = document.querySelector('.track-order-btn');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'SEARCHING...';
  submitBtn.disabled = true;

  // Prepare request data - only include fields that are filled
  const requestData = {};

  if (orderID) {
    requestData.order_number = orderID;
  }

  // Determine if input is email or phone
  if (emailOrPhone) {
    if (emailOrPhone.includes('@')) {
      requestData.email = emailOrPhone;
    } else {
      requestData.phone = emailOrPhone;
    }
  }

  // Make API call
  fetch('/api/track-order-search/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify(requestData)
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        showAlert('error', data.error);
        return;
      }

      // Display the order
      displayOrderStatus(data);
      document.getElementById('orderStatusSection').scrollIntoView({ behavior: 'smooth' });
    })
    .catch(error => {
      console.error('Order search error:', error);
      showAlert('error', 'An error occurred while searching for your order.');
    })
    .finally(() => {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
}

function displayOrderStatus(order) {
  const statusSection = document.getElementById('orderStatusSection');

  // Update order details
  document.getElementById('displayOrderID').textContent = order.order_number;

  // Calculate and display expected delivery date (add 5 business days from order date)
  const orderDate = new Date(order.created_at);
  const deliveryDate = calculateDeliveryDate(orderDate);
  document.getElementById('deliveryDate').textContent = deliveryDate;

  // For now, use a generic tracking number (could be generated per order)
  document.getElementById('trackingNumber').textContent = generateTrackingNumber(order.order_number);

  // Update timeline based on order status
  updateTimeline(order.status);

  // Display order items
  displayOrderItems(order.items);

  // Show the status section
  statusSection.style.display = 'block';
}

function displayOrderItems(items) {
  const itemsContainer = document.querySelector('.tracking-items-container');
  if (!itemsContainer) return;

  if (items.length === 0) {
    itemsContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No items in this order</p>';
    return;
  }

  let itemsHTML = '<div class="tracking-items-list">';
  items.forEach(item => {
    itemsHTML += `
      <div class="tracking-item">
        <div class="tracking-item-info">
          <h6 class="tracking-item-name">${item.product_name}</h6>
          <span class="tracking-item-meta">${item.variant_color} | Size: ${item.size}</span>
        </div>
        <div class="tracking-item-qty">Qty: ${item.quantity}</div>
        <div class="tracking-item-price">₹${parseFloat(item.total_price).toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
      </div>
    `;
  });
  itemsHTML += '</div>';

  itemsContainer.innerHTML = itemsHTML;
}

function updateTimeline(status) {
  // Define status progression in UI
  const statusStages = ['confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery', 'delivered'];

  // Map database status to UI stage index
  let currentIndex = -1;
  switch (status) {
    case 'confirmed':
      currentIndex = 0;
      break;
    case 'processing':
      currentIndex = 1;
      break;
    case 'shipped':
      currentIndex = 3;  // Skip 'packed' as it's not in DB
      break;
    case 'delivered':
      currentIndex = 5;
      break;
    case 'pending':
      currentIndex = -1;  // No stages marked
      break;
    case 'cancelled':
      // Show cancellation state
      markOrderCancelled();
      return;
  }

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

  // Update progress line width
  // Find the timeline-track containing these steps and update its progress
  const firstStep = document.getElementById(`status-${statusStages[0]}`);
  if (firstStep) {
    const timelineTrack = firstStep.closest('.timeline-track');
    if (timelineTrack) {
      updateTimelineProgress(timelineTrack);
    }
  }
}

function markOrderCancelled() {
  const timelineTrack = document.querySelector('.timeline-track');
  if (timelineTrack) {
    timelineTrack.innerHTML = '<p style="color: #d32f2f; text-align: center; font-weight: 600; padding: 30px;">This order has been cancelled</p>';
  }
}

function calculateDeliveryDate(orderDate) {
  // Add 5 business days to order date
  let deliveryDate = new Date(orderDate);
  let daysAdded = 0;

  while (daysAdded < 5) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
    const dayOfWeek = deliveryDate.getDay();
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }

  return deliveryDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function generateTrackingNumber(orderNumber) {
  // Generate a pseudo-unique tracking number based on order number
  let hash = 0;
  for (let i = 0; i < orderNumber.length; i++) {
    const char = orderNumber.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const trackingNumber = Math.abs(hash).toString().substring(0, 12).padEnd(18, '0');
  return trackingNumber.substring(0, 18);
}

function getCookie(name) {
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
