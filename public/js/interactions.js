/* ================================================================
   NexaForce v2 — interactions.js
   Command Palette · Loading Bar · Notifications · Live Clock
   Scroll Reveal · Tooltips · Keyboard Shortcuts · Auto-Refresh
   ================================================================ */
'use strict';

/* ── Loading Bar ──────────────────────────────────────────────── */
const LoadingBar = {
  el: null,
  init() {
    this.el = document.createElement('div');
    this.el.id = 'nxLoadingBar';
    document.body.appendChild(this.el);
  },
  start() {
    if (!this.el) this.init();
    this.el.style.transition = 'none';
    this.el.style.width = '0%';
    this.el.style.opacity = '1';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.el.style.transition = 'width 1.8s cubic-bezier(0.1,0.7,0.3,1)';
        this.el.style.width = '82%';
      });
    });
  },
  done() {
    if (!this.el) return;
    this.el.style.transition = 'width 0.25s ease, opacity 0.4s ease 0.2s';
    this.el.style.width = '100%';
    setTimeout(() => { this.el.style.opacity = '0'; }, 280);
    setTimeout(() => { this.el.style.width = '0%'; this.el.style.opacity = '1'; this.el.style.transition = 'none'; }, 700);
  }
};

/* ── Live Clock ────────────────────────────────────────────────── */
function initClock() {
  const el = document.getElementById('liveClock');
  if (!el) return;
  function tick() {
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  }
  tick();
  setInterval(tick, 1000);
}

/* ── Scroll Reveal ─────────────────────────────────────────────── */
function initScrollReveal() {
  const selector = '.stat-card, .chart-card, .news-card, .kpi-card, .settings-card';
  const els = document.querySelectorAll(selector);
  if (!els.length) return;

  els.forEach((el, i) => {
    el.classList.add('nx-reveal');
    el.style.transitionDelay = (i * 0.05) + 's';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('nx-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  document.querySelectorAll('.nx-reveal').forEach(el => observer.observe(el));
}

/* ── Tooltip System ────────────────────────────────────────────── */
function initTooltips() {
  const tip = document.createElement('div');
  tip.className = 'nx-tooltip';
  document.body.appendChild(tip);

  let hideTimer;
  document.addEventListener('mouseover', e => {
    const target = e.target.closest('[data-tip]');
    if (!target) return;
    clearTimeout(hideTimer);
    tip.textContent = target.dataset.tip;
    const r = target.getBoundingClientRect();
    tip.style.left = (r.left + r.width / 2 + window.scrollX) + 'px';
    tip.style.top  = (r.top  - 10          + window.scrollY) + 'px';
    tip.classList.add('visible');
  });

  document.addEventListener('mouseout', e => {
    if (!e.target.closest('[data-tip]')) return;
    hideTimer = setTimeout(() => tip.classList.remove('visible'), 80);
  });
}

/* ── Notifications Panel ───────────────────────────────────────── */
const Notifications = {
  panel: null,
  btn: null,
  badge: null,
  open: false,

  timeSince(d) {
    if (!d) return '';
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 60)    return diff + 's ago';
    if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  },

  init() {
    this.btn = document.getElementById('notifBtn');
    if (!this.btn) return;

    // Badge dot on bell icon
    const dot = document.createElement('span');
    dot.className = 'notif-dot hidden';
    this.btn.style.position = 'relative';
    this.btn.appendChild(dot);
    this.badge = dot;

    // Panel
    this.panel = document.createElement('div');
    this.panel.className = 'notif-panel hidden';
    this.panel.innerHTML = `
      <div class="notif-header">
        <span class="notif-title-text">Notifications</span>
        <button class="notif-clear" id="notifClear">Mark all read</button>
      </div>
      <div class="notif-list" id="notifList">
        <div class="notif-empty">Loading…</div>
      </div>`;
    document.body.appendChild(this.panel);

    this.btn.addEventListener('click', e => { e.stopPropagation(); this.toggle(); });
    document.addEventListener('click', () => this.close());
    this.panel.addEventListener('click', e => e.stopPropagation());
    document.getElementById('notifClear').addEventListener('click', () => {
      document.getElementById('notifList').innerHTML = '<div class="notif-empty">All caught up!</div>';
      this.badge.classList.add('hidden');
    });

    this.load();
  },

  toggle() {
    this.open = !this.open;
    this.panel.classList.toggle('hidden', !this.open);
    if (this.open) {
      const r = this.btn.getBoundingClientRect();
      this.panel.style.top   = (r.bottom + 8) + 'px';
      this.panel.style.right = (window.innerWidth - r.right) + 'px';
    }
  },

  close() {
    this.open = false;
    if (this.panel) this.panel.classList.add('hidden');
  },

  async load() {
    if (typeof API === 'undefined') return;
    try {
      const res  = await API.getAnalytics();
      const acts = (res.data.recentActivity || []).slice(0, 8);
      const list = document.getElementById('notifList');
      if (!list) return;

      if (!acts.length) {
        list.innerHTML = '<div class="notif-empty">No recent activity</div>';
        return;
      }

      this.badge.classList.remove('hidden');
      const icons = { hired: '🎉', updated: '✏️', terminated: '👋' };
      list.innerHTML = acts.map(a => `
        <div class="notif-item">
          <span class="notif-icon-wrap">${icons[a.action] || '📌'}</span>
          <div class="notif-body">
            <div class="notif-msg"><strong>${a.entityName || 'Employee'}</strong> was ${a.action}</div>
            <div class="notif-meta">${a.details || ''} · ${this.timeSince(a.createdAt)}</div>
          </div>
        </div>`).join('');
    } catch(e) {
      const list = document.getElementById('notifList');
      if (list) list.innerHTML = '<div class="notif-empty">Could not load</div>';
    }
  }
};

/* ── Command Palette ───────────────────────────────────────────── */
const CommandPalette = {
  overlay:   null,
  input:     null,
  results:   null,
  activeIdx: -1,
  employees: [],

  get commands() {
    const base = [
      { label: 'Go to Dashboard',  icon: '🏠', hint: 'Navigate', action: () => { window.location.href = 'dashboard.html'; } },
      { label: 'Go to Employees',  icon: '👥', hint: 'Navigate', action: () => { window.location.href = 'employees.html'; } },
      { label: 'Go to Analytics',  icon: '📊', hint: 'Navigate', action: () => { window.location.href = 'analytics.html'; } },
      { label: 'Go to News',       icon: '📰', hint: 'Navigate', action: () => { window.location.href = 'news.html'; } },
      { label: 'Go to Settings',   icon: '⚙️', hint: 'Navigate', action: () => { window.location.href = 'settings.html'; } },
      { label: 'Add New Employee', icon: '➕', hint: 'Action',   action: () => { window.location.href = 'employees.html'; sessionStorage.setItem('nx_openAdd','1'); } },
      { label: 'Export CSV',       icon: '📁', hint: 'Action',   action: () => { window.location.href = 'employees.html'; sessionStorage.setItem('nx_exportCSV','1'); } },
      { label: 'Logout',           icon: '🔒', hint: 'Auth',     action: () => { if (typeof Auth !== 'undefined') Auth.clear(); window.location.href = 'index.html'; } },
      { label: 'Refresh Page',     icon: '🔄', hint: 'Action',   action: () => { window.location.reload(); } },
    ];
    const empCmds = this.employees.slice(0, 5).map(e => ({
      label: 'Edit: ' + e.name,
      icon:  '✏️',
      hint:  e.department,
      action: () => {
        window.location.href = 'employees.html';
        sessionStorage.setItem('nx_editEmp', e._id);
      }
    }));
    return [...base, ...empCmds];
  },

  init() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'cmd-overlay hidden';
    this.overlay.innerHTML = `
      <div class="cmd-box" role="dialog" aria-label="Command Palette">
        <div class="cmd-search-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cmd-search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" id="cmdInput" placeholder="Type a command or search…" autocomplete="off" spellcheck="false" />
          <kbd class="cmd-esc-key">ESC</kbd>
        </div>
        <div class="cmd-results" id="cmdResults"></div>
        <div class="cmd-footer-bar">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> run</span>
          <span><kbd>Ctrl K</kbd> toggle</span>
        </div>
      </div>`;
    document.body.appendChild(this.overlay);

    this.input   = document.getElementById('cmdInput');
    this.results = document.getElementById('cmdResults');

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); this.isOpen() ? this.close() : this.open(); }
      if (!this.isOpen()) return;
      const items = this.results.querySelectorAll('.cmd-item');
      if (e.key === 'ArrowDown') { e.preventDefault(); this.setActive(this.activeIdx + 1, items); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); this.setActive(this.activeIdx - 1, items); }
      if (e.key === 'Enter')     { e.preventDefault(); if (items[this.activeIdx]) items[this.activeIdx].click(); }
      if (e.key === 'Escape')    this.close();
    });

    this.overlay.addEventListener('click', e => { if (e.target === this.overlay) this.close(); });
    this.input.addEventListener('input', () => this.render());

    // Load employees for search
    if (typeof API !== 'undefined') {
      API.getEmployees({}).then(res => { this.employees = res.data || []; }).catch(() => {});
    }

    this.render();
  },

  isOpen()  { return !this.overlay.classList.contains('hidden'); },
  open()    {
    this.overlay.classList.remove('hidden');
    this.input.value = '';
    this.activeIdx = 0;
    this.render();
    requestAnimationFrame(() => this.input.focus());
  },
  close()   { this.overlay.classList.add('hidden'); },

  setActive(idx, items) {
    items.forEach(i => i.classList.remove('active'));
    this.activeIdx = Math.max(0, Math.min(idx, items.length - 1));
    if (items[this.activeIdx]) {
      items[this.activeIdx].classList.add('active');
      items[this.activeIdx].scrollIntoView({ block: 'nearest' });
    }
  },

  render() {
    const q        = (this.input ? this.input.value : '').toLowerCase().trim();
    const filtered = q
      ? this.commands.filter(c => c.label.toLowerCase().includes(q) || (c.hint || '').toLowerCase().includes(q))
      : this.commands;

    this.activeIdx = filtered.length ? 0 : -1;

    if (!filtered.length) {
      this.results.innerHTML = `<div class="cmd-empty">No results for "<em>${q}</em>"</div>`;
      return;
    }

    this.results.innerHTML = filtered.map((c, i) => `
      <div class="cmd-item${i === 0 ? ' active' : ''}" data-idx="${i}">
        <span class="cmd-item-icon">${c.icon}</span>
        <span class="cmd-item-label">${this.highlight(c.label, q)}</span>
        <span class="cmd-item-hint">${c.hint || ''}</span>
        <span class="cmd-item-arrow">↵</span>
      </div>`).join('');

    this.results.querySelectorAll('.cmd-item').forEach((el, i) => {
      el.addEventListener('click', () => { this.close(); filtered[i].action(); });
      el.addEventListener('mouseover', () => {
        this.results.querySelectorAll('.cmd-item').forEach(x => x.classList.remove('active'));
        el.classList.add('active');
        this.activeIdx = i;
      });
    });
  },

  highlight(text, q) {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return text.slice(0, idx) +
      '<mark class="cmd-highlight">' + text.slice(idx, idx + q.length) + '</mark>' +
      text.slice(idx + q.length);
  }
};

/* ── Shortcut Hint Button ──────────────────────────────────────── */
function initShortcutHint() {
  const topbarRight = document.querySelector('.topbar-right');
  if (!topbarRight) return;
  const btn = document.createElement('button');
  btn.className    = 'topbar-icon-btn cmd-trigger-btn';
  btn.title        = 'Command Palette  (Ctrl+K)';
  btn.dataset.tip  = 'Command Palette  Ctrl+K';
  btn.innerHTML    = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
  btn.addEventListener('click', () => CommandPalette.open());
  topbarRight.prepend(btn);
}

/* ── Auto-Refresh Countdown ───────────────────────────────────── */
function initAutoRefresh(seconds, onRefresh) {
  const wrap = document.createElement('div');
  wrap.className = 'refresh-badge';
  wrap.innerHTML = `
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
    <span id="nxRefreshCount">${seconds}</span>s`;
  const topbarLeft = document.querySelector('.topbar-left');
  if (topbarLeft) topbarLeft.appendChild(wrap);

  let count = seconds;
  setInterval(() => {
    count--;
    const el = document.getElementById('nxRefreshCount');
    if (el) el.textContent = count;
    if (count <= 0) {
      count = seconds;
      wrap.classList.add('refreshing');
      onRefresh().finally(() => { setTimeout(() => wrap.classList.remove('refreshing'), 600); });
    }
  }, 1000);
}

/* ── Sidebar Mobile Toggle ─────────────────────────────────────── */
function initMobileMenu() {
  const topbar = document.querySelector('.topbar-left');
  if (!topbar) return;
  const btn = document.createElement('button');
  btn.className = 'mobile-menu-btn topbar-icon-btn';
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  btn.addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    if (sb) sb.classList.toggle('open');
  });
  topbar.prepend(btn);
}

/* ── Ripple Effect ─────────────────────────────────────────────── */
function initRipple() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.btn-primary, .btn-danger, .btn-cancel, .pill, .nav-item, .view-btn');
    if (!btn) return;
    const r   = btn.getBoundingClientRect();
    const rip = document.createElement('span');
    rip.className = 'nx-ripple';
    rip.style.left   = (e.clientX - r.left) + 'px';
    rip.style.top    = (e.clientY - r.top)  + 'px';
    btn.style.position = 'relative';
    btn.style.overflow = 'hidden';
    btn.appendChild(rip);
    setTimeout(() => rip.remove(), 600);
  });
}

/* ── Page-Transition Fade ──────────────────────────────────────── */
function initPageTransitions() {
  document.querySelectorAll('a.nav-item').forEach(a => {
    a.addEventListener('click', e => {
      if (a.classList.contains('active')) return;
      e.preventDefault();
      const href = a.getAttribute('href');
      document.body.style.transition = 'opacity 0.25s ease';
      document.body.style.opacity = '0';
      setTimeout(() => { window.location.href = href; }, 250);
    });
  });
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.3s ease';
    document.body.style.opacity = '1';
  });
}

/* ── Init All ──────────────────────────────────────────────────── */
(function initInteractions() {
  LoadingBar.init();
  initClock();
  initTooltips();
  initRipple();
  initMobileMenu();
  initShortcutHint();
  CommandPalette.init();
  Notifications.init();
  initPageTransitions();

  // Defer scroll reveal until layout is stable
  setTimeout(initScrollReveal, 100);

  // Auto-open Add modal if requested from command palette
  if (sessionStorage.getItem('nx_openAdd') === '1') {
    sessionStorage.removeItem('nx_openAdd');
    setTimeout(() => {
      const btn = document.getElementById('btnAddEmployee');
      if (btn) btn.click();
    }, 600);
  }

  // Auto-trigger CSV export if requested
  if (sessionStorage.getItem('nx_exportCSV') === '1') {
    sessionStorage.removeItem('nx_exportCSV');
    setTimeout(() => {
      if (typeof exportCSV === 'function') exportCSV();
    }, 1000);
  }

  // Auto-open edit if requested
  const editId = sessionStorage.getItem('nx_editEmp');
  if (editId) {
    sessionStorage.removeItem('nx_editEmp');
    setTimeout(async () => {
      if (typeof API === 'undefined') return;
      try {
        const res = await API.getEmployees({});
        const emp = (res.data || []).find(e => e._id === editId);
        if (emp && typeof openEditModal === 'function') openEditModal(emp);
      } catch(e) {}
    }, 800);
  }
})();
