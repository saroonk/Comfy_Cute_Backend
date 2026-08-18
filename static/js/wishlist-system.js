/**
 * Wishlist System
 * Handles wishlist functionality with AJAX toggling and state management
 * Works with both authenticated users and anonymous sessions
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  setupWishlistButtons();
  updateWishlistIconStates();
});

/**
 * Setup all wishlist buttons with click handlers
 */
function setupWishlistButtons() {
  const wishlistButtons = document.querySelectorAll('[data-wishlist-toggle]');

  wishlistButtons.forEach(button => {
    button.addEventListener('click', function (e) {
      // Prevent card navigation when clicking wishlist button
      e.preventDefault();
      e.stopPropagation();

      const productId = this.getAttribute('data-wishlist-toggle');
      if (!productId) return;

      toggleWishlist(productId, this);
    });
  });
}

/**
 * Toggle wishlist for a product
 * @param {number} productId - The product ID to toggle
 * @param {HTMLElement} button - The button element that was clicked
 */
function toggleWishlist(productId, button) {
  // Get CSRF token from the page
  const csrfToken = getCsrfToken();

  // Disable button during request
  button.disabled = true;

  fetch(`/api/wishlist/toggle/${productId}/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrfToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        // Update button state
        updateButtonState(button, data.wishlisted);

        // Update wishlist count in navbar and all badges
        updateWishlistCount(data.wishlist_count);
      } else {
        console.error('Wishlist toggle failed:', data.message);
      }
    })
    .catch(error => {
      console.error('Error toggling wishlist:', error);
    })
    .finally(() => {
      // Re-enable button
      button.disabled = false;
    });
}

/**
 * Update the visual state of a wishlist button
 * @param {HTMLElement} button - The button element
 * @param {boolean} isWishlisted - Whether the product is now wishlisted
 */
function updateButtonState(button, isWishlisted) {
  if (isWishlisted) {
    button.classList.add('active');
    button.classList.add('wishlisted');
    button.setAttribute('aria-pressed', 'true');
  } else {
    button.classList.remove('active');
    button.classList.remove('wishlisted');
    button.setAttribute('aria-pressed', 'false');
  }
}

/**
 * Update wishlist count in all navbar badges
 * @param {number} count - The new wishlist count
 */
function updateWishlistCount(count) {
  const badges = document.querySelectorAll('.wishlist-badge');

  badges.forEach(badge => {
    badge.textContent = count;

    // Show/hide badge based on count
    if (count === 0) {
      badge.style.display = 'none';
    } else {
      badge.style.display = 'flex';
    }
  });
}

/**
 * Update visual state of all wishlist buttons based on context
 * Called on page load to reflect current wishlist state
 */
function updateWishlistIconStates() {
  // Get wishlist product IDs from the page context
  // These should be provided by the context processor
  const wishlistProductIds = window.wishlistProductIds || [];

  const wishlistButtons = document.querySelectorAll('[data-wishlist-toggle]');

  wishlistButtons.forEach(button => {
    const productId = parseInt(button.getAttribute('data-wishlist-toggle'));

    if (wishlistProductIds.includes(productId)) {
      button.classList.add('active');
      button.classList.add('wishlisted');
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.classList.remove('active');
      button.classList.remove('wishlisted');
      button.setAttribute('aria-pressed', 'false');
    }
  });
}

/**
 * Get CSRF token from the page
 * @returns {string} The CSRF token
 */
function getCsrfToken() {
  // Try to get from cookie
  const name = 'csrftoken';
  let cookieValue = null;

  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + '=') {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }

  // If not in cookie, try to get from meta tag
  if (!cookieValue) {
    const token = document.querySelector('meta[name="csrf-token"]');
    if (token) {
      cookieValue = token.getAttribute('content');
    }
  }

  return cookieValue || '';
}

/**
 * Public function to initialize wishlist data from context processor
 * Call this on pages to pass the wishlist product IDs
 * @param {array} productIds - Array of wishlisted product IDs
 * @param {number} count - Total wishlist count
 */
function initializeWishlistContext(productIds, count) {
  window.wishlistProductIds = productIds || [];
  updateWishlistCount(count || 0);
  updateWishlistIconStates();
}
