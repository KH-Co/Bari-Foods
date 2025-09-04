import { catalog } from "../../assets/data/catalog.mjs";

const viewport = document.getElementById("popViewport");
const track = document.getElementById("popTrack");
const prevBtn = document.getElementById("popPrev");
const nextBtn = document.getElementById("popNext");

// Cart storage helpers

const state = {
  products: [],
  favorites: new Set(JSON.parse(localStorage.getItem("favorites") || "[]")),
};

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

// **UPDATED** - This function now calls your Django API
async function addToCart(id, qty = 1) {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/cart/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_id: id, quantity: qty }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to add item to cart.');
    }

    // You can remove localStorage logic if you are only using the API
    // but we'll keep it for now for the toast notification
    const items = loadCartLS();
    items[id] = (items[id] || 0) + qty;
    saveCartLS(items);

    showAddToCartToast();
    
    return true; // Return a success status
  } catch (error) {
    console.error("Error adding to cart:", error);
    showErrorToast(error.message);
    return false; // Return a failure status
  }
}

function showAddToCartToast() {
  const toast = document.createElement('div');
  toast.innerHTML = `
    <div style="
      position: fixed; top: 100px; right: 20px;
      background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
      color: white; padding: 16px 24px; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      font-weight: 600; font-size: 14px; z-index: 10000;
      transform: translateX(100%); transition: transform 0.3s ease-out;
      display: flex; align-items: center; gap: 8px;
    ">
      <i class="fas fa-check-circle"></i>
      Added to cart successfully!
    </div>
  `;
  document.body.appendChild(toast);
  const toastElement = toast.firstElementChild;
  setTimeout(() => { toastElement.style.transform = 'translateX(0)'; }, 10);
  setTimeout(() => { document.body.removeChild(toast); }, 2500);
}

function showErrorToast(message) {
  const toast = document.createElement('div');
  toast.innerHTML = `
    <div style="
      position: fixed; top: 100px; right: 20px;
      background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
      color: white; padding: 16px 24px; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      font-weight: 600; font-size: 14px; z-index: 10000;
      transform: translateX(100%); transition: transform 0.3s ease-out;
      display: flex; align-items: center; gap: 8px;
    ">
      <i class="fas fa-times-circle"></i>
      ${message}
    </div>
  `;
  document.body.appendChild(toast);
  const toastElement = toast.firstElementChild;
  setTimeout(() => { toastElement.style.transform = 'translateX(0)'; }, 10);
  setTimeout(() => { document.body.removeChild(toast); }, 2500);
}

// **UPDATED** - This function now creates the HTML from API data
function createProductCardHTML(p) {
  const imageUrl = p.image ? `http://127.0.0.1:8000${p.image}` : "../assets/img/placeholder.png";
  const ratingHTML = p.rating ? '★'.repeat(Math.round(p.rating)) : '';
  const price = parseFloat(p.price).toFixed(2);

  return `
    <div class="pop-slide">
      <div class="home-product-card" data-product-id="${p.id}">
        <div class="home-prod-img">
          <img src="${imageUrl}" alt="${p.name}" loading="lazy">
        </div>
        <div class="home-prod-details">
          <div class="home-prod-title">${p.name}</div>
          <div class="home-prod-desc">${p.weight || p.description || ""}</div>
          ${ratingHTML ? `<div class="home-prod-rating" style="color: #e9b540; font-size: 14px; margin: 8px 0;">${ratingHTML}</div>` : ''}
          <div class="home-prod-meta">
            <div class="home-prod-price">₹${price}</div>
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

// **NEW** - The main function to fetch and render
async function fetchAndRenderProducts() {
  const popTrack = document.getElementById("popTrack");
  if (!popTrack) return;

  try {
    const response = await fetch('http://127.0.0.1:8000/api/products/');
    if (!response.ok) throw new Error('Network response was not ok');
    
    state.products = await response.json();
    
    // Check for rating and sort products
    const popularProducts = [...state.products]
      .filter((p) => typeof p.rating === "number" && p.rating > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    popTrack.innerHTML = popularProducts.slice(0, 6).map(createProductCardHTML).join("");
    
    // Now that products are rendered, run the layout and animations
    renderCarousel();
    addScrollAnimations();
    wireEvents();

  } catch (error) {
    console.error("Error fetching products:", error);
    popTrack.innerHTML = `<p style="text-align:center; color: red;">Failed to load products. Please check the backend server.</p>`;
  }
}

// **UPDATED** - Renamed the render function to be more specific to the carousel
function renderCarousel() {
    // This is the main rendering logic for the carousel.
    // It should be called after products are fetched.
    layout();
    updateNavButtons();
}

// All carousel-related functions (layout, slide, etc.) are below and unchanged
// They now operate on the dynamically created HTML
// It is assumed the HTML for the carousel is present in the index.html file


let page = 0;
let pages = 1;
let perPage = 3;
let slideW = 0;
let isAnimating = false;

function layout() {
  // Check if track and viewport exist before continuing
  if (!track || !viewport) return;

  const total = state.products.length;
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
  
  if (track) track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  
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

function wireEvents() {
  const homeAddBtns = track.querySelectorAll(".home-add-btn");
  homeAddBtns.forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      const productId = btn.dataset.id;
      if (!productId) return;
      
      const originalText = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      btn.disabled = true;

      const success = await addToCart(productId, 1);
      
      if (success) {
        btn.innerHTML = '<i class="fas fa-check"></i> Added!';
      } else {
        btn.innerHTML = originalText;
      }

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }, 1500);
    });
  });

  if (prevBtn) prevBtn.addEventListener("click", () => { if (!isAnimating) slide(-1); });
  if (nextBtn) nextBtn.addEventListener("click", () => { if (!isAnimating) slide(1); });

  document.addEventListener("keydown", (e) => {
    if (e.target.closest('.pop-carousel')) {
      if (e.key === "ArrowLeft" && !isAnimating) slide(-1);
      if (e.key === "ArrowRight" && !isAnimating) slide(1);
    }
  });

  let startX = 0;
  let isDragging = false;
  
  if (track) {
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
  }

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(layout, 150);
  });
}

// Run the main function
fetchAndRenderProducts();