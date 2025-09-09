
const BASE_URL = "http://127.0.0.1:8000";
const viewport = document.getElementById("popViewport");
const track = document.getElementById("popTrack");
const prevBtn = document.getElementById("popPrev");
const nextBtn = document.getElementById("popNext");

let authModalInstance = null;
let totalProducts = [];

// --- Helper functions for toasts and cart badge ---
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

async function addToCart(productId, qty = 1) {
  try {
    const response = await fetch(`${BASE_URL}/api/cart/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity: qty }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to add item to cart.');
    }
    const items = loadCartLS();
    items[productId] = (items[productId] || 0) + qty;
    saveCartLS(items);
    showAddToCartToast();
    return true;
  } catch (error) {
    console.error("Error adding to cart:", error);
    showErrorToast(error.message);
    return false;
  }
}

function showAddToCartToast() {
  const toast = document.createElement('div');
  toast.innerHTML = `
    <div style="
      position: fixed; top: 100px; right: 20px;
      background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
      color: white; padding: 16px 24px; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      font-weight: 600; font-size: 14px; z-index: 10000;
      transform: translateX(100%); transition: transform 0.3s ease-out;
      display: flex; align-items: center; gap: 8px;
    ">
      <i class="fas fa-check-circle"></i>
      Added to cart successfully!
    </div>
  `;
  document.body.appendChild(toast);
  const toastElement = toast.firstElementChild;
  setTimeout(() => { toastElement.style.transform = 'translateX(0)'; }, 10);
  setTimeout(() => { document.body.removeChild(toast); }, 2500);
}

function showErrorToast(message) {
  const toast = document.createElement('div');
  toast.innerHTML = `
    <div style="
      position: fixed; top: 100px; right: 20px;
      background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
      color: white; padding: 16px 24px; border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      font-weight: 600; font-size: 14px; z-index: 10000;
      transform: translateX(100%); transition: transform 0.3s ease-out;
      display: flex; align-items: center; gap: 8px;
    ">
      <i class="fas fa-times-circle"></i>
      ${message}
    </div>
  `;
  document.body.appendChild(toast);
  const toastElement = toast.firstElementChild;
  setTimeout(() => { toastElement.style.transform = 'translateX(0)'; }, 10);
  setTimeout(() => { document.body.removeChild(toast); }, 2500);
}

// **UPDATED** - This function creates the HTML from API data
function cardHTML(fp) {
  const p = fp.product;
  const img = p.image ? `${BASE_URL}${p.image}` : "/assets/img/placeholder.png";
  const rating = p.rating ? '★'.repeat(Math.round(p.rating)) : '';
  const price = parseFloat(p.price).toFixed(2);
  const uniqueId = p.id;
  
  return `
    <div class="pop-slide">
      <div class="home-product-card" data-product-id="${uniqueId}">
        <div class="home-prod-img">
          <img src="${img}" alt="${p.name}" loading="lazy">
        </div>
        <div class="home-prod-details">
          <div class="home-prod-title">${p.name}</div>
          <div class="home-prod-desc">${p.weight || p.description || ""}</div>
          ${rating ? `<div class="home-prod-rating" style="color: #e9b540; font-size: 14px; margin: 8px 0;">${rating}</div>` : ''}
          <div class="home-prod-meta">
            <div class="home-prod-price">₹${price}</div>
            <button class="home-add-btn" data-id="${uniqueId}" type="button">
              <i class="fas fa-cart-plus" style="font-size: 12px;"></i>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// **UPDATED** - Main function to fetch and render popular products
async function fetchAndRenderPopularProducts() {
    const popTrack = document.getElementById("popTrack");
    if (!popTrack) return;

    try {
        const response = await fetch(`${BASE_URL}/api/featured-products/`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const featuredProducts = await response.json();
        totalProducts = featuredProducts.map(fp => fp.product);
        
        popTrack.innerHTML = '';
        popTrack.innerHTML = featuredProducts.slice(0, 6).map(cardHTML).join("");
        
        renderCarousel();
        addScrollAnimations();
        wireEvents();
        
    } catch (error) {
        console.error("Error fetching products:", error);
        popTrack.innerHTML = `<p style="text-align:center; color: red;">Failed to load products. Please check the backend server.</p>`;
    }
}

// --- Carousel Logic (Unchanged) ---
function renderCarousel() {
    layout();
    updateNavButtons();
}

let page = 0;
let pages = 1;
let perPage = 3;
let slideW = 0;
let isAnimating = false;

function layout() {
    // **UPDATED** - Use totalProducts here instead of the old 'popular' array
    const total = totalProducts.length;
    if (!track || !viewport) return;
    const vpWidth = viewport.clientWidth;
    
    if (vpWidth < 640) perPage = 1;
    else if (vpWidth < 1024) perPage = 2;
    else perPage = 3;
    
    pages = Math.max(1, Math.ceil(total / perPage));
    const gap = vpWidth < 640 ? 12 : 18;
    slideW = Math.floor((vpWidth - gap * (perPage - 1)) / perPage);

    const slides = track.querySelectorAll(".pop-slide");
    slides.forEach((s, i) => {
        s.style.minWidth = slideW + "px";
        s.style.maxWidth = slideW + "px";
        s.style.marginRight = (i + 1) % perPage !== 0 ? gap + "px" : "0px";
    });
    
    const needsNav = total > perPage;
    if (prevBtn) prevBtn.hidden = !needsNav;
    if (nextBtn) nextBtn.hidden = !needsNav;
    
    page = Math.min(page, pages - 1);
    applyTransform();
}

function updateNavButtons() {
    if (prevBtn && nextBtn) {
        prevBtn.style.opacity = page === 0 ? "0.5" : "1";
        nextBtn.style.opacity = page === pages - 1 ? "0.5" : "1";
        prevBtn.style.cursor = page === 0 ? "not-allowed" : "pointer";
        nextBtn.style.cursor = page === pages - 1 ? "not-allowed" : "pointer";
    }
}

function applyTransform() {
    const gap = viewport.clientWidth < 640 ? 12 : 18;
    const x = -page * (slideW * perPage + gap * (perPage - 1));
    track.style.transform = `translateX(${x}px)`;
}

function slide(dir) {
    if (isAnimating) return;
    const newPage = page + dir;
    if (newPage < 0 || newPage >= pages) return;
    
    isAnimating = true;
    page = newPage;
    
    if (track) track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    applyTransform();
    updateNavButtons();
    setTimeout(() => { isAnimating = false; }, 400);
}

function addScrollAnimations() {
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, observerOptions);

    document.querySelectorAll('.home-product-card').forEach((card, index) => {
        card.style.opacity = "0";
        card.style.transform = "translateY(30px)";
        card.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
}

function wireEvents() {
    const homeAddBtns = track.querySelectorAll(".home-add-btn");
    homeAddBtns.forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            const productId = btn.dataset.id;
            if (!productId) return;
            
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;

            const success = await addToCart(productId, 1);
            
            if (success) {
                btn.innerHTML = '<i class="fas fa-check"></i> Added!';
            } else {
                btn.innerHTML = originalText;
            }

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 1500);
        });
    });

    if (prevBtn) prevBtn.addEventListener("click", () => { if (!isAnimating) slide(-1); });
    if (nextBtn) nextBtn.addEventListener("click", () => { if (!isAnimating) slide(1); });

    document.addEventListener("keydown", (e) => {
        if (e.target.closest('.pop-carousel')) {
            if (e.key === "ArrowLeft" && !isAnimating) slide(-1);
            if (e.key === "ArrowRight" && !isAnimating) slide(1);
        }
    });
}

// **NEW** - This is the corrected `EnhancedAuthModal` class
class EnhancedAuthModal {
    // ... all methods including fixed clearError, validateInput, and API calls
    constructor() {
    // Wait for DOM to be ready before initializing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    // Check if auth modal elements exist
    if (!document.getElementById('authModal')) {
      console.warn('Auth modal elements not found');
      return;
    }

    this.modal = document.getElementById('authModal');
    this.overlay = document.getElementById('authOverlay');
    this.closeBtn = document.getElementById('authClose');
    this.loginForm = document.getElementById('loginForm');
    this.signupForm = document.getElementById('signupForm');
    this.showLoginBtn = document.getElementById('showLogin');
    this.showSignupBtn = document.getElementById('showSignup');

    this.bindEvents();
    this.initPasswordToggles();
    this.initFormValidation();
    this.initProfileTrigger();

    // Check existing login status
    this.checkLoginStatus();
  }

  initProfileTrigger() {
    const profileTrigger = document.getElementById('profileTrigger');
    if (profileTrigger) {
      profileTrigger.addEventListener('click', (e) => {
        e.preventDefault();

        // Check if user is logged in
        const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (userData.loggedIn) {
          // Redirect to profile page or show profile dropdown
          this.showProfileMenu(userData);
        } else {
          // Show auth modal
          this.show();
        }
      });
    }
  }

  showProfileMenu(userData) {
    // Create a simple profile dropdown/menu
    const existingMenu = document.getElementById('profileMenu');
    if (existingMenu) {
      existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.id = 'profileMenu';
    menu.innerHTML = `
      <div style="
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(145deg, #ffffff 0%, #fefcf8 100%);
        border: 2px solid #e9b540;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        z-index: 9998;
        min-width: 200px;
        font-family: var(--font-primary, 'Poppins', sans-serif);
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(233, 181, 64, 0.2);
        ">
          <i class="fas fa-user-circle" style="font-size: 24px; color: #e9b540;"></i>
          <div>
            <div style="font-weight: 600; color: #2d1810; font-size: 14px;">
              ${userData.firstName || 'User'} ${userData.lastName || ''}
            </div>
            <div style="font-size: 12px; color: #a67c52; opacity: 0.8;">
              ${userData.email || ''}
            </div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="../templates/profile.html" style="
            color: #2d1810;
            text-decoration: none;
            padding: 8px 12px;
            border-radius: 8px;
            transition: background 0.2s ease;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
          " onmouseover="this.style.background='rgba(233, 181, 64, 0.1)'" 
             onmouseout="this.style.background='transparent'">
            <i class="fas fa-user"></i>
            My Profile
          </a>
          <a href="../templates/orders.html" style="
            color: #2d1810;
            text-decoration: none;
            padding: 8px 12px;
            border-radius: 8px;
            transition: background 0.2s ease;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 8px;
          " onmouseover="this.style.background='rgba(233, 181, 64, 0.1)'" 
             onmouseout="this.style.background='transparent'">
            <i class="fas fa-shopping-bag"></i>
            My Orders
          </a>
          <button onclick="window.authModalInstance.logout()" style="
            background: none;
            border: none;
            color: #831500;
            padding: 8px 12px;
            border-radius: 8px;
            transition: background 0.2s ease;
            font-size: 14px;
            cursor: pointer;
            width: 100%;
            text-align: left;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: inherit;
          " onmouseover="this.style.background='rgba(131, 21, 0, 0.1)'" 
             onmouseout="this.style.background='transparent'">
            <i class="fas fa-sign-out-alt"></i>
            Sign Out
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(menu);

    // Close menu when clicking outside
    const closeMenu = (e) => {
      if (!menu.contains(e.target) && !e.target.closest('#profileTrigger')) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 100);
  }

  logout() {
    // Clear session
    sessionStorage.removeItem('user');

    // Update UI
    updateUIForUser(null);

    // Remove profile menu if open
    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu) {
      profileMenu.remove();
    }

    // Show logout toast
    this.showLogoutToast();
  }

  showLogoutToast() {
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #e9b540 0%, #f7d2c4 100%);
        color: #2d1810;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        font-weight: 600;
        font-size: 14px;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: var(--font-primary, 'Poppins', sans-serif);
      ">
        <i class="fas fa-sign-out-alt" style="color: #2d1810;"></i>
        Successfully signed out
      </div>
    `;

    document.body.appendChild(toast);
    const toastElement = toast.firstElementChild;

    // Animate in
    setTimeout(() => {
      toastElement.style.transform = 'translateX(0)';
    }, 10);

    // Animate out and remove
    setTimeout(() => {
      toastElement.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  checkLoginStatus() {
    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    updateUIForUser(userData.loggedIn ? userData : null);
  }

  showLoginMessage(message) {
    // Show a message prompting user to login
    const activeForm = document.querySelector('.auth-form.active .form');
    if (activeForm) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'info-message';
      messageDiv.style.cssText = `
        background: rgba(233, 181, 64, 0.1);
        color: #e9b540;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 16px;
        border: 1px solid rgba(233, 181, 64, 0.2);
        text-align: center;
      `;
      messageDiv.textContent = message;
      activeForm.insertBefore(messageDiv, activeForm.firstChild);

      // Remove message after 5 seconds
      setTimeout(() => {
        if (messageDiv.parentNode) {
          messageDiv.remove();
        }
      }, 5000);
    }
  }

  bindEvents() {
    // Close modal
    this.closeBtn.addEventListener('click', () => this.hide());
    this.overlay.addEventListener('click', () => this.hide());

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.hide();
      }
    });

    // Form switching
    this.showSignupBtn.addEventListener('click', () => this.switchToSignup());
    this.showLoginBtn.addEventListener('click', () => this.switchToLogin());

    // Form submissions
    document.getElementById('loginFormElement').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('signupFormElement').addEventListener('submit', (e) => this.handleSignup(e));

  }

  initPasswordToggles() {
    const toggles = ['loginPasswordToggle', 'signupPasswordToggle', 'confirmPasswordToggle'];

    toggles.forEach(toggleId => {
      const toggle = document.getElementById(toggleId);
      if (toggle) {
        toggle.addEventListener('click', () => {
          const input = toggle.previousElementSibling;
          const icon = toggle.querySelector('i');

          if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
          } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
          }
        });
      }
    });
  }

  initFormValidation() {
    // Real-time validation
    const inputs = document.querySelectorAll('.form input');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateInput(input));
      input.addEventListener('input', () => this.clearError(input));
    });

    // Password confirmation validation
    const confirmPassword = document.getElementById('confirmPassword');
    const signupPassword = document.getElementById('signupPassword');

    if (confirmPassword && signupPassword) {
      confirmPassword.addEventListener('input', () => {
        this.validatePasswordMatch(signupPassword, confirmPassword);
      });
    }
  }

  validateInput(input) {
    const wrapper = input.closest('.input-wrapper');
    const existingError = wrapper.parentNode.querySelector('.error-message');

    // Remove existing error
    if (existingError) {
      existingError.remove();
    }

    let isValid = true;
    let errorMessage = '';

    // Email validation
    if (input.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (input.type === 'tel') {
      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(input.value)) {
        isValid = false;
        errorMessage = 'Please enter a valid phone number';
      }
    }

    // Password strength validation
    if (input.id === 'signupPassword') {
      if (input.value.length < 8) {
        isValid = false;
        errorMessage = 'Password must be at least 8 characters';
      }
    }

    // Required field validation
    if (input.hasAttribute('required') && !input.value.trim()) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    // Update UI
    if (isValid) {
      wrapper.classList.remove('error');
    } else {
      wrapper.classList.add('error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = errorMessage;
      wrapper.parentNode.appendChild(errorDiv);
    }

    return isValid;
  }

  validatePasswordMatch(password, confirmPassword) {
    const wrapper = confirmPassword.closest('.input-wrapper');
    const existingError = wrapper.parentNode.querySelector('.error-message');

    if (existingError) {
      existingError.remove();
    }

    if (password.value !== confirmPassword.value && confirmPassword.value) {
      wrapper.classList.add('error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = 'Passwords do not match';
      wrapper.parentNode.appendChild(errorDiv);
      return false;
    } else {
      wrapper.classList.remove('error');
      return true;
    }
  }

  clearError(input) {
    const wrapper = input.closest('.input-wrapper');
    const errorMessage = wrapper.parentNode.querySelector('.error-message');

    if (errorMessage) {
      errorMessage.remove();
    }
    wrapper.classList.remove('error');
  }

  show() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus management
    setTimeout(() => {
      const firstInput = this.modal.querySelector('.auth-form.active input');
      if (firstInput) firstInput.focus();
    }, 300);
  }

  hide() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    this.resetForms();
  }

  switchToSignup() {
    this.loginForm.classList.remove('active');
    this.signupForm.classList.add('active');
    this.resetForms();

    // Focus first input
    setTimeout(() => {
      const firstInput = this.signupForm.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  switchToLogin() {
    this.signupForm.classList.remove('active');
    this.loginForm.classList.add('active');
    this.resetForms();

    // Focus first input
    setTimeout(() => {
      const firstInput = this.loginForm.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  resetForms() {
    // Clear all form inputs
    document.querySelectorAll('.form input').forEach(input => {
      input.value = '';
      this.clearError(input);
    });

    // Reset checkboxes
    document.querySelectorAll('.form input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });

    // Reset buttons
    document.querySelectorAll('.auth-btn').forEach(btn => {
      btn.classList.remove('loading', 'success');
      btn.disabled = false;
      btn.style.background = '';
      const span = btn.querySelector('span');
      if (span) {
        if (btn.closest('#loginForm')) {
          span.textContent = 'Sign In';
        } else if (btn.closest('#signupForm')) {
          span.textContent = 'Create Account';
        }
      }
    });

    // Clear messages
    document.querySelectorAll('.success-message, .error-message, .info-message').forEach(msg => msg.remove());
  }
  // This method now safely clears errors
  clearError(input) {
    const wrapper = input.closest('.input-wrapper');
    if (!wrapper) {
      return; // Prevents the error if wrapper is null
    }
    const errorMessage = wrapper.parentNode.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.remove();
    }
    wrapper.classList.remove('error');
  }

  // This method now safely validates inputs
  validateInput(input) {
    const wrapper = input.closest('.input-wrapper');
    if (!wrapper) {
      return true; // Prevents error if wrapper is null
    }
    const existingError = wrapper.parentNode.querySelector('.error-message');

    if (existingError) {
      existingError.remove();
    }

    let isValid = true;
    let errorMessage = '';

    // Email validation
    if (input.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(input.value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (input.type === 'tel') {
      const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(input.value)) {
        isValid = false;
        errorMessage = 'Please enter a valid phone number';
      }
    }

    // Password strength validation
    if (input.id === 'signupPassword') {
      if (input.value.length < 8) {
        isValid = false;
        errorMessage = 'Password must be at least 8 characters';
      }
    }

    // Required field validation
    if (input.hasAttribute('required') && !input.value.trim()) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    if (isValid) {
      wrapper.classList.remove('error');
    } else {
      wrapper.classList.add('error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = errorMessage;
      wrapper.parentNode.appendChild(errorDiv);
    }

    return isValid;
  }

  async handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const submitBtn = e.target.querySelector('.auth-btn');

    // Validate inputs
    if (!this.validateForm('login')) return;

    // Loading state
    this.setButtonLoading(submitBtn, 'Signing In...');

    try {
      //  API call 
      const response = await fetch('http://127.0.0.1:8000/api/users/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed. Invalid credentials.');
      }

      // Store user session
      const userData = await response.json();
      this.setButtonSuccess(submitBtn, 'Welcome Back!');
      this.showSuccessMessage('Successfully signed in!');

      // Store user session details from the API response
      sessionStorage.setItem('user', JSON.stringify({ ...userData, loggedIn: true }));

      setTimeout(() => {
        this.hide();
        // Reload the page to apply the new authenticated state
        window.location.reload();
      }, 1500);

    } catch (error) {
      this.setButtonError(submitBtn, 'Sign In Failed');
      this.showErrorMessage(error.message);
    }
  }

  async handleSignup(e) {
    e.preventDefault();

    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const email = document.getElementById('signupEmail').value;
    const phone = document.getElementById('phoneNumber').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    const submitBtn = e.target.querySelector('.auth-btn');

    // Validate inputs
    if (!this.validateForm('signup')) return;

    // Additional validation
    if (!agreeTerms) {
      this.showErrorMessage('Please agree to the Terms & Conditions');
      return;
    }

    // Loading state
    this.setButtonLoading(submitBtn, 'Creating Account...');

    try {
      //api call
      const response = await fetch('http://127.0.0.1:8000/api/users/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          username: email,  // Assuming username is the email
          phone,
          password
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Account creation failed.');
      }

      this.setButtonSuccess(submitBtn, 'Account Created!');
      this.showSuccessMessage('Account created successfully! You can now sign in.');

      setTimeout(() => {
        this.switchToLogin(); // Switch to the login form
      }, 1500);
    } catch (error) {
      this.setButtonError(submitBtn, 'Signup Failed');
      this.showErrorMessage(error.message);
    }
  }

  validateForm(type) {
    let isValid = true;
    const form = type === 'login' ? this.loginForm : this.signupForm;
    const inputs = form.querySelectorAll('input[required]');

    inputs.forEach(input => {
      if (!this.validateInput(input)) {
        isValid = false;
      }
    });

    // Special validation for signup
    if (type === 'signup') {
      const password = document.getElementById('signupPassword');
      const confirmPassword = document.getElementById('confirmPassword');

      if (!this.validatePasswordMatch(password, confirmPassword)) {
        isValid = false;
      }
    }

    return isValid;
  }

  setButtonLoading(btn, text) {
    btn.classList.add('loading');
    btn.disabled = true;
    const span = btn.querySelector('span');
    if (span) span.textContent = text;
  }

  setButtonSuccess(btn, text) {
    btn.classList.remove('loading');
    btn.classList.add('success');
    const span = btn.querySelector('span');
    if (span) span.textContent = text;
  }

  setButtonError(btn, text) {
    btn.classList.remove('loading');
    btn.disabled = false;
    btn.style.background = 'rgba(231, 76, 60, 0.9)';
    const span = btn.querySelector('span');
    if (span) span.textContent = text;

    setTimeout(() => {
      btn.style.background = '';
      btn.disabled = false;
      if (span) {
        span.textContent = btn.closest('#loginForm') ? 'Sign In' : 'Create Account';
      }
    }, 3000);
  }

  showSuccessMessage(message) {
    // Remove existing messages
    document.querySelectorAll('.success-message, .error-message, .info-message').forEach(msg => msg.remove());

    const activeForm = document.querySelector('.auth-form.active .form');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    activeForm.insertBefore(successDiv, activeForm.firstChild);
  }

  showErrorMessage(message) {
    // Remove existing messages
    document.querySelectorAll('.success-message, .error-message, .info-message').forEach(msg => msg.remove());

    const activeForm = document.querySelector('.auth-form.active .form');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      margin-bottom: 16px;
      border: 1px solid rgba(231, 76, 60, 0.2);
    `;
    errorDiv.textContent = message;
    activeForm.insertBefore(errorDiv, activeForm.firstChild);
  }

  handleSuccessfulAuth(userData) {
    // Update UI to show logged in state
    updateUIForUser(userData);

    // Show welcome toast
    this.showWelcomeToast(userData.firstName || 'User');
  }

  showWelcomeToast(name) {
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #e9b540 0%, #f7d2c4 100%);
        color: #2d1810;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        font-weight: 600;
        font-size: 14px;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: var(--font-primary, 'Poppins', sans-serif);
      ">
        <i class="fas fa-user-check" style="color: #2d1810;"></i>
        Welcome back, ${name}!
      </div>
    `;

    document.body.appendChild(toast);
    const toastElement = toast.firstElementChild;

    // Animate in
    setTimeout(() => {
      toastElement.style.transform = 'translateX(0)';
    }, 10);

    // Animate out and remove
    setTimeout(() => {
      toastElement.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 4000);
  }

  simulateAPICall(delay = 1000) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate 90% success rate
          if (Math.random() > 0.1) {
            resolve();
          } else {
            reject(new Error('API Error'));
          }
        }, delay);
      });
  }
} 


// **NEW** - Update user interface based on login status
function updateUIForUser(userData) {
    const userIcon = document.querySelector('.user-icon');
    if (userIcon) {
        if (userData && userData.loggedIn) {
            userIcon.style.color = '#e9b540';
            userIcon.title = `Welcome, ${userData.first_name || userData.username}!`;
        } else {
            userIcon.style.color = '';
            userIcon.title = 'Sign In';
        }
    }
}

// **NEW** - Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initCartCount();
    authModalInstance = new EnhancedAuthModal();
    window.authModalInstance = authModalInstance;
    fetchAndRenderPopularProducts();
});