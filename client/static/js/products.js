/* State */
const state = {
  products: [],
  filter: "all",
  favorites: new Set(JSON.parse(localStorage.getItem("favorites") || "[]")),
  openId: null,
  currentImageIndex: 0,
  search: "",
};

const BASE_URL = "";
const grid = document.getElementById("grid");

/* --- HELPER: Get Token safely --- */
function getToken() {
  const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
  return userData.token || userData.access || localStorage.getItem("accessToken") || null;
}

/* --- HELPER: Toast Popup --- */
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
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
    transform: translateX(120%);
    transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Poppins', sans-serif;
  `;
  toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
  });

  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

/* --- HELPER: Button Animation --- */
function animateButtonSuccess(btn) {
  if (!btn) return;

  const originalText = btn.innerHTML;

  btn.innerHTML = '<i class="fas fa-check"></i> Added';
  btn.style.background = '#27ae60';
  btn.style.color = '#ffffff';
  btn.style.borderColor = '#27ae60';
  btn.style.transition = 'all 0.3s ease';
  btn.disabled = true;

  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.style.background = '';
    btn.style.color = '';
    btn.style.borderColor = '';
    btn.disabled = false;
  }, 2000);
}

/* --- RENDER CARD --- */
function productCardHTML(p) {
  const pId = String(p.id);
  const isFav = state.favorites.has(pId);

  const favIcon = isFav ? '<i class="fas fa-heart"></i>' : '<i class="far fa-heart"></i>';
  const favClass = isFav ? "active" : "";

  const imageUrl = p.image || "../assets/products-img/default.png";
  const weightDisplay = p.weight ? (parseFloat(p.weight) * 1000).toFixed(0) + " g" : "";

  return `
    <article class="card" data-id="${p.id}" tabindex="0" aria-label="${p.name}">
      <div class="img-wrap">
        <img src="${imageUrl}" alt="${p.name}" loading="lazy">
      </div>
      <h3>${p.name}</h3>
      <div class="meta">
        <span class="price">₹ ${parseFloat(p.price).toFixed(2)}</span>
        <span>${weightDisplay}</span>
      </div>
      <div class="meta">
        <span class="rating">Rating: ${p.rating ? parseFloat(p.rating).toFixed(1) : 'N/A'}</span>
      </div>
      <div class="meta" style="margin-top:8px;">
        <button class="btn js-add">Add to Cart</button>
        <button class="btn js-fav ${favClass}" aria-label="Toggle favorite" style="font-size:1.2rem;">
            ${favIcon}
        </button>
      </div>
    </article>
  `;
}

function renderGrid() {
  const q = (state.search || "").toLowerCase();

  const filtered = state.products.filter(p => {
    let categoryOk = true;
    if (state.filter === "favorite") {
      categoryOk = state.favorites.has(String(p.id));
    } else if (state.filter === "rajasthani") {
      categoryOk = p.tag === "rajasthani" || (p.description && p.description.toLowerCase().includes("rajasthan"));
    } else if (state.filter !== "all") {
      categoryOk = p.tag === state.filter;
    }

    const nameOk = q ? p.name.toLowerCase().includes(q) : true;
    return categoryOk && nameOk;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px;">No products found.</div>';
  } else {
    grid.innerHTML = filtered.map(productCardHTML).join("");
  }
}

/* --- API: ADD TO CART --- */
async function addToCart(id) {
  const token = getToken();
  if (!token) {
    if (window.authModalInstance) {
      window.authModalInstance.show();
      window.authModalInstance.showLoginMessage('Please log in to add items to cart');
    } else {
      showToast("Please log in to add items to cart");
    }
    return;
  }

  const p = state.products.find(x => String(x.id) === String(id));
  if (!p) return;

  try {
    const response = await fetch(`${BASE_URL}/api/cart/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ product_id: p.id, quantity: 1 }),
    });

    if (!response.ok) {
      throw new Error(`Failed: ${response.status}`);
    }

    showToast(`${p.name} added to cart!`);

    const gridBtn = document.querySelector(`.card[data-id="${id}"] .js-add`);
    animateButtonSuccess(gridBtn);

    if (state.openId === id) {
      const modalBtn = document.getElementById("addToCart");
      animateButtonSuccess(modalBtn);
    }

    // Update cart count if function exists
    if (typeof window.initCartCount === 'function') window.initCartCount();
    if (typeof updateBadge === 'function') updateBadge();

  } catch (error) {
    console.error("Error adding to cart:", error);
    showToast("Could not add item to cart. Please try again.");
  }
}

/* --- LOGIC: FAVORITES --- */
function toggleFavorite(id) {
  const strId = String(id);

  if (state.favorites.has(strId)) {
    state.favorites.delete(strId);
  } else {
    state.favorites.add(strId);
  }

  localStorage.setItem("favorites", JSON.stringify([...state.favorites]));

  renderGrid();

  if (state.openId === id) {
    const btnFav = document.getElementById("fav");
    if (btnFav) {
      btnFav.innerHTML = state.favorites.has(strId)
        ? '<i class="fas fa-heart"></i>'
        : '<i class="far fa-heart"></i>';
    }
  }
}

/* --- IMAGE CAROUSEL --- */
function updateCarousel() {
  const p = state.products.find(x => String(x.id) === String(state.openId));
  if (!p) return;

  const images = p.images && p.images.length > 0 ? p.images : [p.image || "../assets/products-img/default.png"];
  const modalHero = document.getElementById("modalHero");
  const indicators = document.querySelectorAll('.carousel-indicator');

  if (modalHero) {
    modalHero.src = images[state.currentImageIndex];
  }

  indicators.forEach((indicator, index) => {
    if (index === state.currentImageIndex) {
      indicator.classList.add('active');
    } else {
      indicator.classList.remove('active');
    }
  });
}

function nextImage() {
  const p = state.products.find(x => String(x.id) === String(state.openId));
  if (!p) return;

  const images = p.images && p.images.length > 0 ? p.images : [p.image || "../assets/products-img/default.png"];
  state.currentImageIndex = (state.currentImageIndex + 1) % images.length;
  updateCarousel();
}

function prevImage() {
  const p = state.products.find(x => String(x.id) === String(state.openId));
  if (!p) return;

  const images = p.images && p.images.length > 0 ? p.images : [p.image || "../assets/products-img/default.png"];
  state.currentImageIndex = (state.currentImageIndex - 1 + images.length) % images.length;
  updateCarousel();
}

function goToImage(index) {
  state.currentImageIndex = index;
  updateCarousel();
}

/* --- SEARCH FUNCTIONALITY --- */
const searchForm = document.getElementById('productSearchForm');
const searchInput = document.getElementById('productSearch');

if (searchForm && searchInput) {
  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    state.search = (searchInput.value || "").trim();
    renderGrid();
  });

  searchInput.addEventListener('input', () => {
    state.search = (searchInput.value || "").trim();
    renderGrid();
  });

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      searchInput.value = "";
      state.search = "";
      renderGrid();
      searchInput.blur();
    }
  });
}

/* --- FILTERS --- */
document.querySelector(".filter-bar").addEventListener("click", e => {
  const btn = e.target.closest(".filter-chip");
  if (!btn) return;

  document.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  state.filter = btn.dataset.filter;
  renderGrid();
});

/* --- GRID INTERACTIONS --- */
grid.addEventListener("click", e => {
  const card = e.target.closest(".card");
  if (!card) return;
  const id = card.dataset.id;

  if (e.target.classList.contains("js-add")) {
    addToCart(id);
    e.stopPropagation();
    return;
  }

  if (e.target.classList.contains("js-fav")) {
    toggleFavorite(id);
    e.stopPropagation();
    return;
  }

  openModal(id);
});

grid.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    const card = e.target.closest(".card");
    if (!card) return;
    openModal(card.dataset.id);
  }
});

/* --- MODAL ELEMENTS --- */
const backdrop = document.getElementById("backdrop");
const modalClose = document.getElementById("modalClose");
const modalHero = document.getElementById("modalHero");
const modalTitle = document.getElementById("modalTitle");
const modalPrice = document.getElementById("modalPrice");
const modalDesc = document.getElementById("modalDesc");
const modalWeight = document.getElementById("modalWeight");
const modalRating = document.getElementById("modalRating");
const btnAdd = document.getElementById("addToCart");
const btnFav = document.getElementById("fav");
const crumbName = document.getElementById("crumbName");

/* --- MODAL LOGIC --- */
function openModal(id) {
  const p = state.products.find(x => String(x.id) === String(id));
  if (!p) return;

  state.openId = id;
  state.currentImageIndex = 0;

  // Populate Text Data
  modalTitle.textContent = p.name;
  if (crumbName) crumbName.textContent = p.name;
  modalPrice.textContent = `₹ ${parseFloat(p.price).toFixed(2)}`;
  modalDesc.textContent = p.description || "No description available.";

  if (modalWeight) {
    modalWeight.textContent = p.weight ? (parseFloat(p.weight) * 1000).toFixed(0) + " g" : '';
  }

  if (modalRating) {
    const r = Math.round(p.rating || 0);
    let starsHtml = '';
    for (let i = 0; i < r; i++) starsHtml += '<i class="fas fa-star" style="color: #e9b540; margin-right:2px;"></i>';
    for (let i = r; i < 5; i++) starsHtml += '<i class="far fa-star" style="color: #ccc; margin-right:2px;"></i>';
    modalRating.innerHTML = starsHtml;
  }

  // --- CAROUSEL LOGIC ---
  const images = p.images && p.images.length > 0 ? p.images : [p.image || "../assets/products-img/default.png"];
  modalHero.src = images[0];

  const controls = document.querySelector('.carousel-controls');
  if (controls) {
    controls.style.display = images.length > 1 ? 'flex' : 'none';
  }

  const carouselIndicators = document.getElementById("carouselIndicators");
  if (carouselIndicators) {
    if (images.length > 1) {
      carouselIndicators.innerHTML = images.map((_, index) =>
        `<button class="carousel-indicator ${index === 0 ? 'active' : ''}" data-index="${index}" aria-label="Go to image ${index + 1}"></button>`
      ).join('');

      carouselIndicators.querySelectorAll('.carousel-indicator').forEach((indicator, index) => {
        indicator.addEventListener('click', () => goToImage(index));
      });
    } else {
      carouselIndicators.innerHTML = '';
    }
  }

  if (btnFav) {
    btnFav.innerHTML = state.favorites.has(String(id))
      ? '<i class="fas fa-heart"></i>'
      : '<i class="far fa-heart"></i>';
  }

  // Show Modal
  backdrop.style.display = "flex";
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  backdrop.style.display = "none";
  backdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  state.openId = null;
  state.currentImageIndex = 0;
}

/* --- MODAL EVENT LISTENERS --- */
if (modalClose) modalClose.addEventListener("click", closeModal);
if (backdrop) backdrop.addEventListener("click", e => { if (e.target === backdrop) closeModal(); });

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && state.openId) closeModal();
});

const prevBtn = document.getElementById("carouselPrev");
const nextBtn = document.getElementById("carouselNext");

if (prevBtn) prevBtn.addEventListener("click", prevImage);
if (nextBtn) nextBtn.addEventListener("click", nextImage);

if (btnAdd) btnAdd.addEventListener("click", () => {
  if (state.openId) {
    addToCart(state.openId);
  }
});

if (btnFav) btnFav.addEventListener("click", () => {
  if (!state.openId) return;
  toggleFavorite(state.openId);
});

/* --- DEEP LINKING --- */
window.addEventListener("hashchange", () => {
  const id = location.hash.replace("#", "");
  if (id && state.products.some(p => String(p.id) === id)) openModal(id);
});

if (location.hash) {
  const id = location.hash.replace("#", "");
  setTimeout(() => {
    if (state.products.some(p => String(p.id) === id)) openModal(id);
  }, 500);
}

/* --- INITIAL DATA FETCH --- */
async function fetchProducts() {
  try {
    const response = await fetch(`${BASE_URL}/api/products/`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    state.products = data.results || data;
    renderGrid();
  } catch (error) {
    console.error("Error fetching products:", error);
    if (grid) grid.innerHTML = '<p style="text-align:center; color: red;">Failed to load products. Server issue</p>';
  }
}

fetchProducts();