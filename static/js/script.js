import { catalog } from "../../assets/data/catalog.mjs"; // Adjust path if needed

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
  const badge = document.getElementById("cartCount");
  if (badge)
    badge.textContent = Object.values(items).reduce((s, q) => s + q, 0);
}

// Choose popular by rating desc; keep only items with rating defined
const popular = [...catalog]
  .filter((p) => typeof p.rating === "number" && p.rating > 0)
  .sort((a, b) => (b.rating || 0) - (a.rating || 0));

function cardHTML(p) {
  const img = (p.images && p.images) || "/assets/img/placeholder.png";
  return `<div class="pop-slide"> <div class="home-product-card"> <div class="home-prod-img"><img src="${img}" alt="${
    p.name
  }"></div> <div class="home-prod-details"> <div class="home-prod-title">${
    p.name
  }</div> <div class="home-prod-desc">${
    p.weight || ""
  }</div> <div class="home-prod-meta"> <div class="home-prod-price">₹ ${(+p.price).toFixed(
    2
  )}</div> <button class="home-add-btn" data-id="${
    p.id
  }" type="button">Add to Cart</button> </div> </div> </div> </div>`;
}

function render() {
  track.innerHTML = popular.map(cardHTML).join("");
  wireEvents();
  layout();
}

function wireEvents() {
  // Add to Cart
  track.addEventListener("click", (e) => {
    const btn = e.target.closest(".home-add-btn");
    if (!btn) return;
    addToCart(btn.dataset.id, 1);
  });

  // Carousel controls
  prevBtn.addEventListener("click", () => slide(-1));
  nextBtn.addEventListener("click", () => slide(1));

  // Resize to recalc slide widths if needed (responsive)
  window.addEventListener("resize", layout);
}

let page = 0;
let pages = 1;
let perPage = 3;
let slideW = 0;

function layout() {
  const total = popular.length;
  perPage = 3;
  pages = Math.max(1, Math.ceil(total / perPage));

  const gap = 18;
  const vpWidth = viewport.clientWidth;
  slideW = Math.floor((vpWidth - gap * (perPage - 1)) / perPage);

  // Apply widths and gaps
  const slides = track.querySelectorAll(".pop-slide");
  slides.forEach((s, i) => {
    s.style.minWidth = slideW + "px";
    s.style.maxWidth = slideW + "px";
    s.style.marginRight = i % perPage !== perPage - 1 ? gap + "px" : "0px";
  });

  // Update nav visibility
  const needsNav = total > perPage;
  prevBtn.hidden = !needsNav;
  nextBtn.hidden = !needsNav;

  // Clamp page and translate
  page = Math.min(page, pages - 1);
  applyTransform();
}

function applyTransform() {
  const x = -page * (slideW * perPage + 18 * (perPage - 1));
  track.style.transform = `translateX(${x}px)`;
}

function slide(dir) {
  page = (page + dir + pages) % pages;
  applyTransform();
}

render();
