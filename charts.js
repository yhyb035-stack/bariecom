window.BariEcom = window.BariEcom || {};

BariEcom.Charts = (function() {
  function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      return {
        primary: '#10B981',
        primaryLight: 'rgba(16, 185, 129, 0.18)',
        secondary: '#06B6D4',
        secondaryLight: 'rgba(6, 182, 212, 0.18)',
        danger: '#F87171',
        dangerLight: 'rgba(248, 113, 113, 0.18)',
        text: '#F8FAFC',
        textSecondary: '#94A3B8',
        gridLine: 'rgba(255, 255, 255, 0.07)',
        bg: '#131B2E'
      };
    }
    return {
      primary: '#059669',
      primaryLight: 'rgba(5, 150, 105, 0.14)',
      secondary: '#0284C7',
      secondaryLight: 'rgba(2, 132, 199, 0.14)',
      danger: '#EF4444',
      dangerLight: 'rgba(239, 68, 68, 0.14)',
      text: '#0F172A',
      textSecondary: '#64748B',
      gridLine: 'rgba(0, 0, 0, 0.06)',
      bg: '#FFFFFF'
    };
  }

  function prepareCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth || 300;
    const height = 250;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);
    return { canvas, ctx, width, height, colors: getThemeColors() };
  }

  // Format axis value with pure Latin numbers (0-9)
  function formatAxisValue(val) {
    if (val === undefined || val === null || isNaN(val)) return '0';
    const n = Number(val);
    if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (Math.abs(n) >= 1000) return (n / 1000).toFixed(1) + 'K';
    return Math.round(n).toString();
  }

  function calcNiceScale(maxVal) {
    if (maxVal <= 0 || isNaN(maxVal) || !isFinite(maxVal)) return { max: 100, step: 20 };
    const magnitude = Math.pow(10, Math.max(0, Math.floor(Math.log10(maxVal))));
    let niceMax = Math.ceil(maxVal / magnitude) * magnitude;
    if (niceMax === maxVal) niceMax += magnitude;
    const step = niceMax / 5;
    return { max: niceMax, step };
  }
  
  function drawEmptyMessage(ctx, width, height, colors) {
    ctx.fillStyle = colors.textSecondary;
    ctx.font = '14px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('لا توجد بيانات للفترة المحددة', width / 2, height / 2);
  }

  function drawGrid(ctx, width, height, padding, maxValue, steps, colors) {
    ctx.beginPath();
    ctx.strokeStyle = colors.gridLine;
    ctx.lineWidth = 1;
    ctx.font = '11px Cairo, sans-serif';
    ctx.fillStyle = colors.textSecondary;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const graphHeight = height - padding.top - padding.bottom;
    
    for (let i = 0; i <= 5; i++) {
      const val = maxValue - (i * steps);
      const y = padding.top + (i * (graphHeight / 5));
      
      // Grid line
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      
      // Y-axis label
      ctx.fillText(formatAxisValue(val), width - padding.right + 8, y);
    }
    ctx.stroke();
  }

  function renderBarChart(canvasId, labels, datasets, options = {}) {
    const prepared = prepareCanvas(canvasId);
    if (!prepared) return;
    const { ctx, width, height, colors } = prepared;
    
    const hasValidData = datasets && datasets.length > 0 && datasets.some(d => d.data && d.data.some(v => v > 0));
    if (!labels || labels.length === 0 || !hasValidData) {
      drawEmptyMessage(ctx, width, height, colors);
      return;
    }

    const padding = { top: 24, right: 54, bottom: 36, left: 16 };
    const graphWidth = Math.max(50, width - padding.left - padding.right);
    const graphHeight = Math.max(50, height - padding.top - padding.bottom);

    let maxVal = 0;
    datasets.forEach(ds => {
      if (ds.data) {
        ds.data.forEach(val => {
          if (val > maxVal) maxVal = val;
        });
      }
    });
    
    const { max: niceMax, step } = calcNiceScale(maxVal);
    drawGrid(ctx, width, height, padding, niceMax, step, colors);

    const numGroups = labels.length;
    const numDatasets = datasets.length;
    const groupWidth = graphWidth / numGroups;
    const groupGap = Math.max(4, groupWidth * 0.22);
    const barAreaWidth = groupWidth - groupGap;
    const barGap = numDatasets > 1 ? 4 : 0;
    const actualBarWidth = Math.max(6, (barAreaWidth - (barGap * (numDatasets - 1))) / numDatasets);

    ctx.font = '12px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < numGroups; i++) {
      // In RTL, group 0 is positioned at rightmost
      const groupX = width - padding.right - (i * groupWidth) - groupWidth;
      
      // X-axis label
      ctx.fillStyle = colors.textSecondary;
      ctx.fillText(labels[i] || '', groupX + groupWidth / 2, height - padding.bottom + 8);
      
      for (let j = 0; j < numDatasets; j++) {
        const ds = datasets[j];
        const val = (ds.data && ds.data[i] !== undefined) ? ds.data[i] : 0;
        const barHeight = Math.max(0, (val / niceMax) * graphHeight);
        
        // Offset within group
        const x = groupX + (groupGap / 2) + (j * (actualBarWidth + barGap));
        const y = height - padding.bottom - barHeight;
        
        if (barHeight > 0) {
          ctx.fillStyle = ds.color || colors.primary;
          ctx.beginPath();
          const radius = Math.min(4, barHeight / 2);
          ctx.moveTo(x, y + barHeight);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.lineTo(x + actualBarWidth - radius, y);
          ctx.quadraticCurveTo(x + actualBarWidth, y, x + actualBarWidth, y + radius);
          ctx.lineTo(x + actualBarWidth, y + barHeight);
          ctx.closePath();
          ctx.fill();

          // Value label on top of bar
          if (barHeight > 16) {
            ctx.fillStyle = colors.text;
            ctx.textBaseline = 'bottom';
            ctx.fillText(formatAxisValue(val), x + actualBarWidth / 2, y - 2);
            ctx.textBaseline = 'top';
          }
        }
      }
    }
  }

  function renderLineChart(canvasId, labels, data, options = {}) {
    const prepared = prepareCanvas(canvasId);
    if (!prepared) return;
    const { ctx, width, height, colors } = prepared;
    
    if (!data || data.length === 0 || !data.some(v => v > 0)) {
      drawEmptyMessage(ctx, width, height, colors);
      return;
    }

    const padding = { top: 24, right: 54, bottom: 36, left: 16 };
    const graphWidth = Math.max(50, width - padding.left - padding.right);
    const graphHeight = Math.max(50, height - padding.top - padding.bottom);

    let maxVal = Math.max(...data);
    const { max: niceMax, step } = calcNiceScale(maxVal);
    drawGrid(ctx, width, height, padding, niceMax, step, colors);

    const numPoints = data.length;
    const stepX = numPoints > 1 ? graphWidth / (numPoints - 1) : graphWidth;

    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const val = data[i] || 0;
      const x = numPoints > 1 
        ? width - padding.right - (i * stepX)
        : width - padding.right - (graphWidth / 2);
      const y = height - padding.bottom - ((val / niceMax) * graphHeight);
      points.push({ x, y, val, label: labels[i] });
    }

    if (points.length === 0) return;

    // Draw area fill
    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding.bottom);
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        ctx.lineTo(points[i].x, points[i].y);
      } else {
        const prev = points[i - 1];
        const curr = points[i];
        const cpX = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
      }
    }
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, colors.primaryLight);
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw smooth line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      ctx.bezierCurveTo(cpX, prev.y, cpX, curr.y, curr.x, curr.y);
    }
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw dots and labels
    ctx.font = '12px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = colors.bg;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = colors.primary;
      ctx.stroke();

      ctx.fillStyle = colors.textSecondary;
      ctx.fillText(p.label || '', p.x, height - padding.bottom + 8);
      
      ctx.fillStyle = colors.text;
      ctx.textBaseline = 'bottom';
      ctx.fillText(formatAxisValue(p.val), p.x, p.y - 8);
      ctx.textBaseline = 'top';
    }
  }

  return { renderBarChart, renderLineChart, getThemeColors };
})();
