// ====================================
// PRODUCTS PAGE - FUNCTIONALITY
// ====================================

// Sample product data
const productsData = [
  {
    id: 1,
    name: 'Linen Summer Dress',
    price: 2499,
    oldPrice: 4999,
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=500&auto=format&fit=crop',
    rating: 4.5,
    reviews: 128,
    badge: 'New',
    category: 'dresses',
    size: ['XS', 'S', 'M', 'L'],
    color: ['teal', 'white', 'blush'],
    fabric: 'linen',
    inStock: true,
    discount: 50
  },
  {
    id: 2,
    name: 'Organic Cotton Kurti',
    price: 1899,
    oldPrice: 3799,
    image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=500&auto=format&fit=crop',
    rating: 4.8,
    reviews: 256,
    badge: 'Sale',
    category: 'kurtis',
    size: ['S', 'M', 'L', 'XL'],
    color: ['navy', 'white', 'beige'],
    fabric: 'cotton',
    inStock: true,
    discount: 50
  },
  {
    id: 3,
    name: 'Premium Silk Top',
    price: 1599,
    oldPrice: 3199,
    image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=500&auto=format&fit=crop',
    rating: 4.6,
    reviews: 89,
    badge: 'Sale',
    category: 'tops',
    size: ['XS', 'S', 'M', 'L', 'XL'],
    color: ['black', 'white', 'blush'],
    fabric: 'silk',
    inStock: true,
    discount: 50
  },
  {
    id: 4,
    name: 'Casual Linen Shirt',
    price: 1799,
    oldPrice: 3599,
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=500&auto=format&fit=crop',
    rating: 4.4,
    reviews: 145,
    category: 'tops',
    size: ['S', 'M', 'L', 'XL', 'XXL'],
    color: ['white', 'beige', 'navy'],
    fabric: 'linen',
    inStock: true,
    discount: 50
  },
  {
    id: 5,
    name: 'Elegance Party Gown',
    price: 3499,
    oldPrice: 6999,
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=500&auto=format&fit=crop',
    rating: 4.9,
    reviews: 67,
    category: 'party',
    size: ['XS', 'S', 'M', 'L'],
    color: ['black', 'navy', 'blush'],
    fabric: 'rayon',
    inStock: true,
    discount: 50
  },
  {
    id: 6,
    name: 'Comfort Linen Pants',
    price: 1999,
    oldPrice: 3999,
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=500&auto=format&fit=crop',
    rating: 4.7,
    reviews: 203,
    badge: 'Best Seller',
    category: 'casual',
    size: ['XS', 'S', 'M', 'L', 'XL'],
    color: ['white', 'beige', 'navy'],
    fabric: 'linen',
    inStock: true,
    discount: 50
  },
  {
    id: 7,
    name: 'Organic Cotton Blend Tee',
    price: 899,
    oldPrice: 1799,
    image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=500&auto=format&fit=crop',
    rating: 4.5,
    reviews: 412,
    category: 'tops',
    size: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    color: ['white', 'black', 'teal'],
    fabric: 'cotton',
    inStock: true,
    discount: 50
  },
  {
    id: 8,
    name: 'Flowy Rayon Dress',
    price: 2199,
    oldPrice: 4399,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=500&auto=format&fit=crop',
    rating: 4.6,
    reviews: 178,
    category: 'dresses',
    size: ['S', 'M', 'L', 'XL'],
    color: ['blush', 'white', 'navy'],
    fabric: 'rayon',
    inStock: true,
    discount: 50
  },
  {
    id: 9,
    name: 'Minimalist Cotton Hoodie',
    price: 1499,
    oldPrice: 2999,
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=500&auto=format&fit=crop',
    rating: 4.8,
    reviews: 234,
    category: 'casual',
    size: ['XS', 'S', 'M', 'L', 'XL'],
    color: ['white', 'navy', 'black'],
    fabric: 'cotton',
    inStock: true,
    discount: 50
  },
  {
    id: 10,
    name: 'Elegance Linen Kurti',
    price: 1699,
    oldPrice: 3399,
    image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=500&auto=format&fit=crop',
    rating: 4.7,
    reviews: 189,
    category: 'kurtis',
    size: ['S', 'M', 'L', 'XL', 'XXL'],
    color: ['white', 'beige', 'navy'],
    fabric: 'linen',
    inStock: true,
    discount: 50
  },
  {
    id: 11,
    name: 'Silk Blouse Classic',
    price: 1899,
    oldPrice: 3799,
    image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=500&auto=format&fit=crop',
    rating: 4.6,
    reviews: 145,
    category: 'tops',
    size: ['XS', 'S', 'M', 'L', 'XL'],
    color: ['white', 'blush', 'black'],
    fabric: 'silk',
    inStock: true,
    discount: 50
  },
  {
    id: 12,
    name: 'Premium Linen Suit Set',
    price: 3199,
    oldPrice: 6399,
    image: 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?q=80&w=500&auto=format&fit=crop',
    rating: 4.9,
    reviews: 92,
    badge: 'Premium',
    category: 'casual',
    size: ['XS', 'S', 'M', 'L', 'XL'],
    color: ['navy', 'white', 'beige'],
    fabric: 'linen',
    inStock: true,
    discount: 50
  }
];

// Global state
let currentSort = 'recommended';
let currentGridColumns = 3;
let filteredProducts = [...productsData];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  renderProducts();
  setupEventListeners();
  setupSearchFromHomepage();
});

// Render products
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '';

  filteredProducts.forEach((product, index) => {
    const card = createProductCard(product);
    card.style.animationDelay = `${0.05 * index}s`;
    grid.appendChild(card);
  });
}

// Create product card
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'arrival-product-card';
  card.innerHTML = `
    <div class="arrival-img-container">
      <img src="${product.image}" alt="${product.name}" class="arrival-product-img">
      ${product.badge ? `<div class="product-badge-group"><span class="product-badge badge-${product.badge.toLowerCase()}">${product.badge}</span></div>` : ''}
      <button class="arrival-wishlist-btn" aria-label="Add to Wishlist">
        <i class="fa-regular fa-heart"></i>
      </button>
    </div>
    <div class="arrival-product-name">${product.name}</div>
    <div class="arrival-price">₹${product.price.toLocaleString('en-IN')}</div>
  `;

  // Wishlist functionality
  const wishlistBtn = card.querySelector('.arrival-wishlist-btn');
  wishlistBtn.addEventListener('click', function (e) {
    e.preventDefault();
    this.classList.toggle('active');
    updateWishlistBadge();
  });

  return card;
}

// Sort products
function changeSortOrder(order) {
  currentSort = order;

  switch (order) {
    case 'newest':
      filteredProducts.sort((a, b) => b.id - a.id);
      break;
    case 'price-low':
      filteredProducts.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      filteredProducts.sort((a, b) => b.price - a.price);
      break;
    case 'best-selling':
      filteredProducts.sort((a, b) => b.reviews - a.reviews);
      break;
    case 'recommended':
    default:
      filteredProducts = [...productsData];
      break;
  }

  renderProducts();
}

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

// Clear filters
function clearAllFilters() {
  // Clear all checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });

  // Reset price inputs
  document.getElementById('priceMin').value = '';
  document.getElementById('priceMax').value = '';

  // Reset products
  filteredProducts = [...productsData];
  renderProducts();

  // Close mobile modal if open
  closeFilterModal();
}

// Apply filters
function applyFilters() {
  const categories = Array.from(document.querySelectorAll('input[name="category"]:checked')).map(el => el.value);
  const sizes = Array.from(document.querySelectorAll('input[name="size"]:checked')).map(el => el.value);
  const colors = Array.from(document.querySelectorAll('input[name="color"]:checked')).map(el => el.value);
  const fabrics = Array.from(document.querySelectorAll('input[name="fabric"]:checked')).map(el => el.value);
  const availability = Array.from(document.querySelectorAll('input[name="availability"]:checked')).map(el => el.value);
  const discounts = Array.from(document.querySelectorAll('input[name="discount"]:checked')).map(el => parseInt(el.value));
  const priceMin = parseInt(document.getElementById('priceMin').value) || 0;
  const priceMax = parseInt(document.getElementById('priceMax').value) || 10000;

  filteredProducts = productsData.filter(product => {
    // Category filter
    if (categories.length > 0 && !categories.includes(product.category)) return false;

    // Size filter
    if (sizes.length > 0 && !sizes.some(size => product.size.includes(size.toUpperCase()))) return false;

    // Color filter
    if (colors.length > 0 && !colors.some(color => product.color.includes(color))) return false;

    // Fabric filter
    if (fabrics.length > 0 && !fabrics.includes(product.fabric)) return false;

    // Availability filter
    if (availability.length > 0) {
      const inStock = product.inStock;
      if (availability.includes('in-stock') && !inStock) return false;
      if (availability.includes('out-stock') && inStock) return false;
    }

    // Discount filter
    if (discounts.length > 0 && !discounts.includes(product.discount)) return false;

    // Price filter
    if (product.price < priceMin || product.price > priceMax) return false;

    return true;
  });

  renderProducts();
  closeFilterModal();
}

// Update wishlist badge
function updateWishlistBadge() {
  const wishlistBtns = document.querySelectorAll('.arrival-wishlist-btn.active');
  const count = wishlistBtns.length;
  document.querySelectorAll('.wishlist-badge').forEach(badge => {
    badge.textContent = count;
  });
}

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

// Setup search from homepage
function setupSearchFromHomepage() {
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    const form = searchInput.closest('form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const query = searchInput.value.toLowerCase();

        // Filter products by search query
        filteredProducts = productsData.filter(product =>
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
        );

        renderProducts();

        // Close search overlay
        document.querySelector('.search-overlay').classList.remove('active');
      });
    }
  }
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
