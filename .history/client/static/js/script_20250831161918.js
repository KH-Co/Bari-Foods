import { catalog } from "../../assets/data/catalog.mjs";

const viewport = document.getElementById("popViewport");
const track = document.getElementById("popTrack");
const prevBtn = document.getElementById("popPrev");
const nextBtn = document.getElementById("popNext");

// Cart storage helpers
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

  // Update cart badge with animation
  const badge = document.getElementById("cartCount");
  if (badge) {
    const newCount = Object.values(items).reduce((s, q) => s + q, 0);
    badge.textContent = newCount;

    // Add success feedback animation
    badge.style.transform = "scale(1.3)";
    badge.style.color = "#e9b540";
    setTimeout(() => {
      badge.style.transform = "scale(1)";
      badge.style.color = "";
    }, 200);
  }

  // Show toast notification
  showAddToCartToast();
}

function showAddToCartToast() {
  // Create toast element
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

  // Animate in
  setTimeout(() => {
    toastElement.style.transform = 'translateX(0)';
  }, 10);

  // Animate out and remove
  setTimeout(() => {
    toastElement.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2500);
}

// Choose popular by rating desc; keep only items with rating defined
const popular = [...catalog]
  .filter((p) => typeof p.rating === "number" && p.rating > 0)
  .sort((a, b) => (b.rating || 0) - (a.rating || 0));

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
  track.innerHTML = popular.map(cardHTML).join("");
  wireEvents();
  layout();

  // Add intersection observer for animations
  addScrollAnimations();
}

function wireEvents() {
  // Add to Cart with improved UX
  track.addEventListener("click", (e) => {
    const btn = e.target.closest(".home-add-btn");
    if (!btn) return;

    // Prevent double clicks
    if (btn.disabled) return;
    btn.disabled = true;

    // Button loading state
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    btn.style.opacity = '0.7';

    // Simulate API delay for better UX
    setTimeout(() => {
      addToCart(btn.dataset.id, 1);

      // Reset button
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

  // Carousel controls with smooth navigation
  prevBtn.addEventListener("click", () => {
    if (!isAnimating) slide(-1);
  });

  nextBtn.addEventListener("click", () => {
    if (!isAnimating) slide(1);
  });

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.target.closest('.pop-carousel')) {
      if (e.key === "ArrowLeft" && !isAnimating) slide(-1);
      if (e.key === "ArrowRight" && !isAnimating) slide(1);
    }
  });

  // Touch/Swipe support
  let startX = 0;
  let isDragging = false;

  track.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
  });

  track.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
  });

  track.addEventListener("touchend", (e) => {
    if (!isDragging || isAnimating) return;

    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) slide(1);
      else slide(-1);
    }

    isDragging = false;
  });

  // Resize handler with debounce
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(layout, 150);
  });
}

let page = 0;
let pages = 1;
let perPage = 3;
let slideW = 0;
let isAnimating = false;


function layout() {
  const total = popular.length;

  // Responsive slides per page
  const vpWidth = viewport.clientWidth;
  if (vpWidth < 640) perPage = 1;
  else if (vpWidth < 1024) perPage = 2;
  else perPage = 3;

  pages = Math.max(1, Math.ceil(total / perPage));

  const gap = vpWidth < 640 ? 12 : 18;
  slideW = Math.floor((vpWidth - gap * (perPage - 1)) / perPage);

  // Apply widths and gaps with smooth transitions
  const slides = track.querySelectorAll(".pop-slide");
  slides.forEach((s, i) => {
    s.style.minWidth = slideW + "px";
    s.style.maxWidth = slideW + "px";
    s.style.marginRight = (i + 1) % perPage !== 0 ? gap + "px" : "0px";
  });

  // Update navigation visibility
  const needsNav = total > perPage;
  prevBtn.hidden = !needsNav;
  nextBtn.hidden = !needsNav;

  // Update button states
  updateNavButtons();

  // Clamp page and apply transform
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

  // Add smooth animation class
  track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';

  applyTransform();
  updateNavButtons();

  // Reset animation lock
  setTimeout(() => {
    isAnimating = false;
  }, 400);
}

function addScrollAnimations() {
  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Observe product cards
  document.querySelectorAll('.home-product-card').forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
    observer.observe(card);
  });
}

render();