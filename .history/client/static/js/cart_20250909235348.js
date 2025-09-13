// BARI-FOODS/client/static/js/cart.js

// Pricing rules
const DELIVERY_BASE = 30.0;
const FREE_SHIP_THRESHOLD = 499.0;
const BASE_URL = "http://127.0.0.1:8000";

// DOM
const listEl = document.getElementById("cartList");
const emptyEl = document.getElementById("emptyState");
const clearBtn = document.getElementById("clearCartBtn");
const itemsTotalEl = document.getElementById("itemsTotal");
const deliveryFeeEl = document.getElementById("deliveryFee");
const grandTotalEl = document.getElementById("grandTotal");
const freeShipBanner = document.getElementById("freeShipBanner");
const checkoutBtn = document.getElementById("checkoutBtn");

let currentCart = []; // Store the fetched cart data

// Auth
const token = localStorage.getItem("accessToken"); // store this after login

async function authFetch(url, options = {}) {
  const headers = options.headers || {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}




// Utilities
function fmt(n) {
  return "₹ " + (+n).toFixed(2);
}

// Badge
async function updateBadge() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  try {
    const response = await fetch(`${BASE_URL}/api/cart/`);
    if (response.ok) {
      const cartItems = await response.json();
      const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      el.textContent = count;
    } else {
      el.textContent = "0";
    }
  } catch (error) {
    console.error("Error fetching cart for badge:", error);
    el.textContent = "0";
  }
}

// Render
function render() {
  if (!listEl || !emptyEl) return;

  if (currentCart.length === 0) {
    listEl.innerHTML = "";
    emptyEl.classList.remove("hidden");
  } else {
    emptyEl.classList.add("hidden");
    listEl.innerHTML = currentCart
      .map((item) => {
        const p = item.product;
        const qty = item.quantity;
        const imageUrl = p.image ? `${BASE_URL}${p.image}` : "";
        return `<li class="cart-item" data-id="${item.id}"> <div class="item-img"> <img src="${imageUrl}" alt="${p.name}"> </div> <div> <div class="item-name">${p.name}</div> <div class="item-meta">${p.weight}</div> </div> <div class="item-price">${fmt(
          p.price
        )}</div> <div class="stepper"> <button class="dec" aria-label="Decrease">−</button> <span class="qty">${qty}</span> <button class="inc" aria-label="Increase">+</button> </div> <button class="remove-btn link danger">Remove</button> </li>`;
      })
      .join("");
  }

  // Totals
  let itemsTotal = currentCart.reduce((sum, item) => sum + parseFloat(item.product.price) * item.quantity, 0);
  const delivery =
    itemsTotal === 0 ? 0 : itemsTotal >= FREE_SHIP_THRESHOLD ? 0 : DELIVERY_BASE;

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

// API Calls
async function fetchCart() {
  try {
    const response = await fetch(`${BASE_URL}/api/cart/`);
    if (response.ok) {
      currentCart = await response.json();
    } else {
      currentCart = [];
      console.error("Could not fetch cart. Is the user logged in?");
    }
  } catch (error) {
    console.error("Error fetching cart:", error);
    currentCart = [];
  }
}

async function updateCartItem(itemId, quantity) {
  try {
    const response = await fetch(`${BASE_URL}/api/cart/${itemId}/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    if (response.ok) {
      await fetchAndRender();
    } else {
      const errorData = await response.json();
      alert(`Error updating item: ${errorData.detail || response.statusText}`);
    }
  } catch (error) {
    alert("An error occurred while updating the cart.");
    console.error("Error updating cart item:", error);
  }
}

async function removeCartItem(itemId) {
  try {
    const response = await fetch(`${BASE_URL}/api/cart/${itemId}/`, {
      method: "DELETE",
    });
    if (response.ok) {
      await fetchAndRender();
    } else {
      const errorData = await response.json();
      alert(`Error removing item: ${errorData.detail || response.statusText}`);
    }
  } catch (error) {
    alert("An error occurred while removing the item.");
    console.error("Error removing cart item:", error);
  }
}

// Main logic
async function fetchAndRender() {
  await fetchCart();
  render();
}

// Events
if (clearBtn) {
  clearBtn.addEventListener("click", async () => {
    // We need to loop and delete each item from the backend
    if (currentCart.length > 0) {
      for (const item of currentCart) {
        await removeCartItem(item.id);
      }
    }
    await fetchAndRender();
  });
}

if (listEl) {
  listEl.addEventListener("click", async (e) => {
    const row = e.target.closest(".cart-item");
    if (!row) return;
    const itemId = row.dataset.id;
    const item = currentCart.find(i => String(i.id) === itemId);

    if (e.target.classList.contains("inc")) {
      await updateCartItem(itemId, item.quantity + 1);
      return;
    }
    if (e.target.classList.contains("dec")) {
      await updateCartItem(itemId, Math.max(1, item.quantity - 1));
      return;
    }
    if (e.target.classList.contains("remove-btn")) {
      await removeCartItem(itemId);
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
const hasHistory = (window.history.length > 1);
if (hasHistory) {
window.history.back();
} else {
window.location.href = "products.html";
}
});
})();

// Initial render
document.addEventListener("DOMContentLoaded", fetchAndRender);