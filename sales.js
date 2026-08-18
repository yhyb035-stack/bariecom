window.BariEcom = window.BariEcom || {};

BariEcom.Sales = (function() {
  let currentFilter = 'all';
  let currentStart = null;
  let currentEnd = null;

  function init() {
    // Add sale button
    const addBtn = document.getElementById('add-sale-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        openNewSaleModal();
      });
    }

    // Search
    const searchInput = document.getElementById('sale-search');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        render();
      });
    }

    // Date filters
    BariEcom.UI.setupDateFilters(
      'sales-date-filters',
      'sales-custom-dates',
      'sales-date-from',
      'sales-date-to',
      function(start, end, filter) {
        currentStart = start;
        currentEnd = end;
        currentFilter = filter;
        render();
      }
    );
  }

  function render() {
    const searchEl = document.getElementById('sale-search');
    const searchTerm = searchEl ? (searchEl.value || '').trim().toLowerCase() : '';
    let sales = BariEcom.Data.getSales();

    // Date filter
    if (currentFilter !== 'all' && currentStart && currentEnd) {
      sales = BariEcom.UI.filterByDateRange(sales, 'date', currentStart, currentEnd);
    }

    // Search filter
    if (searchTerm) {
      sales = sales.filter(s => 
        (s.productName && s.productName.toLowerCase().includes(searchTerm)) ||
        (s.transactionNumber && s.transactionNumber.toLowerCase().includes(searchTerm))
      );
    }

    // Sort by date desc
    sales.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Update summary stats
    const totalSales = sales.reduce((sum, s) => sum + Number(s.totalSale || 0), 0);
    const salesCount = sales.length;
    const totalProfit = sales.reduce((sum, s) => sum + Number(s.profit || 0), 0);

    const totalEl = document.getElementById('sales-total');
    if (totalEl) totalEl.textContent = BariEcom.UI.formatCurrency(totalSales);

    const countEl = document.getElementById('sales-count');
    if (countEl) countEl.textContent = BariEcom.UI.formatNumber(salesCount);

    const profitEl = document.getElementById('sales-profit');
    if (profitEl) {
      profitEl.textContent = BariEcom.UI.formatCurrency(totalProfit);
      profitEl.className = 'stat-value ' + (totalProfit >= 0 ? 'value-positive' : 'value-negative');
    }

    renderTable(sales);
    renderMobileCards(sales);
  }

  function renderTable(sales) {
    const tbody = document.getElementById('sales-table-body');
    const emptyState = document.getElementById('sales-empty');
    const tableContainer = document.getElementById('sales-table-container');
    if (!tbody) return;

    if (sales.length === 0) {
      if (tableContainer) tableContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (tableContainer) tableContainer.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = sales.map(s => {
      const profitClass = s.profit >= 0 ? 'value-positive' : 'value-negative';
      return `<tr>
        <td><strong>${s.transactionNumber}</strong></td>
        <td>${BariEcom.UI.formatDateTime(s.date)}</td>
        <td><strong>${s.productName}</strong></td>
        <td><span class="font-mono">${BariEcom.UI.formatNumber(s.quantity)}</span></td>
        <td>${BariEcom.UI.formatCurrency(s.actualSellingPrice)}</td>
        <td><strong>${BariEcom.UI.formatCurrency(s.totalSale)}</strong></td>
        <td class="text-tertiary">${BariEcom.UI.formatCurrency(s.productCost)}</td>
        <td class="${profitClass}"><strong>${BariEcom.UI.formatCurrency(s.profit)}</strong></td>
        <td class="actions-cell">
          <button class="btn btn-ghost btn-sm" onclick="BariEcom.Sales.editSale('${s.id}')">تعديل</button>
          <button class="btn btn-ghost btn-sm btn-danger-text" onclick="BariEcom.Sales.deleteSale('${s.id}')">حذف</button>
        </td>
      </tr>`;
    }).join('');
  }

  function renderMobileCards(sales) {
    const container = document.getElementById('sales-mobile-cards');
    if (!container) return;

    if (sales.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = sales.map(s => {
      const profitClass = s.profit >= 0 ? 'value-positive' : 'value-negative';
      return `<div class="mobile-card">
        <div class="mobile-card-header">
          <strong>${s.transactionNumber}</strong>
          <span class="text-secondary text-sm">${BariEcom.UI.formatDate(s.date)}</span>
        </div>
        <div class="mobile-card-row">
          <span class="mobile-card-label">المنتج</span>
          <strong>${s.productName}</strong>
        </div>
        <div class="mobile-card-row">
          <span class="mobile-card-label">الكمية المباعة</span>
          <span>${BariEcom.UI.formatNumber(s.quantity)}</span>
        </div>
        <div class="mobile-card-row">
          <span class="mobile-card-label">سعر البيع الفعلي للوحدة</span>
          <span>${BariEcom.UI.formatCurrency(s.actualSellingPrice)}</span>
        </div>
        <div class="mobile-card-row">
          <span class="mobile-card-label">إجمالي الإيراد</span>
          <strong>${BariEcom.UI.formatCurrency(s.totalSale)}</strong>
        </div>
        <div class="mobile-card-row">
          <span class="mobile-card-label">تكلفة البضاعة المباعة (COGS)</span>
          <span class="text-tertiary">${BariEcom.UI.formatCurrency(s.productCost)}</span>
        </div>
        <div class="mobile-card-row" style="background: var(--color-surface-hover); padding: 6px 8px; border-radius: var(--radius-sm); margin-top: 4px;">
          <span class="mobile-card-label font-bold">الربح من العملية</span>
          <span class="${profitClass} font-bold">${BariEcom.UI.formatCurrency(s.profit)}</span>
        </div>
        <div class="mobile-card-actions">
          <button class="btn btn-ghost btn-sm" onclick="BariEcom.Sales.editSale('${s.id}')">تعديل</button>
          <button class="btn btn-ghost btn-sm btn-danger-text" onclick="BariEcom.Sales.deleteSale('${s.id}')">حذف</button>
        </div>
      </div>`;
    }).join('');
  }

  function openNewSaleModal(existingSale) {
    const isEdit = !!existingSale;
    const products = BariEcom.Data.getProducts();

    if (products.length === 0) {
      BariEcom.UI.showToast('يرجى إضافة منتجات إلى المخزن أولاً', 'warning');
      return;
    }

    // Product options
    const productOptions = products.map(p => {
      const stock = p.currentQuantity + (isEdit && existingSale.productId === p.id ? existingSale.quantity : 0);
      return `<option value="${p.id}" ${isEdit && existingSale.productId === p.id ? 'selected' : ''}>
        ${p.name} (المتاح: ${BariEcom.UI.formatNumber(stock)})
      </option>`;
    }).join('');

    const defaultDate = isEdit && existingSale.date 
      ? new Date(existingSale.date).toISOString().slice(0, 16) 
      : new Date().toISOString().slice(0, 16);

    const content = `
      <div class="form-group">
        <label class="form-label">المنتج *</label>
        <select id="modal-sale-product" class="form-select">
          <option value="">-- اختر المنتج من المخزن --</option>
          ${productOptions}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">الكمية المطلوبة *</label>
          <input type="number" id="modal-sale-quantity" class="form-input" value="${isEdit ? existingSale.quantity : 1}" min="1" step="1">
          <p class="form-hint" id="modal-sale-stock-hint"></p>
        </div>
        <div class="form-group">
          <label class="form-label">سعر البيع الفعلي للوحدة *</label>
          <input type="number" id="modal-sale-price" class="form-input" value="${isEdit ? existingSale.actualSellingPrice : ''}" min="0" step="0.01" placeholder="0.00">
          <p class="form-hint" id="modal-sale-default-hint"></p>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">تاريخ ووقت البيع</label>
        <input type="datetime-local" id="modal-sale-date" class="form-input" value="${defaultDate}">
      </div>
      <div class="form-summary" id="modal-sale-summary">
        <div class="summary-title" style="font-weight:600;font-size:13px;color:var(--color-text-secondary);margin-bottom:8px">ملخص المعاملة الحسابية:</div>
        <div class="mobile-card-row">
          <span class="mobile-card-label">إجمالي البيع (الإيراد)</span>
          <strong id="modal-sale-total">0 MRU</strong>
        </div>
        <div class="mobile-card-row">
          <span class="mobile-card-label">تكلفة البضاعة المباعة (COGS)</span>
          <span id="modal-sale-cost" class="text-tertiary">0 MRU</span>
        </div>
        <div class="mobile-card-row" style="margin-top:4px;padding-top:6px;border-top:1px dashed var(--color-border);">
          <span class="mobile-card-label" style="font-weight:700">ربح العملية</span>
          <strong id="modal-sale-profit" style="font-size:16px">0 MRU</strong>
        </div>
      </div>
    `;

    BariEcom.UI.showModal({
      title: isEdit ? 'تعديل عملية البيع' : 'تسجيل عملية بيع جديدة',
      content: content,
      saveText: isEdit ? 'حفظ التعديلات' : 'تسجيل البيع',
      onSave: function() {
        saveSale(isEdit ? existingSale : null);
      }
    });

    // Wire up real-time calculation
    const productSelect = document.getElementById('modal-sale-product');
    const qtyInput = document.getElementById('modal-sale-quantity');
    const priceInput = document.getElementById('modal-sale-price');

    function updateCalculation() {
      const productId = productSelect.value;
      const product = BariEcom.Data.getProductById(productId);
      
      const qty = parseInt(qtyInput.value) || 0;
      const price = parseFloat(priceInput.value) || 0;
      const purchasePrice = product ? Number(product.purchasePrice || 0) : (isEdit ? Number(existingSale.purchasePrice || 0) : 0);
      
      const total = price * qty;
      const cost = purchasePrice * qty;
      const profit = total - cost;

      document.getElementById('modal-sale-total').textContent = BariEcom.UI.formatCurrency(total);
      document.getElementById('modal-sale-cost').textContent = BariEcom.UI.formatCurrency(cost);
      
      const profitEl = document.getElementById('modal-sale-profit');
      profitEl.textContent = BariEcom.UI.formatCurrency(profit);
      profitEl.className = profit >= 0 ? 'value-positive' : 'value-negative';

      // Stock check
      if (product) {
        const availableStock = product.currentQuantity + (isEdit && existingSale.productId === productId ? existingSale.quantity : 0);
        const hint = document.getElementById('modal-sale-stock-hint');
        if (qty > availableStock) {
          hint.textContent = `⚠️ تنبيه: الكمية المطلوبة (${BariEcom.UI.formatNumber(qty)}) تتجاوز المخزون المتاح (${BariEcom.UI.formatNumber(availableStock)})`;
          hint.style.color = 'var(--color-danger)';
        } else {
          hint.textContent = `المتاح بالمخزن: ${BariEcom.UI.formatNumber(availableStock)} وحدة`;
          hint.style.color = 'var(--color-text-tertiary)';
        }
      }
    }

    productSelect.addEventListener('change', function() {
      const product = BariEcom.Data.getProductById(this.value);
      if (product) {
        priceInput.value = product.defaultSellingPrice;
        document.getElementById('modal-sale-default-hint').textContent = 'السعر الافتراضي المقترح: ' + BariEcom.UI.formatCurrency(product.defaultSellingPrice);
        updateCalculation();
      }
    });

    qtyInput.addEventListener('input', updateCalculation);
    priceInput.addEventListener('input', updateCalculation);

    // If editing or preselected, trigger initial calculation
    if (isEdit) {
      const product = BariEcom.Data.getProductById(existingSale.productId);
      if (product) {
        document.getElementById('modal-sale-default-hint').textContent = 'السعر الافتراضي المقترح: ' + BariEcom.UI.formatCurrency(product.defaultSellingPrice);
      }
      updateCalculation();
    }
  }

  function saveSale(existingSale) {
    const isEdit = !!existingSale;
    const productId = document.getElementById('modal-sale-product').value;
    const quantity = parseInt(document.getElementById('modal-sale-quantity').value);
    const actualSellingPrice = parseFloat(document.getElementById('modal-sale-price').value);
    const dateValue = document.getElementById('modal-sale-date').value;

    // Validation
    if (!productId) {
      BariEcom.UI.showToast('يرجى اختيار المنتج', 'error');
      return;
    }
    if (isNaN(quantity) || quantity < 1) {
      BariEcom.UI.showToast('يرجى إدخال كمية صحيحة (1 أو أكثر)', 'error');
      return;
    }
    if (isNaN(actualSellingPrice) || actualSellingPrice < 0) {
      BariEcom.UI.showToast('يرجى إدخال سعر بيع صحيح', 'error');
      return;
    }

    const product = BariEcom.Data.getProductById(productId);
    if (!product) {
      BariEcom.UI.showToast('المنتج غير موجود في قاعدة البيانات', 'error');
      return;
    }

    // Check stock availability
    let availableStock = product.currentQuantity;
    if (isEdit && existingSale.productId === productId) {
      availableStock += existingSale.quantity; // Add back old quantity
    }

    if (quantity > availableStock) {
      BariEcom.UI.showToast(`عفواً، الكمية المطلوبة (${BariEcom.UI.formatNumber(quantity)}) تفوق المخزون المتاح (${BariEcom.UI.formatNumber(availableStock)})`, 'error');
      return;
    }

    const date = dateValue ? new Date(dateValue).toISOString() : new Date().toISOString();

    if (isEdit) {
      // 1. Restore old inventory first
      const oldProduct = BariEcom.Data.getProductById(existingSale.productId);
      if (oldProduct) {
        BariEcom.Data.updateProduct(existingSale.productId, {
          currentQuantity: oldProduct.currentQuantity + existingSale.quantity
        });
      }

      // 2. Update sale record with actual selling price & cost
      BariEcom.Data.updateSale(existingSale.id, {
        productId,
        productName: product.name,
        quantity,
        purchasePrice: product.purchasePrice,
        actualSellingPrice,
        totalSale: actualSellingPrice * quantity,
        productCost: product.purchasePrice * quantity,
        profit: (actualSellingPrice * quantity) - (product.purchasePrice * quantity),
        date
      });

      // 3. Deduct new inventory from product
      const updatedProduct = BariEcom.Data.getProductById(productId);
      if (updatedProduct) {
        BariEcom.Data.updateProduct(productId, {
          currentQuantity: updatedProduct.currentQuantity - quantity
        });
      }

      BariEcom.UI.showToast('تم تحديث عملية البيع وتحديث المخزون بنجاح', 'success');
    } else {
      // New sale
      BariEcom.Data.addSale({
        productId,
        productName: product.name,
        quantity,
        purchasePrice: product.purchasePrice,
        actualSellingPrice,
        date
      });

      // Reduce inventory
      BariEcom.Data.updateProduct(productId, {
        currentQuantity: product.currentQuantity - quantity
      });

      BariEcom.UI.showToast('تم تسجيل عملية البيع وخصم المخزون بنجاح', 'success');
    }

    BariEcom.UI.hideModal();
    render();
    if (BariEcom.Inventory && typeof BariEcom.Inventory.render === 'function') BariEcom.Inventory.render();
    if (BariEcom.Dashboard && typeof BariEcom.Dashboard.render === 'function') BariEcom.Dashboard.render();
    if (BariEcom.Profits && typeof BariEcom.Profits.render === 'function') BariEcom.Profits.render();
  }

  function editSale(id) {
    const sales = BariEcom.Data.getSales();
    const sale = sales.find(s => s.id === id);
    if (sale) openNewSaleModal(sale);
  }

  function deleteSale(id) {
    const sales = BariEcom.Data.getSales();
    const sale = sales.find(s => s.id === id);
    if (!sale) return;

    BariEcom.UI.showConfirm(`هل أنت متأكد من حذف عملية البيع ${sale.transactionNumber}؟ سيتم استرجاع (${BariEcom.UI.formatNumber(sale.quantity)}) وحدة إلى المخزن وإلغاء أثرها المالي.`, function() {
      // Restore inventory
      const product = BariEcom.Data.getProductById(sale.productId);
      if (product) {
        BariEcom.Data.updateProduct(sale.productId, {
          currentQuantity: product.currentQuantity + sale.quantity
        });
      }

      BariEcom.Data.deleteSale(id);
      BariEcom.UI.showToast('تم حذف عملية البيع واسترجاع المخزون بنجاح', 'success');
      render();
      if (BariEcom.Inventory && typeof BariEcom.Inventory.render === 'function') BariEcom.Inventory.render();
      if (BariEcom.Dashboard && typeof BariEcom.Dashboard.render === 'function') BariEcom.Dashboard.render();
      if (BariEcom.Profits && typeof BariEcom.Profits.render === 'function') BariEcom.Profits.render();
    });
  }

  return { init, render, editSale, deleteSale, openNewSaleModal };
})();
