/**
 * Checkout Page JavaScript
 * Handles cart display in order summary and form validation
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize checkout page
  initCheckout();

  // Set up form submission
  const checkoutForm = document.getElementById('checkoutForm');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  // Initialize mobile account popup
  initMobileAccountPopup();
});

/**
 * Sample items used for UI preview/testing when the cart is empty.
 */
const sampleItems = [
  {
    name: "Cozy Organic Cotton Knit Romper",
    price: 599,
    quantity: 1,
    size: "0-3M",
    color: "Sage Green",
    image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=400&auto=format&fit=crop"
  },
  {
    name: "Premium Ribbed Baby Leggings",
    price: 399,
    quantity: 2,
    size: "6-12M",
    color: "Oatmeal",
    image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=400&auto=format&fit=crop"
  }
];

/**
 * Initialize checkout page
 */
function initCheckout() {
  // Render cart items in order summary
  renderCheckoutSummary();

  // Update summary totals
  updateSummaryTotals();

  // Add event listener to state field for dynamic shipping calculation
  const stateInput = document.getElementById('state');
  if (stateInput) {
    stateInput.addEventListener('input', updateSummaryTotals);
    stateInput.addEventListener('change', updateSummaryTotals);
  }
}

/**
 * Render cart items in the order summary section
 */
function renderCheckoutSummary() {
  const cartItemsContainer = document.querySelector('.cart-items-summary');
  if (!cartItemsContainer) return;

  // Get cart from localStorage
  let cart = getCart();
  let isDemo = false;

  if (cart.length === 0) {
    cart = sampleItems;
    isDemo = true;
  }

  // Render each cart item
  let cartHTML = '';
  cart.forEach((item, index) => {
    const itemTotal = parseFloat(item.price) * parseInt(item.quantity);
    const imageUrl = item.image || 'https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=400&auto=format&fit=crop';

    cartHTML += `
      <div class="summary-item">
        <div class="summary-item-image-wrapper">
          <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(item.name)}" class="summary-item-image">
          <div class="quantity-badge">${item.quantity}</div>
        </div>
        <div class="summary-item-details">
          <div class="summary-item-header">
            <span class="summary-item-name">${escapeHtml(item.name)}</span>
            <span class="summary-item-price">₹${formatPrice(itemTotal)}</span>
          </div>
          <div class="summary-item-meta">
            ${item.size || item.color ? `
              <div class="summary-item-variant">
                ${item.size ? `Size: ${escapeHtml(item.size)}` : ''}
                ${item.size && item.color ? ' • ' : ''}
                ${item.color ? `Color: ${escapeHtml(item.color)}` : ''}
              </div>
            ` : ''}
            <div class="summary-item-qty">Quantity: ${item.quantity}</div>
          </div>
        </div>
      </div>
    `;
  });

  cartItemsContainer.innerHTML = cartHTML;
}

/**
 * Update order summary totals
 */
function updateSummaryTotals() {
  let cart = getCart();
  if (cart.length === 0) {
    cart = sampleItems;
  }
  const subtotal = calculateCartSubtotal(cart);

  // Determine shipping based on state input
  const stateInput = document.getElementById('state');
  const stateValue = stateInput ? stateInput.value.trim() : '';

  let shipping = 0;
  let shippingText = '';
  let shippingClass = '';

  if (!stateValue) {
    shippingText = 'Select State';
    shippingClass = 'shipping-pending';
  } else {
    // Shipping (free above ₹999)
    shipping = subtotal >= 999 ? 0 : 100;
    shippingText = shipping === 0 ? 'FREE' : `₹${formatPrice(shipping)}`;
    shippingClass = shipping === 0 ? 'shipping-free' : '';
  }

  // Total
  const total = subtotal + shipping;

  // Update display
  const subtotalEl = document.querySelector('.subtotal-value');
  const shippingEl = document.querySelector('.shipping-value');
  const totalEl = document.querySelector('.total-value');

  if (subtotalEl) subtotalEl.textContent = `₹${formatPrice(subtotal)}`;
  if (shippingEl) {
    shippingEl.textContent = shippingText;
    shippingEl.className = `price-value shipping-value ${shippingClass}`;
  }
  if (totalEl) totalEl.textContent = `₹${formatPrice(total)}`;
}

/**
 * Calculate cart subtotal
 */
function calculateCartSubtotal(cart) {
  return cart.reduce((total, item) => {
    return total + (parseFloat(item.price) * parseInt(item.quantity));
  }, 0);
}

/**
 * Get cart from localStorage
 */
function getCart() {
  try {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  } catch (e) {
    console.error('Error getting cart:', e);
    return [];
  }
}

/**
 * Format price with commas
 */
function formatPrice(price) {
  return parseInt(price).toLocaleString('en-IN');
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Handle checkout form submission
 */
function handleCheckoutSubmit(e) {
  e.preventDefault();

  // Validate form
  if (!validateCheckoutForm()) {
    showNotification('Please fill in all required fields correctly.', 'error');
    return;
  }

  // Get form data
  const formData = new FormData(document.getElementById('checkoutForm'));
  const checkoutData = Object.fromEntries(formData);

  // Get cart
  const cart = getCart();

  if (cart.length === 0) {
    showNotification('Your cart is empty. Add items before checking out.', 'error');
    return;
  }

  // Prepare order data
  const orderData = {
    customer: {
      email: checkoutData.email,
      firstName: checkoutData.fullName,
      lastName: checkoutData.lastName || '',
      phone: checkoutData.phone,
    },
    shipping: {
      address: checkoutData.address,
      apartment: checkoutData.apartment || '',
      city: checkoutData.city,
      state: checkoutData.state,
      pincode: checkoutData.pincode,
    },
    items: cart,
  };

  // Show loading state
  const submitButton = document.querySelector('button[type="submit"]');
  const originalText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

  // Simulate order placement (in production, send to server)
  setTimeout(() => {
    // Success message
    showNotification('Order placed successfully! Redirecting...', 'success');

    // Clear cart after successful order
    localStorage.removeItem('cart');

    // Redirect after 2 seconds
    setTimeout(() => {
      // In production, redirect to order confirmation page
      window.location.href = '/products/';
    }, 2000);
  }, 1500);

  console.log('Order data:', orderData);
}

/**
 * Validate checkout form
 */
function validateCheckoutForm() {
  const form = document.getElementById('checkoutForm');

  // Get form fields
  const email = form.querySelector('#email').value.trim();
  const fullName = form.querySelector('#fullName').value.trim();
  const phone = form.querySelector('#phone').value.trim();
  const address = form.querySelector('#address').value.trim();
  const city = form.querySelector('#city').value.trim();
  const state = form.querySelector('#state').value.trim();
  const pincode = form.querySelector('#pincode').value.trim();

  // Validate required fields
  if (!email || !fullName || !phone || !address || !city || !state || !pincode) {
    return false;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Validate phone (basic check - at least 10 digits)
  const phoneRegex = /\d{10}/;
  if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
    return false;
  }

  // Validate pincode (basic check - 5-6 digits)
  const pincodeRegex = /^\d{5,6}$/;
  if (!pincodeRegex.test(pincode)) {
    return false;
  }

  return true;
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
  // Remove existing notification if any
  const existing = document.querySelector('.checkout-notification');
  if (existing) {
    existing.remove();
  }

  // Create notification element
  const notification = document.createElement('div');
  notification.className = `checkout-notification checkout-notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;

  // Add styles inline if not in CSS
  if (!document.querySelector('style[data-checkout-notify]')) {
    const style = document.createElement('style');
    style.setAttribute('data-checkout-notify', '');
    style.textContent = `
      .checkout-notification {
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        max-width: 500px;
        width: 90%;
        padding: 1rem;
        border-radius: 0.375rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideDown 0.3s ease;
      }

      .checkout-notification-success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
      }

      .checkout-notification-error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
      }

      .checkout-notification-info {
        background-color: #d1ecf1;
        color: #0c5460;
        border: 1px solid #bee5eb;
      }

      .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateX(-50%) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.animation = 'slideDown 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

/**
 * Initialize mobile account popup
 */
function initMobileAccountPopup() {
  const accountBtn = document.getElementById('mobileAccountBtn');
  const accountPopup = document.getElementById('mobileAccountPopup');

  if (accountBtn && accountPopup) {
    accountBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      accountPopup.classList.toggle('active');
    });

    // Close when clicking outside
    document.addEventListener('click', function(e) {
      if (!accountPopup.contains(e.target) && e.target !== accountBtn) {
        accountPopup.classList.remove('active');
      }
    });
  }
}

/**
 * Update cart display on localStorage change
 * (triggered by main.js when cart is updated)
 */
window.addEventListener('storage', function(e) {
  if (e.key === 'cart') {
    renderCheckoutSummary();
    updateSummaryTotals();
  }
});

// Also listen for custom cart update event (if main.js dispatches one)
document.addEventListener('cartUpdated', function() {
  renderCheckoutSummary();
  updateSummaryTotals();
});
