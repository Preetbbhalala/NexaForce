/* ================================================================
   NexaForce v2 — dashboard.js
   ================================================================ */
'use strict';

// ── Auth guard ────────────────────────────────────────────────
Auth.guard();

// ── Chart.js global dark theme ────────────────────────────────
Chart.defaults.color        = '#94a3b8';
Chart.defaults.borderColor  = 'rgba(255,255,255,0.08)';
Chart.defaults.font.family  = 'Poppins, system-ui, sans-serif';

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
  // Build last-12-month labels
  var labels = [];
  var now    = new Date();
  for (var i = 11; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
  }

  // Map hires to months
  var hiresMap = {};
  (monthlyHires || []).forEach(function (m) {
    var key = new Date(m._id.year, m._id.month - 1, 1)
      .toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    hiresMap[key] = m.count;
  });

  // Compute cumulative headcount
  var totalHiresLast12 = labels.reduce(function (sum, l) { return sum + (hiresMap[l] || 0); }, 0);
  var base = (total || 0) - totalHiresLast12;
  var data = [];
  labels.forEach(function (l) {
    base += (hiresMap[l] || 0);
    data.push(base);
  });

  var ctx = document.getElementById('growthChart').getContext('2d');
  var grad = ctx.createLinearGradient(0, 0, 0, 220);
  grad.addColorStop(0, 'rgba(124,58,237,0.3)');
  grad.addColorStop(1, 'rgba(124,58,237,0)');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label:           'Headcount',
        data:            data,
        borderColor:     '#7c3aed',
        backgroundColor: grad,
        borderWidth:     2,
        fill:            true,
        tension:         0.4,
        pointRadius:     4,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor:     '#0d0d2b',
        pointBorderWidth:     2,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(13,13,43,0.95)',
          titleColor:      '#f1f5f9',
          bodyColor:       '#94a3b8',
          borderColor:     'rgba(124,58,237,0.3)',
          borderWidth:     1,
        },
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { maxRotation: 45, font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 1 } },
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
      labels:   labels,
      datasets: [{
        data:            data,
        backgroundColor: colors.map(function (c) { return c + 'cc'; }),
        borderColor:     colors,
        borderWidth:     2,
        hoverOffset:     8,
      }],
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { padding: 14, font: { size: 12 }, boxWidth: 12 } },
        tooltip: {
          backgroundColor: 'rgba(13,13,43,0.95)',
          titleColor:      '#f1f5f9',
          bodyColor:       '#94a3b8',
          borderColor:     'rgba(255,255,255,0.1)',
          borderWidth:     1,
        },
      },
    },
  });
}

// ── Render status horizontal bar ─────────────────────────────
function renderStatusChart(byStatus) {
  var map = {};
  (byStatus || []).forEach(function (s) { map[s._id] = s.count; });
  var labels = ['Active', 'On Leave', 'Inactive'];
  var data   = [map['Active'] || 0, map['On Leave'] || 0, map['Inactive'] || 0];
  var colors = ['rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)', 'rgba(239,68,68,0.7)'];

  var ctx = document.getElementById('statusChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels:   labels,
      datasets: [{
        label:           'Employees',
        data:            data,
        backgroundColor: colors,
        borderColor:     colors.map(function (c) { return c.replace('0.7', '1'); }),
        borderWidth:     1,
        borderRadius:    6,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(13,13,43,0.95)',
          titleColor: '#f1f5f9',
          bodyColor:  '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
        },
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 1 } },
        y: { grid: { display: false } },
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

    var actionLabel = a.action ? (a.action.charAt(0).toUpperCase() + a.action.slice(1)) : 'Action';

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

// ── Init ──────────────────────────────────────────────────────
(function init() {
  populateSidebar();
  setGreeting();
  loadStats();
  loadAnalytics();
  initThreeJS('bg-canvas', 0.3);
})();
