class ProfileManager {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
    this.initializePasswordValidation();
  }

  bindEvents() {
    this.setupFilterBar();
    this.setupProfilePicture();
    this.setupPasswordToggle();
    this.setupFormHandlers();
    this.setupDeleteAccount();
    this.setupValidation();
  }

  setupFilterBar() {
    const filterChips = document.querySelectorAll('.filter-chip');

    filterChips.forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all chips
        filterChips.forEach(c => c.classList.remove('active'));

        // Add active class to clicked chip
        chip.classList.add('active');

        // Handle filter logic
        const filterType = chip.dataset.filter;
        this.handleFilter(filterType);
      });
    });
  }

  handleFilter(filterType) {
    const profileCards = document.querySelectorAll('.profile-card');

    switch (filterType) {
      case 'account':
        profileCards.forEach(card => card.style.display = 'block');
        break;
      case 'orders':
        profileCards.forEach(card => card.style.display = 'none');
        console.log('Showing orders content');
        break;
      case 'addresses':
        profileCards.forEach((card, index) => {
          // Show only address card (assuming it's the second card)
          card.style.display = index === 1 ? 'block' : 'none';
        });
        break;
      default:
        profileCards.forEach(card => card.style.display = 'block');
    }
  }

  setupProfilePicture() {
    const changePictureBtn = document.querySelector('.change-picture-btn');

    if (changePictureBtn) {
      changePictureBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleProfilePictureChange();
      });
    }
  }

  handleProfilePictureChange() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (this.validateImageFile(file)) {
          this.previewProfileImage(file);
        } else {
          this.showNotification('Please select a valid image file (JPG, PNG, GIF) under 5MB', 'error');
        }
      }
    };

    input.click();
  }

  validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  previewProfileImage(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const profileImage = document.getElementById('profileImage');
      if (profileImage) {
        profileImage.src = e.target.result;
        this.showNotification('Profile picture updated successfully!', 'success');
      }
    };

    reader.onerror = () => {
      this.showNotification('Error reading file. Please try again.', 'error');
    };

    reader.readAsDataURL(file);
  }

  setupPasswordToggle() {
    const passwordToggles = document.querySelectorAll('.password-toggle');

    passwordToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.togglePassword(toggle);
      });
    });
  }

  togglePassword(toggle) {
    const targetId = toggle.dataset.target;
    const passwordInput = document.getElementById(targetId);
    const icon = toggle.querySelector('i');

    if (passwordInput && icon) {
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
      }
    }
  }

  setupFormHandlers() {
    // Profile form
    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        this.handleProfileFormSubmit(e);
      });
    }

    // Address form
    const addressForm = document.querySelector('.address-form');
    if (addressForm) {
      addressForm.addEventListener('submit', (e) => {
        this.handleAddressFormSubmit(e);
      });
    }

    // Password form
    const passwordForm = document.querySelector('.password-form');
    if (passwordForm) {
      passwordForm.addEventListener('submit', (e) => {
        this.handlePasswordFormSubmit(e);
      });
    }

    // Cancel buttons
    const cancelBtns = document.querySelectorAll('.cancel-btn');
    cancelBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleCancel(e);
      });
    });
  }

  handleProfileFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const profileData = Object.fromEntries(formData);

    if (this.validateProfileForm(profileData)) {
      console.log('Profile data:', profileData);
      this.showNotification('Profile updated successfully!', 'success');
    }
  }

  handleAddressFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const addressData = Object.fromEntries(formData);

    if (this.validateAddressForm(addressData)) {
      console.log('Address data:', addressData);
      this.showNotification('Address updated successfully!', 'success');
    }
  }

  handlePasswordFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const passwordData = Object.fromEntries(formData);

    if (this.validatePasswordForm(passwordData)) {
      console.log('Password update requested');
      this.showNotification('Password updated successfully!', 'success');
      e.target.reset();
    }
  }

  handleCancel(e) {
    e.preventDefault();

    const form = e.target.closest('form');
    if (form) {
      form.reset();
      this.showNotification('Changes cancelled', 'info');
    }
  }

  validateProfileForm(data) {
    const errors = [];

    if (!data.firstName?.trim()) {
      errors.push('First name is required');
    }

    if (!data.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if (!data.email?.trim()) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(data.email)) {
      errors.push('Please enter a valid email address');
    }

    if (!data.mobile?.trim()) {
      errors.push('Mobile number is required');
    } else if (!this.isValidPhone(data.mobile)) {
      errors.push('Please enter a valid mobile number');
    }

    if (errors.length > 0) {
      this.showNotification(errors.join('<br>'), 'error');
      return false;
    }

    return true;
  }

  validateAddressForm(data) {
    const errors = [];

    if (!data.address?.trim()) {
      errors.push('Address is required');
    }

    if (!data.city?.trim()) {
      errors.push('City is required');
    }

    if (!data.state?.trim()) {
      errors.push('State is required');
    }

    if (!data.postalCode?.trim()) {
      errors.push('Postal code is required');
    } else if (!this.isValidPostalCode(data.postalCode)) {
      errors.push('Please enter a valid postal code');
    }

    if (errors.length > 0) {
      this.showNotification(errors.join('<br>'), 'error');
      return false;
    }

    return true;
  }

  validatePasswordForm(data) {
    const errors = [];

    if (!data.oldPassword?.trim()) {
      errors.push('Current password is required');
    }

    if (!data.newPassword?.trim()) {
      errors.push('New password is required');
    } else if (!this.isValidPassword(data.newPassword)) {
      errors.push('Password must meet all requirements');
    }

    if (!data.confirmPassword?.trim()) {
      errors.push('Please confirm your new password');
    }

    if (data.newPassword !== data.confirmPassword) {
      errors.push('New password and confirm password do not match');
    }

    if (data.oldPassword === data.newPassword) {
      errors.push('New password must be different from current password');
    }

    if (errors.length > 0) {
      this.showNotification(errors.join('<br>'), 'error');
      return false;
    }

    return true;
  }

  initializePasswordValidation() {
    const newPasswordInput = document.getElementById('newPassword');

    if (newPasswordInput) {
      newPasswordInput.addEventListener('input', (e) => {
        this.updatePasswordRequirements(e.target.value);
      });
    }
  }

  updatePasswordRequirements(password) {
    const requirements = document.querySelectorAll('.requirement');

    if (requirements.length === 0) return;

    const checks = [
      password.length >= 8,
      /[a-z]/.test(password) && /[A-Z]/.test(password),
      /\d/.test(password)
    ];

    requirements.forEach((req, index) => {
      const icon = req.querySelector('i');
      if (checks[index]) {
        icon.className = 'fas fa-check-circle';
        icon.style.color = '#4CAF50';
        req.style.color = '#4CAF50';
      } else {
        icon.className = 'fas fa-times-circle';
        icon.style.color = '#f44336';
        req.style.color = '#f44336';
      }
    });
  }

  setupValidation() {
    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.addEventListener('blur', (e) => {
        this.validateEmailField(e.target);
      });
    }

    // Mobile validation
    const mobileInput = document.getElementById('mobile');
    if (mobileInput) {
      mobileInput.addEventListener('blur', (e) => {
        this.validateMobileField(e.target);
      });
    }
  }

  validateEmailField(input) {
    const email = input.value.trim();

    if (email && !this.isValidEmail(email)) {
      this.showFieldError(input, 'Please enter a valid email address');
    } else {
      this.clearFieldError(input);
    }
  }

  validateMobileField(input) {
    const mobile = input.value.trim();

    if (mobile && !this.isValidPhone(mobile)) {
      this.showFieldError(input, 'Please enter a valid mobile number');
    } else {
      this.clearFieldError(input);
    }
  }

  showFieldError(input, message) {
    this.clearFieldError(input);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #f44336; font-size: 12px; margin-top: 4px;';

    input.parentNode.appendChild(errorDiv);
    input.style.borderColor = '#f44336';
  }

  clearFieldError(input) {
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
    input.style.borderColor = '';
  }

  setupDeleteAccount() {
    const deleteAccountBtn = document.querySelector('.delete-account-btn');

    if (deleteAccountBtn) {
      deleteAccountBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleDeleteAccount();
      });
    }
  }

  handleDeleteAccount() {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    );

    if (confirmed) {
      const doubleConfirm = confirm(
        'This will permanently delete all your data. Are you absolutely sure?'
      );

      if (doubleConfirm) {
        console.log('Account deletion requested');
        this.showNotification(
          'Account deletion request submitted. You will receive a confirmation email.',
          'success'
        );
      }
    }
  }

  // Validation helpers
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidPhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  isValidPostalCode(postalCode) {
    const postalRegex = /^[0-9]{5,6}$/;
    return postalRegex.test(postalCode);
  }

  isValidPassword(password) {
    const minLength = password.length >= 8;
    const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);

    return minLength && hasUpperLower && hasDigit;
  }

  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = message;

    // Style notification
    const baseStyles = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '16px 20px',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      zIndex: '9999',
      maxWidth: '400px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    };

    Object.assign(notification.style, baseStyles);

    // Set background color based on type
    const colors = {
      success: '#4CAF50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196F3'
    };

    notification.style.background = colors[type] || colors.info;

    // Add to document
    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  /**
   * API methods (commented out for optional server communication)
   */
  /*
  async sendProfileData(data) {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      this.showNotification('Failed to update profile. Please try again.', 'error');
    }
  }

  async sendAddressData(data) {
    try {
      const response = await fetch('/api/address', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update address');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating address:', error);
      this.showNotification('Failed to update address. Please try again.', 'error');
    }
  }

  async sendPasswordData(data) {
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPassword: data.oldPassword,
          newPassword: data.newPassword
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update password');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating password:', error);
      this.showNotification('Failed to update password. Please try again.', 'error');
    }
  }

  async requestAccountDeletion() {
    try {
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to request account deletion');
      }

      return await response.json();
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      this.showNotification('Failed to process deletion request. Please try again.', 'error');
    }
  }
  */
}

/**
 * Initialize profile manager when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  new ProfileManager();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProfileManager;
}