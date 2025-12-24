/* Base URL for backend */
const BASE_URL = "http://127.0.0.1:8000";

const DOM = {
  orderId: document.getElementById("orderId"),
  orderDate: document.getElementById("orderDate"),
  totalAmount: document.getElementById("totalAmount"),
  paymentMethod: document.getElementById("paymentMethod"),
  deliveryAddress: document.getElementById("deliveryAddress"),
  estimatedDelivery: document.getElementById("estimatedDelivery"),
  orderItemsList: document.getElementById("orderItemsList")
};

// State
const state = {
  orderData: null,
  loading: true
};

// ---- Database calls ----
async function fetchLatestOrder() {
  try {
    const res = await fetch(`${BASE_URL}/api/orders/latest/`);
    if (!res.ok) throw new Error("Failed to fetch order data");
    return res.json();
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

// ---- Utility functions ----
function formatDate(dateString) {
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function calculateEstimatedDelivery(orderDate) {
  const date = new Date(orderDate);
  date.setDate(date.getDate() + 5); // Add 5 days for delivery
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatPaymentMethod(method) {
  const methods = {
    'cod': 'Cash on Delivery',
    'card': 'Credit/Debit Card',
    'upi': 'UPI Payment',
    'razorpay': 'RazorPay'
  };
  return methods[method] || 'Cash on Delivery';
}

// ---- Render functions ----
function renderOrderDetails(order) {
  if (!order) {
    DOM.orderId.textContent = "N/A";
    DOM.orderDate.textContent = "N/A";
    DOM.totalAmount.textContent = "₹ 0.00";
    DOM.paymentMethod.textContent = "N/A";
    DOM.deliveryAddress.innerHTML = "<p>No delivery address available.</p>";
    DOM.estimatedDelivery.textContent = "N/A";
    DOM.orderItemsList.innerHTML = "<li class='item'><p>No items found.</p></li>";
    return;
  }

  // Order ID
  DOM.orderId.textContent = `#${order.id || 'N/A'}`;

  // Order Date
  DOM.orderDate.textContent = order.created_at ? formatDate(order.created_at) : new Date().toLocaleDateString();

  // Total Amount
  DOM.totalAmount.textContent = `₹ ${parseFloat(order.total_amount || 0).toFixed(2)}`;

  // Payment Method
  DOM.paymentMethod.textContent = formatPaymentMethod(order.payment_method);

  // Delivery Address
  if (order.delivery_address) {
    const addr = order.delivery_address;
    DOM.deliveryAddress.innerHTML = `
      <strong>${addr.label || 'Delivery Address'}</strong><br>
      ${addr.line || ''}<br>
      ${addr.city || ''}, ${addr.zip || ''}<br>
      ${addr.note ? `<em>Note: ${addr.note}</em>` : ''}
    `;
  } else {
    DOM.deliveryAddress.innerHTML = "<p>No delivery address provided.</p>";
  }

  // Estimated Delivery
  DOM.estimatedDelivery.textContent = order.created_at
    ? calculateEstimatedDelivery(order.created_at)
    : "3-5 business days";

  // Order Items
  if (order.items && order.items.length > 0) {
    DOM.orderItemsList.innerHTML = order.items.map(item => {
      const product = item.product;
      const quantity = item.quantity;
      const price = parseFloat(product.price || 0);
      const total = (price * quantity).toFixed(2);
      const imageUrl = product.image ? `${BASE_URL}${product.image}` : "";

      return `
        <li class="item">
          <div class="item-thumb">
            <img src="${imageUrl}" alt="${product.name || 'Product'}" />
          </div>
          <div class="item-info">
            <div class="item-name">${product.name || 'Unknown Product'}</div>
            <div class="item-weight">${product.weight || ''}</div>
          </div>
          <div class="item-price">
            <span class="item-quantity">Qty: ${quantity}</span>
            <span class="item-total">₹ ${total}</span>
          </div>
        </li>
      `;
    }).join("");
  } else {
    DOM.orderItemsList.innerHTML = "<li class='item'><p>No items in this order.</p></li>";
  }
}

// ---- Init ----
(async function init() {
  try {
    // Try to get order ID from URL params first
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');

    // If order ID is in URL, fetch that specific order
    // Otherwise, fetch the latest order
    let orderData;
    if (orderId) {
      const res = await fetch(`${BASE_URL}/api/orders/${orderId}/`);
      if (res.ok) {
        orderData = await res.json();
      } else {
        orderData = await fetchLatestOrder();
      }
    } else {
      orderData = await fetchLatestOrder();
    }

    state.orderData = orderData;
    state.loading = false;

    renderOrderDetails(orderData);
  } catch (error) {
    console.error("Initialization error:", error);
    state.loading = false;

    // Show error message
    if (DOM.orderId) DOM.orderId.textContent = "Error loading order";
    if (DOM.orderItemsList) {
      DOM.orderItemsList.innerHTML = `
        <li class="item" style="text-align: center; color: #c63a22;">
          <p>Failed to load order details. Please check your connection and try again.</p>
        </li>
      `;
    }
  }
})();