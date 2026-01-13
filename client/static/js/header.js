(function HeaderController() {
  function hydrateAvatar() {
    const target = document.getElementById("profileAvatar");
    if (!target) return;
    function initialsFromName() {
      const name = localStorage.getItem("userName") || "User";
      const initials =
        (name.trim().match(/\b\w/g) || []).slice(0, 2).join("").toUpperCase() ||
        "U";
      return initials;
    }

    target.innerHTML = "";
    const url = localStorage.getItem("userAvatarUrl");
    if (url) {
      const img = new Image();
      img.onload = () => {
        target.innerHTML = "";
        target.appendChild(img);
      };
      img.onerror = () => {
        target.textContent = initialsFromName();
      };
      img.src = url;
    } else {
      target.textContent = initialsFromName();
    }
  }

  const profileBtn = document.getElementById("profileBtn");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      window.location.href = "profile.html";
    });
  }

  window.addEventListener("storage", (e) => {
    if (e.key === "userAvatarUrl" || e.key === "userName") hydrateAvatar();
  });


  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hydrateAvatar, {
      once: true,
    });
  } else {
    hydrateAvatar();
  }
})();

(function MobileMenuController() {
  let menuToggle;
  let navLinks;
  let overlay;
  let isMenuOpen = false;

  function init() {
    createMenuToggle();
    
    createOverlay();
    
    menuToggle = document.querySelector('.menu-toggle');
    navLinks = document.querySelector('.nav-links');
    overlay = document.querySelector('.nav-overlay');
    
    if (!menuToggle || !navLinks) return;
    
    bindEvents();
  }

  function createMenuToggle() {
    if (document.querySelector('.menu-toggle')) return;
    
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    
    const toggle = document.createElement('button');
    toggle.className = 'menu-toggle';
    toggle.setAttribute('aria-label', 'Toggle navigation menu');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = `
      <span></span>
      <span></span>
      <span></span>
    `;
    
    const icons = navbar.querySelector('.icons');
    if (icons) {
      navbar.insertBefore(toggle, icons.nextSibling);
    } else {
      navbar.appendChild(toggle);
    }
  }

  function createOverlay() {
    if (document.querySelector('.nav-overlay')) return;
    
    const overlay = document.createElement('div');
    overlay.className = 'nav-overlay';
    document.body.appendChild(overlay);
  }

  function bindEvents() {
    menuToggle.addEventListener('click', toggleMenu);
    
    overlay.addEventListener('click', closeMenu);
    
    const navItems = navLinks.querySelectorAll('a');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          closeMenu();
        }
      });
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isMenuOpen) {
        closeMenu();
      }
    });
    
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (window.innerWidth > 768 && isMenuOpen) {
          closeMenu();
        }
      }, 200);
    });
    
    document.addEventListener('touchmove', (e) => {
      if (isMenuOpen && !e.target.closest('.nav-links')) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  function toggleMenu() {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function openMenu() {
    isMenuOpen = true;
    menuToggle.classList.add('active');
    navLinks.classList.add('active');
    overlay.classList.add('active');
    document.body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    
    trapFocus();
  }

  function closeMenu() {
    isMenuOpen = false;
    menuToggle.classList.remove('active');
    navLinks.classList.remove('active');
    overlay.classList.remove('active');
    document.body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  function trapFocus() {
    const focusableElements = navLinks.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    function handleTabKey(e) {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
    
    if (isMenuOpen) {
      document.addEventListener('keydown', handleTabKey);
      firstElement.focus();
    } else {
      document.removeEventListener('keydown', handleTabKey);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ==================== MOBILE MENU ENHANCEMENTS ====================
document.addEventListener('DOMContentLoaded', () => {
  const anchorLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  
  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      if (href.startsWith('#') && href !== '#') {
        e.preventDefault();
        
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          const headerHeight = document.querySelector('.navbar')?.offsetHeight || 0;
          const targetPosition = targetElement.offsetTop - headerHeight - 20;
          
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      }
    });
  });
});