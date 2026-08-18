/**
 * Wishlist System
 * Handles wishlist functionality with AJAX toggling and state management
 * Works with both authenticated users and anonymous sessions
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  setupWishlistButtons();
  updateWishlistIconStates();
  // Sync any pending wishlist state changes from other pages
  syncWishlistStateFromStorage();
});

// Handle browser back/forward cache
// When returning to a page via back/forward, sync the latest wishlist state
window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    // Page was restored from cache, sync the latest state
    syncWishlistStateFromStorage();
  }
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

        // Store the updated state in sessionStorage for cross-page synchronization
        storeWishlistStateChange(productId, data.wishlisted);
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
  const wishlistLinks = document.querySelectorAll('a[href*="wishlist"]');

  wishlistLinks.forEach(link => {
    let badge = link.querySelector('.wishlist-badge');

    if (count === 0) {
      // Remove the badge if count is 0
      if (badge) {
        badge.remove();
      }
    } else {
      // Create or update the badge if count > 0
      if (!badge) {
        // Badge doesn't exist, create it
        badge = document.createElement('span');
        badge.className = link.classList.contains('icon-btn') ? 'icon-badge wishlist-badge' : 'mobile-nav-badge wishlist-badge';
        link.appendChild(badge);
      }
      // Update the count
      badge.textContent = count;
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
 * Store a wishlist state change in sessionStorage for cross-page synchronization
 * @param {number} productId - The product ID
 * @param {boolean} isWishlisted - Whether the product is now wishlisted
 */
function storeWishlistStateChange(productId, isWishlisted) {
  try {
    // Get or create the wishlist state object
    let wishlistState = JSON.parse(sessionStorage.getItem('wishlistState')) || {};

    // Update the product's state
    wishlistState[productId] = isWishlisted;

    // Store back in sessionStorage
    sessionStorage.setItem('wishlistState', JSON.stringify(wishlistState));
  } catch (error) {
    console.error('Error storing wishlist state:', error);
  }
}

/**
 * Synchronize wishlist button states based on stored changes in sessionStorage
 * This handles the case where the user navigated away and came back
 * (e.g., product detail → back to products page)
 */
function syncWishlistStateFromStorage() {
  try {
    const wishlistState = JSON.parse(sessionStorage.getItem('wishlistState')) || {};

    const wishlistButtons = document.querySelectorAll('[data-wishlist-toggle]');

    wishlistButtons.forEach(button => {
      const productId = parseInt(button.getAttribute('data-wishlist-toggle'));

      // If this product has a stored state change, apply it
      if (wishlistState.hasOwnProperty(productId)) {
        const isWishlisted = wishlistState[productId];
        updateButtonState(button, isWishlisted);
      }
    });
  } catch (error) {
    console.error('Error syncing wishlist state:', error);
  }
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
