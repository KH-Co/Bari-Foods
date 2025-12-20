/* Base URL for backend */
const BASE_URL = "http://127.0.0.1:8000";

const DOM = {
  reviewList: document.getElementById("reviewList"),
  sumItems: document.getElementById("sumItems"),
  sumDelivery: document.getElementById("sumDelivery"),
  sumService: document.getElementById("sumService"),
  sumTotal: document.getElementById("sumTotal"),
  placeOrderBtn: document.getElementById("placeOrder"),

  addrSelect: document.getElementById("addrSelect"),
  addAddressBtn: document.getElementById("addAddressBtn"),
  saveAddressBtn: document.getElementById("saveAddressBtn"),
  deleteAddressBtn: document.getElementById("deleteAddressBtn"),
  addrLine: document.getElementById("addrLine"),
  addrCity: document.getElementById("addrCity"),
  addrZip: document.getElementById("addrZip"),
  addrNote: document.getElementById("addrNote"),

  payList: document.getElementById("payList"),
  cardForm: document.getElementById("cardForm"),
  upiForm: document.getElementById("upiForm")
};

// State
const state = {
  cartItems: [],
  addresses: [],
  selectedAddress: null,
  payment: "cod",
  loading: false,
  errors: {}
};

const CONFIG = {
  FREE_SHIP_THRESHOLD: 499.0,
  DELIVERY_BASE: 30.0,
  SERVICE_FEE_RATE: 0.02,
  MAX_RETRY_ATTEMPTS: 3
};

// ---- Database calls ----
async function fetchCartData() {
  const res = await fetch(`${BASE_URL}/api/cart/`);
  if (!res.ok) throw new Error("Failed to fetch cart data");
  return res.json();
}

async function fetchAddresses() {
  const res = await fetch(`${BASE_URL}/api/addresses/`);
  if (!res.ok) throw new Error("Failed to fetch addresses");
  return res.json();
}

async function saveAddress(address, isNew) {
  const method = isNew ? "POST" : "PUT";
  const url = isNew ? `${BASE_URL}/api/addresses/` : `${BASE_URL}/api/addresses/${address.id}/`;
  const res = await fetch(url, {
    method: method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(address)
  });
  if (!res.ok) throw new Error("Failed to save address");
  return res.json();
}

async function deleteAddress(id) {
  const res = await fetch(`${BASE_URL}/api/addresses/${id}/`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete address");
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
function hydrateAddressSelect(){
  if (addrSelect) {
    addrSelect.innerHTML = state.addresses.length
    ? state.addresses.map(a=><option value="${a.id}">${a.label || a.line || "Address"}</option>).join("")
    : `<option value="-1">No saved addresses</option>`;
  }
}

function selectAddress(id){
    state.selectedAddress = state.addresses.find(a => String(a.id) === String(id));
    fillAddressForm(state.selectedAddress);
}

function fillAddressForm(a){
    if (!a) { // Clear form if no address selected
        addrLine.value = "";
        addrCity.value = "";
        addrZip.value = "";
        addrNote.value = "";
    } else {
        addrLine.value = a.line || "";
        addrCity.value = a.city || "";
        addrZip.value = a.zip || "";
        addrNote.value = a.note || "";
    }
}

function readAddressForm(){
    return {
        label: `${(addrCity.value || "Address")} - ${(addrZip.value || "")}`.trim(),
        line: addrLine.value.trim(),
        city: addrCity.value.trim(),
        zip: addrZip.value.trim(),
        note: addrNote.value.trim()
    };
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
    state.cartItems = await fetchCartData();
    state.addresses = await fetchAddresses();
    
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

    // Address logic
    if (state.addresses.length > 0) {
      hydrateAddressSelect();
      selectAddress(state.addresses[0].id); // Select first address by default
    } else {
      hydrateAddressSelect();
    }
    
    if (addrSelect) addrSelect.addEventListener("change", e => selectAddress(e.target.value));

    if (addAddressBtn) addAddressBtn.addEventListener("click", () => {
      const blank = { label:"New address", line:"", city:"", zip:"", note:"" };
      state.addresses.push(blank);
      hydrateAddressSelect();
      selectAddress(state.addresses[state.addresses.length - 1].id);
      addrLine.focus();
    });

    if (saveAddressBtn) {
      saveAddressBtn.addEventListener("click", async () => {
          const payload = readAddressForm();
          const isNew = !state.selectedAddress;

          try {
              const savedAddress = await saveAddress(payload, isNew);
              alert("Address saved successfully!");
              state.addresses = await fetchAddresses(); // Re-fetch to get the new ID
              hydrateAddressSelect();
              selectAddress(savedAddress.id);
          } catch (err) {
              alert(err.message);
          }
      });
    }

    if (deleteAddressBtn) {
        deleteAddressBtn.addEventListener("click", async () => {
            if (!state.selectedAddress) {
                alert("No address selected to delete.");
                return;
            }
            try {
                await deleteAddress(state.selectedAddress.id);
                alert("Address deleted successfully!");
                state.addresses = await fetchAddresses();
                hydrateAddressSelect();
                if (state.addresses.length > 0) {
                    selectAddress(state.addresses[0].id);
                } else {
                    fillAddressForm(null);
                }
            } catch (err) {
                alert(err.message);
            }
        });
    }

    // Place order button logic
    if (placeOrderBtn) {
      placeOrderBtn.addEventListener("click", async () => {
        if (state.cartItems.length === 0) {
          alert("Cart is empty.");
          return;
        }

        try {
          const orderResponse = await placeOrder();
          alert(`Order placed successfully! Order ID: ${orderResponse.id}`);
          window.location.href = '/order-confirmation.html';
        } catch (err) {
          alert(err.message);
        }
      });
    }
  } catch (error) {
    console.error("Initialization error:", error);
    if (reviewList) reviewList.innerHTML = `<li class="review-item"><p style="color:red;">Failed to load checkout data. Please check if you are logged in.</p></li>`;
  }
  

  render();
})();