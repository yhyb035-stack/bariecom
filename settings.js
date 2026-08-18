window.BariEcom = window.BariEcom || {};

BariEcom.Settings = (function() {
  function init() {
    // Save settings
    const saveBtn = document.getElementById('save-settings-btn');
    if (saveBtn) saveBtn.addEventListener('click', saveProjectSettings);
    
    // Theme select in settings
    const themeSelect = document.getElementById('settings-theme-select');
    if (themeSelect) {
      themeSelect.value = BariEcom.UI.getTheme();
      themeSelect.addEventListener('change', function() {
        BariEcom.UI.setTheme(this.value);
      });
    }

    // Change code
    const changeCodeBtn = document.getElementById('change-code-btn');
    if (changeCodeBtn) changeCodeBtn.addEventListener('click', changeAccessCode);
    
    // Export
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) exportBtn.addEventListener('click', exportData);
    
    // Import
    const importBtn = document.getElementById('import-data-btn');
    const importFileInput = document.getElementById('import-file-input');
    if (importBtn && importFileInput) {
      importBtn.addEventListener('click', function() {
        importFileInput.click();
      });
      importFileInput.addEventListener('change', importData);
    }
    
    // Backup (same as export but with timestamp filename)
    const backupBtn = document.getElementById('backup-data-btn');
    if (backupBtn) backupBtn.addEventListener('click', backupData);
    
    // Reset
    const resetBtn = document.getElementById('reset-data-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetData);
  }

  function render() {
    const settings = BariEcom.Data.getSettings();
    
    const projectNameEl = document.getElementById('settings-project-name');
    if (projectNameEl) projectNameEl.value = settings.projectName || 'Bari Ecom';
    
    const ownerNameEl = document.getElementById('settings-owner-name');
    if (ownerNameEl) ownerNameEl.value = settings.ownerName || 'يحي باري';
    
    const currencyEl = document.getElementById('settings-currency');
    if (currencyEl) currencyEl.value = settings.currency || 'MRU';

    const themeSelect = document.getElementById('settings-theme-select');
    if (themeSelect) themeSelect.value = BariEcom.UI.getTheme();
    
    // Clear code fields
    const currentCode = document.getElementById('settings-current-code');
    if (currentCode) currentCode.value = '';
    
    const newCode = document.getElementById('settings-new-code');
    if (newCode) newCode.value = '';
    
    const confirmCode = document.getElementById('settings-confirm-code');
    if (confirmCode) confirmCode.value = '';
  }

  function saveProjectSettings() {
    const settings = BariEcom.Data.getSettings();
    
    const projectNameEl = document.getElementById('settings-project-name');
    settings.projectName = projectNameEl ? (projectNameEl.value.trim() || 'Bari Ecom') : 'Bari Ecom';
    
    const ownerNameEl = document.getElementById('settings-owner-name');
    settings.ownerName = ownerNameEl ? (ownerNameEl.value.trim() || 'يحي باري') : 'يحي باري';
    
    const currencyEl = document.getElementById('settings-currency');
    if (currencyEl) settings.currency = currencyEl.value || 'MRU';
    
    BariEcom.Data.saveSettings(settings);
    
    // Update branding
    if (BariEcom.App && BariEcom.App.updateBranding) {
      BariEcom.App.updateBranding();
    }
    
    BariEcom.UI.showToast('تم حفظ الإعدادات بنجاح', 'success');

    // Refresh pages that show currency
    if (BariEcom.Dashboard) BariEcom.Dashboard.render();
    if (BariEcom.Inventory) BariEcom.Inventory.render();
    if (BariEcom.Sales) BariEcom.Sales.render();
    if (BariEcom.Expenses) BariEcom.Expenses.render();
    if (BariEcom.Profits) BariEcom.Profits.render();
  }

  function changeAccessCode() {
    const currentCode = document.getElementById('settings-current-code').value;
    const newCode = document.getElementById('settings-new-code').value;
    const confirmCode = document.getElementById('settings-confirm-code').value;
    const settings = BariEcom.Data.getSettings();

    if (currentCode !== settings.accessCode) {
      BariEcom.UI.showToast('كود الدخول الحالي غير صحيح', 'error');
      return;
    }
    if (!newCode || newCode.length < 4) {
      BariEcom.UI.showToast('يجب أن يكون الكود الجديد 4 رموز على الأقل', 'error');
      return;
    }
    if (newCode !== confirmCode) {
      BariEcom.UI.showToast('الكود الجديد وتأكيد الكود غير متطابقين', 'error');
      return;
    }

    settings.accessCode = newCode;
    BariEcom.Data.saveSettings(settings);
    BariEcom.UI.showToast('تم تغيير كود الدخول بنجاح', 'success');
    render();
  }

  function exportData() {
    const data = BariEcom.Data.exportAllData();
    downloadJSON(data, 'bari-ecom-export.json');
    BariEcom.UI.showToast('تم تصدير نسخة البيانات بنجاح', 'success');
  }

  function backupData() {
    const data = BariEcom.Data.exportAllData();
    const date = new Date().toISOString().slice(0, 10);
    downloadJSON(data, 'bari-ecom-backup-' + date + '.json');
    BariEcom.UI.showToast('تم إنشاء النسخة الاحتياطية وتنزيلها', 'success');
  }

  function downloadJSON(data, filename) {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    BariEcom.UI.showConfirm('هل تريد استيراد هذا الملف؟ سيتم استبدال البيانات الحالية بالبيانات الموجودة في الملف.', function() {
      const reader = new FileReader();
      reader.onload = function(event) {
        const success = BariEcom.Data.importAllData(event.target.result);
        if (success) {
          BariEcom.UI.showToast('تم استيراد البيانات وتطبيقها بنجاح', 'success');
          render();
          if (BariEcom.App && BariEcom.App.updateBranding) BariEcom.App.updateBranding();
          if (BariEcom.Dashboard) BariEcom.Dashboard.render();
          if (BariEcom.Inventory) BariEcom.Inventory.render();
          if (BariEcom.Sales) BariEcom.Sales.render();
          if (BariEcom.Expenses) BariEcom.Expenses.render();
          if (BariEcom.Profits) BariEcom.Profits.render();
        } else {
          BariEcom.UI.showToast('فشل في استيراد البيانات. الملف غير متوافق.', 'error');
        }
      };
      reader.readAsText(file);
    });
    
    e.target.value = ''; // Reset input
  }

  function resetData() {
    BariEcom.UI.showConfirm('⚠️ تحذير: سيتم حذف جميع المبيعات والمنتجات والمصاريف نهائياً. هل أنت متأكد؟', function() {
      BariEcom.UI.showConfirm('تأكيد نهائي: هذا الإجراء لا يمكن التراجع عنه مطلقاً. هل تريد المتابعة؟', function() {
        BariEcom.Data.resetAllData();
        BariEcom.UI.showToast('تمت إعادة ضبط جميع البيانات بنجاح', 'success');
        render();
        if (BariEcom.App && BariEcom.App.updateBranding) BariEcom.App.updateBranding();
        if (BariEcom.Dashboard) BariEcom.Dashboard.render();
        if (BariEcom.Inventory) BariEcom.Inventory.render();
        if (BariEcom.Sales) BariEcom.Sales.render();
        if (BariEcom.Expenses) BariEcom.Expenses.render();
        if (BariEcom.Profits) BariEcom.Profits.render();
      });
    });
  }

  return { init, render };
})();
