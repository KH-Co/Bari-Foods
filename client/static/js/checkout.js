/* Base URL for backend */
const BASE_URL = "http://127.0.0.1:8000";

// Summary DOM
const reviewList = document.getElementById("reviewList");
const sumItems = document.getElementById("sumItems");
const sumDelivery = document.getElementById("sumDelivery");
const sumService = document.getElementById("sumService");
const sumTotal = document.getElementById("sumTotal");
const placeOrderBtn = document.getElementById("placeOrder");

// Address DOM - NEW
const addressList = document.getElementById("addressList");
const addressCount = document.getElementById("addressCount");
const addNewAddressBtn = document.getElementById("addNewAddressBtn");
const deliverBtn = document.getElementById("deliverBtn");

// Payment DOM
const payList = document.getElementById("payList");
const cardForm = document.getElementById("cardForm");
const upiForm = document.getElementById("upiForm");

// State
const state = {
  cartItems: [],
  addresses: [],
  selectedAddress: null,
  payment: "cod"
};

const CONFIG = {
  FREE_SHIP_THRESHOLD: 499.0,
  DELIVERY_BASE: 30.0,
  SERVICE_FEE_RATE: 0.02
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
    body: JSON.stringify({
      address_id: state.selectedAddress ? state.selectedAddress.id : null,
      payment_method: state.payment
    })
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to place order.");
  }
  return res.json();
}

// ---- NEW Custom Alert Function ----
function showCustomAlert(title, message, icon = "✓") {
  const alertHtml = `
    <div class="custom-alert-overlay" id="customAlert">
      <div class="custom-alert-box">
        <div class="custom-alert-icon">${icon}</div>
        <div class="custom-alert-title">${title}</div>
        <div class="custom-alert-message">${message}</div>
        <button class="custom-alert-button" id="alertOkBtn">OK</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', alertHtml);

  const alertElement = document.getElementById('customAlert');
  const okBtn = document.getElementById('alertOkBtn');

  okBtn.addEventListener('click', () => {
    alertElement.remove();
  });

  // Also close on overlay click
  alertElement.addEventListener('click', (e) => {
    if (e.target === alertElement) {
      alertElement.remove();
    }
  });
}

// ---- Render cart review + totals ----
function render() {
  const { cartItems } = state;
  let itemsSubtotal = 0;

  if (!cartItems || cartItems.length === 0) {
    if (reviewList) reviewList.innerHTML = `<li class="review-item"><p>Your cart is empty.</p></li>`;
    if (sumItems) sumItems.textContent = "\u20B9 0.00";
    if (sumDelivery) sumDelivery.textContent = "\u20B9 0.00";
    if (sumService) sumService.textContent = "\u20B9 0.00";
    if (sumTotal) sumTotal.textContent = "\u20B9 0.00";
    if (placeOrderBtn) placeOrderBtn.disabled = true;
    return;
  }

  if (reviewList) {
    reviewList.innerHTML = cartItems.map(item => {
      const p = item.product;
      const qty = item.quantity;
      itemsSubtotal += parseFloat(p.price) * qty;
      const imageUrl = p.image ? `${BASE_URL}${p.image}` : "/static/img/placeholder.png";

      return `
        <li class="review-item" data-id="${item.id}"> 
            <div class="review-thumb">
                <img src="${imageUrl}" alt="${p.name}" onerror="this.src='/static/img/placeholder.png'"/>
            </div> 
            <div class="review-info"> 
                <div class="review-name">${p.name}</div> 
                <small class="muted">${p.weight || ""}</small> 
                <div class="review-price">\u20B9${parseFloat(p.price).toFixed(2)}</div>
            </div> 
            <div class="qty-badge">Qty: ${qty}</div> 
        </li>`;
    }).join("");
  }

  const delivery = itemsSubtotal === 0 ? 0 : (itemsSubtotal >= CONFIG.FREE_SHIP_THRESHOLD ? 0 : CONFIG.DELIVERY_BASE);
  const service = +(itemsSubtotal * CONFIG.SERVICE_FEE_RATE).toFixed(2);
  const grand = Math.max(0, itemsSubtotal + delivery + service);

  if (sumItems) sumItems.textContent = `\u20B9 ${itemsSubtotal.toFixed(2)}`;
  if (sumDelivery) sumDelivery.textContent = `\u20B9 ${delivery.toFixed(2)}`;
  if (sumService) sumService.textContent = `\u20B9 ${service.toFixed(2)}`;
  if (sumTotal) sumTotal.textContent = `\u20B9 ${grand.toFixed(2)}`;

  if (placeOrderBtn) placeOrderBtn.disabled = false;
}

// ---- NEW Address Rendering ----
function renderAddresses() {
  if (!addressList) return;
  
  if (addressCount) {
    addressCount.textContent = state.addresses.length;
  }

  if (state.addresses.length === 0) {
    addressList.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #d8c2af;">
        <p>No saved addresses yet. Click below to add your first delivery address.</p>
      </div>
    `;
    if (deliverBtn) deliverBtn.disabled = true;
    return;
  }

  addressList.innerHTML = state.addresses.map((addr, index) => {
    const name = addr.name || "Address";
    const street = addr.street || addr.line || "";
    const city = addr.city || "";
    const stateVal = addr.state || "";
    const pincode = addr.pincode || addr.zip || "";
    const phone = addr.phone || "";
    
    const fullAddress = `${street}, ${city}, ${stateVal}, ${pincode}, India`.replace(/, ,/g, ',');
    const isSelected = state.selectedAddress && state.selectedAddress.id === addr.id;

    return `
      <div class="address-card ${isSelected ? 'selected' : ''}" data-id="${addr.id}">
        <input 
          type="radio" 
          name="address" 
          value="${addr.id}" 
          class="address-radio"
          ${isSelected ? 'checked' : ''}
        />
        <div class="address-info">
          <div class="address-name">${name}</div>
          <div class="address-details">${fullAddress}</div>
          ${phone ? `<div class="address-phone">Phone number: ${phone}</div>` : ''}
        </div>
        <div class="address-actions">
          <button class="edit-address" data-id="${addr.id}">Edit</button>
          <button class="delete-address" data-id="${addr.id}">Delete</button>
        </div>
      </div>
    `;
  }).join("");

  // Add event listeners to address cards
  document.querySelectorAll('.address-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('edit-address') || 
          e.target.classList.contains('delete-address')) {
        return; // Let button handlers deal with this
      }
      const id = card.dataset.id;
      selectAddressById(id);
    });
  });

  // Edit button handlers
  document.querySelectorAll('.edit-address').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      openAddressForm(id);
    });
  });

  // Delete button handlers
  document.querySelectorAll('.delete-address').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      await handleDeleteAddress(id);
    });
  });

  // Enable deliver button if address selected
  if (deliverBtn) {
    deliverBtn.disabled = !state.selectedAddress;
  }
}

function selectAddressById(id) {
  state.selectedAddress = state.addresses.find(a => String(a.id) === String(id));
  renderAddresses();
}

async function handleDeleteAddress(id) {
  if (!confirm("Are you sure you want to delete this address?")) return;

  try {
    await deleteAddress(id);
    showCustomAlert("Deleted", "Address deleted successfully!", "✓");
    state.addresses = await fetchAddresses();
    
    // Clear selection if deleted address was selected
    if (state.selectedAddress && String(state.selectedAddress.id) === String(id)) {
      state.selectedAddress = null;
    }
    
    // Auto-select first address if available
    if (state.addresses.length > 0 && !state.selectedAddress) {
      state.selectedAddress = state.addresses[0];
    }
    
    renderAddresses();
  } catch (err) {
    showCustomAlert("Error", "Failed to delete address: " + err.message, "✕");
  }
}

function openAddressForm(addressId = null) {
  console.log('openAddressForm called with ID:', addressId);
  
  const address = addressId ? state.addresses.find(a => String(a.id) === String(addressId)) : null;
  
  const name = address ? (address.name || "") : "";
  const street = address ? (address.street || address.line || "") : "";
  const city = address ? (address.city || "") : "";
  const stateVal = address ? (address.state || "") : "";
  const pincode = address ? (address.pincode || address.zip || "") : "";
  const phone = address ? (address.phone || "") : "";
  const type = address ? (address.type || "home") : "home";

  const formHtml = `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.2s ease-out;" id="addressFormModal">
      <div style="background: linear-gradient(145deg, rgba(42, 21, 21, 0.98) 0%, rgba(21, 22, 27, 1) 100%); border: 2px solid rgba(233, 181, 64, 0.4); border-radius: 24px; padding: 40px; max-width: 650px; width: 100%; box-shadow: 0 25px 80px rgba(0, 0, 0, 0.9); animation: slideUp 0.3s ease-out;">
        <h3 style="color: #f7d2c4; margin-bottom: 32px; font-size: 28px; text-align: center; font-family: 'Playfair Display', Georgia, serif; font-weight: 700;">${address ? 'Edit' : 'Add New'} Delivery Address</h3>
        
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <label class="field">
            <span class="label">Full Name *</span>
            <input type="text" id="formName" value="${name}" placeholder="Enter your full name" required />
          </label>

          <label class="field">
            <span class="label">Phone Number *</span>
            <input type="tel" id="formPhone" value="${phone}" placeholder="10-digit mobile number" pattern="[0-9]{10}" required />
          </label>

          <label class="field">
            <span class="label">Street Address *</span>
            <input type="text" id="formStreet" value="${street}" placeholder="House no, Building name, Street" required />
          </label>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <label class="field">
              <span class="label">City *</span>
              <input type="text" id="formCity" value="${city}" placeholder="City" required />
            </label>

            <label class="field">
              <span class="label">State *</span>
              <input type="text" id="formState" value="${stateVal}" placeholder="State" required />
            </label>
          </div>

          <label class="field">
            <span class="label">PIN Code *</span>
            <input type="text" id="formPincode" value="${pincode}" placeholder="6-digit PIN code" pattern="[0-9]{6}" required />
          </label>

          <label class="field">
            <span class="label">Address Type</span>
            <select id="formType">
              <option value="home" ${type === 'home' ? 'selected' : ''}>Home</option>
              <option value="office" ${type === 'office' ? 'selected' : ''}>Office</option>
              <option value="other" ${type === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </label>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 12px;">
            <button id="saveAddressForm" class="primary" style="margin: 0; padding: 16px 24px; font-size: 16px; font-weight: 600;">SAVE ADDRESS</button>
            <button id="cancelAddressForm" style="padding: 16px 24px; font-size: 16px; font-weight: 600; background: rgba(255,255,255,0.08); border: 2px solid rgba(233, 181, 64, 0.3); color: #d8c2af; border-radius: 20px; cursor: pointer; transition: all 0.3s ease;">CANCEL</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove any existing modal first
  const existingModal = document.getElementById('addressFormModal');
  if (existingModal) {
    existingModal.remove();
  }

  document.body.insertAdjacentHTML('beforeend', formHtml);
  console.log('Modal HTML inserted');

  // Add CSS animations if not already added
  if (!document.getElementById('modalAnimationStyles')) {
    const style = document.createElement('style');
    style.id = 'modalAnimationStyles';
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      #cancelAddressForm:hover {
        background: rgba(255,255,255,0.12) !important;
        border-color: rgba(233, 181, 64, 0.5) !important;
      }
    `;
    document.head.appendChild(style);
  }

  const cancelBtn = document.getElementById('cancelAddressForm');
  const saveBtn = document.getElementById('saveAddressForm');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      console.log('Cancel clicked');
      const modal = document.getElementById('addressFormModal');
      if (modal) modal.remove();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      console.log('Save clicked');
      const formData = {
        name: document.getElementById('formName').value.trim(),
        phone: document.getElementById('formPhone').value.trim(),
        street: document.getElementById('formStreet').value.trim(),
        city: document.getElementById('formCity').value.trim(),
        state: document.getElementById('formState').value.trim(),
        pincode: document.getElementById('formPincode').value.trim(),
        type: document.getElementById('formType').value
      };

      console.log('Form data:', formData);

      if (!formData.name || !formData.phone || !formData.street || !formData.city || !formData.state || !formData.pincode) {
        showCustomAlert("Missing Information", "Please fill in all required fields.", "⚠️");
        return;
      }

      if (!/^[0-9]{10}$/.test(formData.phone)) {
        showCustomAlert("Invalid Phone", "Please enter a valid 10-digit phone number.", "⚠️");
        return;
      }

      if (!/^[0-9]{6}$/.test(formData.pincode)) {
        showCustomAlert("Invalid PIN Code", "Please enter a valid 6-digit PIN code.", "⚠️");
        return;
      }

      try {
        const isNew = !address;
        if (!isNew) {
          formData.id = address.id;
        }

        const savedAddress = await saveAddress(formData, isNew);
        showCustomAlert("Success!", "Address saved successfully.", "✓");
        
        state.addresses = await fetchAddresses();
        state.selectedAddress = savedAddress;
        
        renderAddresses();
        const modal = document.getElementById('addressFormModal');
        if (modal) modal.remove();
      } catch (err) {
        console.error('Save error:', err);
        showCustomAlert("Error", "Failed to save address: " + err.message, "✕");
      }
    });
  }
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
    const [cartData, addressData] = await Promise.all([
      fetchCartData(),
      fetchAddresses()
    ]);

    state.cartItems = cartData;
    state.addresses = Array.isArray(addressData) ? addressData : [];

    // Auto-select first address if available
    if (state.addresses.length > 0) {
      state.selectedAddress = state.addresses[0];
    }

    // Payment Logic
    if (payList) {
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
    }
    applyPaymentUI();

    // Address UI
    renderAddresses();

    // Add New Address Button
    const addBtn = document.getElementById('addNewAddressBtn');
    if (addBtn) {
      console.log('Add New Address button found');
      addBtn.addEventListener('click', () => {
        console.log('Add New Address clicked');
        openAddressForm();
      });
    } else {
      console.error('Add New Address button NOT found');
    }

    if (deliverBtn) {
      deliverBtn.addEventListener('click', () => {
        if (!state.selectedAddress) {
          showCustomAlert("No Address Selected", "Please select a delivery address first.", "⚠️");
          return;
        }

        // Close delivery section
        const deliveryBlock = document.querySelector('.block[open]');
        if (deliveryBlock) {
          deliveryBlock.removeAttribute('open');
        }

        // Open payment section
        const paymentBlock = document.querySelectorAll('.block')[1];
        if (paymentBlock) {
          paymentBlock.setAttribute('open', '');
          paymentBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Show confirmation
        const addressName = state.selectedAddress.name || "Address";
        const addressCity = state.selectedAddress.city || "";
        showCustomAlert(
          "Address Confirmed!", 
          `Delivery will be made to ${addressName}, ${addressCity}. Please select your payment method below.`,
          "✓"
        );
      });
    }

    if (placeOrderBtn) {
      placeOrderBtn.addEventListener("click", async () => {
        if (state.cartItems.length === 0) {
          showCustomAlert("Empty Cart", "Your cart is empty.", "⚠️");
          return;
        }

        if (!state.selectedAddress) {
          showCustomAlert("No Address", "Please select a delivery address first.", "⚠️");
          return;
        }

        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = "Processing...";

        try {
          const orderResponse = await placeOrder();
          showCustomAlert("Order Placed!", `Order confirmed! Order ID: ${orderResponse.id || 'Confirmed'}`, "✓");
          setTimeout(() => {
            window.location.href = '/order-confirmation.html';
          }, 2000);
        } catch (err) {
          showCustomAlert("Error", err.message, "✕");
          placeOrderBtn.disabled = false;
          placeOrderBtn.textContent = "Place Order";
        }
      });
    }
  } catch (error) {
    console.error("Initialization error:", error);
    if (reviewList) reviewList.innerHTML = `<li class="review-item"><p style="color:red;">Error loading data. ${error.message}</p></li>`;
  }

  render();
})();