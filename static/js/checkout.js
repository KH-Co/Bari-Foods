import { catalog } from "../../assets/data/catalog.mjs";

const DELIVERY_BASE = 30.0;
const FREE_SHIP_THRESHOLD = 499.0;
const SERVICE_FEE_RATE = 0.02;

const reviewList = document.getElementById("reviewList");
const sumItems = document.getElementById("sumItems");
const sumDelivery = document.getElementById("sumDelivery");
const sumService = document.getElementById("sumService");
const sumTotal = document.getElementById("sumTotal");
const placeOrderBtn = document.getElementById("placeOrder");

const addrSelect = document.getElementById("addrSelect");
const addAddressBtn = document.getElementById("addAddressBtn");
const saveAddressBtn = document.getElementById("saveAddressBtn");
const deleteAddressBtn = document.getElementById("deleteAddressBtn");
const addrLine = document.getElementById("addrLine");
const addrCity = document.getElementById("addrCity");
const addrZip = document.getElementById("addrZip");
const addrNote = document.getElementById("addrNote");

const payList = document.getElementById("payList");
const cardForm = document.getElementById("cardForm");
const upiForm = document.getElementById("upiForm");

const state = { addresses: [], addressIndex: -1, payment: "cod" };

function loadCartLS() {
  try {
    return JSON.parse(localStorage.getItem("cartItems")) || {};
  } catch (e) {
    return {};
  }
}
function saveCartLS(o) {
  localStorage.setItem("cartItems", JSON.stringify(o));
}
function loadAddresses() {
  try {
    return JSON.parse(localStorage.getItem("addresses")) || [];
  } catch (e) {
    return [];
  }
}
function saveAddresses(a) {
  localStorage.setItem("addresses", JSON.stringify(a));
}
function saveLastPayment(v) {
  localStorage.setItem("lastPayment", v);
}
function loadLastPayment() {
  return localStorage.getItem("lastPayment") || "cod";
}

function byId(id) {
  return catalog.find((p) => p.id === id);
}
function money(n) {
  return "₹ " + (+n).toFixed(2);
}

function render() {
  const items = loadCartLS();
  const ids = Object.keys(items);
  let itemsSubtotal = 0;

  reviewList.innerHTML = ids
    .map((id) => {
      const p = byId(id);
      const qty = items[id];
      if (!p) return "";
      itemsSubtotal += p.price * qty;
      return `<li class="review-item" data-id="${id}"> <div class="review-thumb"><img src="${
        (p.images && p.images) || ""
      }" alt="${p.name}"></div> <div> <div>${
        p.name
      }</div> <small class="muted">${
        p.weight || ""
      }</small> </div> <div class="qty-badge">×${qty}</div> </li>`;
    })
    .join("");

  const delivery =
    itemsSubtotal === 0
      ? 0
      : itemsSubtotal >= FREE_SHIP_THRESHOLD
      ? 0
      : DELIVERY_BASE;
  const service = +(itemsSubtotal * SERVICE_FEE_RATE).toFixed(2);
  const grand = Math.max(0, itemsSubtotal + delivery + service);

  sumItems.textContent = money(itemsSubtotal);
  sumDelivery.textContent = money(delivery);
  sumService.textContent = money(service);
  sumTotal.textContent = money(grand);
}

function hydrateAddressSelect() {
  addrSelect.innerHTML = state.addresses.length ? (
    state.addresses
      .map((a, i) => <option value="${i}">${a.label || a.line}</option>)
      .join("")
  ) : (
    <option value="-1">No saved addresses</option>
  );
  addrSelect.value = String(state.addressIndex);
}
function fillAddressForm(a) {
  addrLine.value = a?.line || "";
  addrCity.value = a?.city || "";
  addrZip.value = a?.zip || "";
  addrNote.value = a?.note || "";
}
function readAddressForm() {
  return {
    label: `${(addrCity.value || "Address").trim()} - ${(addrZip.value || "").trim()}`,
    line: addrLine.value.trim(),
    city: addrCity.value.trim(),
    zip: addrZip.value.trim(),
    note: addrNote.value.trim(),
  };
}
function selectAddress(idx) {
  state.addressIndex = +idx;
  const a = state.addresses[idx];
  fillAddressForm(a);
  hydrateAddressSelect();
}

function applyPaymentUI() {
  cardForm.classList.toggle("hidden", state.payment !== "card");
  upiForm.classList.toggle("hidden", state.payment !== "upi");
  saveLastPayment(state.payment);
}

(function init() {
  state.addresses = loadAddresses();
  if (state.addresses.length === 0) {
    state.addresses = [
      {
        label: "Home - 35624",
        line: "2118 Thornridge Cir",
        city: "Syracuse",
        zip: "35624",
        note: "",
      },
    ];
    saveAddresses(state.addresses);
  }
  state.addressIndex = 0;
  hydrateAddressSelect();
  fillAddressForm(state.addresses);

  addrSelect.addEventListener("change", (e) => selectAddress(e.target.value));
  addAddressBtn.addEventListener("click", () => {
    const blank = {
      label: "New address",
      line: "",
      city: "",
      zip: "",
      note: "",
    };
    state.addresses.push(blank);
    state.addressIndex = state.addresses.length - 1;
    saveAddresses(state.addresses);
    hydrateAddressSelect();
    fillAddressForm(blank);
    addrLine.focus();
  });
  saveAddressBtn.addEventListener("click", () => {
    if (state.addressIndex < 0) return;
    state.addresses[state.addressIndex] = readAddressForm();
    saveAddresses(state.addresses);
    hydrateAddressSelect();
    alert("Address saved");
  });
  deleteAddressBtn.addEventListener("click", () => {
    if (state.addressIndex < 0) return;
    state.addresses.splice(state.addressIndex, 1);
    if (state.addresses.length === 0) {
      state.addressIndex = -1;
      saveAddresses(state.addresses);
      hydrateAddressSelect();
      fillAddressForm({});
    } else {
      state.addressIndex = Math.max(0, state.addressIndex - 1);
      saveAddresses(state.addresses);
      hydrateAddressSelect();
      fillAddressForm(state.addresses[state.addressIndex]);
    }
  });

  state.payment = loadLastPayment();
  const radios = payList.querySelectorAll('input[name="pay"]');
  radios.forEach((r) => {
    r.checked = r.value === state.payment;
    r.addEventListener("change", () => {
      if (r.checked) {
        state.payment = r.value;
        applyPaymentUI();
      }
    });
  });
  applyPaymentUI();

  placeOrderBtn.addEventListener("click", () => {
    const items = loadCartLS();
    if (Object.keys(items).length === 0) {
      alert("Cart is empty.");
      return;
    }
    alert("Order placed! Thank you for shopping with BariFoods.");
    saveCartLS({});
    render();
  });

  render();
})();
