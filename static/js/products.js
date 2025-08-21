/* Product data model */
const products = [
  {
    id: "chatka-mix",
    name: "Chatka Mix",
    price: 129.0,
    weight: "1 kg",
    tag: "rajasthani",
    rating: 3.0,
    images: [
      "../assets/products-img/p1.png",
      "../assets/products-img/p1.png",
      "../assets/products-img/p1.png"
    ],
    description:
      "Spicy chat masala mixture with low oil content and coconut oil base."
  },
  {
    id: "lahsun-sev",
    name: "Lahsun Sev Premium",
    price: 79.0,
    weight: "200g",
    tag: "rajasthani",
    rating: 4.0,
    images: [
      "../assets/products-img/p3.png", 
      "./assets/lahsun-back.png"
    ],
    description: "Garlic-flavored sev with a crunchy bite."
  },
  {
    id: "premium-bhujiya",
    name: "Premium Bhujiya",
    price: 89.0,
    weight: "300g",
    tag: "rajasthani",
    rating: 4.5,
    images: [
      "../assets/products-img/p2.png", 
      "./assets/bhujiya-texture.png"
    ],
    description: "Crisp bhujiya strands, traditional spice blend."
  },
  {
    id: "jeera-namkeen",
    name: "Jeera Namkeen",
    price: 109.0,
    weight: "450g",
    tag: "rajasthani",
    rating: 4.2,
    images: [
      "../assets/products-img/p2.png"
    ],
    description: "Savory jeera (cumin) crackers perfect for tea time."
  },
  {
    id: "jeera-namkeen",
    name: "Jeera Namkeen",
    price: 109.0,
    weight: "450g",
    tag: "rajasthani",
    rating: 4.2,
    images: [
      "../assets/products-img/p2.png"
    ],
    description: "Savory jeera (cumin) crackers perfect for tea time."
  }
];

/* State */
const state = {
  filter: "all",
  favorites: new Set(JSON.parse(localStorage.getItem("favorites") || "[]")),
  openId: null,
  qty: 1
};

/* Render product grid */
const grid = document.getElementById("grid");

function productCardHTML(p) {
  const fav = state.favorites.has(p.id) ? "★" : "☆";
  return `
    <article class="card" data-id="${p.id}" tabindex="0" aria-label="${p.name}">
      <div class="img-wrap">
        <img src="${p.images[0]}" alt="${p.name}">
      </div>
      <h3>${p.name}</h3>
      <div class="meta">
        <span class="price">₹ ${p.price.toFixed(2)}</span>
        <span>${p.weight}</span>
      </div>
      <div class="meta" style="margin-top:8px;">
        <button class="btn js-add">Add to Cart</button>
        <button class="btn js-fav" aria-label="Toggle favorite">${fav}</button>
      </div>
    </article>
  `;
}

function renderGrid() {
  const filtered = products.filter((p) => {
    if (state.filter === "all") return true;
    if (state.filter === "favorite") return state.favorites.has(p.id);
    return p.tag === state.filter;
  });
  grid.innerHTML = filtered.map(productCardHTML).join("");
}
renderGrid();

/* Filters */
document.querySelector(".filter-bar").addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-chip");
  if(!btn) return;

  document.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  state.filter = btn.dataset.filter;  // "all" | "rajasthani" | "favorite"
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
  const p = products.find((x) => x.id === id);
  if (!p) return;

  state.openId = id;
  state.qty = 1;
  qtyVal.textContent = "1";

  modalTitle.textContent = p.name;
  crumbName.textContent = p.name;
  modalPrice.textContent = `₹ ${p.price.toFixed(2)}`;
  modalDesc.textContent = p.description;
  modalWeight.textContent = p.weight;
  modalRating.innerHTML =
    "★".repeat(Math.round(p.rating)) +
    "☆".repeat(5 - Math.round(p.rating)) +
    ` (${p.rating.toFixed(1)})`;

  modalHero.src = p.images[0];
  modalHero.alt = p.name;

  modalThumbs.innerHTML = p.images
    .map(
      (src, i) =>
        `<img src="${src}" data-idx="${i}" class="${i === 0 ? "active" : ""}" alt="${p.name} thumbnail ${i + 1}">`
    )
    .join("");

  modalThumbs.onclick = (ev) => {
    const t = ev.target.closest("img");
    if (!t) return;
    [...modalThumbs.children].forEach((i) => i.classList.remove("active"));
    t.classList.add("active");
    modalHero.src = p.images[+t.dataset.idx];
  };

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
  cart.set(id, (cart.get(id) || 0) + qty);
  const p = products.find((x) => x.id === id);
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
  if (id && products.some((p) => p.id === id)) openModal(id);
});
if (location.hash) {
  const id = location.hash.replace("#", "");
  if (products.some((p) => p.id === id)) openModal(id);
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

