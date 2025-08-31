import { catalog } from "../../../assets/data/catalog.mjs";

const products = catalog;

const state = {
  filter: "all",
  favorites: new Set(JSON.parse(localStorage.getItem("favorites") || "[]")),
  openId: null,
  qty: 1,
  search: ""
};

const grid = document.getElementById("grid");
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

// Search
const searchForm = document.getElementById("productSearchForm");
const searchInput = document.getElementById("productSearch");

/* Helpers */
function productCardHTML(p) {
  const fav = state.favorites.has(p.id) ? "★" : "☆";
  return `
    <article class="card" data-id="${p.id}" tabindex="0" aria-label="${p.name}">
      <div class="img-wrap">
        <img src="${(p.images && p.images[0]) || ""}" alt="${p.name}">
      </div>
      <h3>${p.name}</h3>
      <div class="meta">
        <span class="price">₹ ${p.price.toFixed(2)}</span>
        <span>${p.weight}</span>
      </div>
      <div class="meta">
        <button class="btn js-add">Add to Cart</button>
        <button class="btn js-fav" title="Save to favorites">${fav}</button>
      </div>
    </article>
  `;
}

function renderGrid() {
  const q = (state.search || "").toLowerCase();
  const filtered = products.filter((p) => {
    const categoryOk =
      state.filter === "all"
        ? true
        : state.filter === "favorite"
        ? state.favorites.has(p.id)
        : p.tag === state.filter;
    const nameOk = q ? p.name.toLowerCase().includes(q) : true;
    return categoryOk && nameOk;
  });
  grid.innerHTML = filtered.map(productCardHTML).join("");
}

/* Filters */
const filterBar = document.querySelector(".filter-bar");
if (filterBar) {
  filterBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    document.querySelectorAll(".filter-chip").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    state.filter = btn.dataset.filter; // "all" | "rajasthani" | "favorite"
    renderGrid();
  });
}

/* Search wiring */
if (searchForm && searchInput) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    state.search = (searchInput.value || "").trim();
    renderGrid();
  });

  let typingTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      state.search = (searchInput.value || "").trim();
      renderGrid();
    }, 120);
  });
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      state.search = "";
      renderGrid();
      searchInput.blur();
    }
  });
}

/* Grid events */
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

/* Modal logic */
function openModal(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  state.openId = id;
  state.qty = 1;
  if (qtyVal) qtyVal.textContent = "1";
  if (modalTitle) modalTitle.textContent = p.name;
  if (crumbName) crumbName.textContent = p.name;
  if (modalPrice) modalPrice.textContent = `₹ ${p.price.toFixed(2)}`;
  if (modalDesc) modalDesc.textContent = p.description;
  if (modalWeight) modalWeight.textContent = p.weight;
  if (modalRating) {
    modalRating.innerHTML =
      "★".repeat(Math.round(p.rating)) +
      "☆".repeat(5 - Math.round(p.rating)) +
      ` (${p.rating.toFixed(1)})`;
  }
  if (modalHero) {
    modalHero.src = p.images[0];
    modalHero.alt = p.name;
  }
  if (modalThumbs) {
    modalThumbs.innerHTML = (p.images || [])
      .map(
        (src, i) =>
          `<img src="${src}" data-idx="${i}" class="${i === 0 ? "active" : ""}" alt="${p.name} image ${i + 1}">`
      )
      .join("");
    modalThumbs.onclick = (ev) => {
      const t = ev.target.closest("img");
      if (!t) return;
      [...modalThumbs.children].forEach((i) => i.classList.remove("active"));
      t.classList.add("active");
      modalHero.src = p.images[+t.dataset.idx];
    };
  }
  if (btnFav) btnFav.textContent = state.favorites.has(id) ? "★" : "☆";
  if (backdrop) {
    backdrop.style.display = "flex";
    backdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
}

function closeModal() {
  if (backdrop) {
    backdrop.style.display = "none";
    backdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  state.openId = null;
}

if (modalClose) modalClose.addEventListener("click", closeModal);
if (backdrop)
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.openId) closeModal();
});

if (btnInc)
  btnInc.addEventListener("click", () => {
    state.qty = Math.min(99, state.qty + 1);
    if (qtyVal) qtyVal.textContent = state.qty;
  });

if (btnDec)
  btnDec.addEventListener("click", () => {
    state.qty = Math.max(1, state.qty - 1);
    if (qtyVal) qtyVal.textContent = state.qty;
  });

if (btnAdd)
  btnAdd.addEventListener("click", () => {
    if (state.openId) addToCart(state.openId, state.qty);
  });

if (btnFav)
  btnFav.addEventListener("click", () => {
    if (!state.openId) return;
    toggleFavorite(state.openId);
    btnFav.textContent = state.favorites.has(state.openId) ? "★" : "☆";
    renderGrid();
  });

/* Favorites */
function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  localStorage.setItem("favorites", JSON.stringify([...state.favorites]));
}

/* Cart + storage */
const cart = new Map(); // id -> qty

function addToCart(id, qty) {
  cart.set(id, (cart.get(id) || 0) + qty);
  const items = loadCartLS();
  items[id] = (items[id] || 0) + qty;
  saveCartLS(items);
  // optional: toast
  // const p = products.find((x) => x.id === id);
  // toast(`${p.name} ×${qty} added`);
}

function loadCartLS() {
  try {
    return JSON.parse(localStorage.getItem("cartItems")) || {};
  } catch (_) {
    return {};
  }
}

function saveCartLS(obj) {
  localStorage.setItem("cartItems", JSON.stringify(obj));
}

function getCartCount() {
  const items = loadCartLS();
  return Object.values(items).reduce((sum, q) => sum + q, 0);
}

const cartCountEl = document.getElementById("cartCount");
if (cartCountEl) cartCountEl.textContent = getCartCount();

/* Deep-linking */
window.addEventListener("hashchange", () => {
  const id = location.hash.replace("#", "");
  if (id && products.some((p) => p.id === id)) openModal(id);
});
if (location.hash) {
  const id = location.hash.replace("#", "");
  if (products.some((p) => p.id === id)) openModal(id);
}

/* Header scroll behavior */
(function () {
  const nav = document.querySelector(".navbar");
  if (!nav) return;
  let lastY = window.scrollY;
  let ticking = false;
  const threshold = 6;
  const showAtTop = 24;
  function onScroll() {
    const y = window.scrollY;
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const diff = y - lastY;
        if (y <= showAtTop) {
          nav.classList.remove("is-hidden");
          lastY = y;
          ticking = false;
          return;
        }
        if (Math.abs(diff) > threshold) {
          if (diff > 0) nav.classList.add("is-hidden");
          else nav.classList.remove("is-hidden");
        }
        lastY = y;
        ticking = false;
      });
      ticking = true;
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* Initial render */
renderGrid();
