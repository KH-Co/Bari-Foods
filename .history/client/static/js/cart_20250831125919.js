import { catalog } from "../../assets/data/catalog.mjs";

// Pricing rules
const DELIVERY_BASE = 30.0;
const FREE_SHIP_THRESHOLD = 499.0;

// DOM
const listEl = document.getElementById("cartList");
const emptyEl = document.getElementById("emptyState");
const clearBtn = document.getElementById("clearCartBtn");
const itemsTotalEl = document.getElementById("itemsTotal");
const deliveryFeeEl = document.getElementById("deliveryFee");
const grandTotalEl = document.getElementById("grandTotal");
const freeShipBanner = document.getElementById("freeShipBanner");
const checkoutBtn = document.getElementById("checkoutBtn");

// Utilities
function fmt(n) {
  return "₹ " + (+n).toFixed(2);
}
function byId(id) {
  return catalog.find((p) => p.id === id);
}

// Storage helpers
function loadCart() {
  try {
    const raw = localStorage.getItem("cartItems");
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return {};
  }
}
function saveCart(obj) {
  localStorage.setItem("cartItems", JSON.stringify(obj));
}

// Badge
function updateBadge() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  const items = loadCart();
  const count = Object.values(items).reduce((sum, q) => sum + q, 0);
  el.textContent = count;
}

// Render
function render() {
  const cart = loadCart();
  const ids = Object.keys(cart);

  if (!listEl || !emptyEl) return;

  if (ids.length === 0) {
    listEl.innerHTML = "";
    emptyEl.classList.remove("hidden");
  } else {
    emptyEl.classList.add("hidden");
    listEl.innerHTML = ids
      .map((id) => {
        const qty = cart[id];
        const p = byId(id);
        if (!p) return "";
        return `<li class="cart-item" data-id="${id}"> <div class="item-img"> <img src="${
          (p.images && p.images) || ""
        }" alt="${p.name}"> </div> <div> <div class="item-name">${
          p.name
        }</div> <div class="item-meta">${
          p.weight
        }</div> </div> <div class="item-price">${fmt(
          p.price
        )}</div> <div class="stepper"> <button class="dec" aria-label="Decrease">−</button> <span class="qty">${qty}</span> <button class="inc" aria-label="Increase">+</button> </div> <button class="remove-btn link danger">Remove</button> </li>`;
      })
      .join("");
  }

  // Totals
  let itemsTotal = 0;
  ids.forEach((id) => {
    const p = byId(id);
    if (!p) return;
    itemsTotal += p.price * cart[id];
  });

  const delivery =
    itemsTotal === 0
      ? 0
      : itemsTotal >= FREE_SHIP_THRESHOLD
      ? 0
      : DELIVERY_BASE;

  if (itemsTotalEl) itemsTotalEl.textContent = fmt(itemsTotal);
  if (deliveryFeeEl) deliveryFeeEl.textContent = fmt(delivery);
  if (grandTotalEl) grandTotalEl.textContent = fmt(itemsTotal + delivery);

  if (freeShipBanner) {
    if (itemsTotal > 0 && itemsTotal < FREE_SHIP_THRESHOLD) {
      const diff = FREE_SHIP_THRESHOLD - itemsTotal;
      freeShipBanner.textContent = `Add items worth ${fmt(
        diff
      )} more for free delivery`;
      freeShipBanner.classList.remove("hidden");
    } else {
      freeShipBanner.classList.add("hidden");
    }
  }

  updateBadge();
}

// Events
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    saveCart({});
    render();
  });
}

if (listEl) {
  listEl.addEventListener("click", (e) => {
    const row = e.target.closest(".cart-item");
    if (!row) return;
    const id = row.dataset.id;
    const cart = loadCart();
    if (e.target.classList.contains("inc")) {
      cart[id] = (cart[id] || 1) + 1;
      saveCart(cart);
      render();
      return;
    }
    if (e.target.classList.contains("dec")) {
      cart[id] = Math.max(1, (cart[id] || 1) - 1);
      saveCart(cart);
      render();
      return;
    }
    if (e.target.classList.contains("remove-btn")) {
      delete cart[id];
      saveCart(cart);
      render();
      return;
    }
  });
}

if (checkoutBtn) {
  checkoutBtn.addEventListener("click", () => {
    location.href = "checkout.html";
  });
}

(function wireBackButton(){
const btn = document.getElementById("navBack");
if (!btn) return;

btn.addEventListener("click", ()=>{
// If there is meaningful history, go back; else go to a safe fallback page.
const hasHistory = (window.history.length > 1);
if (hasHistory) {
// Avoid navigating back to same-origin anchors only; still safe for typical flows.
window.history.back();
} else {
// Fallback destination for the Cart page:
window.location.href = "products.html";
}
});
})();

// Initial render
render();
