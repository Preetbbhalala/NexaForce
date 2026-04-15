/* ================================================================
   NexaForce v2 — employees.js
   ================================================================ */
'use strict';

// ── Auth guard ────────────────────────────────────────────────
Auth.guard();

// ── Department / status config ────────────────────────────────
var DEPT_COLORS = {
  Engineering: { bg: '#7c3aed', light: 'rgba(124,58,237,0.2)', border: 'rgba(124,58,237,0.5)' },
  Design:      { bg: '#ec4899', light: 'rgba(236,72,153,0.2)', border: 'rgba(236,72,153,0.5)' },
  Marketing:   { bg: '#06b6d4', light: 'rgba(6,182,212,0.2)',  border: 'rgba(6,182,212,0.5)'  },
  Sales:       { bg: '#10b981', light: 'rgba(16,185,129,0.2)', border: 'rgba(16,185,129,0.5)' },
  HR:          { bg: '#f59e0b', light: 'rgba(245,158,11,0.2)', border: 'rgba(245,158,11,0.5)' },
  Finance:     { bg: '#6366f1', light: 'rgba(99,102,241,0.2)', border: 'rgba(99,102,241,0.5)' },
  Operations:  { bg: '#f97316', light: 'rgba(249,115,22,0.2)', border: 'rgba(249,115,22,0.5)' },
};
var DEFAULT_DC = { bg: '#7c3aed', light: 'rgba(124,58,237,0.2)', border: 'rgba(124,58,237,0.5)' };

var STATUS_STYLES = {
  'Active':   { dot: '#10b981', text: '#34d399' },
  'Inactive': { dot: '#ef4444', text: '#fca5a5' },
  'On Leave': { dot: '#f59e0b', text: '#fcd34d' },
};

function deptColor(dept) { return DEPT_COLORS[dept] || DEFAULT_DC; }

function initials(name) {
  return (name || '?').split(' ').map(function (p) { return p[0]; }).slice(0, 2).join('').toUpperCase();
}

function fmtSalary(n) {
  return n >= 1000 ? '$' + (n / 1000).toFixed(0) + 'k' : '$' + n;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short' });
}

// ── State ─────────────────────────────────────────────────────
var state = {
  employees: [],
  filter:    'all',
  search:    '',
  view:      'card',
  editingId: null,
  deleteId:  null,
};

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

// ── Sidebar ───────────────────────────────────────────────────
function populateSidebar() {
  var user = Auth.getUser();
  if (!user) return;
  var ini = initials(user.name || 'Admin');
  document.getElementById('sidebarAvatar').textContent = ini;
  document.getElementById('sidebarName').textContent   = user.name || 'Admin';
  document.getElementById('sidebarRole').textContent   = user.role || 'admin';
}

// ── Build 3D flip card ────────────────────────────────────────
function buildCard(emp, index) {
  var dc   = deptColor(emp.department);
  var ss   = STATUS_STYLES[emp.status] || STATUS_STYLES['Active'];
  var ini  = initials(emp.name);
  var sal  = fmtSalary(emp.salary);
  var year = emp.joinDate ? new Date(emp.joinDate).getFullYear() : '—';
  var date = fmtDate(emp.joinDate);

  var wrapper = document.createElement('div');
  wrapper.className = 'card-wrapper';
  wrapper.dataset.id = emp._id;
  wrapper.style.animationDelay = (index * 0.05) + 's';

  wrapper.innerHTML =
    '<div class="card-inner">' +

    // FRONT
    '<div class="card-face card-front">' +
      '<div class="card-glow-strip" style="background: linear-gradient(90deg,' + dc.bg + ',' + dc.bg + '88)"></div>' +
      '<button class="flip-btn" title="See details">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
        '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>' +
        '<line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>' +
        '</svg>' +
      '</button>' +
      '<div class="emp-avatar" style="background:linear-gradient(135deg,' + dc.bg + ',' + dc.bg + 'aa)">' + ini + '</div>' +
      '<div class="emp-name">' + emp.name + '</div>' +
      '<div class="emp-position">' + emp.position + '</div>' +
      '<span class="badge badge-' + emp.department + '">' + emp.department + '</span>' +
      '<div class="status-row">' +
        '<span class="status-dot" style="background:' + ss.dot + ';box-shadow:0 0 6px ' + ss.dot + '"></span>' +
        '<span style="color:' + ss.text + '">' + emp.status + '</span>' +
      '</div>' +
      '<div class="card-quick">' +
        '<div class="quick-item"><span class="q-label">Since</span><span class="q-val">' + year + '</span></div>' +
        '<div class="quick-item"><span class="q-label">Salary</span><span class="q-val">' + sal + '</span></div>' +
      '</div>' +
    '</div>' +

    // BACK
    '<div class="card-face card-back">' +
      '<div class="back-header">' +
        '<div class="back-avatar-sm" style="background:linear-gradient(135deg,' + dc.bg + ',' + dc.bg + '88)">' + ini + '</div>' +
        '<div><div class="back-name">' + emp.name + '</div><div class="back-position">' + emp.position + '</div></div>' +
      '</div>' +
      '<div class="back-details">' +
        '<div class="detail-row"><span class="d-icon">✉</span><span>' + emp.email + '</span></div>' +
        '<div class="detail-row"><span class="d-icon">📞</span><span>' + (emp.phone || '—') + '</span></div>' +
        '<div class="detail-row"><span class="d-icon">💰</span><span>$' + (emp.salary || 0).toLocaleString() + ' / yr</span></div>' +
        '<div class="detail-row"><span class="d-icon">📅</span><span>Joined ' + date + '</span></div>' +
        '<div class="detail-row"><span class="d-icon">🏢</span><span>' + emp.department + '</span></div>' +
      '</div>' +
      '<div class="back-actions">' +
        '<button class="btn-edit"   data-id="' + emp._id + '">Edit</button>' +
        '<button class="btn-delete" data-id="' + emp._id + '">Delete</button>' +
      '</div>' +
      '<button class="btn-flip-back">← Flip Back</button>' +
    '</div>' +

    '</div>';

  // 3D tilt
  wrapper.addEventListener('mousemove', function (e) {
    if (wrapper.classList.contains('flipped')) return;
    var rect = wrapper.getBoundingClientRect();
    var rx   = ((e.clientY - rect.top)  / rect.height - 0.5) * 18;
    var ry   = ((e.clientX - rect.left) / rect.width  - 0.5) * -18;
    wrapper.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) scale3d(1.02,1.02,1.02)';
  });
  wrapper.addEventListener('mouseleave', function () {
    wrapper.style.transform = '';
  });

  // Flip
  wrapper.querySelector('.flip-btn').addEventListener('click', function (e) {
    e.stopPropagation();
    wrapper.classList.add('flipped');
    wrapper.style.transform = '';
  });
  wrapper.querySelector('.btn-flip-back').addEventListener('click', function (e) {
    e.stopPropagation();
    wrapper.classList.remove('flipped');
  });

  // Edit
  wrapper.querySelector('.btn-edit').addEventListener('click', function (e) {
    e.stopPropagation();
    openEditModal(emp);
  });

  // Delete
  wrapper.querySelector('.btn-delete').addEventListener('click', function (e) {
    e.stopPropagation();
    openDeleteModal(emp._id, emp.name);
  });

  return wrapper;
}

// ── Build table row ───────────────────────────────────────────
function buildTableRow(emp) {
  var dc     = deptColor(emp.department);
  var ss     = STATUS_STYLES[emp.status] || STATUS_STYLES['Active'];
  var ini    = initials(emp.name);
  var statusBadgeClass = emp.status === 'Active' ? 'badge-active' : emp.status === 'Inactive' ? 'badge-inactive' : 'badge-onleave';
  var sal    = '$' + (emp.salary || 0).toLocaleString();
  var joined = fmtDate(emp.joinDate);

  var tr = document.createElement('tr');
  tr.innerHTML =
    '<td>' +
      '<div style="display:flex;align-items:center;gap:10px;">' +
        '<div class="avatar-circle" style="background:linear-gradient(135deg,' + dc.bg + ',' + dc.bg + 'aa);font-size:13px;font-weight:700;">' + ini + '</div>' +
        '<div>' +
          '<div class="emp-table-name">'  + emp.name  + '</div>' +
          '<div class="emp-table-email">' + emp.email + '</div>' +
        '</div>' +
      '</div>' +
    '</td>' +
    '<td><span class="badge badge-' + emp.department + '">' + emp.department + '</span></td>' +
    '<td>' + emp.position + '</td>' +
    '<td><span class="badge ' + statusBadgeClass + '">' + emp.status + '</span></td>' +
    '<td style="font-weight:600;color:var(--green);">' + sal + '</td>' +
    '<td>' + joined + '</td>' +
    '<td>' +
      '<button class="btn-table-edit"   data-id="' + emp._id + '">Edit</button>' +
      '<button class="btn-table-delete" data-id="' + emp._id + '">Delete</button>' +
    '</td>';

  tr.querySelector('.btn-table-edit').addEventListener('click', function () { openEditModal(emp); });
  tr.querySelector('.btn-table-delete').addEventListener('click', function () { openDeleteModal(emp._id, emp.name); });
  return tr;
}

// ── Render cards ──────────────────────────────────────────────
function renderCards(list) {
  var grid  = document.getElementById('employeeGrid');
  var empty = document.getElementById('emptyState');
  grid.innerHTML = '';
  if (!list.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  list.forEach(function (emp, i) { grid.appendChild(buildCard(emp, i)); });
}

// ── Render table ──────────────────────────────────────────────
function renderTable(list) {
  var tbody = document.getElementById('employeeTbody');
  var empty = document.getElementById('tableEmpty');
  tbody.innerHTML = '';
  if (!list.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  list.forEach(function (emp) { tbody.appendChild(buildTableRow(emp)); });
}

// ── Show skeletons ────────────────────────────────────────────
function showSkeletons() {
  var grid = document.getElementById('employeeGrid');
  grid.innerHTML = Array.from({ length: 8 }, function () {
    return '<div class="skeleton-card"></div>';
  }).join('');
  document.getElementById('emptyState').classList.add('hidden');
}

// ── Update results count ──────────────────────────────────────
function updateCount(n) {
  document.getElementById('resultsCount').textContent = n + ' employee' + (n !== 1 ? 's' : '');
}

// ── Load employees ────────────────────────────────────────────
async function loadEmployees() {
  if (state.view === 'card') showSkeletons();
  var params = {};
  if (state.filter !== 'all') params.department = state.filter;
  if (state.search)           params.search     = state.search;

  try {
    var res = await API.getEmployees(params);
    state.employees = res.data || [];
    updateCount(state.employees.length);
    if (state.view === 'card') {
      renderCards(state.employees);
    } else {
      renderTable(state.employees);
    }
  } catch (err) {
    showToast('Failed to load employees: ' + err.message, 'error');
    renderCards([]);
  }
}

// ── Modal helpers ─────────────────────────────────────────────
var overlay = document.getElementById('modalOverlay');
var form    = document.getElementById('employeeForm');

function clearErrors() {
  form.querySelectorAll('.error').forEach(function (el) { el.classList.remove('error'); });
}

function validateForm() {
  clearErrors();
  var ok = true;
  ['empName', 'empEmail', 'empPhone', 'empDept', 'empPosition', 'empSalary'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el.value.trim()) { el.classList.add('error'); ok = false; }
  });
  return ok;
}

function openAddModal() {
  state.editingId = null;
  form.reset();
  document.getElementById('empId').value = '';
  document.getElementById('modalTitle').textContent   = 'Add Employee';
  document.getElementById('btnSaveText').textContent  = 'Save Employee';
  clearErrors();
  overlay.classList.remove('hidden');
}

function openEditModal(emp) {
  state.editingId = emp._id;
  document.getElementById('empId').value        = emp._id;
  document.getElementById('empName').value      = emp.name;
  document.getElementById('empEmail').value     = emp.email;
  document.getElementById('empPhone').value     = emp.phone || '';
  document.getElementById('empDept').value      = emp.department;
  document.getElementById('empPosition').value  = emp.position;
  document.getElementById('empSalary').value    = emp.salary;
  document.getElementById('empStatus').value    = emp.status;
  document.getElementById('empJoin').value      = emp.joinDate
    ? new Date(emp.joinDate).toISOString().split('T')[0] : '';
  document.getElementById('modalTitle').textContent  = 'Edit Employee';
  document.getElementById('btnSaveText').textContent = 'Update Employee';
  clearErrors();
  overlay.classList.remove('hidden');
}

function closeModal() {
  overlay.classList.add('hidden');
  form.reset();
  state.editingId = null;
}

// ── Form submit ───────────────────────────────────────────────
form.addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!validateForm()) return;

  var payload = {
    name:       document.getElementById('empName').value.trim(),
    email:      document.getElementById('empEmail').value.trim(),
    phone:      document.getElementById('empPhone').value.trim(),
    department: document.getElementById('empDept').value,
    position:   document.getElementById('empPosition').value.trim(),
    salary:     Number(document.getElementById('empSalary').value),
    status:     document.getElementById('empStatus').value,
    joinDate:   document.getElementById('empJoin').value || undefined,
  };

  var btn     = document.getElementById('btnSave');
  var btnText = document.getElementById('btnSaveText');
  btn.disabled = true;
  btnText.textContent = state.editingId ? 'Updating…' : 'Saving…';

  try {
    if (state.editingId) {
      await API.updateEmployee(state.editingId, payload);
      showToast(payload.name + ' updated', 'success');
    } else {
      await API.createEmployee(payload);
      showToast(payload.name + ' added to the team', 'success');
    }
    closeModal();
    loadEmployees();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btnText.textContent = state.editingId ? 'Update Employee' : 'Save Employee';
  }
});

// ── Delete modal ──────────────────────────────────────────────
var deleteOverlay = document.getElementById('deleteOverlay');

function openDeleteModal(id, name) {
  state.deleteId = id;
  document.getElementById('deleteMsg').textContent = 'Remove "' + name + '" permanently? This cannot be undone.';
  deleteOverlay.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteOverlay.classList.add('hidden');
  state.deleteId = null;
}

document.getElementById('btnDeleteConfirm').addEventListener('click', async function () {
  if (!state.deleteId) return;
  var btn = document.getElementById('btnDeleteConfirm');
  btn.disabled = true;
  btn.textContent = 'Deleting…';
  try {
    await API.deleteEmployee(state.deleteId);
    showToast('Employee removed', 'success');
    closeDeleteModal();
    loadEmployees();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Yes, Delete';
  }
});

// ── View toggle ───────────────────────────────────────────────
document.getElementById('btnCardView').addEventListener('click', function () {
  if (state.view === 'card') return;
  state.view = 'card';
  document.getElementById('btnCardView').classList.add('active');
  document.getElementById('btnTableView').classList.remove('active');
  document.getElementById('cardView').style.display  = '';
  document.getElementById('tableView').style.display = 'none';
  document.getElementById('resultsHint').style.display = '';
  loadEmployees();
});

document.getElementById('btnTableView').addEventListener('click', function () {
  if (state.view === 'table') return;
  state.view = 'table';
  document.getElementById('btnTableView').classList.add('active');
  document.getElementById('btnCardView').classList.remove('active');
  document.getElementById('cardView').style.display  = 'none';
  document.getElementById('tableView').style.display = '';
  document.getElementById('resultsHint').style.display = 'none';
  loadEmployees();
});

// ── Search ────────────────────────────────────────────────────
var _searchTimer;
document.getElementById('searchInput').addEventListener('input', function (e) {
  state.search = e.target.value.trim();
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(loadEmployees, 350);
});

// ── Filter pills ──────────────────────────────────────────────
document.getElementById('filterPills').addEventListener('click', function (e) {
  var pill = e.target.closest('.pill');
  if (!pill) return;
  document.querySelectorAll('#filterPills .pill').forEach(function (p) { p.classList.remove('active'); });
  pill.classList.add('active');
  state.filter = pill.dataset.filter;
  loadEmployees();
});

// ── Add employee button ───────────────────────────────────────
document.getElementById('btnAddEmployee').addEventListener('click', openAddModal);

// ── Modal close events ────────────────────────────────────────
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click', closeModal);
document.getElementById('btnDeleteCancel').addEventListener('click', closeDeleteModal);
overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
deleteOverlay.addEventListener('click', function (e) { if (e.target === deleteOverlay) closeDeleteModal(); });
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { closeModal(); closeDeleteModal(); }
});

// ── Logout ────────────────────────────────────────────────────
document.getElementById('btnLogout').addEventListener('click', function () {
  Auth.clear();
  window.location.href = 'index.html';
});

// ── Init ──────────────────────────────────────────────────────
(function init() {
  populateSidebar();
  loadEmployees();
})();
