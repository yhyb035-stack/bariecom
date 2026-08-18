window.BariEcom = window.BariEcom || {};

BariEcom.App = (function() {
  const SESSION_KEY = 'bariEcom_auth_session';
  let currentPage = 'dashboard';

  function init() {
    // 1. Initialize Theme from localStorage
    if (BariEcom.UI && BariEcom.UI.initTheme) {
      BariEcom.UI.initTheme();
    }

    setupLogin();
    setupNavigation();
    setupMobileSidebar();
    setupThemeToggle();
    setupLogout();

    // 2. Initialize all page modules
    if (BariEcom.Dashboard && typeof BariEcom.Dashboard.init === 'function') {
      BariEcom.Dashboard.init();
    }
    if (BariEcom.Inventory && typeof BariEcom.Inventory.init === 'function') {
      BariEcom.Inventory.init();
    }
    if (BariEcom.Sales && typeof BariEcom.Sales.init === 'function') {
      BariEcom.Sales.init();
    }
    if (BariEcom.Expenses && typeof BariEcom.Expenses.init === 'function') {
      BariEcom.Expenses.init();
    }
    if (BariEcom.Profits && typeof BariEcom.Profits.init === 'function') {
      BariEcom.Profits.init();
    }
    if (BariEcom.Settings && typeof BariEcom.Settings.init === 'function') {
      BariEcom.Settings.init();
    }

    // 3. Check existing authentication
    if (isAuthenticated()) {
      showApp();
    } else {
      showLogin();
    }

    // 4. Resize listener for canvas charts
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        if (currentPage === 'dashboard' && BariEcom.Dashboard) {
          BariEcom.Dashboard.render();
        } else if (currentPage === 'profits' && BariEcom.Profits) {
          BariEcom.Profits.render();
        }
      }, 150);
    });
  }

  function isAuthenticated() {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  }

  function setupLogin() {
    const loginBtn = document.getElementById('login-btn');
    const loginInput = document.getElementById('login-code');
    const loginError = document.getElementById('login-error');

    function handleLogin() {
      const code = (loginInput.value || '').trim();
      const settings = BariEcom.Data.getSettings();

      if (code === (settings.accessCode || '1234')) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        loginInput.value = '';
        if (loginError) loginError.style.display = 'none';
        showApp();
      } else {
        if (loginError) {
          loginError.textContent = 'كود الدخول غير صحيح، يرجى المحاولة مرة أخرى';
          loginError.style.display = 'block';
        }
        loginInput.classList.add('error');
        loginInput.focus();
        loginInput.select();
      }
    }

    if (loginBtn) {
      loginBtn.addEventListener('click', handleLogin);
    }

    if (loginInput) {
      loginInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          handleLogin();
        } else {
          loginInput.classList.remove('error');
          if (loginError) loginError.style.display = 'none';
        }
      });
    }
  }

  function showLogin() {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app');
    if (loginScreen) loginScreen.style.display = 'flex';
    if (appScreen) appScreen.style.display = 'none';

    const loginInput = document.getElementById('login-code');
    if (loginInput) {
      setTimeout(() => loginInput.focus(), 100);
    }
  }

  function showApp() {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app');
    if (loginScreen) loginScreen.style.display = 'none';
    if (appScreen) appScreen.style.display = 'flex';

    updateBranding();
    navigate(currentPage || 'dashboard');
  }

  function updateBranding() {
    const settings = BariEcom.Data.getSettings();
    
    const ownerEl = document.getElementById('sidebar-owner');
    if (ownerEl) ownerEl.textContent = settings.ownerName || 'يحي باري';

    const topOwnerEl = document.getElementById('topbar-owner-name');
    if (topOwnerEl) topOwnerEl.textContent = settings.ownerName || 'يحي باري';

    const dashOwnerEl = document.getElementById('dashboard-owner');
    if (dashOwnerEl) dashOwnerEl.textContent = settings.ownerName || 'يحي باري';

    const logoEls = document.querySelectorAll('.brand-name, .sidebar-logo');
    logoEls.forEach(el => {
      el.textContent = settings.projectName || 'Bari Ecom';
    });
  }

  function setupNavigation() {
    const nav = document.getElementById('sidebar-nav');
    if (!nav) return;

    nav.addEventListener('click', function(e) {
      const link = e.target.closest('[data-page]');
      if (!link) return;
      e.preventDefault();

      const page = link.getAttribute('data-page');
      navigate(page);
    });
  }

  function navigate(pageId) {
    currentPage = pageId;

    // Update nav active states
    const navItems = document.querySelectorAll('#sidebar-nav .nav-item');
    navItems.forEach(item => {
      if (item.getAttribute('data-page') === pageId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update pages visibility
    const pages = document.querySelectorAll('#main-content .page');
    pages.forEach(page => {
      if (page.id === 'page-' + pageId) {
        page.style.display = 'block';
        page.classList.add('active');
      } else {
        page.style.display = 'none';
        page.classList.remove('active');
      }
    });

    // Close mobile sidebar if open
    closeMobileSidebar();

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render active page module
    switch(pageId) {
      case 'dashboard':
        if (BariEcom.Dashboard && typeof BariEcom.Dashboard.render === 'function') {
          BariEcom.Dashboard.render();
        }
        break;
      case 'inventory':
        if (BariEcom.Inventory && typeof BariEcom.Inventory.render === 'function') {
          BariEcom.Inventory.render();
        }
        break;
      case 'sales':
        if (BariEcom.Sales && typeof BariEcom.Sales.render === 'function') {
          BariEcom.Sales.render();
        }
        break;
      case 'expenses':
        if (BariEcom.Expenses && typeof BariEcom.Expenses.render === 'function') {
          BariEcom.Expenses.render();
        }
        break;
      case 'profits':
        if (BariEcom.Profits && typeof BariEcom.Profits.render === 'function') {
          BariEcom.Profits.render();
        }
        break;
      case 'settings':
        if (BariEcom.Settings && typeof BariEcom.Settings.render === 'function') {
          BariEcom.Settings.render();
        }
        break;
    }
  }

  function setupMobileSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const overlay = document.getElementById('sidebar-overlay');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        document.body.classList.toggle('sidebar-open');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', function() {
        closeMobileSidebar();
      });
    }
  }

  function closeMobileSidebar() {
    document.body.classList.remove('sidebar-open');
  }

  function setupThemeToggle() {
    const toggles = document.querySelectorAll('.theme-toggle-btn');
    toggles.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        BariEcom.UI.toggleTheme();
      });
    });
  }

  function setupLogout() {
    const logoutBtns = document.querySelectorAll('#logout-btn, .logout-action-btn');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        BariEcom.UI.showConfirm('هل ترغب في تسجيل الخروج من النظام؟', function() {
          logout();
        });
      });
    });
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
    if (BariEcom.UI) {
      BariEcom.UI.showToast('تم تسجيل الخروج بنجاح', 'info');
    }
  }

  return {
    init,
    navigate,
    logout,
    updateBranding,
    isAuthenticated
  };
})();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  BariEcom.App.init();
});
