window.BariEcom = window.BariEcom || {};

BariEcom.Data = (function() {
  const KEYS = {
    products: 'bariEcom_products',
    sales: 'bariEcom_sales',
    expenses: 'bariEcom_expenses',
    settings: 'bariEcom_settings'
  };

  const DEFAULT_SETTINGS = {
    projectName: 'Bari Ecom',
    ownerName: 'يحي باري',
    currency: 'MRU',
    accessCode: '1234'
  };

  // Helper to get array from localStorage
  function getArray(key) {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch(e) {
      return [];
    }
  }

  function saveArray(key, arr) {
    localStorage.setItem(key, JSON.stringify(arr));
  }

  function generateId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  }

  // PRODUCTS
  function getProducts() { 
    return getArray(KEYS.products); 
  }
  
  function saveProducts(arr) { 
    saveArray(KEYS.products, arr); 
  }
  
  function addProduct(product) {
    const products = getProducts();
    const now = new Date().toISOString();
    const newProduct = {
      ...product,
      id: generateId('prod'),
      purchasePrice: Number(product.purchasePrice || 0),
      defaultSellingPrice: Number(product.defaultSellingPrice || 0),
      currentQuantity: Number(product.currentQuantity || 0),
      minStock: Number(product.minStock || 5),
      createdAt: now,
      updatedAt: now
    };
    products.push(newProduct);
    saveProducts(products);
    return newProduct;
  }
  
  function updateProduct(id, updates) {
    const products = getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      const sanitizedUpdates = { ...updates };
      if (sanitizedUpdates.purchasePrice !== undefined) sanitizedUpdates.purchasePrice = Number(sanitizedUpdates.purchasePrice);
      if (sanitizedUpdates.defaultSellingPrice !== undefined) sanitizedUpdates.defaultSellingPrice = Number(sanitizedUpdates.defaultSellingPrice);
      if (sanitizedUpdates.currentQuantity !== undefined) sanitizedUpdates.currentQuantity = Number(sanitizedUpdates.currentQuantity);
      if (sanitizedUpdates.minStock !== undefined) sanitizedUpdates.minStock = Number(sanitizedUpdates.minStock);

      products[index] = {
        ...products[index],
        ...sanitizedUpdates,
        updatedAt: new Date().toISOString()
      };
      saveProducts(products);
      return products[index];
    }
    return null;
  }
  
  function deleteProduct(id) {
    const products = getProducts();
    const newProducts = products.filter(p => p.id !== id);
    saveProducts(newProducts);
  }
  
  function getProductById(id) {
    const products = getProducts();
    return products.find(p => p.id === id) || null;
  }

  // SALES
  function getSales() { 
    return getArray(KEYS.sales); 
  }
  
  function saveSales(arr) { 
    saveArray(KEYS.sales, arr); 
  }
  
  function getNextTransactionNumber() {
    const sales = getSales();
    const maxNum = sales.reduce((max, s) => {
      const num = parseInt((s.transactionNumber || '').replace('INV-', '')) || 0;
      return num > max ? num : max;
    }, 0);
    return 'INV-' + String(maxNum + 1).padStart(4, '0');
  }
  
  function addSale(sale) {
    const sales = getSales();
    const now = new Date().toISOString();
    const qty = Number(sale.quantity || 0);
    const actualPrice = Number(sale.actualSellingPrice || 0);
    const purchasePrice = Number(sale.purchasePrice || 0);
    
    // Total Revenue = actualSellingPrice * quantity
    const totalSale = actualPrice * qty;
    // Cost of Goods Sold (COGS) = purchasePrice * quantity
    const productCost = purchasePrice * qty;
    // Gross Profit = Total Revenue - COGS
    const profit = totalSale - productCost;

    const newSale = {
      ...sale,
      id: generateId('sale'),
      transactionNumber: getNextTransactionNumber(),
      quantity: qty,
      purchasePrice: purchasePrice,
      actualSellingPrice: actualPrice,
      totalSale: totalSale,
      productCost: productCost,
      profit: profit,
      createdAt: now,
      updatedAt: now
    };
    sales.push(newSale);
    saveSales(sales);
    return newSale;
  }
  
  function updateSale(id, updates) {
    const sales = getSales();
    const index = sales.findIndex(s => s.id === id);
    if (index !== -1) {
      const current = sales[index];
      const qty = Number(updates.quantity !== undefined ? updates.quantity : current.quantity);
      const actualPrice = Number(updates.actualSellingPrice !== undefined ? updates.actualSellingPrice : current.actualSellingPrice);
      const purchasePrice = Number(updates.purchasePrice !== undefined ? updates.purchasePrice : current.purchasePrice);
      
      const totalSale = actualPrice * qty;
      const productCost = purchasePrice * qty;
      const profit = totalSale - productCost;

      sales[index] = {
        ...current,
        ...updates,
        quantity: qty,
        purchasePrice: purchasePrice,
        actualSellingPrice: actualPrice,
        totalSale: totalSale,
        productCost: productCost,
        profit: profit,
        updatedAt: new Date().toISOString()
      };
      saveSales(sales);
      return sales[index];
    }
    return null;
  }
  
  function deleteSale(id) {
    const sales = getSales();
    const newSales = sales.filter(s => s.id !== id);
    saveSales(newSales);
  }

  // EXPENSES
  function getExpenses() { 
    return getArray(KEYS.expenses); 
  }
  
  function saveExpenses(arr) { 
    saveArray(KEYS.expenses, arr); 
  }
  
  function addExpense(expense) {
    const expenses = getExpenses();
    const now = new Date().toISOString();
    const newExpense = {
      ...expense,
      id: generateId('exp'),
      amount: Number(expense.amount || 0),
      createdAt: now,
      updatedAt: now
    };
    expenses.push(newExpense);
    saveExpenses(expenses);
    return newExpense;
  }
  
  function getExpenseById(id) {
    const expenses = getExpenses();
    return expenses.find(e => e.id === id) || null;
  }

  function updateExpense(id, updates) {
    if (typeof id === 'object' && id !== null && id.id) {
      updates = id;
      id = updates.id;
    }
    const expenses = getExpenses();
    const index = expenses.findIndex(e => e.id === id);
    if (index !== -1) {
      const sanitizedUpdates = { ...updates };
      if (sanitizedUpdates.amount !== undefined) sanitizedUpdates.amount = Number(sanitizedUpdates.amount);

      expenses[index] = {
        ...expenses[index],
        ...sanitizedUpdates,
        updatedAt: new Date().toISOString()
      };
      saveExpenses(expenses);
      return expenses[index];
    }
    return null;
  }
  
  function deleteExpense(id) {
    const expenses = getExpenses();
    const newExpenses = expenses.filter(e => e.id !== id);
    saveExpenses(newExpenses);
  }

  // SETTINGS
  function getSettings() {
    try {
      const stored = localStorage.getItem(KEYS.settings);
      let parsed = stored ? JSON.parse(stored) : {};
      
      // Auto-migrate legacy or empty currency to MRU
      if (!parsed.currency || parsed.currency === 'د.م.') {
        parsed.currency = 'MRU';
      }
      
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch(e) {
      return { ...DEFAULT_SETTINGS };
    }
  }
  
  function saveSettings(settings) {
    const current = getSettings();
    const updated = { ...current, ...settings };
    if (!updated.currency) updated.currency = 'MRU';
    localStorage.setItem(KEYS.settings, JSON.stringify(updated));
  }

  // EXPORT / IMPORT / RESET
  function exportAllData() {
    return JSON.stringify({
      products: getProducts(),
      sales: getSales(),
      expenses: getExpenses(),
      settings: getSettings(),
      theme: localStorage.getItem('bariEcom_theme') || 'light',
      exportDate: new Date().toISOString(),
      version: '2.0'
    }, null, 2);
  }
  
  function importAllData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.products && Array.isArray(data.products)) saveProducts(data.products);
      if (data.sales && Array.isArray(data.sales)) saveSales(data.sales);
      if (data.expenses && Array.isArray(data.expenses)) saveExpenses(data.expenses);
      if (data.settings) saveSettings(data.settings);
      if (data.theme) localStorage.setItem('bariEcom_theme', data.theme);
      return true;
    } catch(e) {
      return false;
    }
  }
  
  function resetAllData() {
    localStorage.removeItem(KEYS.products);
    localStorage.removeItem(KEYS.sales);
    localStorage.removeItem(KEYS.expenses);
    saveSettings(DEFAULT_SETTINGS);
  }

  return {
    generateId, getProducts, saveProducts, addProduct, updateProduct, deleteProduct, getProductById,
    getSales, saveSales, addSale, updateSale, deleteSale, getNextTransactionNumber,
    getExpenses, saveExpenses, addExpense, updateExpense, deleteExpense, getExpenseById,
    getSettings, saveSettings, exportAllData, importAllData, resetAllData,
    DEFAULT_SETTINGS
  };
})();
