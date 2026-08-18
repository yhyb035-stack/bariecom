window.BariEcom = window.BariEcom || {};

BariEcom.Profits = (function() {
  let currentFilter = 'month';
  let currentStart = null;
  let currentEnd = null;

  function init() {
    if (BariEcom.UI && BariEcom.UI.setupDateFilters) {
      BariEcom.UI.setupDateFilters(
        'profits-date-filters',
        'profits-custom-dates',
        'profits-date-from',
        'profits-date-to',
        function(start, end, filter) {
          currentStart = start;
          currentEnd = end;
          currentFilter = filter;
          render();
        }
      );

      const range = BariEcom.UI.getDateRange('month');
      currentStart = range.start;
      currentEnd = range.end;

      const filterBtns = document.querySelectorAll('#profits-date-filters .date-filter-btn');
      filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === 'month');
      });
    }
  }

  function render() {
    const sales = BariEcom.UI.filterByDateRange(BariEcom.Data.getSales(), 'date', currentStart, currentEnd);
    const expenses = BariEcom.UI.filterByDateRange(BariEcom.Data.getExpenses(), 'date', currentStart, currentEnd);

    // 1. Total Revenue = sum of actual selling prices
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalSale || 0), 0);
    
    // 2. Cost of Goods Sold (COGS) = purchase cost of sold units
    const productCost = sales.reduce((sum, s) => sum + Number(s.productCost || 0), 0);
    
    // 3. Gross Profit = Revenue - COGS
    const grossProfit = totalRevenue - productCost;
    
    // 4. Operating Expenses
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    
    // 5. TRUE NET PROFIT = Gross Profit - Operating Expenses
    const netProfit = grossProfit - totalExpenses;
    
    // 6. Profit Margin %
    const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

    // Update stat cards
    const totalSalesEl = document.getElementById('profit-total-sales');
    if (totalSalesEl) totalSalesEl.textContent = BariEcom.UI.formatCurrency(totalRevenue);
    
    const productCostEl = document.getElementById('profit-product-cost');
    if (productCostEl) productCostEl.textContent = BariEcom.UI.formatCurrency(productCost);
    
    const grossEl = document.getElementById('profit-gross');
    if (grossEl) {
      grossEl.textContent = BariEcom.UI.formatCurrency(grossProfit);
      grossEl.className = 'stat-value ' + (grossProfit >= 0 ? 'value-positive' : 'value-negative');
    }
    
    const expensesEl = document.getElementById('profit-expenses');
    if (expensesEl) expensesEl.textContent = BariEcom.UI.formatCurrency(totalExpenses);
    
    const netEl = document.getElementById('profit-net');
    if (netEl) {
      netEl.textContent = BariEcom.UI.formatCurrency(netProfit);
      netEl.className = 'stat-value ' + (netProfit >= 0 ? 'value-positive' : 'value-negative');
    }
    
    const marginEl = document.getElementById('profit-margin');
    if (marginEl) marginEl.textContent = margin.toFixed(1) + '%';
    
    const salesCountEl = document.getElementById('profit-sales-count');
    if (salesCountEl) salesCountEl.textContent = BariEcom.UI.formatNumber(sales.length);

    // Render profit chart
    if (document.getElementById('profit-chart') && BariEcom.Charts) {
      const themeColors = BariEcom.Charts.getThemeColors ? BariEcom.Charts.getThemeColors() : { primary: '#059669', danger: '#EF4444' };
      
      BariEcom.Charts.renderBarChart('profit-chart', 
        ['إجمالي الإيرادات', 'تكلفة البضاعة المباعة (COGS)', 'المصاريف التشغيلية', 'صافي الربح الحقيقي'],
        [
          { label: 'التحليل المالي', data: [totalRevenue, productCost, totalExpenses, Math.max(0, netProfit)], color: themeColors.primary }
        ]
      );
    }

    // Render breakdown
    renderBreakdown(totalRevenue, productCost, grossProfit, totalExpenses, netProfit, margin, sales.length);
  }

  function renderBreakdown(totalSales, productCost, grossProfit, totalExpenses, netProfit, margin, count) {
    const container = document.getElementById('profit-breakdown');
    if (!container) return;
    
    const rows = [
      { label: 'إجمالي الإيرادات (المبيعات المكتملة)', value: BariEcom.UI.formatCurrency(totalSales), class: 'font-bold' },
      { label: 'تكلفة البضاعة المباعة (COGS)', value: '- ' + BariEcom.UI.formatCurrency(productCost), class: 'text-tertiary' },
      { label: 'الربح الإجمالي من المبيعات', value: BariEcom.UI.formatCurrency(grossProfit), class: grossProfit >= 0 ? 'value-positive' : 'value-negative', bold: true },
      { label: 'المصاريف التشغيلية الإضافية', value: '- ' + BariEcom.UI.formatCurrency(totalExpenses), class: 'text-danger' },
      { label: 'صافي الربح الحقيقي النهائي', value: BariEcom.UI.formatCurrency(netProfit), class: netProfit >= 0 ? 'value-positive' : 'value-negative', bold: true, highlight: true },
      { label: 'نسبة هامش الربح الصافي', value: margin.toFixed(1) + '%', class: 'font-mono font-bold' },
      { label: 'إجمالي عدد العمليات المنفذة', value: `${BariEcom.UI.formatNumber(count)} عملية`, class: '' }
    ];

    container.innerHTML = rows.map(r => {
      const style = r.bold ? 'font-weight:700;' : '';
      const bg = r.highlight ? 'background:var(--color-primary-50);padding:14px 16px;border-radius:var(--radius-md);margin:10px 0;border:1px solid var(--color-primary-light);' : '';
      return `<div class="mobile-card-row" style="${bg}">
        <span class="mobile-card-label" style="${style}">${r.label}</span>
        <span class="${r.class}" style="${style}">${r.value}</span>
      </div>`;
    }).join('');
  }

  return { init, render };
})();
