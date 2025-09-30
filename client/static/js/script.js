// ==================== CART MANAGEMENT ====================
function loadCartLS() {
  try {
    return JSON.parse(localStorage.getItem("cartItems")) || {};
  } catch {
    return {};
  }
}

function saveCartLS(o) {
  localStorage.setItem("cartItems", JSON.stringify(o));
}

function addToCart(id, qty = 1) {
  const items = loadCartLS();
  items[id] = (items[id] || 0) + qty;
  saveCartLS(items);

  const badge = document.getElementById("cartCount");
  if (badge) {
    const newCount = Object.values(items).reduce((s, q) => s + q, 0);
    badge.textContent = newCount;
    badge.style.transform = "scale(1.3)";
    badge.style.color = "#e9b540";
    setTimeout(() => {
      badge.style.transform = "scale(1)";
      badge.style.color = "";
    }, 200);
  }

  showAddToCartToast();
}

function showAddToCartToast() {
  const toast = document.createElement('div');
  toast.innerHTML = `
    <div style="
      position: fixed;
      top: 100px;
      right: 20px;
      background: linear-gradient(135deg, #e9b540 0%, #f7d2c4 100%);
      color: #2d1810;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      font-weight: 600;
      font-size: 14px;
      z-index: 10000;
      transform: translateX(100%);
      transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-primary, 'Poppins', sans-serif);
    ">
      <i class="fas fa-check-circle" style="color: #2d1810;"></i>
      Added to cart successfully!
    </div>
  `;

  document.body.appendChild(toast);
  const toastElement = toast.firstElementChild;

  setTimeout(() => {
    toastElement.style.transform = 'translateX(0)';
  }, 10);

  setTimeout(() => {
    toastElement.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2500);
}

function initCartCount() {
  const cartItems = loadCartLS();
  const totalCount = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  const badge = document.getElementById("cartCount");
  if (badge) {
    badge.textContent = totalCount;
  }
}

// ==================== POPULAR PRODUCTS CAROUSEL ====================
const viewport = document.getElementById("popViewport");
const track = document.getElementById("popTrack");
const prevBtn = document.getElementById("popPrev");
const nextBtn = document.getElementById("popNext");

let popular = [];
let eventsBound = false;
let page = 0;
let pages = 1;
let perPage = 3;
let slideW = 0;
let isAnimating = false;

async function fetchPopular() {
  const API_URL = "http://127.0.0.1:8000/api/featured-products/";
  if (track) track.innerHTML = `<div class="pop-loading" style="padding:20px;">Loading popular items…</div>`;

  try {
    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    const token = userData?.token || userData?.access || null;
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(API_URL, { method: "GET", headers });
    if (!res.ok) throw new Error(`API returned ${res.status}`);

    const json = await res.json();
    const items = json.results || json.products || json.data || json || [];

    const normalized = items.map(item => {
      const p = item.product || {};
      const name = p.name || p.title || "Unnamed product";
      const images = p.image || "/assets/img/placeholder.png";
      const price = Number(p.price ?? 0);
      const rating = Number(p.rating ?? null);
      const weight = p.weight || "";
      const description = p.description || "";

      return {
        id: p.id ?? item.id ?? name,
        name,
        images,
        price,
        rating,
        weight,
        description,
        _raw: item
      };
    });

    const withRating = normalized.filter(x => typeof x.rating === "number" && x.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    popular = withRating.length ? withRating : normalized.slice(0, 12);

    render();
  } catch (err) {
    console.error("Failed to fetch popular products:", err);
    if (track) {
      track.innerHTML = `<div class="pop-error" style="padding:20px;color:#831500;">Unable to load popular products. Try again later.</div>`;
    }
  }
}

function cardHTML(p) {
  const img = (p.images && p.images) || "/assets/img/placeholder.png";
  const rating = p.rating ? '★'.repeat(Math.floor(p.rating)) : '';

  return `
    <div class="pop-slide"> 
      <div class="home-product-card" data-product-id="${p.id}"> 
        <div class="home-prod-img">
          <img src="${img}" alt="${p.name}" loading="lazy">
        </div> 
        <div class="home-prod-details"> 
          <div class="home-prod-title">${p.name}</div> 
          <div class="home-prod-desc">${p.weight || p.description || ""}</div>
          ${rating ? `<div class="home-prod-rating" style="color: #e9b540; font-size: 14px; margin: 8px 0;">${rating}</div>` : ''}
          <div class="home-prod-meta"> 
            <div class="home-prod-price">₹${(+p.price).toFixed(2)}</div> 
            <button class="home-add-btn" data-id="${p.id}" type="button">
              <i class="fas fa-cart-plus" style="font-size: 12px;"></i>
              Add to Cart
            </button> 
          </div> 
        </div> 
      </div> 
    </div>
  `;
}

function render() {
  if (!track) return;
  track.innerHTML = popular.map(cardHTML).join("");
  wireEvents();
  layout();
  addScrollAnimations();
}

function wireEvents() {
  if (eventsBound || !track) return;
  eventsBound = true;

  track.addEventListener("click", (e) => {
    const btn = e.target.closest(".home-add-btn");
    if (!btn) return;

    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!userData.loggedIn) {
      if (window.authModalInstance) {
        window.authModalInstance.show();
        window.authModalInstance.showLoginMessage('Please sign in to add items to your cart');
        return;
      }
    }

    if (btn.disabled) return;
    btn.disabled = true;

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    btn.style.opacity = '0.7';

    setTimeout(() => {
      addToCart(btn.dataset.id, 1);
      btn.innerHTML = '<i class="fas fa-check"></i> Added!';
      btn.style.background = 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)';

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.style.opacity = '';
        btn.disabled = false;
      }, 1000);
    }, 300);
  });

  prevBtn?.addEventListener("click", () => !isAnimating && slide(-1));
  nextBtn?.addEventListener("click", () => !isAnimating && slide(1));

  document.addEventListener("keydown", (e) => {
    if (e.target.closest('.pop-carousel')) {
      if (e.key === "ArrowLeft" && !isAnimating) slide(-1);
      if (e.key === "ArrowRight" && !isAnimating) slide(1);
    }
  });

  let startX = 0;
  let isDragging = false;
  track.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; isDragging = true; });
  track.addEventListener("touchmove", (e) => isDragging && e.preventDefault());
  track.addEventListener("touchend", (e) => {
    if (!isDragging || isAnimating) return;
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) slide(1); else slide(-1);
    }
    isDragging = false;
  });

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(layout, 150);
  });
}

function layout() {
  if (!viewport || !track) return;
  const total = popular.length;
  const vpWidth = viewport.clientWidth;

  if (vpWidth < 640) perPage = 1;
  else if (vpWidth < 1024) perPage = 2;
  else perPage = 3;

  pages = Math.max(1, Math.ceil(total / perPage));
  const gap = vpWidth < 640 ? 12 : 18;
  slideW = Math.floor((vpWidth - gap * (perPage - 1)) / perPage);

  const slides = track.querySelectorAll(".pop-slide");
  slides.forEach((s, i) => {
    s.style.minWidth = slideW + "px";
    s.style.maxWidth = slideW + "px";
    s.style.marginRight = (i + 1) % perPage !== 0 ? gap + "px" : "0px";
  });

  const needsNav = total > perPage;
  if (prevBtn) prevBtn.hidden = !needsNav;
  if (nextBtn) nextBtn.hidden = !needsNav;

  updateNavButtons();
  page = Math.min(page, pages - 1);
  applyTransform();
}

function updateNavButtons() {
  if (prevBtn && nextBtn) {
    prevBtn.style.opacity = page === 0 ? "0.5" : "1";
    nextBtn.style.opacity = page === pages - 1 ? "0.5" : "1";
    prevBtn.style.cursor = page === 0 ? "not-allowed" : "pointer";
    nextBtn.style.cursor = page === pages - 1 ? "not-allowed" : "pointer";
  }
}

function applyTransform() {
  if (!viewport || !track) return;
  const gap = viewport.clientWidth < 640 ? 12 : 18;
  const x = -page * (slideW * perPage + gap * (perPage - 1));
  track.style.transform = `translateX(${x}px)`;
}

function slide(dir) {
  if (isAnimating) return;
  const newPage = page + dir;
  if (newPage < 0 || newPage >= pages) return;

  isAnimating = true;
  page = newPage;

  if (track) {
    track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  }

  applyTransform();
  updateNavButtons();

  setTimeout(() => { isAnimating = false; }, 400);
}

function addScrollAnimations() {
  const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  document.querySelectorAll('.home-product-card').forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
  });
}

// ==================== TESTIMONIALS CONTROLLER ====================
(function TestimonialsController() {
  let currentIndex = 0;
  let autoPlayInterval = null;
  let isAnimating = false;
  let touchStartX = 0;
  let touchEndX = 0;

  const testimonials = [
    {
      name: "Priya Sharma",
      location: "Jaipur, Rajasthan",
      rating: 5,
      text: "The authentic taste reminds me of my grandmother's kitchen. Bari Foods truly captures the essence of traditional Rajasthani flavors!",
      avatar: "PS"
    },
    {
      name: "Rajesh Kumar",
      location: "Delhi",
      rating: 5,
      text: "Outstanding quality and packaging! Every order arrives fresh and perfectly seasoned. My family's favorite snack brand now.",
      avatar: "RK"
    },
    {
      name: "Anjali Mehta",
      location: "Mumbai, Maharashtra",
      rating: 5,
      text: "A perfect blend of tradition and taste! The snacks are always crispy, and the delivery is impressively fast. Highly recommended!",
      avatar: "AM"
    },
    {
      name: "Vikram Singh",
      location: "Udaipur, Rajasthan",
      rating: 5,
      text: "Been ordering for 2 years now. Consistency in quality is remarkable. Perfect for gifting to relatives abroad!",
      avatar: "VS"
    },
    {
      name: "Meera Patel",
      location: "Ahmedabad, Gujarat",
      rating: 5,
      text: "My go-to snack for office breaks. The spice level is just perfect and the packaging keeps them fresh for weeks!",
      avatar: "MP"
    },
    {
      name: "Arjun Reddy",
      location: "Bangalore, Karnataka",
      rating: 5,
      text: "Discovered this brand during Diwali. Now it's a staple in my pantry. Authentic flavors that transport you to Rajasthan!",
      avatar: "AR"
    }
  ];

  function init() {
    const container = document.querySelector('.testimonials-container');
    if (!container) return;

    enhanceTestimonialSection();
    renderTestimonials();
    addNavigationControls();
    addPaginationDots();
    setupAutoPlay();
    setupTouchGestures();
    setupKeyboardNavigation();
    setupIntersectionObserver();
    addHoverEffects();
  }

  function enhanceTestimonialSection() {
    const section = document.querySelector('.testimonials-section');
    if (!section) return;

    const decorativeElements = document.createElement('div');
    decorativeElements.className = 'testimonial-decorations';
    decorativeElements.innerHTML = `
      <div class="testimonial-blob blob-1"></div>
      <div class="testimonial-blob blob-2"></div>
      <div class="testimonial-pattern"></div>
    `;
    section.insertBefore(decorativeElements, section.firstChild);
  }

  function renderTestimonials() {
    const container = document.querySelector('.testimonials-container');
    if (!container) return;

    container.innerHTML = testimonials.map((testimonial, index) => `
      <div class="testimonial-card" data-index="${index}" style="opacity: 0; transform: translateY(30px);">
        <div class="quote-icon">
          <i class="fas fa-quote-left"></i>
        </div>
        <div class="testimonial-content">
          <div class="stars">
            ${generateStars(testimonial.rating)}
          </div>
          <p class="testimonial-text">"${testimonial.text}"</p>
          <div class="customer-info">
            <div class="customer-avatar" style="background: var(--logo-gradient);">
              <span style="color: var(--button-primary); font-weight: 700; font-size: 18px;">${testimonial.avatar}</span>
            </div>
            <div class="customer-details">
              <h4 class="customer-name">${testimonial.name}</h4>
              <p class="customer-location">
                <i class="fas fa-map-marker-alt" style="font-size: 12px; margin-right: 4px;"></i>
                ${testimonial.location}
              </p>
            </div>
          </div>
          <div class="verified-badge">
            <i class="fas fa-check-circle"></i>
            <span>Verified Purchase</span>
          </div>
        </div>
      </div>
    `).join('');

    animateCardsIn();
  }

  function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    let starsHTML = '';

    for (let i = 0; i < fullStars; i++) {
      starsHTML += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
      starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      starsHTML += '<i class="far fa-star"></i>';
    }

    return starsHTML;
  }

  function animateCardsIn() {
    const cards = document.querySelectorAll('.testimonial-card');
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 150);
    });
  }

  function addNavigationControls() {
    const section = document.querySelector('.testimonials-section');
    if (!section || window.innerWidth < 768) return;

    const navHTML = `
      <div class="testimonial-navigation">
        <button class="testimonial-nav testimonial-prev" aria-label="Previous testimonial">
          <i class="fas fa-chevron-left"></i>
        </button>
        <button class="testimonial-nav testimonial-next" aria-label="Next testimonial">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;

    const header = section.querySelector('.testimonials-header');
    header.insertAdjacentHTML('afterend', navHTML);

    document.querySelector('.testimonial-prev')?.addEventListener('click', () => navigateTestimonials(-1));
    document.querySelector('.testimonial-next')?.addEventListener('click', () => navigateTestimonials(1));
  }

  function addPaginationDots() {
    const section = document.querySelector('.testimonials-section');
    if (!section) return;

    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'testimonial-dots';

    const visibleCards = getVisibleCardsCount();
    const totalPages = Math.ceil(testimonials.length / visibleCards);

    for (let i = 0; i < totalPages; i++) {
      const dot = document.createElement('button');
      dot.className = 'testimonial-dot';
      dot.setAttribute('aria-label', `Go to testimonial page ${i + 1}`);
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToPage(i));
      dotsContainer.appendChild(dot);
    }

    section.appendChild(dotsContainer);
  }

  function getVisibleCardsCount() {
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }

  function navigateTestimonials(direction) {
    if (isAnimating) return;

    const cards = document.querySelectorAll('.testimonial-card');
    const visibleCount = getVisibleCardsCount();
    const maxIndex = Math.ceil(cards.length / visibleCount) - 1;

    currentIndex += direction;
    if (currentIndex < 0) currentIndex = maxIndex;
    if (currentIndex > maxIndex) currentIndex = 0;

    updateCardsDisplay();
    updateDots();
    resetAutoPlay();
  }

  function goToPage(pageIndex) {
    if (isAnimating) return;
    currentIndex = pageIndex;
    updateCardsDisplay();
    updateDots();
    resetAutoPlay();
  }

  function updateCardsDisplay() {
    const cards = document.querySelectorAll('.testimonial-card');
    const visibleCount = getVisibleCardsCount();
    const startIndex = currentIndex * visibleCount;

    isAnimating = true;

    cards.forEach((card, index) => {
      const isVisible = index >= startIndex && index < startIndex + visibleCount;

      if (isVisible) {
        card.style.display = 'block';
        card.style.animation = 'testimonialSlideIn 0.6s ease forwards';
      } else {
        setTimeout(() => {
          card.style.display = 'none';
        }, 300);
        card.style.animation = 'testimonialSlideOut 0.3s ease forwards';
      }
    });

    setTimeout(() => {
      isAnimating = false;
    }, 600);
  }

  function updateDots() {
    const dots = document.querySelectorAll('.testimonial-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === currentIndex);
    });
  }

  function setupAutoPlay() {
    autoPlayInterval = setInterval(() => {
      navigateTestimonials(1);
    }, 5000);

    const section = document.querySelector('.testimonials-section');
    if (section) {
      section.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
      section.addEventListener('mouseleave', () => {
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => navigateTestimonials(1), 5000);
      });
    }
  }

  function resetAutoPlay() {
    clearInterval(autoPlayInterval);
    autoPlayInterval = setInterval(() => {
      navigateTestimonials(1);
    }, 5000);
  }

  function setupTouchGestures() {
    const container = document.querySelector('.testimonials-container');
    if (!container) return;

    container.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        navigateTestimonials(1);
      } else {
        navigateTestimonials(-1);
      }
    }
  }

  function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      const section = document.querySelector('.testimonials-section');
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const isInView = rect.top < window.innerHeight && rect.bottom >= 0;

      if (isInView) {
        if (e.key === 'ArrowLeft') navigateTestimonials(-1);
        if (e.key === 'ArrowRight') navigateTestimonials(1);
      }
    });
  }

  function setupIntersectionObserver() {
    const cards = document.querySelectorAll('.testimonial-card');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          entry.target.style.animationPlayState = 'running';
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    cards.forEach(card => observer.observe(card));
  }

  function addHoverEffects() {
    const cards = document.querySelectorAll('.testimonial-card');

    cards.forEach(card => {
      card.addEventListener('mouseenter', function () {
        this.style.transform = 'translateY(-12px) scale(1.02)';

        const ripple = document.createElement('div');
        ripple.className = 'testimonial-ripple';
        this.appendChild(ripple);

        setTimeout(() => ripple.remove(), 600);
      });

      card.addEventListener('mouseleave', function () {
        this.style.transform = '';
      });
    });
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const dots = document.querySelector('.testimonial-dots');
      if (dots) {
        dots.remove();
        addPaginationDots();
      }
      updateCardsDisplay();
    }, 250);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('beforeunload', () => {
    clearInterval(autoPlayInterval);
  });
})();

// ==================== AUTHENTICATION MODAL ====================
function updateUIForUser(userData) {
  const userIcon = document.querySelector('.user-icon');
  const profileTrigger = document.getElementById('profileTrigger');
  if (userData && userData.loggedIn) {
    if (userIcon) {
      userIcon.style.color = '#e9b540';
      userIcon.title = `Welcome, ${userData.firstName || 'User'}!`;
    }
    if (profileTrigger) {
      profileTrigger.href = '../templates/profile.html';
      profileTrigger.onclick = null;
    }
  } else {
    if (userIcon) {
      userIcon.style.color = '';
      userIcon.title = 'Sign In';
    }
  }
}

class EnhancedAuthModal {
  init() {
    if (!document.getElementById('authModal')) {
      console.warn('Auth modal elements not found');
      return;
    }
    this.modal = document.getElementById('authModal');
    this.overlay = document.getElementById('authOverlay');
    this.closeBtn = document.getElementById('authClose');
    this.loginForm = document.getElementById('loginForm');
    this.signupForm = document.getElementById('signupForm');
    this.showLoginBtn = document.getElementById('showLogin');
    this.showSignupBtn = document.getElementById('showSignup');

    this.bindEvents();
    this.initPasswordToggles();
    this.initFormValidation();
    this.initProfileTrigger();
    this.checkLoginStatus();
  }

  initProfileTrigger() {
    const profileTrigger = document.getElementById('profileTrigger');
    if (profileTrigger) {
      profileTrigger.addEventListener('click', (e) => {
        const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (userData.loggedIn) {
          e.preventDefault();
          this.showProfileMenu(userData);
        } else {
          e.preventDefault();
          this.show();
        }
      });
    }
  }

  showProfileMenu(userData) {
    const existingMenu = document.getElementById('profileMenu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.id = 'profileMenu';
    menu.innerHTML = `
      <div style="position: fixed; top: 80px; right: 20px; background: linear-gradient(145deg, #ffffff 0%, #fefcf8 100%); border: 2px solid #e9b540; border-radius: 16px; padding: 20px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); z-index: 9998; min-width: 200px; font-family: var(--font-primary, 'Poppins', sans-serif);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(233, 181, 64, 0.2);">
          <i class="fas fa-user-circle" style="font-size: 24px; color: #e9b540;"></i>
          <div>
            <div style="font-weight: 600; color: #2d1810; font-size: 14px;">${userData.firstName || 'User'} ${userData.lastName || ''}</div>
            <div style="font-size: 12px; color: #a67c52; opacity: 0.8;">${userData.email || ''}</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="../templates/profile.html" style="color: #2d1810; text-decoration: none; padding: 8px 12px; border-radius: 8px; transition: background 0.2s ease; font-size: 14px; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='rgba(233, 181, 64, 0.1)'" onmouseout="this.style.background='transparent'"><i class="fas fa-user"></i> My Profile</a>
          <a href="../templates/orders.html" style="color: #2d1810; text-decoration: none; padding: 8px 12px; border-radius: 8px; transition: background 0.2s ease; font-size: 14px; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='rgba(233, 181, 64, 0.1)'" onmouseout="this.style.background='transparent'"><i class="fas fa-shopping-bag"></i> My Orders</a>
          <button onclick="window.authModalInstance.logout()" style="background: none; border: none; color: #831500; padding: 8px 12px; border-radius: 8px; transition: background 0.2s ease; font-size: 14px; cursor: pointer; width: 100%; text-align: left; display: flex; align-items: center; gap: 8px; font-family: inherit;" onmouseover="this.style.background='rgba(131, 21, 0, 0.1)'" onmouseout="this.style.background='transparent'"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
        </div>
      </div>`;
    document.body.appendChild(menu);

    const closeMenu = (e) => {
      if (!menu.contains(e.target) && !e.target.closest('#profileTrigger')) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 100);
  }

  logout() {
    sessionStorage.removeItem('user');
    updateUIForUser(null);
    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu) profileMenu.remove();
    this.showLogoutToast();
  }

  showLogoutToast() {
    const toast = document.createElement('div');
    toast.innerHTML = `<div style="position: fixed; top: 100px; right: 20px; background: linear-gradient(135deg, #e9b540 0%, #f7d2c4 100%); color: #2d1810; padding: 16px 24px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); font-weight: 600; font-size: 14px; z-index: 10000; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); display: flex; align-items: center; gap: 8px; font-family: var(--font-primary, 'Poppins', sans-serif);"><i class="fas fa-sign-out-alt" style="color: #2d1810;"></i> Successfully signed out</div>`;
    document.body.appendChild(toast);
    const toastElement = toast.firstElementChild;
    setTimeout(() => { toastElement.style.transform = 'translateX(0)'; }, 10);
    setTimeout(() => {
      toastElement.style.transform = 'translateX(100%)';
      setTimeout(() => { document.body.removeChild(toast); }, 300);
    }, 3000);
  }

  checkLoginStatus() {
    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    updateUIForUser(userData.loggedIn ? userData : null);
  }

  showLoginMessage(message) {
    const activeForm = document.querySelector('.auth-form.active .form');
    if (activeForm) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'info-message';
      messageDiv.style.cssText = `background: rgba(233, 181, 64, 0.1); color: #e9b540; padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; margin-bottom: 16px; border: 1px solid rgba(233, 181, 64, 0.2); text-align: center;`;
      messageDiv.textContent = message;
      activeForm.insertBefore(messageDiv, activeForm.firstChild);
      setTimeout(() => { if (messageDiv.parentNode) messageDiv.remove(); }, 5000);
    }
  }

  bindEvents() {
    this.closeBtn.addEventListener('click', () => this.hide());
    this.overlay.addEventListener('click', () => this.hide());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) this.hide();
    });
    this.showSignupBtn.addEventListener('click', () => this.switchToSignup());
    this.showLoginBtn.addEventListener('click', () => this.switchToLogin());
    document.getElementById('loginFormElement').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('signupFormElement').addEventListener('submit', (e) => this.handleSignup(e));
  }

  initPasswordToggles() {
    ['loginPasswordToggle', 'signupPasswordToggle', 'confirmPasswordToggle'].forEach(toggleId => {
      const toggle = document.getElementById(toggleId);
      if (toggle) {
        toggle.addEventListener('click', () => {
          const input = toggle.previousElementSibling;
          const icon = toggle.querySelector('i');
          if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
          } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
          }
        });
      }
    });
  }

  initFormValidation() {
    document.querySelectorAll('.form input').forEach(input => {
      input.addEventListener('blur', () => this.validateInput(input));
      input.addEventListener('input', () => this.clearError(input));
    });
    const confirmPassword = document.getElementById('confirmPassword');
    const signupPassword = document.getElementById('signupPassword');
    if (confirmPassword && signupPassword) {
      confirmPassword.addEventListener('input', () => this.validatePasswordMatch(signupPassword, confirmPassword));
    }
  }

  validatePasswordMatch(password, confirmPassword) {
    const wrapper = confirmPassword.closest('.input-wrapper');
    const existingError = wrapper.parentNode.querySelector('.error-message');
    if (existingError) existingError.remove();

    if (password.value !== confirmPassword.value && confirmPassword.value) {
      wrapper.classList.add('error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = 'Passwords do not match';
      wrapper.parentNode.appendChild(errorDiv);
      return false;
    } else {
      wrapper.classList.remove('error');
      return true;
    }
  }

  show() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const firstInput = this.modal.querySelector('.auth-form.active input');
      if (firstInput) firstInput.focus();
    }, 300);
  }

  hide() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    this.resetForms();
  }

  switchToSignup() {
    this.loginForm.classList.remove('active');
    this.signupForm.classList.add('active');
    this.resetForms();
    setTimeout(() => {
      const firstInput = this.signupForm.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  switchToLogin() {
    this.signupForm.classList.remove('active');
    this.loginForm.classList.add('active');
    this.resetForms();
    setTimeout(() => {
      const firstInput = this.loginForm.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  resetForms() {
    document.querySelectorAll('.form input').forEach(input => {
      input.value = '';
      this.clearError(input);
    });
    document.querySelectorAll('.form input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
    document.querySelectorAll('.auth-btn').forEach(btn => {
      btn.classList.remove('loading', 'success');
      btn.disabled = false;
      btn.style.background = '';
      const span = btn.querySelector('span');
      if (span) {
        if (btn.closest('#loginForm')) span.textContent = 'Sign In';
        else if (btn.closest('#signupForm')) span.textContent = 'Create Account';
      }
    });
    document.querySelectorAll('.success-message, .error-message, .info-message').forEach(msg => msg.remove());
  }

  clearError(input) {
    const wrapper = input.closest('.input-wrapper');
    if (!wrapper) return;
    const errorMessage = wrapper.parentNode.querySelector('.error-message');
    if (errorMessage) errorMessage.remove();
    wrapper.classList.remove('error');
  }

  validateInput(input) {
    const wrapper = input.closest('.input-wrapper');
    if (!wrapper) return true;
    this.clearError(input);

    let isValid = true;
    let errorMessage = '';

    if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    } else if (input.type === 'tel' && !/^[+]?[\d\s\-\(\)]{10,}$/.test(input.value)) {
      isValid = false;
      errorMessage = 'Please enter a valid phone number';
    } else if (input.id === 'signupPassword' && input.value.length < 8) {
      isValid = false;
      errorMessage = 'Password must be at least 8 characters';
    } else if (input.hasAttribute('required') && !input.value.trim()) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    if (!isValid) {
      wrapper.classList.add('error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = errorMessage;
      wrapper.parentNode.appendChild(errorDiv);
    }
    return isValid;
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const submitBtn = e.target.querySelector('.auth-btn');

    if (!this.validateForm('login')) return;
    this.setButtonLoading(submitBtn, 'Signing In...');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed. Invalid credentials.');
      }
      const userData = await response.json();
      this.setButtonSuccess(submitBtn, 'Welcome Back!');
      this.showSuccessMessage('Successfully signed in!');
      sessionStorage.setItem('user', JSON.stringify({ ...userData, loggedIn: true }));
      setTimeout(() => {
        this.hide();
        window.location.reload();
      }, 1500);
    } catch (error) {
      this.setButtonError(submitBtn, 'Sign In Failed');
      this.showErrorMessage(error.message);
    }
  }

  async handleSignup(e) {
    e.preventDefault();
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('phoneNumber').value;
    const password = document.getElementById('signupPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    const submitBtn = e.target.querySelector('.auth-btn');

    if (!this.validateForm('signup')) return;
    if (!agreeTerms) {
      this.showErrorMessage('Please agree to the Terms & Conditions');
      return;
    }
    this.setButtonLoading(submitBtn, 'Creating Account...');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, username: email, phone, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Account creation failed.');
      }
      this.setButtonSuccess(submitBtn, 'Account Created!');
      this.showSuccessMessage('Account created successfully! You can now sign in.');
      setTimeout(() => { this.switchToLogin(); }, 1500);
    } catch (error) {
      this.setButtonError(submitBtn, 'Signup Failed');
      this.showErrorMessage(error.message);
    }
  }

  validateForm(type) {
    let isValid = true;
    const form = type === 'login' ? this.loginForm : this.signupForm;
    form.querySelectorAll('input[required]').forEach(input => {
      if (!this.validateInput(input)) isValid = false;
    });

    if (type === 'signup') {
      const password = document.getElementById('signupPassword');
      const confirmPassword = document.getElementById('confirmPassword');
      if (!this.validatePasswordMatch(password, confirmPassword)) isValid = false;
    }
    return isValid;
  }

  setButtonLoading(btn, text) {
    btn.classList.add('loading');
    btn.disabled = true;
    const span = btn.querySelector('span');
    if (span) span.textContent = text;
  }

  setButtonSuccess(btn, text) {
    btn.classList.remove('loading');
    btn.classList.add('success');
    const span = btn.querySelector('span');
    if (span) span.textContent = text;
  }

  setButtonError(btn, text) {
    btn.classList.remove('loading');
    btn.disabled = false;
    btn.style.background = 'rgba(231, 76, 60, 0.9)';
    const span = btn.querySelector('span');
    if (span) span.textContent = text;

    setTimeout(() => {
      btn.style.background = '';
      btn.disabled = false;
      if (span) span.textContent = btn.closest('#loginForm') ? 'Sign In' : 'Create Account';
    }, 3000);
  }

  showSuccessMessage(message) {
    document.querySelectorAll('.success-message, .error-message, .info-message').forEach(msg => msg.remove());
    const activeForm = document.querySelector('.auth-form.active .form');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    activeForm.insertBefore(successDiv, activeForm.firstChild);
  }

  showErrorMessage(message) {
    document.querySelectorAll('.success-message, .error-message, .info-message').forEach(msg => msg.remove());
    const activeForm = document.querySelector('.auth-form.active .form');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `background: rgba(231, 76, 60, 0.1); color: #e74c3c; padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; margin-bottom: 16px; border: 1px solid rgba(231, 76, 60, 0.2);`;
    errorDiv.textContent = message;
    activeForm.insertBefore(errorDiv, activeForm.firstChild);
  }
}

// ==================== NAVBAR SCROLL EFFECT ====================
function initNavbarScrollEffect() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    });
  }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  initCartCount();
  const authModalInstance = new EnhancedAuthModal();
  authModalInstance.init();
  window.authModalInstance = authModalInstance;
  initNavbarScrollEffect();
  fetchPopular();
});