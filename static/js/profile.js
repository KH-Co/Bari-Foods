    // Bari Foods Account Management - Complete JavaScript Implementation

class BariAccountManager {
  constructor() {
    this.init();
    this.currentSection = 'profile';
    this.formData = {};
    this.isLoading = false;
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeApp());
    } else {
      this.initializeApp();
    }
  }

  initializeApp() {
    this.setupNavigation();
    this.setupPasswordToggles();
    this.setupFormHandlers();
    this.setupDeleteAccountConfirmation();
    this.setupProfilePictureHandlers();
    this.setupEnhancedInteractions();
    this.setupPasswordStrengthIndicator();
    this.setupAutoSaveDrafts();
    this.setupKeyboardNavigation();
    this.setupLoadAnimation();
    this.restoreDraftValues();
    this.addRippleEffects();
    this.setupSearchFunctionality();
    this.setupNotificationPreferences();
    this.setupOrderTracking();
    this.setupAddressManagement();
    this.setupFormValidation();
  }

  // Navigation System
  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        const sectionName = link.getAttribute('data-section');
        this.switchSection(sectionName, navLinks, contentSections);

        // Update URL without page reload
        window.history.pushState({ section: sectionName }, '', `#${sectionName}`);
      });
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      const section = e.state?.section || 'profile';
      this.switchSection(section, navLinks, contentSections);
    });

    // Handle initial URL hash
    const initialSection = window.location.hash.slice(1) || 'profile';
    this.switchSection(initialSection, navLinks, contentSections);
  }

  switchSection(sectionName, navLinks, contentSections) {
    // Remove active classes
    navLinks.forEach(l => l.classList.remove('active'));
    contentSections.forEach(s => s.classList.remove('active'));

    // Add active class to current link
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }

    // Show corresponding section
    const targetSection = document.getElementById(sectionName + 'Section');
    if (targetSection) {
      targetSection.classList.add('active');
      this.currentSection = sectionName;

      // Smooth scroll to content
      this.smoothScrollToElement(targetSection);
    }
  }

  smoothScrollToElement(element) {
    const yOffset = -100; // Offset for fixed header
    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;

    window.scrollTo({
      top: y,
      behavior: 'smooth'
    });
  }

  // Password Toggle Functionality
  setupPasswordToggles() {
    const passwordToggles = document.querySelectorAll('.password-toggle');

    passwordToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.togglePasswordVisibility(toggle);
      });
    });
  }

  togglePasswordVisibility(toggle) {
    const targetId = toggle.getAttribute('data-target');
    const input = document.getElementById(targetId);
    const icon = toggle.querySelector('i');

    if (!input) return;

    const isPasswordVisible = input.type === 'text';

    input.type = isPasswordVisible ? 'password' : 'text';
    icon.className = isPasswordVisible ? 'fas fa-eye' : 'fas fa-eye-slash';
    toggle.style.color = isPasswordVisible ? '' : 'var(--primary-gold)';

    // Add subtle animation
    toggle.style.transform = 'scale(0.9)';
    setTimeout(() => {
      toggle.style.transform = 'scale(1)';
    }, 150);
  }

  // Form Handling System
  setupFormHandlers() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmission(form);
      });
    });
  }

  async handleFormSubmission(form) {
    if (this.isLoading) return;

    const formId = form.id;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('[type="submit"]');

    if (!this.validateForm(form)) {
      this.showFormError('Please fill in all required fields correctly.');
      return;
    }

    try {
      this.setLoadingState(submitBtn, true);

      // Simulate API call
      const result = await this.submitFormData(formId, formData);

      if (result.success) {
        this.showSuccessState(submitBtn);
        this.clearDraftData(formId);
        this.showNotification('Settings saved successfully!', 'success');
      } else {
        throw new Error(result.message || 'Failed to save settings');
      }

    } catch (error) {
      console.error('Form submission error:', error);
      this.showFormError(error.message);
      this.resetButtonState(submitBtn);
    }
  }

  async submitFormData(formId, formData) {
    // Simulate API call with realistic delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate success/failure based on form type
        const shouldFail = Math.random() < 0.1; // 10% failure rate for demo

        resolve({
          success: !shouldFail,
          message: shouldFail ? 'Network error occurred' : 'Data saved successfully',
          data: Object.fromEntries(formData)
        });
      }, Math.random() * 1500 + 800); // 800-2300ms delay
    });
  }

  setLoadingState(button, loading) {
    if (!button) return;

    this.isLoading = loading;

    if (loading) {
      button.dataset.originalContent = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
      button.disabled = true;
      button.classList.add('loading');
      button.style.transform = 'none';
    }
  }

  showSuccessState(button) {
    if (!button) return;

    button.innerHTML = '<i class="fas fa-check"></i> Saved Successfully!';
    button.classList.remove('loading');
    button.classList.add('success');

    setTimeout(() => {
      this.resetButtonState(button);
    }, 2500);
  }

  resetButtonState(button) {
    if (!button) return;

    button.innerHTML = button.dataset.originalContent || button.innerHTML;
    button.disabled = false;
    button.classList.remove('loading', 'success');
    this.isLoading = false;
  }

  // Delete Account Confirmation
  setupDeleteAccountConfirmation() {
    const deleteInput = document.getElementById('deleteConfirmation');
    const deleteBtn = document.querySelector('#deleteSection .btn-danger');

    if (!deleteInput || !deleteBtn) return;

    deleteInput.addEventListener('input', () => {
      const isMatch = deleteInput.value.trim().toUpperCase() === 'DELETE';
      this.updateDeleteButtonState(deleteBtn, isMatch);
    });

    deleteBtn.addEventListener('click', (e) => {
      if (!deleteBtn.disabled) {
        this.confirmAccountDeletion(e);
      }
    });
  }

  updateDeleteButtonState(button, isEnabled) {
    button.disabled = !isEnabled;

    if (isEnabled) {
      button.style.opacity = '1';
      button.style.transform = 'translateY(-1px)';
    } else {
      button.style.opacity = '0.6';
      button.style.transform = 'none';
    }
  }

  confirmAccountDeletion(e) {
    e.preventDefault();

    const confirmed = confirm(
      'This will permanently delete your account and all associated data. ' +
      'This action cannot be undone. Are you absolutely sure?'
    );

    if (confirmed) {
      this.processAccountDeletion();
    }
  }

  async processAccountDeletion() {
    const deleteBtn = document.querySelector('#deleteSection .btn-danger');

    try {
      this.setLoadingState(deleteBtn, true);
      deleteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting Account...';

      // Simulate account deletion process
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Redirect to goodbye page or homepage
      window.location.href = '/account-deleted';

    } catch (error) {
      console.error('Account deletion error:', error);
      this.showNotification('Failed to delete account. Please try again.', 'error');
      this.resetButtonState(deleteBtn);
    }
  }

  // Profile Picture Management
  setupProfilePictureHandlers() {
    const profilePictures = document.querySelectorAll('.profile-avatar, .profile-picture-large');

    profilePictures.forEach(pic => {
      pic.addEventListener('click', () => {
        this.openImagePicker(pic);
      });

      // Add keyboard accessibility
      pic.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openImagePicker(pic);
        }
      });
    });
  }

  openImagePicker(targetElement) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/webp';
    fileInput.multiple = false;

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleImageUpload(file, targetElement);
      }
    });

    fileInput.click();
  }

  async handleImageUpload(file, targetElement) {
    // Validate file
    if (!this.validateImageFile(file)) {
      this.showNotification('Please select a valid image file (JPEG, PNG, WebP) under 5MB.', 'error');
      return;
    }

    try {
      // Show loading state
      const img = targetElement.querySelector('img');
      const originalSrc = img.src;

      // Read and display the image
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
        this.showNotification('Profile picture updated!', 'success');
      };

      reader.onerror = () => {
        img.src = originalSrc;
        this.showNotification('Failed to load image. Please try again.', 'error');
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error('Image upload error:', error);
      this.showNotification('Failed to upload image. Please try again.', 'error');
    }
  }

  validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    return file.size <= maxSize && allowedTypes.includes(file.type);
  }

  // Enhanced Interactions
  setupEnhancedInteractions() {
    const interactiveElements = document.querySelectorAll('.btn, .item-card, .card, .nav-link');

    interactiveElements.forEach(element => {
      this.addHoverEffects(element);
    });
  }

  addHoverEffects(element) {
    let hoverTimeout;

    element.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      if (!element.disabled && !element.classList.contains('loading')) {
        element.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
      }
    });

    element.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        if (element.style.transform !== 'none') {
          element.style.transform = 'translateY(0)';
        }
      }, 50);
    });
  }

  // Ripple Effect
  addRippleEffects() {
    const buttons = document.querySelectorAll('.btn');

    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        if (button.disabled || button.classList.contains('loading')) return;

        this.createRippleEffect(e, button);
      });
    });
  }

  createRippleEffect(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
      z-index: 1000;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => {
      if (ripple.parentNode) {
        ripple.parentNode.removeChild(ripple);
      }
    }, 600);
  }

  // Password Strength Indicator
  setupPasswordStrengthIndicator() {
    const newPasswordInput = document.getElementById('newPassword');
    if (!newPasswordInput) return;

    newPasswordInput.addEventListener('input', () => {
      this.updatePasswordStrength(newPasswordInput.value);
    });
  }

  updatePasswordStrength(password) {
    const requirements = document.querySelectorAll('.requirement');

    const checks = [
      { test: password.length >= 8, requirement: 0 },
      { test: /[a-z]/.test(password) && /[A-Z]/.test(password), requirement: 1 },
      { test: /\d/.test(password), requirement: 2 },
      { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), requirement: 3 }
    ];

    checks.forEach(({ test, requirement }) => {
      const req = requirements[requirement];
      if (!req) return;

      const icon = req.querySelector('i');

      if (test) {
        req.classList.remove('invalid');
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#4CAF50';
      } else {
        req.classList.add('invalid');
        icon.className = 'fas fa-times-circle';
        icon.style.color = '#dc2626';
      }
    });
  }

  // Auto-save Draft Functionality
  setupAutoSaveDrafts() {
    const formInputs = document.querySelectorAll('.form-input, .form-textarea, .form-select');

    formInputs.forEach(input => {
      input.addEventListener('input', this.debounce(() => {
        this.saveDraftValue(input);
      }, 1000));
    });
  }

  saveDraftValue(input) {
    const form = input.closest('form');
    if (!form) return;

    const formId = form.id;
    const fieldName = input.name || input.id;
    const value = input.value;

    if (formId && fieldName && value) {
      try {
        sessionStorage.setItem(`draft_${formId}_${fieldName}`, value);
      } catch (error) {
        console.warn('Failed to save draft:', error);
      }
    }
  }

  restoreDraftValues() {
    const formInputs = document.querySelectorAll('.form-input, .form-textarea, .form-select');

    formInputs.forEach(input => {
      const form = input.closest('form');
      if (!form) return;

      const formId = form.id;
      const fieldName = input.name || input.id;

      if (formId && fieldName) {
        try {
          const savedValue = sessionStorage.getItem(`draft_${formId}_${fieldName}`);
          if (savedValue && savedValue !== input.value) {
            input.value = savedValue;
            input.style.borderColor = 'rgba(233, 181, 64, 0.5)';
            input.title = 'Draft value restored';
          }
        } catch (error) {
          console.warn('Failed to restore draft:', error);
        }
      }
    });
  }

  clearDraftData(formId) {
    try {
      const keys = Object.keys(sessionStorage).filter(key => key.startsWith(`draft_${formId}_`));
      keys.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear draft data:', error);
    }
  }

  // Keyboard Navigation
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('using-keyboard');
      }
    });

    document.addEventListener('click', () => {
      document.body.classList.remove('using-keyboard');
    });
  }

  handleKeyboardShortcuts(e) {
    if (e.altKey) {
      const shortcuts = {
        '1': 'profile',
        '2': 'security',
        '3': 'orders',
        '4': 'addresses',
        '5': 'preferences',
        '6': 'delete'
      };

      if (shortcuts[e.key]) {
        e.preventDefault();
        const link = document.querySelector(`[data-section="${shortcuts[e.key]}"]`);
        if (link) link.click();
      }
    }
  }

  // Load Animation
  setupLoadAnimation() {
    window.addEventListener('load', () => {
      this.animatePageLoad();
    });
  }

  animatePageLoad() {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';

    requestAnimationFrame(() => {
      document.body.style.opacity = '1';
    });

    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';

      setTimeout(() => {
        card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 150);
    });
  }

  // Search Functionality
  setupSearchFunctionality() {
    const searchInput = document.querySelector('.product-search input');
    const searchBtn = document.querySelector('.search-btn');

    if (searchInput && searchBtn) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performSearch(searchInput.value);
        }
      });

      searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.performSearch(searchInput.value);
      });
    }
  }

  performSearch(query) {
    if (!query.trim()) return;

    console.log('Searching for:', query);
    this.showNotification(`Searching for "${query}"...`, 'info');

    // Simulate search redirect
    setTimeout(() => {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }, 1000);
  }

  // Notification Preferences
  setupNotificationPreferences() {
    const checkboxes = document.querySelectorAll('#preferencesForm input[type="checkbox"]');

    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.handleNotificationToggle(checkbox);
      });
    });
  }

  handleNotificationToggle(checkbox) {
    const label = checkbox.closest('label');
    const isChecked = checkbox.checked;

    // Visual feedback
    label.style.opacity = isChecked ? '1' : '0.7';

    // Auto-save preference
    this.saveDraftValue(checkbox);

    // Show feedback
    const action = isChecked ? 'enabled' : 'disabled';
    this.showNotification(`Notification ${action}`, 'info');
  }

  // Order Tracking
  setupOrderTracking() {
    const trackButtons = document.querySelectorAll('.btn:contains("Track")');

    trackButtons.forEach(button => {
      if (button.textContent.includes('Track')) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          this.trackOrder(button);
        });
      }
    });
  }

  trackOrder(button) {
    const orderCard = button.closest('.item-card');
    const orderNumber = orderCard.querySelector('.item-title').textContent.trim();

    this.showNotification(`Tracking ${orderNumber}...`, 'info');

    // Simulate tracking redirect
    setTimeout(() => {
      window.open('/track-order', '_blank');
    }, 1000);
  }

  // Address Management
  setupAddressManagement() {
    this.setupAddressActions();
    this.setupAddAddressButton();
  }

  setupAddressActions() {
    const addressCards = document.querySelectorAll('#addressesSection .item-card');

    addressCards.forEach(card => {
      const editBtn = card.querySelector('.btn:contains("Edit")');
      const deleteBtn = card.querySelector('.btn-danger');
      const defaultBtn = card.querySelector('.btn:contains("Default")');

      if (editBtn) {
        editBtn.addEventListener('click', () => this.editAddress(card));
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => this.deleteAddress(card));
      }

      if (defaultBtn) {
        defaultBtn.addEventListener('click', () => this.setDefaultAddress(card));
      }
    });
  }

  setupAddAddressButton() {
    const addBtn = document.querySelector('#addressesSection .btn-primary');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addNewAddress());
    }
  }

  editAddress(card) {
    this.showNotification('Opening address editor...', 'info');
    // Simulate opening address form modal
  }

  deleteAddress(card) {
    const confirmed = confirm('Are you sure you want to delete this address?');
    if (confirmed) {
      card.style.animation = 'slideOut 0.5s ease-out forwards';
      setTimeout(() => {
        card.remove();
        this.showNotification('Address deleted successfully', 'success');
      }, 500);
    }
  }

  setDefaultAddress(card) {
    // Remove default badge from other addresses
    document.querySelectorAll('.status-badge.default').forEach(badge => {
      badge.remove();
    });

    // Add default badge to this address
    const header = card.querySelector('.item-header');
    const defaultBadge = document.createElement('span');
    defaultBadge.className = 'status-badge default';
    defaultBadge.innerHTML = '<i class="fas fa-star"></i> Default';
    header.appendChild(defaultBadge);

    this.showNotification('Default address updated', 'success');
  }

  addNewAddress() {
    this.showNotification('Opening new address form...', 'info');
    // Simulate opening new address form
  }

  // Form Validation
  setupFormValidation() {
    const forms = document.querySelectorAll('form');

    forms.forEach(form => {
      const inputs = form.querySelectorAll('.form-input, .form-select, .form-textarea');

      inputs.forEach(input => {
        input.addEventListener('blur', () => {
          this.validateField(input);
        });

        input.addEventListener('input', () => {
          if (input.classList.contains('error')) {
            this.clearFieldError(input);
          }
        });
      });
    });
  }

  validateForm(form) {
    const inputs = form.querySelectorAll('.form-input[required], .form-select[required], .form-textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  }

  validateField(input) {
    const value = input.value.trim();
    const type = input.type;
    let isValid = true;
    let errorMessage = '';

    // Check if required field is empty
    if (input.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    // Type-specific validation
    if (value && type === 'email' && !this.isValidEmail(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    }

    if (value && type === 'tel' && !this.isValidPhone(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid phone number';
    }

    if (input.id === 'confirmPassword') {
      const newPassword = document.getElementById('newPassword');
      if (newPassword && value !== newPassword.value) {
        isValid = false;
        errorMessage = 'Passwords do not match';
      }
    }

    // Update field appearance
    if (isValid) {
      this.clearFieldError(input);
    } else {
      this.showFieldError(input, errorMessage);
    }

    return isValid;
  }

  showFieldError(input, message) {
    input.classList.add('error');
    input.style.borderColor = '#dc2626';

    // Remove existing error message
    const existingError = input.parentNode.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    // Add error message
    const errorEl = document.createElement('div');
    errorEl.className = 'error-message';
    errorEl.style.cssText = `
      color: #dc2626;
      font-size: 0.75rem;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 4px;
    `;
    errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;

    input.parentNode.appendChild(errorEl);
  }

  clearFieldError(input) {
    input.classList.remove('error');
    input.style.borderColor = '';

    const errorMessage = input.parentNode.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.remove();
    }
  }

  // Utility Functions
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      border-radius: 12px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      transform: translateX(400px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      max-width: 400px;
    `;

    // Set background color based on type
    const colors = {
      success: '#10b981',
      error: '#dc2626',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
    });

    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  showFormError(message) {
    this.showNotification(message, 'error');
  }
}

// Initialize the application
const accountManager = new BariAccountManager();

// Add custom CSS for animations and additional styles
const customCSS = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @keyframes slideOut {
    to {
      opacity: 0;
      transform: translateX(-100%);
    }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
  }
  
  .form-input.error,
  .form-select.error,
  .form-textarea.error {
    border-color: #dc2626 !important;
    box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1) !important;
  }
  
  .error-message {
    animation: fadeInUp 0.3s ease-out;
  }
  
  .using-keyboard .nav-link:focus,
  .using-keyboard .btn:focus,
  .using-keyboard .form-input:focus,
  .using-keyboard .form-select:focus,
  .using-keyboard .form-textarea:focus {
    outline: 2px solid var(--primary-gold);
    outline-offset: 2px;
  }
  
  .notification {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }
  
  .loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(2, 17, 32, 0.8);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }
  
  .loading-overlay.active {
    opacity: 1;
    visibility: visible;
  }
  
  .loading-spinner {
    width: 60px;
    height: 60px;
    border: 4px solid rgba(233, 181, 64, 0.3);
    border-top: 4px solid var(--primary-gold);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .btn:disabled {
    opacity: 0.6 !important;
    cursor: not-allowed !important;
    transform: none !important;
    pointer-events: none;
  }
  
  .btn.loading {
    position: relative;
    color: transparent !important;
  }
  
  .btn.loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    color: white;
  }
  
  .success-checkmark {
    display: inline-block;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #10b981;
    color: white;
    text-align: center;
    line-height: 20px;
    font-size: 12px;
    margin-right: 8px;
    animation: pulse 0.6s ease-out;
  }
  
  /* Address card animations */
  .item-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .item-card.removing {
    animation: slideOut 0.5s ease-out forwards;
  }
  
  /* Search suggestions */
  .search-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--card-gradient);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(233, 181, 64, 0.15);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.3s ease;
  }
  
  .search-suggestions.active {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  
  .search-suggestion {
    padding: 12px 20px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid rgba(233, 181, 64, 0.05);
  }
  
  .search-suggestion:hover {
    background: rgba(233, 181, 64, 0.08);
    color: var(--primary-gold);
  }
  
  .search-suggestion:last-child {
    border-bottom: none;
  }
  
  /* Form enhancement styles */
  .form-group.has-value .form-label {
    color: var(--primary-gold);
    transform: scale(0.9);
  }
  
  .floating-label {
    position: relative;
  }
  
  .floating-label .form-label {
    position: absolute;
    top: 18px;
    left: 20px;
    pointer-events: none;
    transition: all 0.3s ease;
    background: transparent;
  }
  
  .floating-label .form-input:focus + .form-label,
  .floating-label .form-input:not(:placeholder-shown) + .form-label {
    top: -8px;
    left: 16px;
    font-size: 0.75rem;
    color: var(--primary-gold);
    background: var(--card-gradient);
    padding: 0 8px;
    border-radius: 4px;
  }
  
  /* Progress indicator */
  .progress-indicator {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 20px 0;
    position: relative;
  }
  
  .progress-indicator::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(233, 181, 64, 0.2);
    z-index: 1;
  }
  
  .progress-step {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(233, 181, 64, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-weight: 600;
    position: relative;
    z-index: 2;
    transition: all 0.3s ease;
  }
  
  .progress-step.active {
    background: var(--primary-gold);
    color: #1a1a1a;
    transform: scale(1.1);
  }
  
  .progress-step.completed {
    background: #10b981;
    color: white;
  }
`;

// Export the class for potential external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BariAccountManager;
}

// Additional utility functions and enhancements
class BariAccountUtilities {
  static formatCurrency(amount, currency = 'INR') {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return formatter.format(amount);
  }

  static formatDate(date, locale = 'en-IN') {
    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    return formatter.format(new Date(date));
  }

  static generateOrderId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ORD-${timestamp}-${random}`.toUpperCase();
  }

  static validateIndianPincode(pincode) {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    return pincodeRegex.test(pincode);
  }

  static extractPhoneNumber(phone) {
    return phone.replace(/\D/g, '');
  }

  static maskEmail(email) {
    const [username, domain] = email.split('@');
    if (username.length <= 2) return email;

    const masked = username[0] + '*'.repeat(username.length - 2) + username.slice(-1);
    return `${masked}@${domain}`;
  }

  static maskPhone(phone) {
    const cleaned = this.extractPhoneNumber(phone);
    if (cleaned.length <= 4) return phone;

    return cleaned.substring(0, 2) + '*'.repeat(cleaned.length - 4) + cleaned.slice(-2);
  }

  static calculatePasswordStrength(password) {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    Object.values(checks).forEach(check => {
      if (check) score++;
    });

    const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';
    return { score, strength, checks };
  }

  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        timeout = null;
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static animateValue(element, start, end, duration = 1000) {
    const startTime = performance.now();
    const range = end - start;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (range * easeOut);

      element.textContent = Math.round(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }

  static createLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner"></div>';
    document.body.appendChild(overlay);

    return {
      show() {
        overlay.classList.add('active');
      },
      hide() {
        overlay.classList.remove('active');
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 300);
      }
    };
  }

  static copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'absolute';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();

      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return Promise.resolve();
      } catch (err) {
        document.body.removeChild(textArea);
        return Promise.reject(err);
      }
    }
  }

  static downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static isMobile() {
    return window.innerWidth <= 768 ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static isOnline() {
    return navigator.onLine;
  }

  static getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenWidth: screen.width,
      screenHeight: screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
    };
  }
}

// Enhanced error handling and logging
class BariErrorHandler {
  static init() {
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handleRejection.bind(this));
  }

  static handleError(event) {
    console.error('JavaScript Error:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });

    // Show user-friendly error message
    if (window.accountManager) {
      window.accountManager.showNotification(
        'Something went wrong. Please refresh the page and try again.',
        'error'
      );
    }
  }

  static handleRejection(event) {
    console.error('Unhandled Promise Rejection:', event.reason);

    if (window.accountManager) {
      window.accountManager.showNotification(
        'A network error occurred. Please check your connection.',
        'error'
      );
    }
  }
}

// Performance monitoring
class BariPerformanceMonitor {
  static init() {
    if ('performance' in window) {
      this.measurePageLoad();
      this.measureInteractions();
    }
  }

  static measurePageLoad() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          console.log('Page Load Performance:', {
            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
            totalTime: perfData.loadEventEnd - perfData.fetchStart
          });
        }
      }, 0);
    });
  }

  static measureInteractions() {
    const interactions = ['click', 'keydown', 'submit'];

    interactions.forEach(eventType => {
      document.addEventListener(eventType, (e) => {
        const start = performance.now();

        requestAnimationFrame(() => {
          const end = performance.now();
          const duration = end - start;

          if (duration > 16.67) { // More than 1 frame at 60fps
            console.warn(`Slow ${eventType} interaction:`, {
              target: e.target.tagName,
              duration: `${duration.toFixed(2)}ms`
            });
          }
        });
      });
    });
  }
}

// Initialize error handling and performance monitoring
BariErrorHandler.init();
BariPerformanceMonitor.init();

// Make utilities available globally
window.BariAccountUtilities = BariAccountUtilities;

console.log('🍽️ Bari Foods Account Management System Loaded Successfully');
console.log('📊 Performance monitoring active');
console.log('🛡️ Error handling initialized');
console.log('⌨️ Keyboard shortcuts: Alt+1 (Profile), Alt+2 (Security), Alt+3 (Orders), etc.');