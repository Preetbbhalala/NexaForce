/* ═══════════════════════════════════════════════════
   NexaForce  |  app.js
   ═══════════════════════════════════════════════════ */

'use strict';

/* ══════════════════════════════════════════════════
   THREE.JS SCENE
══════════════════════════════════════════════════ */
function initThreeJS() {
  if (typeof THREE === 'undefined') return;

  const canvas   = document.getElementById('bg-canvas');
  const scene    = new THREE.Scene();
  const camera   = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.position.z = 55;

  /* ── Coloured Star Field ── */
  const starCount = 7000;
  const positions = new Float32Array(starCount * 3);
  const colors    = new Float32Array(starCount * 3);

  const palette = [
    [0.49, 0.23, 0.93],  // purple
    [0.02, 0.71, 0.83],  // cyan
    [0.93, 0.28, 0.60],  // pink
    [1.00, 1.00, 1.00],  // white
  ];

  for (let i = 0; i < starCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 500;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 500;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 500;
    const c = palette[Math.floor(Math.random() * palette.length)];
    colors[i * 3]     = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  const stars = new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ size: 0.4, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.75 })
  );
  scene.add(stars);

  /* ── Torus Knot (background) ── */
  const tkGeo = new THREE.TorusKnotGeometry(18, 5, 128, 16);
  const tkMat = new THREE.MeshBasicMaterial({ color: 0x7c3aed, wireframe: true, transparent: true, opacity: 0.12 });
  const torusKnot = new THREE.Mesh(tkGeo, tkMat);
  torusKnot.position.set(40, -10, -60);
  scene.add(torusKnot);

  /* ── Icosahedron ── */
  const icoGeo = new THREE.IcosahedronGeometry(10, 1);
  const icoMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.14 });
  const ico = new THREE.Mesh(icoGeo, icoMat);
  ico.position.set(-45, 20, -50);
  scene.add(ico);

  /* ── Octahedron ── */
  const octGeo = new THREE.OctahedronGeometry(7, 0);
  const octMat = new THREE.MeshBasicMaterial({ color: 0xec4899, wireframe: true, transparent: true, opacity: 0.1 });
  const oct = new THREE.Mesh(octGeo, octMat);
  oct.position.set(0, 30, -40);
  scene.add(oct);

  /* ── Mouse Parallax ── */
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ── Animate ── */
  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    stars.rotation.y = t * 0.008;
    stars.rotation.x = t * 0.004;

    torusKnot.rotation.x = t * 0.08;
    torusKnot.rotation.y = t * 0.06;

    ico.rotation.x = t * 0.12;
    ico.rotation.y = t * 0.09;

    oct.rotation.x = t * 0.15;
    oct.rotation.z = t * 0.10;

    camera.position.x += (mouseX * 4 - camera.position.x) * 0.04;
    camera.position.y += (-mouseY * 3 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  })();

  /* ── Resize ── */
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

/* ══════════════════════════════════════════════════
   API SERVICE  (localStorage — works without server)
   When Node + MongoDB are running, swap this block
   back to fetch calls against /api/employees.
══════════════════════════════════════════════════ */
const API = {
  _KEY: 'nexaforce_employees',

  _load() {
    try { return JSON.parse(localStorage.getItem(this._KEY) || '[]'); } catch { return []; }
  },
  _save(data) { localStorage.setItem(this._KEY, JSON.stringify(data)); },
  _uid()      { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); },

  _seedIfEmpty() {
    if (this._load().length) return;
    const demo = [
      { name: 'Alice Chen',      email: 'alice@corp.io',    phone: '(306) 555-0101', department: 'Engineering',  position: 'Senior Developer',   salary: 110000, status: 'Active',   joinDate: '2021-03-15' },
      { name: 'Marcus Williams', email: 'marcus@corp.io',   phone: '(306) 555-0102', department: 'Engineering',  position: 'DevOps Engineer',     salary: 98000,  status: 'Active',   joinDate: '2022-07-01' },
      { name: 'Priya Sharma',    email: 'priya@corp.io',    phone: '(306) 555-0103', department: 'Design',       position: 'UI/UX Designer',      salary: 87000,  status: 'Active',   joinDate: '2020-11-20' },
      { name: 'Jordan Lee',      email: 'jordan@corp.io',   phone: '(306) 555-0104', department: 'Marketing',    position: 'Marketing Manager',   salary: 92000,  status: 'Active',   joinDate: '2019-05-10' },
      { name: 'Sofia Torres',    email: 'sofia@corp.io',    phone: '(306) 555-0105', department: 'Sales',        position: 'Sales Director',      salary: 105000, status: 'Active',   joinDate: '2020-02-14' },
      { name: 'Ryan Patel',      email: 'ryan@corp.io',     phone: '(306) 555-0106', department: 'Finance',      position: 'Financial Analyst',   salary: 83000,  status: 'On Leave', joinDate: '2021-09-05' },
      { name: 'Emma Johnson',    email: 'emma@corp.io',     phone: '(306) 555-0107', department: 'HR',           position: 'HR Specialist',       salary: 76000,  status: 'Active',   joinDate: '2022-01-17' },
      { name: 'Liam Nguyen',     email: 'liam@corp.io',     phone: '(306) 555-0108', department: 'Engineering',  position: 'Full Stack Engineer', salary: 102000, status: 'Active',   joinDate: '2023-03-01' },
      { name: 'Amara Osei',      email: 'amara@corp.io',    phone: '(306) 555-0109', department: 'Operations',   position: 'Operations Manager',  salary: 94000,  status: 'Active',   joinDate: '2020-08-22' },
      { name: 'Zoe Mitchell',    email: 'zoe@corp.io',      phone: '(306) 555-0111', department: 'Design',       position: 'Graphic Designer',    salary: 72000,  status: 'Inactive', joinDate: '2022-06-15' },
      { name: 'Noah Kim',        email: 'noah@corp.io',     phone: '(306) 555-0112', department: 'Finance',      position: 'Senior Accountant',   salary: 88000,  status: 'Active',   joinDate: '2021-04-28' },
      { name: 'Carlos Rivera',   email: 'carlos@corp.io',   phone: '(306) 555-0110', department: 'Sales',        position: 'Account Executive',   salary: 79000,  status: 'Active',   joinDate: '2019-12-01' },
    ].map(e => ({ ...e, _id: this._uid(), createdAt: new Date().toISOString() }));
    this._save(demo);
  },

  async getAll(params = {}) {
    let data = this._load();
    if (params.department) data = data.filter(e => e.department === params.department);
    if (params.search) {
      const q = params.search.toLowerCase();
      data = data.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q)
      );
    }
    return { success: true, count: data.length, data };
  },

  async getStats() {
    const data  = this._load();
    const total = data.length;
    const avg   = total ? Math.round(data.reduce((s, e) => s + (e.salary || 0), 0) / total) : 0;
    return {
      success: true,
      data: {
        total,
        active:    data.filter(e => e.status === 'Active').length,
        onLeave:   data.filter(e => e.status === 'On Leave').length,
        inactive:  data.filter(e => e.status === 'Inactive').length,
        avgSalary: avg,
      },
    };
  },

  async create(payload) {
    const data = this._load();
    if (data.find(e => e.email.toLowerCase() === payload.email.toLowerCase()))
      throw new Error('An employee with that email already exists');
    const emp = { ...payload, _id: this._uid(), createdAt: new Date().toISOString() };
    data.unshift(emp);
    this._save(data);
    return { success: true, data: emp };
  },

  async update(id, payload) {
    const data = this._load();
    const idx  = data.findIndex(e => e._id === id);
    if (idx === -1) throw new Error('Employee not found');
    data[idx] = { ...data[idx], ...payload };
    this._save(data);
    return { success: true, data: data[idx] };
  },

  async remove(id) {
    this._save(this._load().filter(e => e._id !== id));
    return { success: true, message: 'Employee removed' };
  },
};

/* ══════════════════════════════════════════════════
   STATE
══════════════════════════════════════════════════ */
const state = {
  employees: [],
  activeFilter: 'all',
  searchQuery: '',
  editingId: null,
  deleteId: null,
};

/* ══════════════════════════════════════════════════
   DEPARTMENT COLOURS
══════════════════════════════════════════════════ */
const DEPT_COLORS = {
  Engineering: { bg: '#7c3aed', light: 'rgba(124,58,237,0.2)',  border: 'rgba(124,58,237,0.5)' },
  Design:      { bg: '#ec4899', light: 'rgba(236,72,153,0.2)',  border: 'rgba(236,72,153,0.5)' },
  Marketing:   { bg: '#06b6d4', light: 'rgba(6,182,212,0.2)',   border: 'rgba(6,182,212,0.5)'  },
  Sales:       { bg: '#10b981', light: 'rgba(16,185,129,0.2)',  border: 'rgba(16,185,129,0.5)' },
  HR:          { bg: '#f59e0b', light: 'rgba(245,158,11,0.2)',  border: 'rgba(245,158,11,0.5)' },
  Finance:     { bg: '#6366f1', light: 'rgba(99,102,241,0.2)',  border: 'rgba(99,102,241,0.5)' },
  Operations:  { bg: '#f97316', light: 'rgba(249,115,22,0.2)',  border: 'rgba(249,115,22,0.5)' },
};
const defaultColor = { bg: '#7c3aed', light: 'rgba(124,58,237,0.2)', border: 'rgba(124,58,237,0.5)' };

const STATUS_STYLES = {
  'Active':   { dot: '#10b981', text: '#34d399' },
  'Inactive': { dot: '#ef4444', text: '#fca5a5' },
  'On Leave': { dot: '#f59e0b', text: '#fcd34d' },
};

function deptColor(dept) { return DEPT_COLORS[dept] || defaultColor; }
function initials(name) { return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase(); }
function fmtSalary(n) { return n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`; }
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'short' });
}

/* ══════════════════════════════════════════════════
   STATS COUNTER ANIMATION
══════════════════════════════════════════════════ */
function animateCount(el, target, prefix = '', suffix = '') {
  const duration = 1200;
  const start = performance.now();
  const from = 0;
  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + Math.round(from + (target - from) * ease).toLocaleString() + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}

async function loadStats() {
  try {
    const { data } = await API.getStats();
    animateCount(document.getElementById('statTotal'),  data.total);
    animateCount(document.getElementById('statActive'),  data.active);
    animateCount(document.getElementById('statLeave'),   data.onLeave);
    animateCount(document.getElementById('statSalary'),  data.avgSalary, '$');
  } catch {
    /* stats unavailable — silently skip */
  }
}

/* ══════════════════════════════════════════════════
   CARD RENDERER
══════════════════════════════════════════════════ */
function buildCard(emp, index) {
  const dc    = deptColor(emp.department);
  const ss    = STATUS_STYLES[emp.status] || STATUS_STYLES['Active'];
  const ini   = initials(emp.name);
  const sal   = fmtSalary(emp.salary);
  const year  = emp.joinDate ? new Date(emp.joinDate).getFullYear() : '—';
  const email = emp.email;
  const phone = emp.phone;
  const date  = fmtDate(emp.joinDate);

  const wrapper = document.createElement('div');
  wrapper.className = 'card-wrapper';
  wrapper.dataset.id = emp._id;
  wrapper.style.animationDelay = `${index * 0.07}s`;

  wrapper.innerHTML = `
    <div class="card-inner">

      <!-- ── FRONT ── -->
      <div class="card-face card-front">
        <div class="card-glow-strip" style="background: linear-gradient(90deg, ${dc.bg}, ${dc.bg}88)"></div>
        <button class="flip-btn" title="See details">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
          </svg>
        </button>

        <div class="emp-avatar" style="background: linear-gradient(135deg, ${dc.bg}, ${dc.bg}aa)">${ini}</div>
        <div class="emp-name">${emp.name}</div>
        <div class="emp-position">${emp.position}</div>

        <span class="dept-badge"
          style="background:${dc.light};color:${dc.bg};border-color:${dc.border}">
          ${emp.department}
        </span>

        <div class="status-row">
          <span class="status-dot" style="background:${ss.dot};box-shadow:0 0 6px ${ss.dot}"></span>
          <span style="color:${ss.text}">${emp.status}</span>
        </div>

        <div class="card-quick">
          <div class="quick-item">
            <span class="q-label">Since</span>
            <span class="q-val">${year}</span>
          </div>
          <div class="quick-item">
            <span class="q-label">Salary</span>
            <span class="q-val">${sal}</span>
          </div>
        </div>
      </div>

      <!-- ── BACK ── -->
      <div class="card-face card-back">
        <div class="back-header">
          <div class="back-avatar-sm" style="background:linear-gradient(135deg,${dc.bg},${dc.bg}88)">${ini}</div>
          <div>
            <div class="back-name">${emp.name}</div>
            <div class="back-position">${emp.position}</div>
          </div>
        </div>

        <div class="back-details">
          <div class="detail-row">
            <span class="d-icon">✉</span>
            <span>${email}</span>
          </div>
          <div class="detail-row">
            <span class="d-icon">📞</span>
            <span>${phone}</span>
          </div>
          <div class="detail-row">
            <span class="d-icon">💰</span>
            <span>$${emp.salary.toLocaleString()} / yr</span>
          </div>
          <div class="detail-row">
            <span class="d-icon">📅</span>
            <span>Joined ${date}</span>
          </div>
          <div class="detail-row">
            <span class="d-icon">🏢</span>
            <span>${emp.department}</span>
          </div>
        </div>

        <div class="back-actions">
          <button class="btn-edit"   data-id="${emp._id}">✏ Edit</button>
          <button class="btn-delete" data-id="${emp._id}">🗑 Delete</button>
        </div>
        <button class="btn-flip-back">← Flip Back</button>
      </div>

    </div>`;

  // ── 3D Tilt on hover ──
  wrapper.addEventListener('mousemove', (e) => {
    if (wrapper.classList.contains('flipped')) return;
    const rect   = wrapper.getBoundingClientRect();
    const x      = e.clientX - rect.left;
    const y      = e.clientY - rect.top;
    const rx     = ((y / rect.height) - 0.5) * 18;
    const ry     = ((x / rect.width)  - 0.5) * -18;
    wrapper.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.02,1.02,1.02)`;
  });
  wrapper.addEventListener('mouseleave', () => {
    wrapper.style.transform = '';
  });

  // ── Flip button ──
  wrapper.querySelector('.flip-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    wrapper.classList.add('flipped');
    wrapper.style.transform = '';
  });
  wrapper.querySelector('.btn-flip-back').addEventListener('click', (e) => {
    e.stopPropagation();
    wrapper.classList.remove('flipped');
  });

  // ── Edit ──
  wrapper.querySelector('.btn-edit').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(emp);
  });

  // ── Delete ──
  wrapper.querySelector('.btn-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    openDeleteModal(emp._id, emp.name);
  });

  return wrapper;
}

/* ══════════════════════════════════════════════════
   RENDER EMPLOYEES
══════════════════════════════════════════════════ */
function renderEmployees(list) {
  const grid  = document.getElementById('employeeGrid');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('resultsCount');

  grid.innerHTML = '';

  if (!list.length) {
    empty.classList.remove('hidden');
    count.textContent = '0 employees';
    return;
  }

  empty.classList.add('hidden');
  count.textContent = `${list.length} employee${list.length !== 1 ? 's' : ''}`;
  list.forEach((emp, i) => grid.appendChild(buildCard(emp, i)));
}

function showSkeletons(n = 6) {
  const grid = document.getElementById('employeeGrid');
  grid.innerHTML = Array.from({ length: n }, () => `<div class="skeleton-card"></div>`).join('');
}

/* ══════════════════════════════════════════════════
   LOAD EMPLOYEES
══════════════════════════════════════════════════ */
async function loadEmployees() {
  showSkeletons();
  const params = {};
  if (state.activeFilter !== 'all') params.department = state.activeFilter;
  if (state.searchQuery)             params.search     = state.searchQuery;
  try {
    const { data } = await API.getAll(params);
    state.employees = data;
    renderEmployees(data);
  } catch (err) {
    showToast('Failed to load employees: ' + err.message, 'error');
    renderEmployees([]);
  }
}

/* ══════════════════════════════════════════════════
   MODAL — ADD / EDIT
══════════════════════════════════════════════════ */
const overlay = document.getElementById('modalOverlay');
const form    = document.getElementById('employeeForm');

function openAddModal() {
  state.editingId = null;
  form.reset();
  document.getElementById('empId').value = '';
  document.getElementById('modalTitle').textContent = 'Add Employee';
  document.getElementById('btnSaveText').textContent = 'Save Employee';
  clearErrors();
  overlay.classList.remove('hidden');
}

function openEditModal(emp) {
  state.editingId = emp._id;
  document.getElementById('empId').value      = emp._id;
  document.getElementById('empName').value    = emp.name;
  document.getElementById('empEmail').value   = emp.email;
  document.getElementById('empPhone').value   = emp.phone;
  document.getElementById('empDept').value    = emp.department;
  document.getElementById('empPosition').value= emp.position;
  document.getElementById('empSalary').value  = emp.salary;
  document.getElementById('empStatus').value  = emp.status;
  document.getElementById('empJoin').value    = emp.joinDate
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

function clearErrors() {
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
}

function validateForm() {
  clearErrors();
  let ok = true;
  const required = ['empName', 'empEmail', 'empPhone', 'empDept', 'empPosition', 'empSalary'];
  required.forEach(id => {
    const el = document.getElementById(id);
    if (!el.value.trim()) { el.classList.add('error'); ok = false; }
  });
  return ok;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const payload = {
    name:       document.getElementById('empName').value.trim(),
    email:      document.getElementById('empEmail').value.trim(),
    phone:      document.getElementById('empPhone').value.trim(),
    department: document.getElementById('empDept').value,
    position:   document.getElementById('empPosition').value.trim(),
    salary:     Number(document.getElementById('empSalary').value),
    status:     document.getElementById('empStatus').value,
    joinDate:   document.getElementById('empJoin').value || undefined,
  };

  const btn = document.getElementById('btnSave');
  btn.disabled = true;
  document.getElementById('btnSaveText').textContent = state.editingId ? 'Updating…' : 'Saving…';

  try {
    if (state.editingId) {
      await API.update(state.editingId, payload);
      showToast(`${payload.name} updated successfully`, 'success');
    } else {
      await API.create(payload);
      showToast(`${payload.name} added to the team`, 'success');
    }
    closeModal();
    loadEmployees();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    document.getElementById('btnSaveText').textContent = state.editingId ? 'Update Employee' : 'Save Employee';
  }
});

/* ══════════════════════════════════════════════════
   MODAL — DELETE
══════════════════════════════════════════════════ */
const deleteOverlay = document.getElementById('deleteOverlay');

function openDeleteModal(id, name) {
  state.deleteId = id;
  document.getElementById('deleteMsg').textContent = `Remove "${name}" permanently? This cannot be undone.`;
  deleteOverlay.classList.remove('hidden');
}
function closeDeleteModal() {
  deleteOverlay.classList.add('hidden');
  state.deleteId = null;
}

document.getElementById('btnDeleteConfirm').addEventListener('click', async () => {
  if (!state.deleteId) return;
  const btn = document.getElementById('btnDeleteConfirm');
  btn.disabled = true;
  btn.textContent = 'Deleting…';
  try {
    await API.remove(state.deleteId);
    showToast('Employee removed', 'success');
    closeDeleteModal();
    loadEmployees();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Yes, Delete';
  }
});

/* ══════════════════════════════════════════════════
   TOAST
══════════════════════════════════════════════════ */
let _toastTimer;
function showToast(msg, type = 'info') {
  const toast    = document.getElementById('toast');
  const icon     = document.getElementById('toastIcon');
  const msgEl    = document.getElementById('toastMsg');
  const icons    = { success: '✅', error: '❌', info: 'ℹ️' };

  toast.className = `toast toast-${type}`;
  icon.textContent = icons[type] || icons.info;
  msgEl.textContent = msg;
  toast.classList.remove('hidden');

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

/* ══════════════════════════════════════════════════
   SEARCH & FILTER
══════════════════════════════════════════════════ */
let _searchTimer;
document.getElementById('searchInput').addEventListener('input', (e) => {
  state.searchQuery = e.target.value.trim();
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(loadEmployees, 350);
});

document.getElementById('filterPills').addEventListener('click', (e) => {
  const pill = e.target.closest('.pill');
  if (!pill) return;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  state.activeFilter = pill.dataset.filter;
  loadEmployees();
});

/* ══════════════════════════════════════════════════
   NAV SCROLL EFFECT
══════════════════════════════════════════════════ */
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ══════════════════════════════════════════════════
   MISC EVENT LISTENERS
══════════════════════════════════════════════════ */
document.getElementById('btnAddNav').addEventListener('click',  openAddModal);
document.getElementById('btnAddHero').addEventListener('click', openAddModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('btnCancel').addEventListener('click',  closeModal);
document.getElementById('btnDeleteCancel').addEventListener('click', closeDeleteModal);

// Close overlays on backdrop click
overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
deleteOverlay.addEventListener('click', (e) => { if (e.target === deleteOverlay) closeDeleteModal(); });

// Keyboard: Escape closes modals
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); closeDeleteModal(); }
});

/* ══════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════ */
(function init() {
  API._seedIfEmpty();   // load 12 demo employees on first visit
  initThreeJS();
  loadStats();
  loadEmployees();
})();
