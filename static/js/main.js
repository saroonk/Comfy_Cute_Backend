/*
   COMFY CUTE - Premium Clothing E-commerce Homepage
   Custom JS Features & Interactions
*/

document.addEventListener('DOMContentLoaded', function () {
  
  // ==========================================
  // 1. TOP ANNOUNCEMENT BAR SLIDER
  // ==========================================
  const announcementItems = document.querySelectorAll('.announcement-item');
  let currentAnnouncementIndex = 0;

  if (announcementItems.length > 0) {
    setInterval(() => {
      announcementItems[currentAnnouncementIndex].classList.remove('active');
      currentAnnouncementIndex = (currentAnnouncementIndex + 1) % announcementItems.length;
      announcementItems[currentAnnouncementIndex].classList.add('active');
    }, 4000);
  }

  // ==========================================
  // 2. NAVBAR SCROLL COMPACT + HERO OFFSET
  // ==========================================
  const header = document.querySelector('header');
  const backToTopBtn = document.querySelector('.btn-back-to-top');

  // Dynamically push hero below the fixed announcement bar + navbar.
  // Accounts for the announcement bar being auto-hidden on scroll (see below).
  function adjustLayout() {
    const barEl  = document.getElementById('announcementBar');
    const navEl  = document.querySelector('header');
    const heroEl = document.querySelector('.hero-section');
    if (!navEl || !heroEl) return;

    const announcementHidden = document.body.classList.contains('announcement-hidden');
    const barH = barEl ? barEl.offsetHeight : 0;
    const navH = navEl.offsetHeight;
    const offset = announcementHidden ? navH : (barH + navH);

    // Push the hero section down so it starts below the fixed bars
    heroEl.style.marginTop = offset + 'px';
  }

  adjustLayout();
  window.addEventListener('resize', adjustLayout);

  // Keep scrolled class for compact navbar padding on scroll
  window.addEventListener('scroll', function () {
    const wasScrolled = header.classList.contains('scrolled');
    const isScrolled = window.scrollY > 80;

    if (isScrolled) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Header height changes slightly when its padding compacts —
    // resync the hero offset once that transition has settled.
    if (wasScrolled !== isScrolled) {
      setTimeout(adjustLayout, 320);
    }

    if (backToTopBtn) {
      if (window.scrollY > 500) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    }
  });

  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ==========================================
  // 2b. ANNOUNCEMENT BAR HIDE ON SCROLL (ONE-TIME, GPU-FRIENDLY)
  // ==========================================
  // One-way behavior: announcement bar hides on first scroll beyond 50px
  // and stays hidden for the rest of the session. It only reappears after
  // a full page refresh/reload.
  let announcementHidden = false;
  let scrollTicking = false;

  function handleAnnouncementScroll() {
    scrollTicking = false;

    // If already hidden, ignore all further scroll events
    if (announcementHidden) return;

    // Hide announcement bar on first scroll beyond 50px
    if (window.scrollY > 50) {
      document.body.classList.add('announcement-hidden');
      announcementHidden = true;
    }
  }

  window.addEventListener('scroll', function () {
    if (!scrollTicking && !announcementHidden) {
      window.requestAnimationFrame(handleAnnouncementScroll);
      scrollTicking = true;
    }
  }, { passive: true });

  // ==========================================
  // 3. SEARCH OVERLAY TOGGLE
  // ==========================================
  const searchBtn = document.querySelector('.btn-search');
  const searchMobileBtn = document.querySelector('.btn-search-mobile');
  const searchOverlay = document.querySelector('.search-overlay');
  const searchOverlayClose = document.querySelector('.search-overlay-close');
  const searchInput = document.querySelector('.search-input');

  function openSearch() {
    searchOverlay.classList.add('active');
    setTimeout(() => searchInput.focus(), 300);
    document.body.style.overflow = 'hidden'; // Prevents scrolling behind overlay
  }

  function closeSearch() {
    searchOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  if (searchMobileBtn) searchMobileBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openSearch();
  });
  if (searchOverlayClose) searchOverlayClose.addEventListener('click', closeSearch);

  // Close search overlay with Escape key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
      closeSearch();
    }
  });

  // ==========================================
  // 4. MOCK DATA & CART/WISHLIST STATE
  // ==========================================
  // Sample products database for quick view and cart
  const products = {
    "prod-1": {
      id: "prod-1",
      title: "Premium Linen Summer Dress",
      price: 2499,
      oldPrice: 3499,
      discount: "28% OFF",
      rating: 4.8,
      ratingCount: 124,
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop",
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["#E6F2F2", "#FCF3CF", "#F2D7D5"],
      desc: "An elegant, lightweight linen dress perfect for warm afternoons. Designed with a relaxed fit, functional side pockets, and a clean minimalist aesthetic. Tailored using ethically sourced 100% organic European flax linen."
    },
    "prod-2": {
      id: "prod-2",
      title: "Floral Printed Cotton Romper",
      price: 1299,
      oldPrice: 1999,
      discount: "35% OFF",
      rating: 4.9,
      ratingCount: 89,
      image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?q=80&w=600&auto=format&fit=crop",
      sizes: ["0-3M", "3-6M", "6-12M", "1-2Y"],
      colors: ["#FDEDEC", "#EAF2F8", "#E8F8F5"],
      desc: "Keep your little one cozy all day in this skin-friendly, extra-soft organic cotton romper. Featuring flat-lock stitching to prevent skin irritation and nickel-free snap buttons for easy diaper changes."
    },
    "prod-3": {
      id: "prod-3",
      title: "Minimalist Pastel Knit Sweater",
      price: 2899,
      oldPrice: 3999,
      discount: "27% OFF",
      rating: 4.7,
      ratingCount: 65,
      image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&auto=format&fit=crop",
      sizes: ["S", "M", "L", "XL"],
      colors: ["#A9D6D5", "#FCFEFE", "#F5B041"],
      desc: "A beautifully soft knit sweater crafted with a premium cotton-merino wool blend. It features a relaxed drop shoulder, comfortable crew neckline, and a warm pastel tone that coordinates effortlessly."
    },
    "prod-4": {
      id: "prod-4",
      title: "Unisex Cotton Dungaree Set",
      price: 1599,
      oldPrice: 2299,
      discount: "30% OFF",
      rating: 4.9,
      ratingCount: 110,
      image: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&auto=format&fit=crop",
      sizes: ["3-6M", "6-12M", "1-2Y", "2-4Y"],
      colors: ["#F9EBEA", "#EBEDEF", "#FEF9E7"],
      desc: "A classic matching dungaree set featuring adjustable shoulder straps, soft elastic waistlines, and a breathable pure cotton undershirt. Perfect for playdates and weekend outings."
    },
    "prod-5": {
      id: "prod-5",
      title: "Elegant Cotton Anarkali Kurti",
      price: 3299,
      oldPrice: 4999,
      discount: "34% OFF",
      rating: 4.6,
      ratingCount: 145,
      image: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?q=80&w=600&auto=format&fit=crop",
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["#FADBD8", "#D4EFDF", "#FCF3CF"],
      desc: "Infuse traditional elegance into your wardrobe with this pure cotton Anarkali Kurti. Features detailed hand-block printed motifs, elegant borders, and a beautiful flowy drape that stays light and breathable."
    },
    "prod-6": {
      id: "prod-6",
      title: "Cozy Cotton Sleepwear Set",
      price: 1899,
      oldPrice: 2499,
      discount: "24% OFF",
      rating: 4.8,
      ratingCount: 98,
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop",
      sizes: ["S", "M", "L", "XL"],
      colors: ["#E8F8F5", "#FBEEE6", "#F4ECF7"],
      desc: "Experience ultimate luxury during lounge hours. This soft cotton pajama set features a classic collar shirt and premium straight-leg pants with a comfort-fit elastic waistband."
    },
    "prod-7": {
      id: "prod-7",
      title: "Cute Ruffled Party Frock",
      price: 1999,
      oldPrice: 2999,
      discount: "33% OFF",
      rating: 5.0,
      ratingCount: 42,
      image: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?q=80&w=600&auto=format&fit=crop",
      sizes: ["6-12M", "1-2Y", "2-4Y", "4-6Y"],
      colors: ["#FDEDEC", "#F4ECF7", "#FCFEFE"],
      desc: "Perfect for birthdays and festive dinners, this party frock features multi-tiered tulle ruffles, comfortable satin-lined inner fabric, and an elegant tie-back bow."
    },
    "prod-8": {
      id: "prod-8",
      title: "Modern Linen Wide Leg Trousers",
      price: 2199,
      oldPrice: 2999,
      discount: "26% OFF",
      rating: 4.5,
      ratingCount: 76,
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=600&auto=format&fit=crop",
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["#EBEDEF", "#EBEDEF", "#EAEDED"],
      desc: "A chic summer essential. Tailored with a comfortable elasticated back waist, front pockets, and a sophisticated wide-leg drape. Crafted with pure breathable flax linen."
    }
  };

  let cart = [
    {
      id: "prod-1",
      title: "Premium Linen Summer Dress",
      price: 2499,
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop",
      size: "M",
      color: "Mint Green",
      qty: 1
    }
  ];

  let wishlist = new Set(["prod-2"]);

  // Elements to update
  const cartBadges = document.querySelectorAll('.cart-badge');
  const wishlistBadges = document.querySelectorAll('.wishlist-badge');
  const cartDrawerItems = document.querySelector('.cart-items-container');
  const cartSubtotalText = document.querySelector('.cart-subtotal-price');

  // Initialize UI counts
  updateCartUI();
  updateWishlistUI();

  // WISHLIST TOGGLE ACTION
  document.addEventListener('click', function (e) {
    const wishlistBtn = e.target.closest('.btn-wishlist');
    if (wishlistBtn) {
      const prodId = wishlistBtn.dataset.id;
      if (wishlist.has(prodId)) {
        wishlist.delete(prodId);
        wishlistBtn.classList.remove('active');
        showToast("Removed from wishlist", "info");
      } else {
        wishlist.add(prodId);
        wishlistBtn.classList.add('active');
        showToast("Added to wishlist", "success");
      }
      updateWishlistUI();
    }
  });

  function updateWishlistUI() {
    wishlistBadges.forEach(badge => {
      badge.textContent = wishlist.size;
      if (wishlist.size === 0) {
        badge.style.display = 'none';
      } else {
        badge.style.display = 'flex';
      }
    });

    // Update heart icons across cards
    document.querySelectorAll('.btn-wishlist').forEach(btn => {
      const id = btn.dataset.id;
      if (wishlist.has(id)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // CART STATE UPDATING
  function updateCartUI() {
    // Badges update
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartBadges.forEach(badge => {
      badge.textContent = totalItems;
      if (totalItems === 0) {
        badge.style.display = 'none';
      } else {
        badge.style.display = 'flex';
      }
    });

    // Subtotal calculation
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (cartSubtotalText) {
      cartSubtotalText.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    }

    // Render items in mini cart drawer
    if (cartDrawerItems) {
      if (cart.length === 0) {
        cartDrawerItems.innerHTML = `
          <div class="text-center py-5">
            <i class="fa-solid fa-bag-shopping mb-3" style="font-size: 3rem; color: var(--color-border)"></i>
            <h5 class="mb-2">Your cart is empty</h5>
            <p class="text-muted mb-4 small">Looks like you haven't added anything yet.</p>
            <button class="btn btn-premium btn-premium-primary btn-sm" data-bs-dismiss="offcanvas">Shop Now</button>
          </div>
        `;
      } else {
        cartDrawerItems.innerHTML = cart.map(item => `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.title}" class="cart-item-img">
            <div class="cart-item-info">
              <h6 class="cart-item-title">${item.title}</h6>
              <div class="cart-item-meta">Size: ${item.size} | Color: ${item.color}</div>
              <div class="d-flex justify-content-between align-items-center">
                <span class="cart-item-price">₹${(item.price * item.qty).toLocaleString('en-IN')}</span>
                <div class="cart-item-qty">
                  <button class="cart-qty-btn qty-minus" data-id="${item.id}" data-size="${item.size}">-</button>
                  <span class="cart-qty-val">${item.qty}</span>
                  <button class="cart-qty-btn qty-plus" data-id="${item.id}" data-size="${item.size}">+</button>
                </div>
              </div>
            </div>
            <button class="cart-item-remove" data-id="${item.id}" data-size="${item.size}">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        `).join('');
      }
    }
  }

  // Cart Qty Modifiers & Remove buttons inside drawer
  if (cartDrawerItems) {
    cartDrawerItems.addEventListener('click', function (e) {
      const target = e.target;
      const itemId = target.dataset.id;
      const itemSize = target.dataset.size;

      if (!itemId) return;

      const itemIdx = cart.findIndex(item => item.id === itemId && item.size === itemSize);

      if (itemIdx === -1) return;

      if (target.classList.contains('qty-plus')) {
        cart[itemIdx].qty += 1;
        updateCartUI();
      } else if (target.classList.contains('qty-minus')) {
        if (cart[itemIdx].qty > 1) {
          cart[itemIdx].qty -= 1;
        } else {
          cart.splice(itemIdx, 1);
          showToast("Item removed from cart", "info");
        }
        updateCartUI();
      } else if (target.closest('.cart-item-remove')) {
        cart.splice(itemIdx, 1);
        showToast("Item removed from cart", "info");
        updateCartUI();
      }
    });
  }

  // Add To Cart Event (on product cards and modal)
  document.addEventListener('click', function (e) {
    const addBtn = e.target.closest('.btn-product-add');
    if (addBtn) {
      const prodId = addBtn.dataset.id;
      const product = products[prodId];
      if (!product) return;

      // Check if size selection exists
      let selectedSize = "M"; // default fallback
      let selectedColor = "Sage Green"; // default fallback

      // If added from modal
      const modal = document.getElementById('quickViewModal');
      if (modal && modal.classList.contains('show')) {
        const sizeActive = modal.querySelector('.qv-size-box.active');
        if (sizeActive) selectedSize = sizeActive.textContent;
        // Close modal after adding
        const bootstrapModal = bootstrap.Modal.getInstance(modal);
        if (bootstrapModal) bootstrapModal.hide();
      }

      // Check if already in cart with same size
      const existingIdx = cart.findIndex(item => item.id === prodId && item.size === selectedSize);
      if (existingIdx !== -1) {
        cart[existingIdx].qty += 1;
      } else {
        cart.push({
          id: prodId,
          title: product.title,
          price: product.price,
          image: product.image,
          size: selectedSize,
          color: selectedColor,
          qty: 1
        });
      }

      updateCartUI();
      showToast("Added to shopping cart", "success");

      // Open Cart offcanvas drawer automatically to show addition
      const cartOffcanvasEl = document.getElementById('cartDrawer');
      if (cartOffcanvasEl) {
        const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(cartOffcanvasEl);
        if (bsOffcanvas) bsOffcanvas.show();
      }
    }
  });

  // ==========================================
  // 5. COUNTDOWN TIMER (Limited Time Offer)
  // ==========================================
  // Set date to always be 3 days in the future to keep countdown active
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);

  function updateCountdown() {
    const now = new Date().getTime();
    const difference = targetDate - now;

    if (difference < 0) {
      clearInterval(countdownInterval);
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    const dEl = document.getElementById('cd-days');
    const hEl = document.getElementById('cd-hours');
    const mEl = document.getElementById('cd-minutes');
    const sEl = document.getElementById('cd-seconds');

    if (dEl) dEl.textContent = String(days).padStart(2, '0');
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(minutes).padStart(2, '0');
    if (sEl) sEl.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  const countdownInterval = setInterval(updateCountdown, 1000);

  // ==========================================
  // 6. QUICK VIEW MODAL LOADING
  // ==========================================
  const qvModal = document.getElementById('quickViewModal');
  if (qvModal) {
    qvModal.addEventListener('show.bs.modal', function (e) {
      const triggerBtn = e.relatedTarget;
      const prodId = triggerBtn.dataset.id;
      const product = products[prodId];

      if (!product) return;

      // Update Modal content dynamically
      qvModal.querySelector('.qv-img').src = product.image;
      qvModal.querySelector('.qv-img').alt = product.title;
      qvModal.querySelector('.qv-title').textContent = product.title;
      qvModal.querySelector('.price-current').textContent = `₹${product.price.toLocaleString('en-IN')}`;
      qvModal.querySelector('.price-old').textContent = `₹${product.oldPrice.toLocaleString('en-IN')}`;
      qvModal.querySelector('.discount-percentage').textContent = product.discount;
      qvModal.querySelector('.rating-stars').innerHTML = getStarRatingHTML(product.rating);
      qvModal.querySelector('.rating-text').textContent = `(${product.ratingCount} reviews)`;
      qvModal.querySelector('.qv-desc').textContent = product.desc;

      // Render sizes in modal
      const sizesContainer = qvModal.querySelector('.qv-sizes-row');
      sizesContainer.innerHTML = product.sizes.map((size, idx) => `
        <div class="qv-size-box ${idx === 1 ? 'active' : ''}">${size}</div>
      `).join('');

      // Add ID to checkout button
      qvModal.querySelector('.btn-product-add').dataset.id = product.id;

      // Qty reset
      qvModal.querySelector('.qv-qty-val').value = "1";
    });
  }

  // Size selections clicking in modal
  document.addEventListener('click', function (e) {
    const sizeBox = e.target.closest('.qv-size-box');
    if (sizeBox) {
      const siblings = sizeBox.parentElement.querySelectorAll('.qv-size-box');
      siblings.forEach(box => box.classList.remove('active'));
      sizeBox.classList.add('active');
    }
  });

  // Modal Qty adjustment
  document.addEventListener('click', function (e) {
    const qtyBtn = e.target.closest('.qv-qty-btn');
    if (qtyBtn) {
      const input = qtyBtn.parentElement.querySelector('.qv-qty-val');
      let val = parseInt(input.value) || 1;
      if (qtyBtn.classList.contains('qv-qty-plus')) {
        val++;
      } else if (qtyBtn.classList.contains('qv-qty-minus') && val > 1) {
        val--;
      }
      input.value = val;
    }
  });

  function getStarRatingHTML(rating) {
    let html = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    for (let i = 0; i < fullStars; i++) {
      html += '<i class="fa-solid fa-star"></i>';
    }
    if (halfStar) {
      html += '<i class="fa-solid fa-star-half-stroke"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
      html += '<i class="fa-regular fa-star"></i>';
    }
    return html;
  }

  // ==========================================
  // 7. TOAST NOTIFICATION UTILITY
  // ==========================================
  function showToast(message, type = "success") {
    // Create toast container if not exists
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container position-fixed bottom-0 start-0 p-4';
      toastContainer.style.zIndex = '3000';
      document.body.appendChild(toastContainer);
    }

    const toastId = 'toast-' + Date.now();
    const bgClass = type === "success" ? "bg-white text-dark" : "bg-dark text-white";
    const icon = type === "success" 
      ? '<i class="fa-solid fa-circle-check text-success me-2"></i>' 
      : '<i class="fa-solid fa-circle-info text-info me-2"></i>';

    const toastHTML = `
      <div id="${toastId}" class="toast align-items-center ${bgClass} border-0 shadow-lg p-2" role="alert" aria-live="assertive" aria-atomic="true" style="border-radius: var(--border-radius-sm)">
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center">
            ${icon}
            <span class="fw-semibold small">${message}</span>
          </div>
          <button type="button" class="btn-close me-2 m-auto ${type === "info" ? "btn-close-white" : ""}" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    const toastEl = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
    bsToast.show();

    // Remove from DOM on hidden
    toastEl.addEventListener('hidden.bs.toast', function () {
      toastEl.remove();
    });
  }

  // ==========================================
  // 8. OWL CAROUSEL INITIALIZATIONS
  // ==========================================

  // Hero Slider — full-width, 100vh, edge-to-edge
  if ($('.hero-slider').length) {
    const $heroSlider = $('.hero-slider').owlCarousel({
      items: 1,
      loop: true,
      autoplay: true,
      autoplayTimeout: 5500,
      autoplayHoverPause: true,
      nav: false,           // using custom .hero-prev / .hero-next buttons
      dots: true,
      smartSpeed: 700,
      mouseDrag: true,
      touchDrag: true,
      pullDrag: true,
      freeDrag: false,
      lazyLoad: true,
      video: false
    });

    // Wire up custom prev / next buttons
    const $prevBtn = document.querySelector('.hero-prev');
    const $nextBtn = document.querySelector('.hero-next');
    if ($prevBtn) {
      $prevBtn.addEventListener('click', () => $heroSlider.trigger('prev.owl.carousel', [600]));
    }
    if ($nextBtn) {
      $nextBtn.addEventListener('click', () => $heroSlider.trigger('next.owl.carousel', [600]));
    }

    // Keyboard navigation (left / right arrow keys)
    document.addEventListener('keydown', function (e) {
      // Only when no input is focused
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if (e.key === 'ArrowLeft')  $heroSlider.trigger('prev.owl.carousel', [600]);
      if (e.key === 'ArrowRight') $heroSlider.trigger('next.owl.carousel', [600]);
    });
  }

  // New Arrivals Slider
  if ($('.new-arrivals-slider').length) {
    $('.new-arrivals-slider').owlCarousel({
      loop: true,
      margin: 25,
      nav: true,
      dots: false,
      navText: [
        '<i class="fa-solid fa-chevron-left"></i>',
        '<i class="fa-solid fa-chevron-right"></i>'
      ],
      responsive: {
        0: {
          items: 1,
          stagePadding: 15,
          margin: 15
        },
        576: {
          items: 2
        },
        992: {
          items: 3
        },
        1200: {
          items: 4
        }
      }
    });
  }

  // Reviews Testimonial Slider
  if ($('.reviews-slider').length) {
    $('.reviews-slider').owlCarousel({
      loop: true,
      margin: 30,
      nav: false,
      dots: true,
      autoplay: true,
      autoplayTimeout: 5000,
      autoplayHoverPause: true,
      responsive: {
        0: {
          items: 1
        },
        768: {
          items: 2
        },
        1200: {
          items: 3
        }
      }
    });
  }

// ==========================================
  // 9. MOBILE NAVIGATION LOGIC — sliding multi-level panels
  // ==========================================
  // Hand-rolled open/close (no Bootstrap Collapse): Collapse drives its own
  // height-based show/hide lifecycle and only adds the class our slide-in
  // CSS keys off of *after* that finishes — a needless ~300ms+ dead zone
  // before the drawer visibly moves. A plain class toggle responds on the
  // very next frame instead.
  const navToggleBtn = document.getElementById('mobileNavToggle');
  const navDrawer = document.getElementById('mobileNavDrawer');
  const navPanelsWrap = navDrawer ? navDrawer.querySelector('.mobile-nav-panels') : null;

  if (navToggleBtn && navDrawer && navPanelsWrap) {
    const getPanel = (key) => navPanelsWrap.querySelector(`.mobile-nav-panel[data-panel="${key}"]`);
    const rootPanel = getPanel('root');
    if (rootPanel) rootPanel.setAttribute('data-active', 'true');

    // Submenu thumbnails use data-src so nothing fetches until their panel
    // is actually opened — the drawer never pays for 24 image requests
    // just to show the root "Home / Women / Baby / …" list.
    function hydratePanelImages(panel) {
      panel.querySelectorAll('img[data-src]').forEach((img) => {
        img.src = img.getAttribute('data-src');
        img.removeAttribute('data-src');
      });
    }

    function goToPanel(targetKey, direction) {
      const current = navPanelsWrap.querySelector('.mobile-nav-panel[data-active="true"]') || rootPanel;
      const target = getPanel(targetKey);
      if (!target || target === current) return;

      hydratePanelImages(target);

      target.style.transition = 'none';
      target.style.visibility = 'visible';
      target.style.transform = direction === 'forward' ? 'translateX(100%)' : 'translateX(-100%)';
      void target.offsetHeight; // force reflow before re-enabling transition
      target.style.transition = '';

      requestAnimationFrame(() => {
        target.style.transform = 'translateX(0)';
        current.style.transform = direction === 'forward' ? 'translateX(-100%)' : 'translateX(100%)';
      });

      current.removeAttribute('data-active');
      target.setAttribute('data-active', 'true');
      target.scrollTop = 0;

      current.addEventListener('transitionend', function onEnd(e) {
        if (e.target !== current) return;
        current.style.visibility = 'hidden';
        current.removeEventListener('transitionend', onEnd);
      });
    }

    navPanelsWrap.querySelectorAll('[data-open-panel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-open-panel');
        goToPanel(key, key === 'root' ? 'back' : 'forward');
      });
    });

    function resetToRootPanel() {
      navPanelsWrap.querySelectorAll('.mobile-nav-panel').forEach((panel) => {
        const isRoot = panel.dataset.panel === 'root';
        panel.removeAttribute('data-active');
        panel.style.transition = 'none';
        panel.style.visibility = isRoot ? 'visible' : 'hidden';
        panel.style.transform = isRoot ? 'translateX(0)' : 'translateX(100%)';
        void panel.offsetHeight;
        panel.style.transition = '';
      });
      if (rootPanel) rootPanel.setAttribute('data-active', 'true');
    }

    // ---- Background scroll lock ----
    // position:fixed pins the page at its exact current scroll offset (the
    // one reliable cross-browser way to stop touch-scroll / rubber-banding
    // from reaching content behind a fixed overlay on mobile Safari/Chrome).
    let lockedScrollY = 0;

    function lockBodyScroll() {
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.documentElement.classList.add('nav-drawer-open');
      document.body.classList.add('nav-drawer-open');
    }

    function unlockBodyScroll() {
      document.documentElement.classList.remove('nav-drawer-open');
      document.body.classList.remove('nav-drawer-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, lockedScrollY); // exact same spot, no jump to top
    }

    function openDrawer() {
      lockBodyScroll();          // synchronous, no layout wait before the next line
      navDrawer.classList.add('show'); // starts the transform transition on the next frame
      navToggleBtn.setAttribute('aria-expanded', 'true');
    }

    function closeDrawer() {
      navDrawer.classList.remove('show');
      navToggleBtn.setAttribute('aria-expanded', 'false');
      unlockBodyScroll();
    }

    navToggleBtn.addEventListener('click', openDrawer);
    navDrawer.querySelectorAll('.mobile-nav-close').forEach((btn) => {
      btn.addEventListener('click', closeDrawer);
    });

    // Reset to the root panel only once the close animation actually finishes,
    // so panels don't visibly snap back while still sliding off-screen.
    navDrawer.addEventListener('transitionend', (e) => {
      if (e.target !== navDrawer || e.propertyName !== 'transform') return;
      if (!navDrawer.classList.contains('show')) resetToRootPanel();
    });
  }

  // Shop by Category Slider
  if ($('.category-carousel').length) {
    $('.category-carousel').owlCarousel({
      loop: true,
      margin: 20,
      nav: true,
      dots: false,
      autoplay: false,
      smartSpeed: 600,
      mouseDrag: true,
      touchDrag: true,
      pullDrag: true,
      navText: [
        '<i class="fa-solid fa-chevron-left"></i>',
        '<i class="fa-solid fa-chevron-right"></i>'
      ],
      stagePadding: 30,
      responsive: {
        0: {
          items: 2,
          margin: 12,
          stagePadding: 10
        },
        576: {
          items: 3,
          margin: 16,
          stagePadding: 15
        },
        768: {
          items: 4,
          margin: 20,
          stagePadding: 20
        },
        992: {
          items: 5,
          margin: 20,
          stagePadding: 25
        },
        1200: {
          items: 6,
          margin: 20,
          stagePadding: 30
        }
      }
    });
  }

});
