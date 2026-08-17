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

// ====================================
// PRODUCT FILTERING & SORTING
// ====================================

// Smooth scroll to product section
function scrollToProducts() {
  const productSection = document.querySelector('.products-section');
  if (productSection) {
    productSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ====================================
// DYNAMIC CATEGORY → SUBCATEGORY
// ====================================

// Update subcategories dynamically via AJAX when user manually changes category
// NOTE: This does NOT run on initial page load - Django's template rendering handles that
// This ONLY runs when the user clicks a category checkbox to change it
// Now uses slug-based identification instead of ID
function updateSubcategoriesForCategory(categorySlug) {
  if (!categorySlug) {
    // No category selected - show message
    const subcategoryDiv = document.getElementById('subcategoryFilters');
    if (subcategoryDiv) {
      subcategoryDiv.innerHTML = '<p style="font-size: 12px; color: #999; padding: 8px 0;">Select a category above to see subcategories</p>';
    }

    const subcategoryDivMobile = document.getElementById('subcategoryFiltersMobile');
    if (subcategoryDivMobile) {
      subcategoryDivMobile.innerHTML = '<p style="font-size: 12px; color: #999; padding: 8px 0;">Select a category above to see subcategories</p>';
    }
    return;
  }

  // Fetch subcategories for this category via API using slug-based identification
  fetch(`/api/product-subcategories/?category_slug=${categorySlug}`)
    .then(response => response.json())
    .then(data => {
      if (data.subcategories && data.subcategories.length > 0) {
        // Build subcategory checkboxes using slug as value (no checked attribute since this is dynamic)
        let html = '';
        data.subcategories.forEach(subcategory => {
          html += `<label class="filter-checkbox">
            <input type="checkbox" name="subcategory" value="${subcategory.slug}"> ${subcategory.name}
          </label>`;
        });

        // Update both desktop and mobile subcategory filters
        const subcategoryDiv = document.getElementById('subcategoryFilters');
        if (subcategoryDiv) {
          subcategoryDiv.innerHTML = html;
        }

        const subcategoryDivMobile = document.getElementById('subcategoryFiltersMobile');
        if (subcategoryDivMobile) {
          subcategoryDivMobile.innerHTML = html;
        }
      } else {
        // No subcategories for this category
        const emptyMessage = '<p style="font-size: 12px; color: #999; padding: 8px 0;">No subcategories available</p>';

        const subcategoryDiv = document.getElementById('subcategoryFilters');
        if (subcategoryDiv) {
          subcategoryDiv.innerHTML = emptyMessage;
        }

        const subcategoryDivMobile = document.getElementById('subcategoryFiltersMobile');
        if (subcategoryDivMobile) {
          subcategoryDivMobile.innerHTML = emptyMessage;
        }
      }
    })
    .catch(error => {
      console.error('Error fetching subcategories:', error);
    });
}

// Initialize category change listeners ONLY
// These listeners ONLY fire when the user manually clicks a category checkbox
// They do NOT interfere with Django's initial page rendering
document.addEventListener('DOMContentLoaded', function () {
  const categoryCheckboxes = document.querySelectorAll('input[name="category"]');

  categoryCheckboxes.forEach(checkbox => {
    // IMPORTANT: Only attach listeners for manual user changes, not initial state
    checkbox.addEventListener('change', function () {
      // Now using slug-based identification (this.value is category.slug)
      const selectedCategorySlug = this.checked ? this.value : '';

      // Enforce single-select behavior: uncheck all other categories
      categoryCheckboxes.forEach(cb => {
        if (cb !== this) {
          cb.checked = false;
        }
      });

      // When category changes, clear previously selected subcategory
      // because it might not belong to the new category
      const subcategoryCheckboxes = document.querySelectorAll('input[name="subcategory"]');
      subcategoryCheckboxes.forEach(cb => {
        cb.checked = false;
      });

      // Dynamically fetch and update subcategories for the selected category using slug
      updateSubcategoriesForCategory(selectedCategorySlug);
    });
  });
});

// Change sort order while preserving current filters
function changeSortOrder(sortValue) {
  const url = new URL(window.location);
  // IMPORTANT: Preserve existing filters, only change the sort parameter
  url.searchParams.set('sort', sortValue);
  window.location.href = url.toString();
}

// Apply filters - collect all CURRENT filter values from the form
// IMPORTANT: This builds state ONLY from checked checkboxes and non-empty inputs
// It does NOT preserve stale/old filter parameters
function applyFilters() {
  // Start with a FRESH URL - clear ALL existing filter parameters
  // Keep only the current domain and path
  const baseUrl = window.location.origin + window.location.pathname;
  const url = new URL(baseUrl);

  // Determine if we should read from mobile filter modal or desktop sidebar
  const isMobile = window.innerWidth < 992;
  const container = document.querySelector(isMobile ? '#mobileFilterModal' : '.products-sidebar');

  if (container) {
    // Category (single select)
    const categoryChecked = container.querySelector('input[name="category"]:checked');
    const category = categoryChecked ? categoryChecked.value.trim() : '';
    if (category) {
      url.searchParams.set('category', category);
    }

    // Subcategory (single select)
    const subcategoryChecked = container.querySelector('input[name="subcategory"]:checked');
    const subcategory = subcategoryChecked ? subcategoryChecked.value.trim() : '';
    if (subcategory) {
      url.searchParams.set('subcategory', subcategory);
    }

    // Fabric (can be multiple selections)
    const fabricCheckboxes = container.querySelectorAll('input[name="fabric"]:checked');
    fabricCheckboxes.forEach(checkbox => {
      url.searchParams.append('fabric', checkbox.value.trim());
    });

    // Size (can be multiple selections)
    const sizeCheckboxes = container.querySelectorAll('input[name="size"]:checked');
    sizeCheckboxes.forEach(checkbox => {
      url.searchParams.append('size', checkbox.value.trim());
    });

    // Availability (can be multiple selections)
    const availabilityCheckboxes = container.querySelectorAll('input[name="availability"]:checked');
    availabilityCheckboxes.forEach(checkbox => {
      url.searchParams.append('availability', checkbox.value.trim());
    });
  }

  // Price filters - read from the correct elements based on container/viewport
  const priceMinEl = isMobile ? document.getElementById('priceMinMobile') : document.getElementById('priceMin');
  const priceMaxEl = isMobile ? document.getElementById('priceMaxMobile') : document.getElementById('priceMax');

  const minPrice = priceMinEl?.value?.trim() || '';
  const maxPrice = priceMaxEl?.value?.trim() || '';

  if (minPrice && !isNaN(minPrice) && minPrice !== '0') {
    url.searchParams.set('min_price', minPrice);
  }

  if (maxPrice && !isNaN(maxPrice) && maxPrice !== '0') {
    url.searchParams.set('max_price', maxPrice);
  }

  // Sorting - preserve current sort if present, default to newest
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect && sortSelect.value) {
    url.searchParams.set('sort', sortSelect.value);
  }

  // Reset page to 1 when applying new filters
  url.searchParams.set('page', '1');

  // Navigate to the new URL with fresh filter state
  window.location.href = url.toString();

  // Close mobile filter modal if open
  closeFilterModal();
}

// Clear all filters
function clearAllFilters() {
  // Clear all checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });

  // Clear price inputs (both desktop and mobile)
  const priceMinDesktop = document.getElementById('priceMin');
  const priceMaxDesktop = document.getElementById('priceMax');
  const priceMinMobile = document.getElementById('priceMinMobile');
  const priceMaxMobile = document.getElementById('priceMaxMobile');

  if (priceMinDesktop) priceMinDesktop.value = '';
  if (priceMaxDesktop) priceMaxDesktop.value = '';
  if (priceMinMobile) priceMinMobile.value = '';
  if (priceMaxMobile) priceMaxMobile.value = '';

  // Reset sort to default
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = 'newest';

  // Redirect to products page without any filters
  window.location.href = '/products/';
}

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
