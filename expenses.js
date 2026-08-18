window.BariEcom = window.BariEcom || {};

BariEcom.Expenses = (function() {
  let currentFilter = 'all';
  let currentStart = null;
  let currentEnd = null;

  function init() {
    const addBtn = document.getElementById('add-expense-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        openExpenseModal();
      });
    }

    const searchInput = document.getElementById('expense-search');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        render();
      });
    }

    if (BariEcom.UI && BariEcom.UI.setupDateFilters) {
      BariEcom.UI.setupDateFilters(
        'expenses-date-filters',
        'expenses-custom-dates', 
        'expenses-date-from',
        'expenses-date-to',
        function(start, end, filter) {
          currentStart = start;
          currentEnd = end;
          currentFilter = filter;
          render();
        }
      );
    }
  }

  function render() {
    const searchInput = document.getElementById('expense-search');
    const searchTerm = searchInput ? (searchInput.value || '').trim().toLowerCase() : '';
    let expenses = BariEcom.Data.getExpenses();

    if (currentFilter !== 'all' && currentStart && currentEnd) {
      expenses = BariEcom.UI.filterByDateRange(expenses, 'date', currentStart, currentEnd);
    }

    if (searchTerm) {
      expenses = expenses.filter(e => 
        (e.description && e.description.toLowerCase().includes(searchTerm)) ||
        (e.notes && e.notes.toLowerCase().includes(searchTerm))
      );
    }

    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Update summary
    const total = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const totalEl = document.getElementById('expenses-total');
    if (totalEl) totalEl.textContent = BariEcom.UI.formatCurrency(total);
    
    const countEl = document.getElementById('expenses-count');
    if (countEl) countEl.textContent = BariEcom.UI.formatNumber(expenses.length);

    renderTable(expenses);
    renderMobileCards(expenses);
  }

  function renderTable(expenses) {
    const tbody = document.getElementById('expenses-table-body');
    const emptyState = document.getElementById('expenses-empty');
    const tableContainer = document.getElementById('expenses-table-container');
    if (!tbody) return;

    if (expenses.length === 0) {
      if (tableContainer) tableContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (tableContainer) tableContainer.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = expenses.map(expense => `
      <tr>
        <td>${BariEcom.UI.formatDate(expense.date)}</td>
        <td><strong>${expense.description}</strong></td>
        <td><strong class="text-danger">${BariEcom.UI.formatCurrency(expense.amount)}</strong></td>
        <td>${expense.notes ? `<span class="text-tertiary">${expense.notes}</span>` : '-'}</td>
        <td class="actions-cell">
          <button class="btn btn-ghost btn-sm" onclick="BariEcom.Expenses.editExpense('${expense.id}')">تعديل</button>
          <button class="btn btn-ghost btn-sm btn-danger-text" onclick="BariEcom.Expenses.deleteExpense('${expense.id}')">حذف</button>
        </td>
      </tr>
    `).join('');
  }

  function renderMobileCards(expenses) {
    const container = document.getElementById('expenses-mobile-cards');
    if (!container) return;

    if (expenses.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = expenses.map(expense => `
      <div class="mobile-card">
        <div class="mobile-card-header">
          <strong>${expense.description}</strong>
          <span class="text-secondary text-sm">${BariEcom.UI.formatDate(expense.date)}</span>
        </div>
        <div class="mobile-card-row">
          <span class="mobile-card-label">المبلغ المصروف</span>
          <strong class="text-danger">${BariEcom.UI.formatCurrency(expense.amount)}</strong>
        </div>
        ${expense.notes ? `
        <div class="mobile-card-row">
          <span class="mobile-card-label">ملاحظات</span>
          <span class="text-tertiary">${expense.notes}</span>
        </div>` : ''}
        <div class="mobile-card-actions">
          <button class="btn btn-ghost btn-sm" onclick="BariEcom.Expenses.editExpense('${expense.id}')">تعديل</button>
          <button class="btn btn-ghost btn-sm btn-danger-text" onclick="BariEcom.Expenses.deleteExpense('${expense.id}')">حذف</button>
        </div>
      </div>
    `).join('');
  }

  function openExpenseModal(existingExpense = null) {
    const isEdit = !!existingExpense;
    const expDate = isEdit && existingExpense.date 
      ? new Date(existingExpense.date).toISOString().slice(0, 10) 
      : new Date().toISOString().slice(0, 10);
    
    const content = `
      <div class="form-group">
        <label class="form-label">التاريخ *</label>
        <input type="date" id="modal-expense-date" class="form-input" value="${expDate}">
      </div>
      
      <div class="form-group">
        <label class="form-label">وصف المصروف التشغيلي *</label>
        <input type="text" id="modal-expense-desc" class="form-input" 
               value="${isEdit ? (existingExpense.description || '') : ''}" placeholder="مثال: إعلانات ممولة، كول سنتر، شحن وتوصيل، تغليف...">
      </div>
      
      <div class="form-group">
        <label class="form-label">المبلغ *</label>
        <input type="number" id="modal-expense-amount" class="form-input" min="0" step="0.01"
               value="${isEdit ? (existingExpense.amount !== undefined ? existingExpense.amount : '') : ''}" placeholder="0.00">
      </div>
      
      <div class="form-group">
        <label class="form-label">ملاحظات (اختياري)</label>
        <textarea id="modal-expense-notes" class="form-input form-textarea" rows="2" placeholder="أي تفاصيل إضافية عن المصروف">${isEdit ? (existingExpense.notes || '') : ''}</textarea>
      </div>
    `;

    BariEcom.UI.showModal({
      title: isEdit ? 'تعديل المصروف التشغيلي' : 'إضافة مصروف تشغيلي جديد',
      content: content,
      saveText: isEdit ? 'حفظ التعديلات' : 'إضافة المصروف',
      onSave: function() {
        saveExpense(isEdit ? existingExpense : null);
      }
    });
  }

  function saveExpense(existingExpense) {
    const isEdit = !!existingExpense;
    const dateInput = document.getElementById('modal-expense-date');
    const descInput = document.getElementById('modal-expense-desc');
    const amountInput = document.getElementById('modal-expense-amount');
    const notesInput = document.getElementById('modal-expense-notes');

    const dateVal = dateInput ? dateInput.value : '';
    const description = descInput ? descInput.value.trim() : '';
    const amount = amountInput ? parseFloat(amountInput.value) : NaN;
    const notes = notesInput ? notesInput.value.trim() : '';

    if (!description) {
      BariEcom.UI.showToast('يرجى إدخال وصف المصروف', 'error');
      return;
    }
    if (isNaN(amount) || amount < 0) {
      BariEcom.UI.showToast('يرجى إدخال مبلغ صحيح', 'error');
      return;
    }

    const date = dateVal ? new Date(dateVal).toISOString() : new Date().toISOString();

    const expenseData = {
      date,
      description,
      amount,
      notes
    };

    if (isEdit) {
      BariEcom.Data.updateExpense(existingExpense.id, expenseData);
      BariEcom.UI.showToast('تم تحديث المصروف بنجاح', 'success');
    } else {
      BariEcom.Data.addExpense(expenseData);
      BariEcom.UI.showToast('تم تسجيل المصروف بنجاح', 'success');
    }

    BariEcom.UI.hideModal();
    render();
    if (BariEcom.Dashboard && typeof BariEcom.Dashboard.render === 'function') {
      BariEcom.Dashboard.render();
    }
    if (BariEcom.Profits && typeof BariEcom.Profits.render === 'function') {
      BariEcom.Profits.render();
    }
  }

  function editExpense(id) {
    const expense = BariEcom.Data.getExpenseById(id);
    if (expense) {
      openExpenseModal(expense);
    }
  }

  function deleteExpense(id) {
    const expense = BariEcom.Data.getExpenseById(id);
    if (!expense) return;

    BariEcom.UI.showConfirm('هل أنت متأكد من حذف المصروف "' + expense.description + '"؟', function() {
      BariEcom.Data.deleteExpense(id);
      BariEcom.UI.showToast('تم حذف المصروف بنجاح', 'success');
      render();
      if (BariEcom.Dashboard && typeof BariEcom.Dashboard.render === 'function') {
        BariEcom.Dashboard.render();
      }
      if (BariEcom.Profits && typeof BariEcom.Profits.render === 'function') {
        BariEcom.Profits.render();
      }
    });
  }

  return { init, render, editExpense, deleteExpense, openExpenseModal };
})();
