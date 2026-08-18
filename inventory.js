window.BariEcom = window.BariEcom || {};

BariEcom.Inventory = (function() {
  function init() {
    // Add product button
    const addBtn = document.getElementById('add-product-btn');
    if (addBtn) {
      addBtn.addEventListener('click', function() {
        openProductModal();
      });
    }

    // Search
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        render(this.value);
      });
    }
  }

  function render(searchTerm) {
    searchTerm = (searchTerm || '').trim().toLowerCase();
    let products = BariEcom.Data.getProducts();

    if (searchTerm) {
      products = products.filter(p => 
        (p.name && p.name.toLowerCase().includes(searchTerm)) ||
        (p.notes && p.notes.toLowerCase().includes(searchTerm))
      );
    }

    renderTable(products);
    renderMobileCards(products);
  }

  function renderTable(products) {
    const tbody = document.getElementById('products-table-body');
    const emptyState = document.getElementById('products-empty');
    const tableContainer = document.getElementById('products-table-container');
    if (!tbody) return;

    if (products.length === 0) {
      if (tableContainer) tableContainer.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (tableContainer) tableContainer.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = products.map(p => {
      const status = getStatus(p);
      return `<tr>
        <td>
          <strong>${p.name}</strong>
          ${p.notes ? '<br><small class="text-tertiary">' + p.notes + '</small>' : ''}
        </td>
        <td>${BariEcom.UI.formatCurrency(p.purchasePrice)}</td>
        <td>${BariEcom.UI.formatCurrency(p.defaultSellingPrice)}</td>
        <td><strong class="font-mono">${BariEcom.UI.formatNumber(p.currentQuantity)}</strong></td>
        <td>${status}</td>
        <td class="actions-cell">
          <button class="btn btn-ghost btn-sm" onclick="BariEcom.Inventory.editProduct('${p.id}')">تعديل</button>
          <button class="btn btn-ghost btn-sm" onclick="BariEcom.Inventory.adjustQuantity('${p.id}')">الكمية</button>
          <button class="btn btn-ghost btn-sm btn-danger-text" onclick="BariEcom.Inventory.deleteProduct('${p.id}')">حذف</button>
        </td>
      </tr>`;
    }).join('');
  }

  function renderMobileCards(products) {
    const container = document.getElementById('products-mobile-cards');
    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = products.map(p => {
      const status = getStatus(p);
      return `<div class="mobile-card">
        <div class="mobile-card-header">
          <strong>${p.name}</strong>
          ${status}
        </div>
        <div class="mobile-card-row">
          <span class="mobile-card-label">سعر الشراء</span>
          <span>${BariEcom.UI.formatCurrency(p.purchasePrice)}</span>
        </div>
        <div class="mobile-card-row">
          <span class="mobile-card-label">سعر البيع الافتراضي</span>
          <span>${BariEcom.UI.formatCurrency(p.defaultSellingPrice)}</span>
        </div>
        <div class="mobile-card-row">
          <span class="mobile-card-label">الكمية المتاحة</span>
          <strong>${BariEcom.UI.formatNumber(p.currentQuantity)}</strong>
        </div>
        ${p.notes ? `
        <div class="mobile-card-row">
          <span class="mobile-card-label">ملاحظات</span>
          <span class="text-tertiary">${p.notes}</span>
        </div>` : ''}
        <div class="mobile-card-actions">
          <button class="btn btn-ghost btn-sm" onclick="BariEcom.Inventory.editProduct('${p.id}')">تعديل</button>
          <button class="btn btn-ghost btn-sm" onclick="BariEcom.Inventory.adjustQuantity('${p.id}')">الكمية</button>
          <button class="btn btn-ghost btn-sm btn-danger-text" onclick="BariEcom.Inventory.deleteProduct('${p.id}')">حذف</button>
        </div>
      </div>`;
    }).join('');
  }

  function getStatus(product) {
    const qty = Number(product.currentQuantity || 0);
    const min = Number(product.minStock || 5);
    if (qty === 0) {
      return '<span class="badge badge-danger">نفد</span>';
    } else if (qty <= min) {
      return '<span class="badge badge-warning">مخزون منخفض</span>';
    }
    return '<span class="badge badge-success">متوفر</span>';
  }

  function openProductModal(existingProduct) {
    const isEdit = !!existingProduct;
    const p = existingProduct || { name: '', purchasePrice: '', defaultSellingPrice: '', currentQuantity: '', minStock: 5, notes: '' };

    const content = `
      <div class="form-group">
        <label class="form-label">اسم المنتج *</label>
        <input type="text" id="modal-product-name" class="form-input" value="${p.name}" placeholder="مثال: قميص كتان بيج">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">سعر الشراء (التكلفة) *</label>
          <input type="number" id="modal-product-purchase" class="form-input" value="${p.purchasePrice}" min="0" step="0.01" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">سعر البيع الافتراضي *</label>
          <input type="number" id="modal-product-selling" class="form-input" value="${p.defaultSellingPrice}" min="0" step="0.01" placeholder="0">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">الكمية الحالية *</label>
          <input type="number" id="modal-product-quantity" class="form-input" value="${p.currentQuantity}" min="0" step="1" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">الحد الأدنى للتنبيه</label>
          <input type="number" id="modal-product-minstock" class="form-input" value="${p.minStock}" min="0" step="1" placeholder="5">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">ملاحظات (اختياري)</label>
        <textarea id="modal-product-notes" class="form-input form-textarea" rows="2" placeholder="أي تفاصيل أو ملاحظات خاصة بالمنتج">${p.notes || ''}</textarea>
      </div>
    `;

    BariEcom.UI.showModal({
      title: isEdit ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد',
      content: content,
      saveText: isEdit ? 'تحديث' : 'إضافة المنتج',
      onSave: function() {
        const name = document.getElementById('modal-product-name').value.trim();
        const purchasePrice = parseFloat(document.getElementById('modal-product-purchase').value);
        const defaultSellingPrice = parseFloat(document.getElementById('modal-product-selling').value);
        const currentQuantity = parseInt(document.getElementById('modal-product-quantity').value);
        const minStock = parseInt(document.getElementById('modal-product-minstock').value) || 5;
        const notes = document.getElementById('modal-product-notes').value.trim();

        // Validation
        if (!name) {
          BariEcom.UI.showToast('يرجى إدخال اسم المنتج', 'error');
          return;
        }
        if (isNaN(purchasePrice) || purchasePrice < 0) {
          BariEcom.UI.showToast('يرجى إدخال سعر شراء صحيح', 'error');
          return;
        }
        if (isNaN(defaultSellingPrice) || defaultSellingPrice < 0) {
          BariEcom.UI.showToast('يرجى إدخال سعر بيع صحيح', 'error');
          return;
        }
        if (isNaN(currentQuantity) || currentQuantity < 0) {
          BariEcom.UI.showToast('يرجى إدخال كمية صحيحة', 'error');
          return;
        }

        const data = { name, purchasePrice, defaultSellingPrice, currentQuantity, minStock, notes };

        if (isEdit) {
          BariEcom.Data.updateProduct(existingProduct.id, data);
          BariEcom.UI.showToast('تم تحديث المنتج بنجاح', 'success');
        } else {
          BariEcom.Data.addProduct(data);
          BariEcom.UI.showToast('تم إضافة المنتج بنجاح', 'success');
        }

        BariEcom.UI.hideModal();
        render();
        if (BariEcom.Dashboard && typeof BariEcom.Dashboard.render === 'function') BariEcom.Dashboard.render();
        if (BariEcom.Profits && typeof BariEcom.Profits.render === 'function') BariEcom.Profits.render();
      }
    });
  }

  function editProduct(id) {
    const product = BariEcom.Data.getProductById(id);
    if (product) openProductModal(product);
  }

  function adjustQuantity(id) {
    const product = BariEcom.Data.getProductById(id);
    if (!product) return;

    const content = `
      <div class="form-group">
        <label class="form-label">المنتج</label>
        <p style="font-weight:600;font-size:16px;margin:0 0 12px">${product.name}</p>
      </div>
      <div class="form-group">
        <label class="form-label">الكمية الحالية في المخزن</label>
        <div style="font-size:20px;font-weight:700;margin-bottom:12px">${BariEcom.UI.formatNumber(product.currentQuantity)}</div>
      </div>
      <div class="form-group">
        <label class="form-label">الكمية الجديدة بعد الجرد / التوريد *</label>
        <input type="number" id="modal-adjust-qty" class="form-input" value="${product.currentQuantity}" min="0" step="1">
      </div>
    `;

    BariEcom.UI.showModal({
      title: 'تعديل كمية المخزون',
      content: content,
      saveText: 'تحديث الكمية',
      onSave: function() {
        const newQty = parseInt(document.getElementById('modal-adjust-qty').value);
        if (isNaN(newQty) || newQty < 0) {
          BariEcom.UI.showToast('يرجى إدخال كمية صحيحة', 'error');
          return;
        }
        BariEcom.Data.updateProduct(id, { currentQuantity: newQty });
        BariEcom.UI.hideModal();
        BariEcom.UI.showToast('تم تحديث كمية المخزون', 'success');
        render();
        if (BariEcom.Dashboard && typeof BariEcom.Dashboard.render === 'function') BariEcom.Dashboard.render();
        if (BariEcom.Profits && typeof BariEcom.Profits.render === 'function') BariEcom.Profits.render();
      }
    });
  }

  function deleteProduct(id) {
    const product = BariEcom.Data.getProductById(id);
    if (!product) return;

    BariEcom.UI.showConfirm('هل أنت متأكد من حذف المنتج "' + product.name + '"؟', function() {
      BariEcom.Data.deleteProduct(id);
      BariEcom.UI.showToast('تم حذف المنتج', 'success');
      render();
      if (BariEcom.Dashboard && typeof BariEcom.Dashboard.render === 'function') BariEcom.Dashboard.render();
      if (BariEcom.Profits && typeof BariEcom.Profits.render === 'function') BariEcom.Profits.render();
    });
  }

  return { init, render, editProduct, adjustQuantity, deleteProduct, openProductModal };
})();
