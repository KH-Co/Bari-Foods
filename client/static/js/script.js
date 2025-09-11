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

  // Update cart badge with animation
  const badge = document.getElementById("cartCount");
  if (badge) {
    const newCount = Object.values(items).reduce((s, q) => s + q, 0);
    badge.textContent = newCount;

    // Add success feedback animation
    badge.style.transform = "scale(1.3)";
    badge.style.color = "#e9b540";
    setTimeout(() => {
      badge.style.transform = "scale(1)";
      badge.style.color = "";
    }, 200);
  }

  // Show toast notification
  showAddToCartToast();
}


function showAddToCartToast() {
  // Create toast element
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
      <i class="fas fa-check-circle" style="color: #2d1810;"></i>
      Added to cart successfully!
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
  }, 2500);
}


//  API-driven popular
let popular = [];
let eventsBound = false;

async function fetchPopular() {
  const API_URL = "http://127.0.0.1:8000/api/featured-products/"; 
  if (track) track.innerHTML = `<div class="pop-loading" style="padding:20px;">Loading popular items…</div>`;

  try {
    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    const token = userData?.token || userData?.access || null;
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(API_URL, { method: "GET", headers });
    if (!res.ok) throw new Error(`API returned ${res.status}`);

    const json = await res.json();
    const items = json.results || json.products || json.data || json || [];

    const normalized = items.map(item => {
      const p = item.product || {};  // extract the nested product
      const name = p.name || p.title || "Unnamed product";
      const images = p.image || "/assets/img/placeholder.png";
      const price = Number(p.price ?? 0);
      const rating = Number(p.rating ?? null);
      const weight = p.weight || "";
      const description = p.description || "";

      return {
        id: p.id ?? item.id ?? name,
        name,
        images,
        price,
        rating,
        weight,
        description,
        _raw: item
      };
    });
    
    // Filter items with valid rating, fallback to first 12 if none
    const withRating = normalized.filter(x => typeof x.rating === "number" && x.rating > 0)
                                .sort((a,b) => (b.rating || 0) - (a.rating || 0));

    popular = withRating.length ? withRating : normalized.slice(0, 12);

    render();
  } catch (err) {
    console.error("Failed to fetch popular products:", err);
    if (track) {
      track.innerHTML = `<div class="pop-error" style="padding:20px;color:#831500;">Unable to load popular products. Try again later.</div>`;
    }
  }
}

function cardHTML(p) {
  const img = (p.images && p.images) || "/assets/img/placeholder.png";
  const rating = p.rating ? '★'.repeat(Math.floor(p.rating)) : '';

  return `
    <div class="pop-slide"> 
      <div class="home-product-card" data-product-id="${p.id}"> 
        <div class="home-prod-img">
          <img src="${img}" alt="${p.name}" loading="lazy">
        </div> 
        <div class="home-prod-details"> 
          <div class="home-prod-title">${p.name}</div> 
          <div class="home-prod-desc">${p.weight || p.description || ""}</div>
          ${rating ? `<div class="home-prod-rating" style="color: #e9b540; font-size: 14px; margin: 8px 0;">${rating}</div>` : ''}
          <div class="home-prod-meta"> 
            <div class="home-prod-price">₹${(+p.price).toFixed(2)}</div> 
            <button class="home-add-btn" data-id="${p.id}" type="button">
              <i class="fas fa-cart-plus" style="font-size: 12px;"></i>
              Add to Cart
            </button> 
          </div> 
        </div> 
      </div> 
    </div>
  `;
}

function render() {
  if (!track) return;
  track.innerHTML = popular.map(cardHTML).join("");
  wireEvents();
  layout();
  addScrollAnimations();
}

function wireEvents() {
  if (eventsBound || !track) return;
  eventsBound = true;

  track.addEventListener("click", (e) => {
    const btn = e.target.closest(".home-add-btn");
    if (!btn) return;

    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    if (!userData.loggedIn) {
      if (window.authModalInstance) {
        window.authModalInstance.show();
        window.authModalInstance.showLoginMessage('Please sign in to add items to your cart');
        return;
      }
    }

    if (btn.disabled) return;
    btn.disabled = true;

    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    btn.style.opacity = '0.7';

    setTimeout(() => {
      addToCart(btn.dataset.id, 1);
      btn.innerHTML = '<i class="fas fa-check"></i> Added!';
      btn.style.background = 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)';

      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.style.opacity = '';
        btn.disabled = false;
      }, 1000);
    }, 300);
  });

  prevBtn?.addEventListener("click", () => !isAnimating && slide(-1));
  nextBtn?.addEventListener("click", () => !isAnimating && slide(1));

  document.addEventListener("keydown", (e) => {
    if (e.target.closest('.pop-carousel')) {
      if (e.key === "ArrowLeft" && !isAnimating) slide(-1);
      if (e.key === "ArrowRight" && !isAnimating) slide(1);
    }
  });

  let startX = 0;
  let isDragging = false;
  track.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; isDragging = true; });
  track.addEventListener("touchmove", (e) => isDragging && e.preventDefault());
  track.addEventListener("touchend", (e) => {
    if (!isDragging || isAnimating) return;
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) slide(1); else slide(-1);
    }
    isDragging = false;
  });

  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(layout, 150);
  });
}

let page = 0;
let pages = 1;
let perPage = 3;
let slideW = 0;
let isAnimating = false;

function layout() {
  if (!viewport || !track) return;
  const total = popular.length;
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
  if(prevBtn) prevBtn.hidden = !needsNav;
  if(nextBtn) nextBtn.hidden = !needsNav;

  updateNavButtons();
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
  if (!viewport || !track) return;
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

  if (track) {
    track.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
  }
  
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

function initCartCount() {
  const cartItems = loadCartLS();
  const totalCount = Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  const badge = document.getElementById("cartCount");
  if (badge) {
    badge.textContent = totalCount;
  }
}

function updateUIForUser(userData) {
  const userIcon = document.querySelector('.user-icon');
  const profileTrigger = document.getElementById('profileTrigger');
  if (userData && userData.loggedIn) {
    if (userIcon) {
      userIcon.style.color = '#e9b540';
      userIcon.title = `Welcome, ${userData.firstName || 'User'}!`;
    }
    if (profileTrigger) {
      profileTrigger.href = '../templates/profile.html';
      profileTrigger.onclick = null;
    }
  } else {
    if (userIcon) {
      userIcon.style.color = '';
      userIcon.title = 'Sign In';
    }
  }
}

class EnhancedAuthModal {
  init() {
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
    this.checkLoginStatus();
  }

  initProfileTrigger() {
    const profileTrigger = document.getElementById('profileTrigger');
    if (profileTrigger) {
      profileTrigger.addEventListener('click', (e) => {
        const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
        if (userData.loggedIn) {
          e.preventDefault();
          this.showProfileMenu(userData);
        } else {
          e.preventDefault();
          this.show();
        }
      });
    }
  }

  showProfileMenu(userData) {
    const existingMenu = document.getElementById('profileMenu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.id = 'profileMenu';
    menu.innerHTML = `
      <div style="position: fixed; top: 80px; right: 20px; background: linear-gradient(145deg, #ffffff 0%, #fefcf8 100%); border: 2px solid #e9b540; border-radius: 16px; padding: 20px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); z-index: 9998; min-width: 200px; font-family: var(--font-primary, 'Poppins', sans-serif);">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid rgba(233, 181, 64, 0.2);">
          <i class="fas fa-user-circle" style="font-size: 24px; color: #e9b540;"></i>
          <div>
            <div style="font-weight: 600; color: #2d1810; font-size: 14px;">${userData.firstName || 'User'} ${userData.lastName || ''}</div>
            <div style="font-size: 12px; color: #a67c52; opacity: 0.8;">${userData.email || ''}</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <a href="../templates/profile.html" style="color: #2d1810; text-decoration: none; padding: 8px 12px; border-radius: 8px; transition: background 0.2s ease; font-size: 14px; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='rgba(233, 181, 64, 0.1)'" onmouseout="this.style.background='transparent'"><i class="fas fa-user"></i> My Profile</a>
          <a href="../templates/orders.html" style="color: #2d1810; text-decoration: none; padding: 8px 12px; border-radius: 8px; transition: background 0.2s ease; font-size: 14px; display: flex; align-items: center; gap: 8px;" onmouseover="this.style.background='rgba(233, 181, 64, 0.1)'" onmouseout="this.style.background='transparent'"><i class="fas fa-shopping-bag"></i> My Orders</a>
          <button onclick="window.authModalInstance.logout()" style="background: none; border: none; color: #831500; padding: 8px 12px; border-radius: 8px; transition: background 0.2s ease; font-size: 14px; cursor: pointer; width: 100%; text-align: left; display: flex; align-items: center; gap: 8px; font-family: inherit;" onmouseover="this.style.background='rgba(131, 21, 0, 0.1)'" onmouseout="this.style.background='transparent'"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
        </div>
      </div>`;
    document.body.appendChild(menu);

    const closeMenu = (e) => {
      if (!menu.contains(e.target) && !e.target.closest('#profileTrigger')) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 100);
  }

  logout() {
    sessionStorage.removeItem('user');
    updateUIForUser(null);
    const profileMenu = document.getElementById('profileMenu');
    if (profileMenu) profileMenu.remove();
    this.showLogoutToast();
  }

  showLogoutToast() {
    const toast = document.createElement('div');
    toast.innerHTML = `<div style="position: fixed; top: 100px; right: 20px; background: linear-gradient(135deg, #e9b540 0%, #f7d2c4 100%); color: #2d1810; padding: 16px 24px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); font-weight: 600; font-size: 14px; z-index: 10000; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94); display: flex; align-items: center; gap: 8px; font-family: var(--font-primary, 'Poppins', sans-serif);"><i class="fas fa-sign-out-alt" style="color: #2d1810;"></i> Successfully signed out</div>`;
    document.body.appendChild(toast);
    const toastElement = toast.firstElementChild;
    setTimeout(() => { toastElement.style.transform = 'translateX(0)'; }, 10);
    setTimeout(() => {
      toastElement.style.transform = 'translateX(100%)';
      setTimeout(() => { document.body.removeChild(toast); }, 300);
    }, 3000);
  }

  checkLoginStatus() {
    const userData = JSON.parse(sessionStorage.getItem('user') || '{}');
    updateUIForUser(userData.loggedIn ? userData : null);
  }

  showLoginMessage(message) {
    const activeForm = document.querySelector('.auth-form.active .form');
    if (activeForm) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'info-message';
      messageDiv.style.cssText = `background: rgba(233, 181, 64, 0.1); color: #e9b540; padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; margin-bottom: 16px; border: 1px solid rgba(233, 181, 64, 0.2); text-align: center;`;
      messageDiv.textContent = message;
      activeForm.insertBefore(messageDiv, activeForm.firstChild);
      setTimeout(() => { if (messageDiv.parentNode) messageDiv.remove(); }, 5000);
    }
  }

  bindEvents() {
    this.closeBtn.addEventListener('click', () => this.hide());
    this.overlay.addEventListener('click', () => this.hide());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) this.hide();
    });
    this.showSignupBtn.addEventListener('click', () => this.switchToSignup());
    this.showLoginBtn.addEventListener('click', () => this.switchToLogin());
    document.getElementById('loginFormElement').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('signupFormElement').addEventListener('submit', (e) => this.handleSignup(e));
  }

  initPasswordToggles() {
    ['loginPasswordToggle', 'signupPasswordToggle', 'confirmPasswordToggle'].forEach(toggleId => {
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
    document.querySelectorAll('.form input').forEach(input => {
      input.addEventListener('blur', () => this.validateInput(input));
      input.addEventListener('input', () => this.clearError(input));
    });
    const confirmPassword = document.getElementById('confirmPassword');
    const signupPassword = document.getElementById('signupPassword');
    if (confirmPassword && signupPassword) {
      confirmPassword.addEventListener('input', () => this.validatePasswordMatch(signupPassword, confirmPassword));
    }
  }

  validatePasswordMatch(password, confirmPassword) {
    const wrapper = confirmPassword.closest('.input-wrapper');
    const existingError = wrapper.parentNode.querySelector('.error-message');
    if (existingError) existingError.remove();

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

  show() {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
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
    setTimeout(() => {
      const firstInput = this.signupForm.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  switchToLogin() {
    this.signupForm.classList.remove('active');
    this.loginForm.classList.add('active');
    this.resetForms();
    setTimeout(() => {
      const firstInput = this.loginForm.querySelector('input');
      if (firstInput) firstInput.focus();
    }, 100);
  }

  resetForms() {
    document.querySelectorAll('.form input').forEach(input => {
      input.value = '';
      this.clearError(input);
    });
    document.querySelectorAll('.form input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
    document.querySelectorAll('.auth-btn').forEach(btn => {
      btn.classList.remove('loading', 'success');
      btn.disabled = false;
      btn.style.background = '';
      const span = btn.querySelector('span');
      if (span) {
        if (btn.closest('#loginForm')) span.textContent = 'Sign In';
        else if (btn.closest('#signupForm')) span.textContent = 'Create Account';
      }
    });
    document.querySelectorAll('.success-message, .error-message, .info-message').forEach(msg => msg.remove());
  }

  clearError(input) {
    const wrapper = input.closest('.input-wrapper');
    if (!wrapper) return;
    const errorMessage = wrapper.parentNode.querySelector('.error-message');
    if (errorMessage) errorMessage.remove();
    wrapper.classList.remove('error');
  }

  validateInput(input) {
    const wrapper = input.closest('.input-wrapper');
    if (!wrapper) return true;
    this.clearError(input);

    let isValid = true;
    let errorMessage = '';

    if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    } else if (input.type === 'tel' && !/^[+]?[\d\s\-\(\)]{10,}$/.test(input.value)) {
      isValid = false;
      errorMessage = 'Please enter a valid phone number';
    } else if (input.id === 'signupPassword' && input.value.length < 8) {
      isValid = false;
      errorMessage = 'Password must be at least 8 characters';
    } else if (input.hasAttribute('required') && !input.value.trim()) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    if (!isValid) {
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
    const submitBtn = e.target.querySelector('.auth-btn');

    if (!this.validateForm('login')) return;
    this.setButtonLoading(submitBtn, 'Signing In...');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed. Invalid credentials.');
      }
      const userData = await response.json();
      this.setButtonSuccess(submitBtn, 'Welcome Back!');
      this.showSuccessMessage('Successfully signed in!');
      sessionStorage.setItem('user', JSON.stringify({ ...userData, loggedIn: true }));
      setTimeout(() => {
        this.hide();
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
    const agreeTerms = document.getElementById('agreeTerms').checked;
    const submitBtn = e.target.querySelector('.auth-btn');

    if (!this.validateForm('signup')) return;
    if (!agreeTerms) {
      this.showErrorMessage('Please agree to the Terms & Conditions');
      return;
    }
    this.setButtonLoading(submitBtn, 'Creating Account...');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/users/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, username: email, phone, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Account creation failed.');
      }
      this.setButtonSuccess(submitBtn, 'Account Created!');
      this.showSuccessMessage('Account created successfully! You can now sign in.');
      setTimeout(() => { this.switchToLogin(); }, 1500);
    } catch (error) {
      this.setButtonError(submitBtn, 'Signup Failed');
      this.showErrorMessage(error.message);
    }
  }

  validateForm(type) {
    let isValid = true;
    const form = type === 'login' ? this.loginForm : this.signupForm;
    form.querySelectorAll('input[required]').forEach(input => {
      if (!this.validateInput(input)) isValid = false;
    });

    if (type === 'signup') {
      const password = document.getElementById('signupPassword');
      const confirmPassword = document.getElementById('confirmPassword');
      if (!this.validatePasswordMatch(password, confirmPassword)) isValid = false;
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
      if (span) span.textContent = btn.closest('#loginForm') ? 'Sign In' : 'Create Account';
    }, 3000);
  }

  showSuccessMessage(message) {
    document.querySelectorAll('.success-message, .error-message, .info-message').forEach(msg => msg.remove());
    const activeForm = document.querySelector('.auth-form.active .form');
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    activeForm.insertBefore(successDiv, activeForm.firstChild);
  }

  showErrorMessage(message) {
    document.querySelectorAll('.success-message, .error-message, .info-message').forEach(msg => msg.remove());
    const activeForm = document.querySelector('.auth-form.active .form');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `background: rgba(231, 76, 60, 0.1); color: #e74c3c; padding: 12px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; margin-bottom: 16px; border: 1px solid rgba(231, 76, 60, 0.2);`;
    errorDiv.textContent = message;
    activeForm.insertBefore(errorDiv, activeForm.firstChild);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initCartCount();
  const authModalInstance = new EnhancedAuthModal();
  authModalInstance.init();
  window.authModalInstance = authModalInstance;
  initNavbarScrollEffect();
  fetchPopular();
});

function initNavbarScrollEffect() {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 100) navbar.classList.add('scrolled');
      else navbar.classList.remove('scrolled');
    });
  }
}