// Enhanced Profile Page JavaScript
class ProfileManager {
  constructor() {
    this.currentSection = 'profile';
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupPasswordStrength();
    this.setupFormValidation();
    this.setupDeleteConfirmation();
    this.loadUserData();
  }

  // Event Bindings
  bindEvents() {
    // Sidebar toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    menuToggle?.addEventListener('click', () => this.toggleSidebar());
    sidebarClose?.addEventListener('click', () => this.closeSidebar());
    sidebarOverlay?.addEventListener('click', () => this.closeSidebar());

    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        if (section) {
          this.showSection(section);
        }
      });
    });

    // Password toggle buttons
    document.querySelectorAll('.password-toggle').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.togglePasswordVisibility(button);
      });
    });

    // Form submissions
    document.getElementById('profileForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveProfile();
    });

    document.getElementById('securityForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.updatePassword();
    });

    document.getElementById('deleteAccountForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.deleteAccount();
    });

    // Address management
    document.querySelectorAll('.add-address').forEach(button => {
      button.addEventListener('click', () => this.addAddress());
    });

    // Escape key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
      }
    });
  }

  // Sidebar Management
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
  }

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Section Navigation
  showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(`${sectionName}Section`);
    if (targetSection) {
      targetSection.classList.add('active');
      this.currentSection = sectionName;
    }

    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }

    // Update page title based on section
    this.updatePageTitle(sectionName);

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }

    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  // Update page title dynamically
  updatePageTitle(sectionName) {
    const pageTitle = document.querySelector('.page-title-section h1');
    const pageSubtitle = document.querySelector('.page-subtitle');

    const sectionTitles = {
      profile: {
        title: 'Personal Information',
        subtitle: 'Update your basic profile details and contact information'
      },
      security: {
        title: 'Password & Security',
        subtitle: 'Keep your account secure with a strong password'
      },
      orders: {
        title: 'Order History',
        subtitle: 'Track and manage your purchases'
      },
      addresses: {
        title: 'Delivery Addresses',
        subtitle: 'Manage your saved delivery locations'
      },
      delete: {
        title: 'Delete Account',
        subtitle: 'Permanently remove your account and all data'
      }
    };

    const section = sectionTitles[sectionName];
    if (section && pageTitle && pageSubtitle) {
      pageTitle.textContent = section.title;
      pageSubtitle.textContent = section.subtitle;
    }
  }

  // Password Management
  togglePasswordVisibility(button) {
    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);
    const icon = button.querySelector('i');

    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fas fa-eye-slash';
    } else {
      input.type = 'password';
      icon.className = 'fas fa-eye';
    }
  }

  setupPasswordStrength() {
    const newPasswordInput = document.getElementById('newPassword');
    if (!newPasswordInput) return;

    newPasswordInput.addEventListener('input', (e) => {
      this.checkPasswordStrength(e.target.value);
    });
  }

  checkPasswordStrength(password) {
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    const requirements = document.querySelectorAll('.requirement');

    if (!strengthFill || !strengthText) return;

    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };

    // Update requirements
    requirements.forEach((req, index) => {
      const checkNames = ['length', 'uppercase', 'number', 'special'];
      const isValid = checks[checkNames[index]];

      req.classList.toggle('satisfied', isValid);
      const icon = req.querySelector('i');
      icon.className = isValid ? 'fas fa-check-circle' : 'fas fa-times-circle';
    });

    // Calculate strength
    const validChecks = Object.values(checks).filter(Boolean).length;
    let strength = 'weak';
    let percentage = 25;

    if (validChecks >= 3) {
      strength = 'medium';
      percentage = 60;
    }
    if (validChecks === 4) {
      strength = 'strong';
      percentage = 100;
    }

    strengthFill.className = `strength-fill ${strength}`;
    strengthFill.style.width = `${percentage}%`;
    strengthText.textContent = `Password strength: ${strength.charAt(0).toUpperCase() + strength.slice(1)}`;
  }

  // Form Validation
  setupFormValidation() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const inputs = form.querySelectorAll('input[required], select[required]');
      inputs.forEach(input => {
        input.addEventListener('blur', () => this.validateField(input));
        input.addEventListener('input', () => this.clearFieldError(input));
      });
    });
  }

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let message = '';

    // Required field check
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      message = 'This field is required';
    }

    // Email validation
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        message = 'Please enter a valid email address';
      }
    }

    // Phone validation
    if (field.type === 'tel' && value) {
      const phoneRegex = /^\+91\s?\d{10}$/;
      if (!phoneRegex.test(value)) {
        isValid = false;
        message = 'Please enter a valid phone number (+91 XXXXXXXXXX)';
      }
    }

    // Password confirmation
    if (field.id === 'confirmPassword') {
      const newPassword = document.getElementById('newPassword');
      if (newPassword && value !== newPassword.value) {
        isValid = false;
        message = 'Passwords do not match';
      }
    }

    this.showFieldValidation(field, isValid, message);
    return isValid;
  }

  showFieldValidation(field, isValid, message) {
    // Remove existing error
    this.clearFieldError(field);

    if (!isValid && message) {
      field.classList.add('error');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.textContent = message;
      errorDiv.style.cssText = `
        color: var(--danger);
        font-size: var(--text-xs);
        margin-top: var(--space-1);
      `;
      field.parentNode.appendChild(errorDiv);
    } else {
      field.classList.remove('error');
    }
  }

  clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }

  // Data Management
  loadUserData() {
    // Simulate loading user data
    const userData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      mobile: '+91 9876543210',
      gender: 'male',
      dateOfBirth: '1990-01-01'
    };

    // Populate form fields
    Object.keys(userData).forEach(key => {
      const field = document.getElementById(key);
      if (field) {
        field.value = userData[key];
      }
    });
  }

  // Profile Management
  saveProfile() {
    const form = document.getElementById('profileForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Validate all fields
    let isValid = true;
    form.querySelectorAll('input[required], select[required]').forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    if (!isValid) {
      this.showNotification('Please correct the errors before saving', 'error');
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    submitBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
      // Reset button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;

      // Update profile display
      this.updateProfileDisplay(data);

      this.showNotification('Profile updated successfully!', 'success');
    }, 1500);
  }

  updateProfileDisplay(data) {
    // Update sidebar profile info
    const profileName = document.querySelector('.profile-info h3');
    const profileEmail = document.querySelector('.profile-info p');

    if (profileName) {
      profileName.textContent = `${data.firstName} ${data.lastName}`;
    }
    if (profileEmail) {
      profileEmail.textContent = data.email;
    }
  }

  // Security Management
  updatePassword() {
    const form = document.getElementById('securityForm');
    const currentPassword = form.currentPassword.value;
    const newPassword = form.newPassword.value;
    const confirmPassword = form.confirmPassword.value;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      this.showNotification('Please fill in all password fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showNotification('New passwords do not match', 'error');
      return;
    }

    // Check password strength
    const strengthFill = document.querySelector('.strength-fill');
    if (!strengthFill.classList.contains('strong')) {
      this.showNotification('Please choose a stronger password', 'warning');
      return;
    }

    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    submitBtn.disabled = true;

    // Simulate API call
    setTimeout(() => {
      // Reset button and form
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      form.reset();

      // Reset password strength display
      const strengthFill = document.querySelector('.strength-fill');
      const strengthText = document.querySelector('.strength-text');
      strengthFill.style.width = '0%';
      strengthFill.className = 'strength-fill';
      strengthText.textContent = 'Password strength';

      this.showNotification('Password updated successfully!', 'success');
    }, 1500);
  }

  // Address Management
  addAddress() {
    const modal = this.createAddressModal();
    document.body.appendChild(modal);

    // Show modal with animation
    setTimeout(() => {
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
      modal.querySelector('.modal-content').style.transform = 'scale(1) translateY(0)';
    }, 10);
  }

  createAddressModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add New Address</h3>
          <button class="modal-close" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <form class="modal-body" id="addressForm">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Address Type</label>
              <select class="form-select" name="type" required>
                <option value="">Select type</option>
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" class="form-input" name="name" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Street Address</label>
              <input type="text" class="form-input" name="street" required>
            </div>
            <div class="form-group">
              <label class="form-label">City</label>
              <input type="text" class="form-input" name="city" required>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">State</label>
              <input type="text" class="form-input" name="state" required>
            </div>
            <div class="form-group">
              <label class="form-label">PIN Code</label>
              <input type="text" class="form-input" name="pincode" pattern="[0-9]{6}" required>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" class="form-input" name="phone" placeholder="+91 XXXXXXXXXX" required>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-ghost modal-cancel">Cancel</button>
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-plus"></i>
              Add Address
            </button>
          </div>
        </form>
      </div>
    `;

    // Add modal styles
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-modal);
      opacity: 0;
      visibility: hidden;
      transition: var(--transition);
      backdrop-filter: blur(8px);
    `;

    const modalContent = modal.querySelector('.modal-content');
    modalContent.style.cssText = `
      background: var(--bg-secondary);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-xl);
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      transform: scale(0.9) translateY(20px);
      transition: var(--transition);
    `;

    const modalHeader = modal.querySelector('.modal-header');
    modalHeader.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-6);
      border-bottom: 1px solid var(--glass-border);
    `;

    const modalBody = modal.querySelector('.modal-body');
    modalBody.style.cssText = `padding: var(--space-6);`;

    // Event handlers
    const closeModal = () => {
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
      modalContent.style.transform = 'scale(0.9) translateY(20px)';
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
    modal.querySelector('.modal-cancel')?.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    modal.querySelector('#addressForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveAddress(new FormData(e.target));
      closeModal();
    });

    return modal;
  }

  saveAddress(formData) {
    const data = Object.fromEntries(formData);

    // Create new address element
    const addressesGrid = document.querySelector('.addresses-grid');
    const addButton = addressesGrid?.querySelector('.add-address');

    const newAddress = document.createElement('div');
    newAddress.className = 'address-item';
    newAddress.innerHTML = `
      <div class="address-header">
        <div class="address-type">
          <i class="fas fa-${data.type === 'home' ? 'home' : data.type === 'work' ? 'building' : 'map-marker-alt'}"></i>
          ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}
        </div>
        <div class="address-badges">
          <span class="badge-primary">Active</span>
        </div>
      </div>
      <div class="address-content">
        <div class="address-name">${data.name}</div>
        <div class="address-details">
          ${data.street}<br>
          ${data.city}, ${data.state} ${data.pincode}
        </div>
        <div class="address-phone">
          <i class="fas fa-phone"></i>
          ${data.phone}
        </div>
      </div>
      <div class="address-actions">
        <button class="btn btn-small btn-ghost">
          <i class="fas fa-edit"></i>
          Edit
        </button>
        <button class="btn btn-small btn-outline">
          <i class="fas fa-trash"></i>
          Delete
        </button>
      </div>
    `;

    if (addButton) {
      addressesGrid.insertBefore(newAddress, addButton);
    }

    this.showNotification('Address added successfully!', 'success');
  }

  // Delete Account Management
  setupDeleteConfirmation() {
    const deleteForm = document.getElementById('deleteAccountForm');
    if (!deleteForm) return;

    const confirmInput = deleteForm.querySelector('input[name="confirmation"]');
    const deleteButton = deleteForm.querySelector('button[type="submit"]');

    confirmInput?.addEventListener('input', (e) => {
      const isValid = e.target.value.toLowerCase() === 'delete my account';
      deleteButton.disabled = !isValid;
      deleteButton.classList.toggle('btn-danger', isValid);
      deleteButton.classList.toggle('btn-ghost', !isValid);
    });
  }

  deleteAccount() {
    const confirmModal = this.createConfirmationModal(
      'Delete Account',
      'Are you absolutely sure? This action cannot be undone and will permanently delete your account and all associated data.',
      'Delete Forever',
      () => {
        this.showNotification('Account deletion initiated. You will be redirected shortly.', 'success');
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    );

    document.body.appendChild(confirmModal);
    setTimeout(() => {
      confirmModal.style.opacity = '1';
      confirmModal.style.visibility = 'visible';
    }, 10);
  }

  // Notification System
  showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Add notification styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      max-width: 400px;
      padding: var(--space-4);
      background: var(--surface);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      z-index: var(--z-tooltip);
      transform: translateX(100%);
      transition: var(--transition);
      backdrop-filter: blur(12px);
    `;

    const colors = {
      success: 'var(--success)',
      error: 'var(--danger)',
      warning: 'var(--warning)',
      info: 'var(--info)'
    };

    notification.style.borderLeftColor = colors[type];
    notification.style.borderLeftWidth = '4px';

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Auto hide after 5 seconds
    const timeoutId = setTimeout(() => {
      this.hideNotification(notification);
    }, 5000);

    // Close button handler
    notification.querySelector('.notification-close')?.addEventListener('click', () => {
      clearTimeout(timeoutId);
      this.hideNotification(notification);
    });
  }

  hideNotification(notification) {
    if (!notification) return;
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => notification.remove(), 300);
  }

  // Confirmation Modal
  createConfirmationModal(title, message, confirmText, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost modal-cancel">Cancel</button>
          <button class="btn btn-danger modal-confirm">${confirmText}</button>
        </div>
      </div>
    `;

    // Apply similar styling as address modal
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-modal);
      opacity: 0;
      visibility: hidden;
      transition: var(--transition);
      backdrop-filter: blur(8px);
    `;

    const closeModal = () => {
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.modal-cancel')?.addEventListener('click', closeModal);
    modal.querySelector('.modal-confirm')?.addEventListener('click', () => {
      onConfirm();
      closeModal();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    return modal;
  }
}

// Initialize ProfileManager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ProfileManager();
});