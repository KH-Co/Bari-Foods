/* State */
const state = {
  products: [], // Will be populated by the API call
  filter: "all",
  favorites: new Set(JSON.parse(localStorage.getItem("favorites") || "[]")),
  openId: null,
  qty: 1,
  search: "",
};

/* Render product grid */
const grid = document.getElementById("grid");

function productCardHTML(p) {
  const fav = state.favorites.has(p.id) ? "★" : "☆";
  // The API doesn't have an 'id' property, so we use 'name' as a fallback for the unique identifier.
  // Ideally, you should update your Django serializer to include a unique ID from the model.
  const uniqueId = p.id || p.name;
  const imageUrl = p.image ? 'http://127.0.0.1:8000${p.image}' : '';

  return `
    <article class="card" data-id="${uniqueId}" tabindex="0" aria-label="${p.name}">
      <div class="img-wrap">
        <img src="${imageUrl}" alt="${p.name}">
      </div>
      <h3>${p.name}</h3>
      <div class="meta">
        <span class="price">₹ ${parseFloat(p.price).toFixed(2)}</span>
        <span>${p.weight || 'N/A'}</span>
      </div>
      <div class="meta">
                <span class="rating">
                    Rating: ${p.rating ? parseFloat(p.rating).toFixed(1) : 'N/A'}
                </span>
            </div>
      <div class="meta" style="margin-top:8px;">
        <button class="btn js-add">Add to Cart</button>
        <button class="btn js-fav" aria-label="Toggle favorite">${fav}</button>
      </div>
    </article>
  `;
}

function renderGrid() {
  const q = (state.search || "").toLowerCase();

  const filtered = state.products.filter(p => {
    const categoryOk =
      state.filter === "all" ? true :
      state.filter === "favorite" ? state.favorites.has(p.id || p.name) :
      p.tag === state.filter;

    const nameOk = q ? p.name.toLowerCase().includes(q) : true;

    return categoryOk && nameOk;
  });

  grid.innerHTML = filtered.map(productCardHTML).join("");
}

/* Search functionality */
const searchForm = document.getElementById('productSearchForm');
const searchInput = document.getElementById('productSearch');

if (searchForm && searchInput){
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    state.search = (searchInput.value || "").trim();
    renderGrid();
  });

  let typingTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      state.search = (searchInput.value || "").trim();
      renderGrid();
    }, 120);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape'){
      searchInput.value = "";
      state.search = "";
      renderGrid();
      searchInput.blur();
    }
  });
}

/* Filters */
document.querySelector(".filter-bar").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-chip");
  if(!btn) return;

  document.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  state.filter = btn.dataset.filter; // "all" | "rajasthani" | "favorite"
  renderGrid();
});

/* Grid: open modal / add / fav */
grid.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (!card) return;
  const id = card.dataset.id;

  if (e.target.classList.contains("js-add")) {
    addToCart(id, 1);
    return;
  }
  if (e.target.classList.contains("js-fav")) {
    toggleFavorite(id);
    renderGrid();
    return;
  }
  openModal(id);
});
grid.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const card = e.target.closest(".card");
    if (!card) return;
    openModal(card.dataset.id);
  }
});

/* Modal elements */
const backdrop = document.getElementById("backdrop");
const modalClose = document.getElementById("modalClose");
const modalHero = document.getElementById("modalHero");
const modalThumbs = document.getElementById("modalThumbs");
const modalTitle = document.getElementById("modalTitle");
const modalPrice = document.getElementById("modalPrice");
const modalDesc = document.getElementById("modalDesc");
const modalWeight = document.getElementById("modalWeight");
const modalRating = document.getElementById("modalRating");
const qtyVal = document.getElementById("qtyVal");
const btnInc = document.getElementById("inc");
const btnDec = document.getElementById("dec");
const btnAdd = document.getElementById("addToCart");
const btnFav = document.getElementById("fav");
const crumbName = document.getElementById("crumbName");

/* Modal logic */
function openModal(id) {
  const p = state.products.find((x) => (x.id || x.name) === id);
  if (!p) return;

  state.openId = id;
  state.qty = 1;
  qtyVal.textContent = "1";

  modalTitle.textContent = p.name;
  crumbName.textContent = p.name;
  modalPrice.textContent = `₹ ${parseFloat(p.price).toFixed(2)}`;
  modalDesc.textContent = p.description;
  modalWeight.textContent = p.weight || 'N/A';
  modalRating.innerHTML =
    "★".repeat(Math.round(p.rating)) +
    "☆".repeat(5 - Math.round(p.rating)) +
    ` (${p.rating.toFixed(1)})`;

  modalHero.src = p.images ? p.images[0] : p.image;
  modalHero.alt = p.name;

  if (p.images && p.images.length > 0) {
    modalThumbs.innerHTML = p.images
      .map((src, i) =>
        `<img src="${src}" data-idx="${i}" class="${i === 0 ? "active" : ""}" alt="${p.name} thumbnail ${i + 1}">`
      ).join("");
    modalThumbs.onclick = (ev) => {
      const t = ev.target.closest("img");
      if (!t) return;
      [...modalThumbs.children].forEach((i) => i.classList.remove("active"));
      t.classList.add("active");
      modalHero.src = p.images[+t.dataset.idx];
    };
  } else {
    modalThumbs.innerHTML = ''; // Clear thumbnails if no images
  }

  btnFav.textContent = state.favorites.has(id) ? "★" : "☆";

  backdrop.style.display = "flex";
  backdrop.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  backdrop.style.display = "none";
  backdrop.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  state.openId = null;
}

document.getElementById("modalClose").addEventListener("click", closeModal);
backdrop.addEventListener("click", (e) => { if (e.target === backdrop) closeModal(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && state.openId) closeModal(); });

btnInc.addEventListener("click", () => { state.qty = Math.min(99, state.qty + 1); qtyVal.textContent = state.qty; });
btnDec.addEventListener("click", () => { state.qty = Math.max(1, state.qty - 1); qtyVal.textContent = state.qty; });
btnAdd.addEventListener("click", () => { if (state.openId) addToCart(state.openId, state.qty); });
btnFav.addEventListener("click", () => {
  if (!state.openId) return;
  toggleFavorite(state.openId);
  btnFav.textContent = state.favorites.has(state.openId) ? "★" : "☆";
  renderGrid();
});

/* Cart + Favorites */
const cart = new Map(); // id -> qty
function addToCart(id, qty) {
  const p = state.products.find((x) => (x.id || x.name) === id);
  if (!p) return; // Add check to prevent adding non-existent items
  cart.set(id, (cart.get(id) || 0) + qty);
  toast(`${p.name} ×${qty} added`);
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  localStorage.setItem("favorites", JSON.stringify([...state.favorites]));
}

/* Deep-linking: open modal from URL hash (#id) */
window.addEventListener("hashchange", () => {
  const id = location.hash.replace("#", "");
  if (id && state.products.some((p) => (p.id || p.name) === id)) openModal(id);
});
if (location.hash) {
  const id = location.hash.replace("#", "");
  if (state.products.some((p) => (p.id || p.name) === id)) openModal(id);
}

//headder scroll behavior
(function(){
  const nav = document.querySelector('.navbar');
  if(!nav) return;

  let lastY = window.scrollY;
  let ticking = false;
  const threshold = 6;
  const showAtTop = 24;

  function onScroll(){
    const y = window.scrollY;

    if (!ticking){
      window.requestAnimationFrame(()=>{
        const diff = y - lastY;

        if (y <= showAtTop){
          nav.classList.remove('is-hidden');
          lastY = y;
          ticking = false;
          return;
        }

        if (Math.abs(diff) > threshold){
          if (diff > 0){
            nav.classList.add('is-hidden');
          } else {
            nav.classList.remove('is-hidden');
          }
          lastY = y;
        }

        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
})();

/* Initial Data Fetch */
async function fetchProducts() {
    try {
        const response = await fetch('http://127.0.0.1:8000/api/products/');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        state.products = data;
        renderGrid();
    } catch (error) {
        console.error("Error fetching products:", error);
        if (grid) {
            grid.innerHTML = '<p style="text-align:center; color: red;">Failed to load products.</p>';
        }
    }
}
fetchProducts();