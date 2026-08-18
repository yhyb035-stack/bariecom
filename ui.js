window.BariEcom = window.BariEcom || {};

BariEcom.UI = (function() {
  const THEME_KEY = 'bariEcom_theme';

  // Format currency: strictly Latin / Western Arabic numerals (0-9) + Currency symbol (e.g. 1,250 MRU)
  function formatCurrency(amount) {
    const settings = BariEcom.Data.getSettings();
    const currency = settings.currency || 'MRU';
    const num = Number(amount || 0);
    const formatted = num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    return `${formatted} ${currency}`;
  }

  // Format number: strictly Latin / Western Arabic numerals (0-9)
  function formatNumber(num) {
    const n = Number(num || 0);
    return n.toLocaleString('en-US');
  }

  // Format date: Latin numerals for year/month/day
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    // Format using Latin digits
    try {
      return d.toLocaleDateString('ar-u-nu-latn', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch(e) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // Format date and time: Latin numerals
  function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    try {
      return d.toLocaleDateString('ar-u-nu-latn', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch(e) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${mins}`;
    }
  }

  // THEME MANAGEMENT (Light / Dark Mode)
  function getTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  }

  function setTheme(theme) {
    const activeTheme = (theme === 'dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', activeTheme);
    localStorage.setItem(THEME_KEY, activeTheme);

    // Update UI toggle icons if they exist
    const themeIcons = document.querySelectorAll('.theme-toggle-icon');
    themeIcons.forEach(icon => {
      icon.textContent = (activeTheme === 'dark') ? '☀️' : '🌙';
    });

    const themeSelect = document.getElementById('settings-theme-select');
    if (themeSelect) {
      themeSelect.value = activeTheme;
    }

    // Redraw active charts to match new theme contrast
    if (BariEcom.Charts) {
      if (document.getElementById('sales-chart') && BariEcom.Dashboard) {
        BariEcom.Dashboard.render();
      }
      if (document.getElementById('profit-chart') && BariEcom.Profits) {
        BariEcom.Profits.render();
      }
    }
  }

  function toggleTheme() {
    const current = getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    setTheme(next);
    showToast(next === 'dark' ? 'تم تفعيل الوضع الليلي' : 'تم تفعيل الوضع النهاري', 'info');
  }

  function initTheme() {
    const saved = getTheme();
    setTheme(saved);
  }

  // MODAL
  function showModal(options) {
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const saveBtn = document.getElementById('modal-save');
    const cancelBtn = document.getElementById('modal-cancel');
    const footer = document.getElementById('modal-footer');
    
    if (titleEl) titleEl.textContent = options.title || '';
    if (bodyEl) bodyEl.innerHTML = options.content || '';
    
    if (options.showSave !== false && saveBtn) {
      saveBtn.style.display = '';
      saveBtn.textContent = options.saveText || 'حفظ';
      saveBtn.onclick = function() {
        if (options.onSave) options.onSave();
      };
    } else if (saveBtn) {
      saveBtn.style.display = 'none';
    }
    
    if (options.showCancel !== false && cancelBtn) {
      cancelBtn.style.display = '';
      cancelBtn.onclick = function() {
        hideModal();
      };
    } else if (cancelBtn) {
      cancelBtn.style.display = 'none';
    }
    
    const closeBtn = document.getElementById('modal-close');
    if (closeBtn) {
      closeBtn.onclick = function() {
        hideModal();
      };
    }

    if (overlay) {
      overlay.onclick = function(e) {
        if (e.target === overlay) {
          hideModal();
        }
      };
    }
    
    if (footer) {
      footer.style.display = (options.showSave === false && options.showCancel === false) ? 'none' : '';
    }
    
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Focus first input
      setTimeout(() => {
        const firstInput = document.querySelector('#modal-body input:not([type=hidden]), #modal-body select, #modal-body textarea');
        if (firstInput) firstInput.focus();
      }, 100);
    }
  }

  function hideModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
      const saveBtn = document.getElementById('modal-save');
      if (saveBtn) saveBtn.onclick = null;
    }
  }

  // CONFIRM DIALOG
  function showConfirm(message, onConfirm) {
    const overlay = document.getElementById('confirm-overlay');
    const msgEl = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');
    
    if (msgEl) msgEl.textContent = message;
    
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    
    if (yesBtn) {
      yesBtn.onclick = function() {
        hideConfirm();
        if (onConfirm) onConfirm();
      };
    }
    
    if (noBtn) {
      noBtn.onclick = function() {
        hideConfirm();
      };
    }
  }

  function hideConfirm() {
    const overlay = document.getElementById('confirm-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  // TOAST
  function showToast(message, type) {
    type = type || 'info';
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    
    let icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠️';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // DATE RANGE HELPERS
  function getDateRange(filter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start, end;

    switch(filter) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        end.setDate(end.getDate() + 1);
        break;
      case 'week':
        start = new Date(today);
        // Start from Saturday (Arabic week)
        const dayOfWeek = start.getDay();
        const diff = dayOfWeek === 6 ? 0 : dayOfWeek + 1;
        start.setDate(start.getDate() - diff);
        end = new Date(start);
        end.setDate(end.getDate() + 7);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        start = new Date(0);
        end = new Date(9999, 11, 31);
    }
    return { start, end };
  }

  function filterByDateRange(items, dateField, start, end) {
    if (!items || !Array.isArray(items)) return [];
    return items.filter(item => {
      const dateVal = item[dateField];
      if (!dateVal) return false;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return false;
      return d >= start && d < end;
    });
  }

  // Setup date filter buttons for a container
  function setupDateFilters(containerId, customDatesId, dateFromId, dateToId, onChange) {
    const container = document.getElementById(containerId);
    const customDates = document.getElementById(customDatesId);
    const dateFrom = document.getElementById(dateFromId);
    const dateTo = document.getElementById(dateToId);

    if (!container) return;

    container.addEventListener('click', function(e) {
      const btn = e.target.closest('.date-filter-btn');
      if (!btn) return;

      container.querySelectorAll('.date-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      if (filter === 'custom') {
        if (customDates) customDates.style.display = 'block';
        if (dateFrom && dateTo && dateFrom.value && dateTo.value) {
          const start = new Date(dateFrom.value);
          const end = new Date(dateTo.value);
          end.setDate(end.getDate() + 1);
          if (onChange) onChange(start, end, 'custom');
        }
      } else {
        if (customDates) customDates.style.display = 'none';
        const range = getDateRange(filter);
        if (onChange) onChange(range.start, range.end, filter);
      }
    });

    if (dateFrom && dateTo) {
      const onCustomChange = function() {
        if (dateFrom.value && dateTo.value) {
          const start = new Date(dateFrom.value);
          const end = new Date(dateTo.value);
          end.setDate(end.getDate() + 1);
          if (onChange) onChange(start, end, 'custom');
        }
      };
      dateFrom.addEventListener('change', onCustomChange);
      dateTo.addEventListener('change', onCustomChange);
    }
  }

  // Empty state HTML
  function createEmptyState(icon, title, text) {
    return `<div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <div class="empty-state-title">${title}</div>
      <div class="empty-state-text">${text}</div>
    </div>`;
  }

  return {
    formatCurrency, formatNumber, formatDate, formatDateTime,
    getTheme, setTheme, toggleTheme, initTheme,
    showModal, hideModal, showConfirm, hideConfirm, showToast,
    getDateRange, filterByDateRange, setupDateFilters, createEmptyState
  };
})();
