// ====================================
// PRODUCTS PAGE - FUNCTIONALITY
// ====================================

// Products are now rendered server-side via Django
// No static product data is needed

// Global state
let currentSort = 'recommended';
let currentGridColumns = 3;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  // Products are now rendered server-side via Django
  // Do not render old static products
  // No event listener setup needed — backend handles product rendering
});

// Products are now rendered server-side via Django
// JavaScript rendering functions removed to prevent conflicts with backend rendering

// Sorting is now handled by backend — no client-side sorting needed
// Product sorting functionality disabled (uses server-side filtering)

// Grid view toggle
document.addEventListener('DOMContentLoaded', function () {
  const gridBtns = document.querySelectorAll('.grid-btn');
  gridBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      const columns = this.dataset.columns;
      currentGridColumns = parseInt(columns);

      // Update active state
      gridBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');

      // Update grid
      const grid = document.getElementById('productsGrid');
      grid.classList.remove('grid-2', 'grid-4');
      if (columns === '2') grid.classList.add('grid-2');
      if (columns === '4') grid.classList.add('grid-4');
    });
  });
});

// Mobile filter modal
function openFilterModal() {
  const modal = document.getElementById('mobileFilterModal');
  const backdrop = document.getElementById('mobileFilterBackdrop');
  modal.classList.add('active');
  backdrop.classList.add('active');
  document.body.classList.add('filter-modal-open');
}

function closeFilterModal() {
  const modal = document.getElementById('mobileFilterModal');
  const backdrop = document.getElementById('mobileFilterBackdrop');
  modal.classList.remove('active');
  backdrop.classList.remove('active');
  document.body.classList.remove('filter-modal-open');
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function () {
  const backdrop = document.getElementById('mobileFilterBackdrop');
  if (backdrop) {
    backdrop.addEventListener('click', closeFilterModal);
  }
});

// Filtering functions disabled — dynamic filtering will be implemented server-side
// These functions previously used the deleted static products array
// TODO: Implement backend filtering in a future phase

// Wishlist functionality is now handled by backend and DOM event handlers
// Wishlist badge updates removed (managed by server-side rendering)

// Back to top button
document.addEventListener('DOMContentLoaded', function () {
  const backToTopBtn = document.querySelector('.btn-back-to-top');

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
});

// Search functionality
document.addEventListener('DOMContentLoaded', function () {
  const searchBtn = document.querySelector('.btn-search');
  const searchOverlay = document.querySelector('.search-overlay');
  const searchOverlayClose = document.querySelector('.search-overlay-close');

  if (searchBtn && searchOverlay) {
    searchBtn.addEventListener('click', function () {
      searchOverlay.classList.add('active');
    });

    searchOverlayClose.addEventListener('click', function () {
      searchOverlay.classList.remove('active');
    });

    // Close on ESC key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        searchOverlay.classList.remove('active');
      }
    });
  }
});

// Search functionality disabled — server-side search will be implemented
// This function previously used the deleted static products array
// TODO: Implement backend search in a future phase
function setupSearchFromHomepage() {
  // Placeholder — search functionality will be added via backend later
}

// Mobile nav drawer
document.addEventListener('DOMContentLoaded', function () {
  const mobileNavToggle = document.getElementById('mobileNavToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const mobileNavClose = document.querySelector('.mobile-nav-close');

  if (mobileNavToggle && mobileNavDrawer) {
    mobileNavToggle.addEventListener('click', function () {
      mobileNavDrawer.classList.add('active');
    });

    mobileNavClose.addEventListener('click', function () {
      mobileNavDrawer.classList.remove('active');
    });
  }
});
