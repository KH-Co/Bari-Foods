import { catalog } from "../../assets/data/catalog.mjs";

const DELIVERY_BASE = 30.0;
const FREE_SHIP_THRESHOLD = 499.0;
const SERVICE_FEE_RATE = 0.02;

// Summary DOM
const reviewList = document.getElementById("reviewList");
const sumItems = document.getElementById("sumItems");
const sumDelivery = document.getElementById("sumDelivery");
const sumService = document.getElementById("sumService");
const sumTotal = document.getElementById("sumTotal");
const placeOrderBtn = document.getElementById("placeOrder");

// Address DOM
const addrSelect = document.getElementById("addrSelect");
const addAddressBtn = document.getElementById("addAddressBtn");
const saveAddressBtn = document.getElementById("saveAddressBtn");
const deleteAddressBtn = document.getElementById("deleteAddressBtn");
const addrLine = document.getElementById("addrLine");
const addrCity = document.getElementById("addrCity");
const addrZip = document.getElementById("addrZip");
const addrNote = document.getElementById("addrNote");

// Payment DOM
const payList = document.getElementById("payList");
const cardForm = document.getElementById("cardForm");
const upiForm = document.getElementById("upiForm");

// State
const state = { addresses: [], addressIndex: -1, payment: "cod" };

// Storage utils (guarded)
function loadCartLS(){ try { return JSON.parse(localStorage.getItem("cartItems")) || {}; } catch { return {}; } } 
function saveCartLS(o){ localStorage.setItem("cartItems", JSON.stringify(o)); }
function loadAddresses(){ try { return JSON.parse(localStorage.getItem("addresses")) || []; } catch { return []; } } 
function saveAddresses(a){ localStorage.setItem("addresses", JSON.stringify(a)); }
function saveLastPayment(v){ localStorage.setItem("lastPayment", v); }
function loadLastPayment(){ return localStorage.getItem("lastPayment") || "cod"; } 

function byId(id){ return catalog.find(p => p.id === id); }
function money(n){ return "₹ " + (+n).toFixed(2); }

// ---- Database calls (adjust endpoint URLs) ----
async function saveAddressToDB(address){
// Replace with your real endpoint (Express, Next API route, etc.)
// Example: POST /api/addresses {label,line,city,zip,note}
const res = await fetch("/api/addresses", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(address)
});
if (!res.ok) throw new Error("Failed to save address");
return res.json();
}

// ---- Render cart review + totals ----
function render(){
const items = loadCartLS();
const ids = Object.keys(items);
let itemsSubtotal = 0;

reviewList.innerHTML = ids.map(id => {
const p = byId(id);
const qty = items[id];
if (!p) return "";
itemsSubtotal += p.price * qty;
const img = (p.images && p.images) || "";
return `<li class="review-item" data-id="${id}"> <div class="review-thumb"><img src="${img}" alt="${p.name}"/></div> <div> <div>${p.name}</div> <small class="muted">${p.weight || ""}</small> </div> <div class="qty-badge">×${qty}</div> </li>` ;
}).join("");

const delivery = itemsSubtotal === 0 ? 0 : (itemsSubtotal >= FREE_SHIP_THRESHOLD ? 0 : DELIVERY_BASE);
const service = +(itemsSubtotal * SERVICE_FEE_RATE).toFixed(2);
const grand = Math.max(0, itemsSubtotal + delivery + service);

sumItems.textContent = money(itemsSubtotal);
sumDelivery.textContent = money(delivery);
sumService.textContent = money(service);
sumTotal.textContent = money(grand);
}

// ---- Address helpers ----
function hydrateAddressSelect(){
addrSelect.innerHTML = state.addresses.length
? state.addresses.map((a,i)=><option value="${i}">${a.label || a.line || "Address "+(i+1)}</option>).join("")
: <option value="-1">No saved addresses</option>;
addrSelect.value = String(state.addressIndex);
}
function fillAddressForm(a){
addrLine.value = a?.line || "";
addrCity.value = a?.city || "";
addrZip.value = a?.zip || "";
addrNote.value = a?.note || "";
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
function selectAddress(idx){
state.addressIndex = +idx;
const a = state.addresses[state.addressIndex];
fillAddressForm(a || {});
hydrateAddressSelect();
}

// ---- Payment UI ----
function applyPaymentUI(){
const val = state.payment;
cardForm.classList.toggle("hidden", val !== "card");
upiForm.classList.toggle("hidden", val !== "upi");
saveLastPayment(val);
}

// ---- Init ----
(function init(){
// 1) Addresses
state.addresses = loadAddresses();
if (state.addresses.length === 0){
state.addresses = [{
label: "Home - 35624",
line: "2118 Thornridge Cir",
city: "Syracuse",
zip: "35624",
note: ""
}];
saveAddresses(state.addresses);
}
state.addressIndex = 0;
hydrateAddressSelect();
fillAddressForm(state.addresses);

// 2) Address events
addrSelect.addEventListener("change", e => selectAddress(e.target.value));
addAddressBtn.addEventListener("click", ()=>{
const blank = { label:"New address", line:"", city:"", zip:"", note:"" };
state.addresses.push(blank);
state.addressIndex = state.addresses.length - 1;
saveAddresses(state.addresses);
hydrateAddressSelect();
fillAddressForm(blank);
addrLine.focus();
});

saveAddressBtn.addEventListener("click", async ()=>{
if (state.addressIndex < 0) return;
const payload = readAddressForm();
// Optimistic UI: update local first
state.addresses[state.addressIndex] = payload;
saveAddresses(state.addresses);
hydrateAddressSelect();
try{
const saved = await saveAddressToDB(payload);
// If backend returns canonical address/id, merge/update here
// Example: state.addresses[state.addressIndex].id = saved.id;
alert("Address saved");
}catch(err){
console.error(err);
alert("Could not save to server. Address saved locally.");
}
});

deleteAddressBtn.addEventListener("click", ()=>{
if (state.addressIndex < 0) return;
state.addresses.splice(state.addressIndex, 1);
if (state.addresses.length === 0){
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

// 3) Payment radios
state.payment = loadLastPayment();
const radios = payList.querySelectorAll('input[name="pay"]');
radios.forEach(r=>{
r.checked = r.value === state.payment;
r.addEventListener("change", ()=>{
if (r.checked){
state.payment = r.value;
applyPaymentUI();
}
});
});
applyPaymentUI();

// 4) Place order
placeOrderBtn.addEventListener("click", ()=>{
  const items = loadCartLS();
  if (Object.keys(items).length === 0){
  alert("Cart is empty.");
  return;
}

const addr = state.addresses[state.addressIndex] || readAddressForm();
const totals = {
  items: sumItems.textContent,
  delivery: sumDelivery.textContent,
  service: sumService.textContent,
  grand: sumTotal.textContent
};

const order = { items, address: addr, payment: state.payment, totals, ts: Date.now() };
  localStorage.setItem("lastOrder", JSON.stringify(order));
  saveCartLS({});
  render();
  alert("Order placed! Thank you for shopping with BariFoods.");
  // Optionally POST order to backend here with fetch just like address
});

// 5) Finally render items and totals
render();
})();