/* Base URL for backend */
const BASE_URL = "http://127.0.0.1:8000";

// Summary DOM
const reviewList = document.getElementById("reviewList");
const sumItems = document.getElementById("sumItems");
const sumDelivery = document.getElementById("sumDelivery");
const sumService = document.getElementById("sumService");
const sumTotal = document.getElementById("sumTotal");
const placeOrderBtn = document.getElementById("placeOrder");

// Address DOM
const addrSelect = document.getElementById("addrSelect");
const addrLine = document.getElementById("addrLine");
const addrCity = document.getElementById("addrCity");
const addrZip = document.getElementById("addrZip");
const addrNote = document.getElementById("addrNote");

// Payment DOM
const payList = document.getElementById("payList");
const cardForm = document.getElementById("cardForm");
const upiForm = document.getElementById("upiForm");

// State
const state = {
  cartItems: [],
  userProfile: null,
  address: null,
  payment: "cod"
};

// ---- Database calls ----
async function fetchCartData() {
  const res = await fetch(`${BASE_URL}/api/cart/`);
  if (!res.ok) throw new Error("Failed to fetch cart data");
  return res.json();
}

async function fetchUserProfile() {
  const res = await fetch(`${BASE_URL}/api/users/profile/`);
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

async function placeOrder() {
  const res = await fetch(`${BASE_URL}/api/checkout/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to place order.");
  }
  return res.json();
}

// ---- Render cart review + totals ----
function render() {
  const { cartItems } = state;
  let itemsSubtotal = 0;

  if (cartItems.length === 0) {
    if (reviewList) reviewList.innerHTML = `<li class="review-item"><p>Your cart is empty.</p></li>`;
    if (sumItems) sumItems.textContent = "₹ 0.00";
    if (sumDelivery) sumDelivery.textContent = "₹ 0.00";
    if (sumService) sumService.textContent = "₹ 0.00";
    if (sumTotal) sumTotal.textContent = "₹ 0.00";
    if (placeOrderBtn) placeOrderBtn.disabled = true;
    return;
  }

  if (reviewList) {
    reviewList.innerHTML = cartItems.map(item => {
      const p = item.product;
      const qty = item.quantity;
      itemsSubtotal += parseFloat(p.price) * qty;
      const imageUrl = p.image ? `${BASE_URL}${p.image}` : "";
      return `<li class="review-item" data-id="${p.id}"> <div class="review-thumb"><img src="${imageUrl}" alt="${p.name}"/></div> <div> <div>${p.name}</div> <small class="muted">${p.weight || ""}</small> </div> <div class="qty-badge">×${qty}</div> </li>`;
    }).join("");
  }

  const FREE_SHIP_THRESHOLD = 499.0;
  const DELIVERY_BASE = 30.0;
  const SERVICE_FEE_RATE = 0.02;

  const delivery = itemsSubtotal === 0 ? 0 : (itemsSubtotal >= FREE_SHIP_THRESHOLD ? 0 : DELIVERY_BASE);
  const service = +(itemsSubtotal * SERVICE_FEE_RATE).toFixed(2);
  const grand = Math.max(0, itemsSubtotal + delivery + service);

  if (sumItems) sumItems.textContent = `₹ ${itemsSubtotal.toFixed(2)}`;
  if (sumDelivery) sumDelivery.textContent = `₹ ${delivery.toFixed(2)}`;
  if (sumService) sumService.textContent = `₹ ${service.toFixed(2)}`;
  if (sumTotal) sumTotal.textContent = `₹ ${grand.toFixed(2)}`;
  if (placeOrderBtn) placeOrderBtn.disabled = false;
}

// ---- Address helpers ----
function fillAddressForm(a) {
  if (addrLine) addrLine.value = a?.address || "";
  // The backend user profile has a single 'address' field, not separate line/city/zip
  // So we'll fill the main address field and assume a simple model
}

// ---- Payment UI ----
function applyPaymentUI() {
  const val = state.payment;
  if (cardForm) cardForm.classList.toggle("hidden", val !== "card");
  if (upiForm) upiForm.classList.toggle("hidden", val !== "upi");
}

// ---- Init ----
(async function init() {
  try {
    const cartData = await fetchCartData();
    state.cartItems = cartData;

    const userProfileData = await fetchUserProfile();
    state.userProfile = userProfileData;
    state.address = userProfileData.address;

    // Fill address form with fetched data
    fillAddressForm(state.userProfile);
    
    // Set up payment UI
    const radios = payList.querySelectorAll('input[name="pay"]');
    radios.forEach(r => {
      r.checked = r.value === state.payment;
      r.addEventListener("change", () => {
        if (r.checked) {
          state.payment = r.value;
          applyPaymentUI();
        }
      });
    });
    applyPaymentUI();

    // Place order button logic
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener("click", async () => {
        if (state.cartItems.length === 0) {
          alert("Cart is empty.");
          return;
        }

        try {
          // Place the order via API
          const orderResponse = await placeOrder();
          alert(`Order placed successfully! Order ID: ${orderResponse.id}`);
          window.location.href = '/order-confirmation.html'; // Redirect
        } catch (err) {
          alert(err.message);
        }
      });
    }
  } catch (error) {
    console.error("Initialization error:", error);
    if (reviewList) reviewList.innerHTML = `<li class="review-item"><p style="color:red;">Failed to load checkout data. Please check if you are logged in.</p></li>`;
  }
  
  // Finally render items and totals
  render();
})();