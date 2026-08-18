window.BariEcom = window.BariEcom || {};

BariEcom.Dashboard = (function() {
  let currentFilter = 'month';
  let currentStart = null;
  let currentEnd = null;

  function init() {
    // Setup date filters using BariEcom.UI.setupDateFilters
    BariEcom.UI.setupDateFilters(
      'dashboard-date-filters',
      'dashboard-custom-dates',
      'dashboard-date-from',
      'dashboard-date-to',
      function(start, end, filter) {
        currentStart = start;
        currentEnd = end;
        currentFilter = filter;
        render();
      }
    );

    // Set default to 'month'
    const range = BariEcom.UI.getDateRange('month');
    currentStart = range.start;
    currentEnd = range.end;

    // Make the 'month' button active by default
    const filterBtns = document.querySelectorAll('#dashboard-date-filters .date-filter-btn');
    filterBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === 'month');
    });

    // New sale button
    const newSaleBtn = document.getElementById('dashboard-new-sale-btn');
    if (newSaleBtn) {
      newSaleBtn.addEventListener('click', function() {
        BariEcom.App.navigate('sales');
        setTimeout(function() {
          if (BariEcom.Sales && BariEcom.Sales.openNewSaleModal) {
            BariEcom.Sales.openNewSaleModal();
          }
        }, 100);
      });
    }
  }

  function render() {
    const sales = BariEcom.Data.getSales();
    const expenses = BariEcom.Data.getExpenses();
    const products = BariEcom.Data.getProducts();
    const settings = BariEcom.Data.getSettings();

    // Filter by date
    const filteredSales = BariEcom.UI.filterByDateRange(sales, 'date', currentStart, currentEnd);
    const filteredExpenses = BariEcom.UI.filterByDateRange(expenses, 'date', currentStart, currentEnd);

    // 1. Total Revenue = sum of actual selling prices for sold units
    const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.totalSale || 0), 0);
    
    // 2. Cost of Goods Sold (COGS) = sum of purchase cost for sold units
    const cogs = filteredSales.reduce((sum, s) => sum + Number(s.productCost || 0), 0);
    
    // 3. Gross Profit from Sales = Total Revenue - COGS
    const grossProfit = totalRevenue - cogs;
    
    // 4. Operating Expenses = sum of additional expenses recorded
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    
    // 5. TRUE NET PROFIT = Total Revenue - COGS - Operating Expenses
    const netProfit = grossProfit - totalExpenses;
    
    // 6. Number of Sales
    const salesCount = filteredSales.length;
    
    // 7. Current Inventory Value = remaining units in stock * purchase price
    const inventoryValue = products.reduce((sum, p) => sum + (Number(p.currentQuantity || 0) * Number(p.purchasePrice || 0)), 0);

    // Profit Margin %
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

    // Update stat cards
    const totalRevEl = document.getElementById('stat-total-sales');
    if (totalRevEl) totalRevEl.textContent = BariEcom.UI.formatCurrency(totalRevenue);

    const cogsEl = document.getElementById('stat-product-cost');
    if (cogsEl) cogsEl.textContent = BariEcom.UI.formatCurrency(cogs);

    const grossEl = document.getElementById('stat-sales-profit');
    if (grossEl) {
      grossEl.textContent = BariEcom.UI.formatCurrency(grossProfit);
      grossEl.className = 'stat-value ' + (grossProfit >= 0 ? 'value-positive' : 'value-negative');
    }

    const expensesEl = document.getElementById('stat-total-expenses');
    if (expensesEl) expensesEl.textContent = BariEcom.UI.formatCurrency(totalExpenses);

    const netProfitEl = document.getElementById('stat-net-profit');
    if (netProfitEl) {
      netProfitEl.textContent = BariEcom.UI.formatCurrency(netProfit);
      netProfitEl.className = 'stat-value ' + (netProfit >= 0 ? 'value-positive' : 'value-negative');
    }

    const marginBadgeEl = document.getElementById('stat-net-margin-badge');
    if (marginBadgeEl) {
      marginBadgeEl.textContent = `هامش الربح: ${profitMargin.toFixed(1)}%`;
      marginBadgeEl.className = 'badge ' + (netProfit >= 0 ? 'badge-success' : 'badge-danger');
    }

    const salesCountEl = document.getElementById('stat-sales-count');
    if (salesCountEl) salesCountEl.textContent = BariEcom.UI.formatNumber(salesCount);

    const invValEl = document.getElementById('stat-inventory-value');
    if (invValEl) invValEl.textContent = BariEcom.UI.formatCurrency(inventoryValue);

    // Update owner names across UI
    const ownerEl = document.getElementById('dashboard-owner');
    if (ownerEl) ownerEl.textContent = settings.ownerName || 'يحي باري';

    const sidebarOwnerEl = document.getElementById('sidebar-owner');
    if (sidebarOwnerEl) sidebarOwnerEl.textContent = settings.ownerName || 'يحي باري';

    // Render charts
    renderSalesChart(filteredSales);
    renderComparisonChart(filteredSales, filteredExpenses);

    // Recent sales (last 5)
    renderRecentSales(filteredSales);

    // Low stock products
    renderLowStock(products);
  }

  function renderSalesChart(filteredSales) {
    const dailyData = {};
    
    // Sort sales by date ascending for charts
    const sorted = [...filteredSales].sort((a, b) => new Date(a.date) - new Date(b.date));

    sorted.forEach(s => {
      const day = BariEcom.UI.formatDate(s.date);
      dailyData[day] = (dailyData[day] || 0) + Number(s.totalSale || 0);
    });

    const labels = Object.keys(dailyData);
    const data = Object.values(dailyData);

    const themeColors = BariEcom.Charts.getThemeColors ? BariEcom.Charts.getThemeColors() : { primary: '#059669' };

    if (labels.length === 0) {
      BariEcom.Charts.renderBarChart('sales-chart', [], [{ label: '', data: [], color: themeColors.primary }]);
    } else {
      BariEcom.Charts.renderBarChart('sales-chart', labels, [
        { label: 'الإيرادات', data: data, color: themeColors.primary }
      ]);
    }
  }

  function renderComparisonChart(filteredSales, filteredExpenses) {
    const allDates = [];
    const salesByDay = {};
    const expensesByDay = {};

    const allItems = [
      ...filteredSales.map(s => ({ date: s.date, type: 'sale', amount: Number(s.totalSale || 0) })),
      ...filteredExpenses.map(e => ({ date: e.date, type: 'expense', amount: Number(e.amount || 0) }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    allItems.forEach(item => {
      const day = BariEcom.UI.formatDate(item.date);
      if (!allDates.includes(day)) {
        allDates.push(day);
      }
      if (item.type === 'sale') {
        salesByDay[day] = (salesByDay[day] || 0) + item.amount;
      } else {
        expensesByDay[day] = (expensesByDay[day] || 0) + item.amount;
      }
    });

    const labels = allDates;
    const salesData = labels.map(l => salesByDay[l] || 0);
    const expensesData = labels.map(l => expensesByDay[l] || 0);

    const themeColors = BariEcom.Charts.getThemeColors ? BariEcom.Charts.getThemeColors() : { primary: '#059669', danger: '#EF4444' };

    BariEcom.Charts.renderBarChart('comparison-chart', labels, [
      { label: 'الإيرادات', data: salesData, color: themeColors.primary },
      { label: 'المصاريف', data: expensesData, color: themeColors.danger }
    ]);
  }

  function renderRecentSales(filteredSales) {
    const tbody = document.getElementById('dashboard-recent-sales-body');
    const emptyState = document.getElementById('dashboard-recent-sales-empty');
    const table = document.getElementById('dashboard-recent-sales');
    if (!tbody) return;

    // Sort by date descending, take last 5
    const recent = [...filteredSales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    if (recent.length === 0) {
      if (table) table.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (table) table.style.display = '';
    if (emptyState) emptyState.style.display = 'none';

    tbody.innerHTML = recent.map(s => {
      const profitClass = s.profit >= 0 ? 'value-positive' : 'value-negative';
      return `<tr>
        <td><strong>${s.transactionNumber}</strong></td>
        <td>${BariEcom.UI.formatDate(s.date)}</td>
        <td>${s.productName}</td>
        <td>${BariEcom.UI.formatNumber(s.quantity)}</td>
        <td>${BariEcom.UI.formatCurrency(s.totalSale)}</td>
        <td class="${profitClass}">${BariEcom.UI.formatCurrency(s.profit)}</td>
      </tr>`;
    }).join('');
  }

  function renderLowStock(products) {
    const container = document.getElementById('dashboard-low-stock');
    const emptyState = document.getElementById('dashboard-low-stock-empty');
    if (!container) return;

    const lowStock = products.filter(p => Number(p.currentQuantity || 0) <= Number(p.minStock || 5));

    if (lowStock.length === 0) {
      container.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    container.style.display = 'block';
    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = '<div class="table-container"><table class="data-table"><thead><tr><th>المنتج</th><th>الكمية المتبقية</th><th>الحد الأدنى</th><th>الحالة</th></tr></thead><tbody>' +
      lowStock.map(p => {
        const qty = Number(p.currentQuantity || 0);
        const status = qty === 0 ? 
          '<span class="badge badge-danger">نفد من المخزن</span>' : 
          '<span class="badge badge-warning">مخزون منخفض</span>';
        return `<tr>
          <td><strong>${p.name}</strong></td>
          <td><span class="stock-num ${qty === 0 ? 'text-danger' : 'text-warning'}">${BariEcom.UI.formatNumber(qty)}</span></td>
          <td>${BariEcom.UI.formatNumber(p.minStock)}</td>
          <td>${status}</td>
        </tr>`;
      }).join('') +
      '</tbody></table></div>';
  }

  return { init, render };
})();
