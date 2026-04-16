/* ================================================================
   NexaForce v2 — analytics.js
   ================================================================ */
'use strict';

if (!Auth.guard()) throw new Error('Unauthenticated');

/* ── Shared helpers ── */
const DEPT_COLORS = {
  Engineering: '#7c3aed', Design: '#ec4899', Marketing: '#06b6d4',
  Sales: '#10b981', HR: '#f59e0b', Finance: '#6366f1', Operations: '#f97316',
};
function dc(dept) { return DEPT_COLORS[dept] || '#7c3aed'; }

let _toastTimer;
function showToast(msg, type) {
  if (!type) type = 'info';
  const toast = document.getElementById('toast');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.className = 'toast toast-' + type;
  document.getElementById('toastIcon').textContent = icons[type] || icons.info;
  document.getElementById('toastMsg').textContent  = msg;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

/* ── Sidebar init ── */
(function initSidebar() {
  const user = Auth.getUser();
  if (!user) return;
  const name = user.name || 'Admin';
  document.getElementById('sidebarAvatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('sidebarName').textContent   = name;
  document.getElementById('sidebarRole').textContent   = user.role || 'admin';
  document.getElementById('btnLogout').addEventListener('click', () => {
    Auth.clear();
    window.location.href = 'index.html';
  });
})();

/* ── Chart defaults ── */
Chart.defaults.color       = '#64748b';
Chart.defaults.borderColor = 'rgba(255,255,255,0.04)';
Chart.defaults.font.family = 'Poppins, sans-serif';
Chart.defaults.font.size   = 11;

var TOOLTIP_STYLE = {
  backgroundColor: 'rgba(7,7,22,0.97)',
  titleColor:      '#f1f5f9',
  bodyColor:       '#94a3b8',
  borderColor:     'rgba(124,58,237,0.4)',
  borderWidth:     1,
  cornerRadius:    10,
  padding:         12,
  displayColors:   false,
};

const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

/* ── KPIs ── */
function renderKPIs(data) {
  const { byDept } = data;

  document.getElementById('kpiPayroll').textContent =
    '$' + Math.round(data.totalPayroll || 0).toLocaleString();

  // Highest paid dept (by avgSalary)
  if (byDept && byDept.length) {
    const sorted = [...byDept].sort((a, b) => (b.avgSalary || 0) - (a.avgSalary || 0));
    document.getElementById('kpiHighDept').textContent    = sorted[0]._id;
    document.getElementById('kpiHighDeptSub').textContent =
      'Avg $' + Math.round(sorted[0].avgSalary || 0).toLocaleString();

    const largest = [...byDept].sort((a, b) => b.count - a.count);
    document.getElementById('kpiLargeDept').textContent    = largest[0]._id;
    document.getElementById('kpiLargeDeptSub').textContent = largest[0].count + ' employees';
  }
}

/* ── Salary by Department (horizontal bar) ── */
function renderSalaryByDept(byDept) {
  destroyChart('salaryByDeptChart');
  const sorted = [...byDept].sort((a, b) => (b.avgSalary || 0) - (a.avgSalary || 0));
  const labels  = sorted.map(d => d._id);
  const values  = sorted.map(d => Math.round(d.avgSalary || 0));
  const colors  = labels.map(l => dc(l));

  chartInstances['salaryByDeptChart'] = new Chart(
    document.getElementById('salaryByDeptChart'),
    {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Avg Salary',
          data: values,
          backgroundColor: colors.map(c => c + '66'),
          borderColor: colors,
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
            callbacks: { label: ctx => '  $' + ctx.parsed.x.toLocaleString() + ' avg' },
          }),
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.03)', drawTicks: false },
            border: { display: false },
            ticks: { color: '#475569', font: { size: 10 }, callback: v => '$' + (v / 1000).toFixed(0) + 'k' },
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#94a3b8', font: { size: 11, weight: '600' }, padding: 8 },
          },
        },
      },
    }
  );
}

/* ── Headcount by Department (bar) ── */
function renderHeadcount(byDept) {
  destroyChart('headcountChart');
  const sorted = [...byDept].sort((a, b) => b.count - a.count);
  const labels  = sorted.map(d => d._id);
  const values  = sorted.map(d => d.count);
  const colors  = labels.map(l => dc(l));

  chartInstances['headcountChart'] = new Chart(
    document.getElementById('headcountChart'),
    {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Employees',
          data: values,
          backgroundColor: colors.map(c => c + '77'),
          borderColor: colors,
          borderWidth: 0,
          borderRadius: { topLeft: 8, topRight: 8 },
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        animation: { duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: Object.assign({}, TOOLTIP_STYLE, {
            callbacks: { label: ctx => '  ' + ctx.parsed.y + ' employees' }
          }),
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#94a3b8', font: { size: 10 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.03)', drawTicks: false },
            border: { display: false },
            ticks: { color: '#475569', font: { size: 10 }, stepSize: 1, padding: 6 },
          },
        },
      },
    }
  );
}

/* ── Monthly Hiring Trend (line) ── */
function renderTrend(monthlyHires) {
  destroyChart('trendChart');

  const shortLabels = [];
  const fullLabels  = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    shortLabels.push(d.toLocaleDateString('en-US', { month: 'short' }));
    fullLabels.push(d.toLocaleDateString('en-CA', { month: 'short', year: '2-digit' }));
  }

  const hireMap = {};
  (monthlyHires || []).forEach(item => {
    const key = new Date(item._id.year, item._id.month - 1, 1)
      .toLocaleDateString('en-CA', { month: 'short', year: '2-digit' });
    hireMap[key] = item.count;
  });

  const values = fullLabels.map(l => hireMap[l] || 0);
  const canvas = document.getElementById('trendChart');
  const ctx2   = canvas.getContext('2d');
  const grad   = ctx2.createLinearGradient(0, 0, 0, 200);
  grad.addColorStop(0,   'rgba(124,58,237,0.4)');
  grad.addColorStop(0.6, 'rgba(124,58,237,0.1)');
  grad.addColorStop(1,   'rgba(124,58,237,0.0)');

  chartInstances['trendChart'] = new Chart(canvas, {
    type: 'line',
    data: {
      labels: shortLabels,
      datasets: [{
        label: 'New Hires',
        data: values,
        borderColor: '#8b5cf6',
        backgroundColor: grad,
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#070716',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        tension: 0.45,
        fill: true,
        borderWidth: 2.5,
      }],
    },
    options: {
      responsive: true,
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: Object.assign({}, TOOLTIP_STYLE, {
          callbacks: {
            title: (items) => fullLabels[items[0].dataIndex],
            label: (item) => '  New hires: ' + item.parsed.y,
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
          grid: { color: 'rgba(255,255,255,0.03)', drawTicks: false },
          border: { display: false },
          ticks: { color: '#475569', font: { size: 10 }, stepSize: 1, padding: 6 },
        },
      },
    },
  });
}

/* ── Salary Distribution (bar) ── */
function renderSalaryDist(salaryRanges) {
  destroyChart('salaryDistChart');

  const rangeLabels = ['< $50k', '$50–75k', '$75–100k', '$100–125k', '$125k+'];
  const rangeColors = ['#ef4444', '#f59e0b', '#06b6d4', '#7c3aed', '#ec4899'];

  const counts = [0, 0, 0, 0, 0];
  (salaryRanges || []).forEach(r => {
    const id = r._id;
    if      (id === 0      || id < 50000)  counts[0] += r.count;
    else if (id === 50000)                 counts[1] += r.count;
    else if (id === 75000)                 counts[2] += r.count;
    else if (id === 100000)                counts[3] += r.count;
    else                                   counts[4] += r.count;
  });

  chartInstances['salaryDistChart'] = new Chart(
    document.getElementById('salaryDistChart'),
    {
      type: 'bar',
      data: {
        labels: rangeLabels,
        datasets: [{
          label: 'Employees',
          data: counts,
          backgroundColor: rangeColors.map(c => c + '77'),
          borderColor: rangeColors,
          borderWidth: 0,
          borderRadius: { topLeft: 8, topRight: 8 },
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        animation: { duration: 900, easing: 'easeOutQuart' },
        plugins: {
          legend: { display: false },
          tooltip: Object.assign({}, TOOLTIP_STYLE, {
            callbacks: { label: ctx => '  ' + ctx.parsed.y + ' employees' }
          }),
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: '#94a3b8', font: { size: 10 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.03)', drawTicks: false },
            border: { display: false },
            ticks: { color: '#475569', font: { size: 10 }, stepSize: 1, padding: 6 },
          },
        },
      },
    }
  );
}

/* ── Department Table ── */
function renderDeptTable(byDept, total) {
  const tbody = document.getElementById('deptTableBody');
  if (!byDept || !byDept.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:24px;">No data</td></tr>';
    return;
  }
  const sorted = [...byDept].sort((a, b) => b.count - a.count);
  tbody.innerHTML = sorted.map(d => {
    const pct = total ? ((d.count / total) * 100).toFixed(1) : 0;
    const color = dc(d._id);
    return `<tr>
      <td>
        <span style="display:inline-flex;align-items:center;gap:8px;">
          <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;"></span>
          ${d._id}
        </span>
      </td>
      <td>${d.count}</td>
      <td>$${Math.round(d.avgSalary || 0).toLocaleString()}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;"></div>
          </div>
          <span style="font-size:12px;color:var(--text-secondary);min-width:36px;">${pct}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ── Load everything ── */
async function load() {
  try {
    const [statsRes, analyticsRes] = await Promise.all([
      API.getStats(),
      API.getAnalytics(),
    ]);

    const stats     = statsRes.data;
    const analytics = analyticsRes.data;

    // Merge totalPayroll from stats
    analytics.totalPayroll = stats.totalPayroll || 0;

    renderKPIs(analytics);
    renderSalaryByDept(analytics.byDept   || []);
    renderHeadcount(analytics.byDept      || []);
    renderTrend(analytics.monthlyHires    || []);
    renderSalaryDist(analytics.salaryRanges || []);
    renderDeptTable(analytics.byDept      || [], stats.total || 0);
  } catch (err) {
    showToast('Failed to load analytics: ' + err.message, 'error');
  }
}

load();
