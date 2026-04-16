/* ================================================================
   NexaForce v2 — dashboard.js
   ================================================================ */
'use strict';

// ── Auth guard ────────────────────────────────────────────────
Auth.guard();

// ── Chart.js global dark theme ────────────────────────────────
Chart.defaults.color        = '#64748b';
Chart.defaults.borderColor  = 'rgba(255,255,255,0.05)';
Chart.defaults.font.family  = 'Poppins, system-ui, sans-serif';
Chart.defaults.font.size    = 11;

// Shared tooltip style
var TOOLTIP_STYLE = {
  backgroundColor: 'rgba(7,7,22,0.97)',
  titleColor:      '#f1f5f9',
  bodyColor:       '#94a3b8',
  borderColor:     'rgba(124,58,237,0.4)',
  borderWidth:     1,
  cornerRadius:    10,
  padding:         12,
  displayColors:   false,
  callbacks: {},
};

// ── Department colours ────────────────────────────────────────
const DEPT_COLORS = {
  Engineering: '#7c3aed',
  Design:      '#ec4899',
  Marketing:   '#06b6d4',
  Sales:       '#10b981',
  HR:          '#f59e0b',
  Finance:     '#6366f1',
  Operations:  '#f97316',
};

// ── Helpers ───────────────────────────────────────────────────
function initials(name) {
  return (name || '?').split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase();
}

function fmtSalary(n) {
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000)    return '$' + (n / 1000).toFixed(0) + 'k';
  return '$' + n;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(d) {
  if (!d) return '';
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

// ── Toast ─────────────────────────────────────────────────────
var _toastTimer;
function showToast(msg, type) {
  if (!type) type = 'info';
  var toast = document.getElementById('toast');
  var icon  = document.getElementById('toastIcon');
  var msgEl = document.getElementById('toastMsg');
  var icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.className   = 'toast toast-' + type;
  icon.textContent  = icons[type] || icons.info;
  msgEl.textContent = msg;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function () { toast.classList.add('hidden'); }, 3500);
}

// ── Sidebar user info ─────────────────────────────────────────
function populateSidebar() {
  var user = Auth.getUser();
  if (!user) return;
  var ini = initials(user.name || 'Admin');
  document.getElementById('sidebarAvatar').textContent = ini;
  document.getElementById('sidebarName').textContent   = user.name  || 'Admin';
  document.getElementById('sidebarRole').textContent   = user.role  || 'admin';
  document.getElementById('topbarAvatar').textContent  = ini;
  document.getElementById('topbarName').textContent    = (user.name || 'Admin').split(' ')[0];
}

// ── Greeting ──────────────────────────────────────────────────
function setGreeting() {
  var h = new Date().getHours();
  var g = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  document.getElementById('greeting').textContent = g;
}

// ── Animated counter ──────────────────────────────────────────
function animateCount(el, target, prefix, suffix) {
  if (!prefix) prefix = '';
  if (!suffix) suffix = '';
  var duration = 1200;
  var start    = performance.now();
  (function tick(now) {
    var p    = Math.min((now - start) / duration, 1);
    var ease = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + Math.round(target * ease).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

// ── Load stats ────────────────────────────────────────────────
async function loadStats() {
  try {
    var res = await API.getStats();
    var d   = res.data;
    animateCount(document.getElementById('statTotal'),  d.total);
    animateCount(document.getElementById('statActive'), d.active);
    animateCount(document.getElementById('statLeave'),  d.onLeave);
    animateCount(document.getElementById('statSalary'), d.avgSalary, '$');
  } catch (err) {
    showToast('Could not load stats', 'error');
  }
}

// ── Render growth chart ───────────────────────────────────────
function renderGrowthChart(monthlyHires, total) {
  var labels = [];
  var now    = new Date();
  for (var i = 11; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
  }

  var fullLabels = [];
  for (var i = 11; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    fullLabels.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
  }

  var hiresMap = {};
  (monthlyHires || []).forEach(function (m) {
    var key = new Date(m._id.year, m._id.month - 1, 1)
      .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    hiresMap[key] = m.count;
  });

  var totalHiresLast12 = fullLabels.reduce(function (sum, l) { return sum + (hiresMap[l] || 0); }, 0);
  var base = (total || 0) - totalHiresLast12;
  var data = [];
  var hireData = [];
  fullLabels.forEach(function (l) {
    var hires = hiresMap[l] || 0;
    base += hires;
    data.push(base);
    hireData.push(hires);
  });

  var ctx  = document.getElementById('growthChart').getContext('2d');
  var grad = ctx.createLinearGradient(0, 0, 0, 260);
  grad.addColorStop(0,   'rgba(124,58,237,0.35)');
  grad.addColorStop(0.5, 'rgba(124,58,237,0.12)');
  grad.addColorStop(1,   'rgba(124,58,237,0.0)');

  var grad2 = ctx.createLinearGradient(0, 0, 0, 260);
  grad2.addColorStop(0,   'rgba(6,182,212,0.3)');
  grad2.addColorStop(0.5, 'rgba(6,182,212,0.08)');
  grad2.addColorStop(1,   'rgba(6,182,212,0.0)');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label:               'Headcount',
          data:                data,
          borderColor:         '#8b5cf6',
          backgroundColor:     grad,
          borderWidth:         2.5,
          fill:                true,
          tension:             0.45,
          pointRadius:         0,
          pointHoverRadius:    6,
          pointHoverBackgroundColor: '#8b5cf6',
          pointHoverBorderColor:     '#0d0d2b',
          pointHoverBorderWidth:     2,
          yAxisID: 'y',
        },
        {
          label:               'New Hires',
          data:                hireData,
          borderColor:         '#06b6d4',
          backgroundColor:     grad2,
          borderWidth:         2,
          fill:                true,
          tension:             0.45,
          pointRadius:         0,
          pointHoverRadius:    5,
          pointHoverBackgroundColor: '#06b6d4',
          yAxisID: 'y2',
          borderDash:          [4, 3],
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          align: 'end',
          labels: {
            color: '#64748b',
            font: { size: 11 },
            usePointStyle: true,
            pointStyleWidth: 8,
            boxHeight: 6,
            padding: 16,
          },
        },
        tooltip: Object.assign({}, TOOLTIP_STYLE, {
          callbacks: {
            title: function(items) { return fullLabels[items[0].dataIndex]; },
            label: function(item) {
              if (item.datasetIndex === 0) return '  Total: ' + item.parsed.y + ' employees';
              return '  Hired: +' + item.parsed.y;
            },
          }
        }),
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.03)', drawTicks: false },
          border: { display: false },
          ticks: { color: '#475569', font: { size: 10 }, maxRotation: 0 },
        },
        y: {
          position: 'left',
          grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
          border: { display: false },
          ticks: { color: '#475569', font: { size: 10 }, padding: 8, stepSize: 1 },
        },
        y2: {
          position: 'right',
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#06b6d4', font: { size: 10 }, padding: 8, stepSize: 1 },
        },
      },
    },
  });
}

// ── Render dept doughnut ──────────────────────────────────────
function renderDeptChart(byDept) {
  var labels = (byDept || []).map(function (d) { return d._id; });
  var data   = (byDept || []).map(function (d) { return d.count; });
  var colors = labels.map(function (l) { return DEPT_COLORS[l] || '#7c3aed'; });

  var ctx = document.getElementById('deptChart').getContext('2d');
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data:            data,
        backgroundColor: colors.map(function (c) { return c + 'bb'; }),
        borderColor:     colors.map(function (c) { return c; }),
        borderWidth:     2,
        hoverOffset:     12,
        hoverBorderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      cutout: '72%',
      animation: { animateRotate: true, duration: 1000, easing: 'easeInOutQuart' },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 12,
            font: { size: 11 },
            usePointStyle: true,
            pointStyleWidth: 8,
            boxHeight: 7,
            color: '#64748b',
          },
        },
        tooltip: Object.assign({}, TOOLTIP_STYLE, {
          callbacks: {
            label: function(item) { return '  ' + item.label + ': ' + item.parsed + ' employees'; }
          }
        }),
      },
    },
    plugins: [{
      id: 'centerLabel',
      afterDraw: function(chart) {
        var total = chart.data.datasets[0].data.reduce(function(a,b){return a+b;},0);
        var ctx2  = chart.ctx;
        var cx    = chart.chartArea.left + (chart.chartArea.right  - chart.chartArea.left) / 2;
        var cy    = chart.chartArea.top  + (chart.chartArea.bottom - chart.chartArea.top)  / 2;
        ctx2.save();
        ctx2.font = 'bold 22px Poppins, sans-serif';
        ctx2.fillStyle = '#f1f5f9';
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.fillText(total, cx, cy - 8);
        ctx2.font = '11px Poppins, sans-serif';
        ctx2.fillStyle = '#475569';
        ctx2.fillText('employees', cx, cy + 12);
        ctx2.restore();
      }
    }],
  });
}

// ── Render status horizontal bar ─────────────────────────────
function renderStatusChart(byStatus) {
  var map = {};
  (byStatus || []).forEach(function (s) { map[s._id] = s.count; });
  var labels = ['Active', 'On Leave', 'Inactive'];
  var data   = [map['Active'] || 0, map['On Leave'] || 0, map['Inactive'] || 0];
  var total  = data.reduce(function(a,b){return a+b;},0);

  var ctx = document.getElementById('statusChart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label:           'Employees',
        data:            data,
        backgroundColor: [
          'rgba(16,185,129,0.75)',
          'rgba(245,158,11,0.75)',
          'rgba(239,68,68,0.75)',
        ],
        borderColor: ['#10b981','#f59e0b','#ef4444'],
        borderWidth: 0,
        borderRadius: { topRight: 8, bottomRight: 8 },
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: Object.assign({}, TOOLTIP_STYLE, {
          callbacks: {
            label: function(item) {
              var pct = total ? Math.round((item.parsed.x / total) * 100) : 0;
              return '  ' + item.parsed.x + ' employees (' + pct + '%)';
            }
          }
        }),
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.03)', drawTicks: false },
          border: { display: false },
          ticks: { color: '#475569', font: { size: 10 }, padding: 6, stepSize: 1 },
        },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: { color: '#94a3b8', font: { size: 12, weight: '600' }, padding: 8 },
        },
      },
    },
  });
}

// ── Render top earners ────────────────────────────────────────
function renderTopEarners(topEarners) {
  var list = document.getElementById('earnersList');
  if (!topEarners || !topEarners.length) {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:12px 0;">No data</p>';
    return;
  }
  list.innerHTML = topEarners.map(function (e, i) {
    var rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
    return '<div class="earner-item">' +
      '<div class="earner-rank ' + rankClass + '">' + (i + 1) + '</div>' +
      '<div class="earner-info">' +
        '<div class="earner-name">' + e.name + '</div>' +
        '<div class="earner-dept">' + (e.department || '') + '</div>' +
      '</div>' +
      '<div class="earner-salary">' + fmtSalary(e.salary) + '</div>' +
    '</div>';
  }).join('');
}

// ── Render activity feed ──────────────────────────────────────
function renderActivity(activities) {
  var feed = document.getElementById('activityFeed');
  if (!activities || !activities.length) {
    feed.innerHTML = '<p style="color:var(--text-muted);font-size:13px;padding:12px 0;">No recent activity</p>';
    return;
  }
  feed.innerHTML = activities.slice(0, 10).map(function (a) {
    var dotClass = 'dot-' + (a.action || 'default');
    var validDots = ['hired', 'updated', 'terminated'];
    if (!validDots.includes(a.action)) dotClass = 'dot-default';

    return '<div class="activity-item">' +
      '<span class="activity-dot ' + dotClass + '"></span>' +
      '<div class="activity-content">' +
        '<div class="activity-title"><strong>' + (a.entityName || 'Unknown') + '</strong> was ' + a.action + ' by ' + (a.userName || 'System') + '</div>' +
        '<div class="activity-meta">' + (a.details || '') + ' &bull; ' + timeAgo(a.createdAt) + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ── Load analytics and render charts ─────────────────────────
async function loadAnalytics() {
  try {
    var res = await API.getAnalytics();
    var d   = res.data;

    // Need total for growth chart baseline
    var statsRes = await API.getStats();
    var total = statsRes.data.total;

    renderGrowthChart(d.monthlyHires, total);
    renderDeptChart(d.byDept);
    renderStatusChart(d.byStatus);
    renderTopEarners(d.topEarners);
    renderActivity(d.recentActivity);
  } catch (err) {
    showToast('Could not load analytics data', 'error');
  }
}

// ── Logout ────────────────────────────────────────────────────
document.getElementById('btnLogout').addEventListener('click', function () {
  Auth.clear();
  window.location.href = 'index.html';
});

// ── Clickable stat cards ──────────────────────────────────────
function initClickableStats() {
  var cardMap = {
    'statCardTotal':  'employees.html',
    'statCardActive': 'employees.html?status=Active',
    'statCardLeave':  'employees.html?status=On+Leave',
  };
  Object.keys(cardMap).forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function() {
      window.location.href = cardMap[id];
    });
  });
}

// ── Quick action buttons ──────────────────────────────────────
function initQuickActions() {
  var addBtn = document.getElementById('qaBtnAddEmp');
  if (addBtn) addBtn.addEventListener('click', function() {
    window.location.href = 'employees.html';
    sessionStorage.setItem('nx_openAdd', '1');
  });
  var palBtn = document.getElementById('qaBtnPalette');
  if (palBtn) palBtn.addEventListener('click', function() {
    if (typeof CommandPalette !== 'undefined') CommandPalette.open();
  });
}

// ── Auto-refresh data every 30s ───────────────────────────────
async function refreshAll() {
  if (typeof LoadingBar !== 'undefined') LoadingBar.start();
  await Promise.all([loadStats(), loadAnalytics()]).catch(function() {});
  if (typeof LoadingBar !== 'undefined') LoadingBar.done();
}

// ── Init ──────────────────────────────────────────────────────
(function init() {
  populateSidebar();
  setGreeting();
  loadStats();
  loadAnalytics();
  initThreeJS('bg-canvas', 0.3);
  initClickableStats();
  initQuickActions();

  // Hook LoadingBar into initial loads
  if (typeof LoadingBar !== 'undefined') LoadingBar.start();
  Promise.all([
    API.getStats(),
    API.getAnalytics(),
  ]).catch(function(){}).finally(function() {
    if (typeof LoadingBar !== 'undefined') LoadingBar.done();
  });

  // Auto-refresh setup (delegated to interactions.js initAutoRefresh when loaded)
  var _refreshCount = 30;
  setInterval(function() {
    _refreshCount--;
    var el = document.getElementById('nxRefreshCount');
    if (el) el.textContent = _refreshCount;
    if (_refreshCount <= 0) {
      _refreshCount = 30;
      refreshAll();
    }
  }, 1000);
})();
