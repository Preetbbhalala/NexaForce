/* ================================================================
   NexaForce v2 — settings.js
   ================================================================ */
'use strict';

if (!Auth.guard()) throw new Error('Unauthenticated');

/* ── Toast ── */
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

/* ── Sidebar ── */
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

/* ── Tab switching ── */
document.querySelectorAll('.settings-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById('panel-' + tab.dataset.tab);
    if (panel) panel.classList.add('active');
    if (tab.dataset.tab === 'audit') loadAuditLog();
  });
});

/* ── Format dates ── */
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/* ── Load profile ── */
async function loadProfile() {
  try {
    const res  = await API.getMe();
    const user = res.user;

    const name = user.name || 'Admin';
    document.getElementById('profileAvatar').textContent    = name.charAt(0).toUpperCase();
    document.getElementById('profileName').textContent      = name;
    document.getElementById('profileEmail').textContent     = user.email || '';
    document.getElementById('profileLastLogin').textContent = 'Last login: ' + fmtDate(user.lastLogin);
    document.getElementById('profileNameInput').value       = name;
    document.getElementById('profileEmailInput').value      = user.email || '';
    document.getElementById('profileRoleBadge').textContent = user.role || 'admin';
    document.getElementById('accountCreated').textContent   = fmtDate(user.createdAt);
    document.getElementById('accountLastLogin').textContent = fmtDate(user.lastLogin);

    // Keep localStorage in sync
    Auth.setUser({ ...Auth.getUser(), name: user.name, role: user.role });
  } catch (err) {
    showToast('Failed to load profile: ' + err.message, 'error');
  }
}

/* ── Profile form ── */
document.getElementById('profileForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('profileNameInput').value.trim();
  if (!name) { showToast('Name cannot be empty', 'error'); return; }

  // Update local display (name is stored in JWT; no dedicated update endpoint yet)
  const stored = Auth.getUser() || {};
  Auth.setUser({ ...stored, name });
  document.getElementById('profileAvatar').textContent     = name.charAt(0).toUpperCase();
  document.getElementById('profileName').textContent       = name;
  document.getElementById('sidebarAvatar').textContent     = name.charAt(0).toUpperCase();
  document.getElementById('sidebarName').textContent       = name;
  showToast('Profile updated', 'success');
});

/* ── Password strength ── */
document.getElementById('newPw').addEventListener('input', function () {
  const val   = this.value;
  const fill  = document.getElementById('strengthFill');
  const label = document.getElementById('strengthLabel');
  let score = 0;
  if (val.length >= 6)                    score++;
  if (val.length >= 10)                   score++;
  if (/[A-Z]/.test(val))                  score++;
  if (/[0-9]/.test(val))                  score++;
  if (/[^A-Za-z0-9]/.test(val))           score++;

  const levels = [
    { w: '0%',   color: 'var(--red)',    text: 'Enter a new password'  },
    { w: '20%',  color: 'var(--red)',    text: 'Too weak'              },
    { w: '40%',  color: 'var(--amber)',  text: 'Weak'                  },
    { w: '60%',  color: 'var(--amber)',  text: 'Fair'                  },
    { w: '80%',  color: 'var(--green)',  text: 'Strong'                },
    { w: '100%', color: 'var(--cyan)',   text: 'Very strong'           },
  ];
  const lvl = levels[Math.min(score, 5)];
  fill.style.width      = val.length ? lvl.w : '0%';
  fill.style.background = lvl.color;
  label.textContent     = val.length ? lvl.text : 'Enter a new password';
  label.style.color     = val.length ? lvl.color : 'var(--text-muted)';
});

/* ── Password form ── */
document.getElementById('passwordForm').addEventListener('submit', async e => {
  e.preventDefault();
  const currentPw = document.getElementById('currentPw').value;
  const newPw     = document.getElementById('newPw').value;
  const confirmPw = document.getElementById('confirmPw').value;

  if (!currentPw || !newPw || !confirmPw) {
    showToast('All fields are required', 'error'); return;
  }
  if (newPw.length < 6) {
    showToast('New password must be at least 6 characters', 'error'); return;
  }
  if (newPw !== confirmPw) {
    showToast('Passwords do not match', 'error'); return;
  }

  const btn  = document.getElementById('btnChangePw');
  const text = document.getElementById('btnChangePwText');
  btn.disabled = true;
  text.textContent = 'Updating…';

  try {
    const res = await API.changePassword({ currentPassword: currentPw, newPassword: newPw });
    Auth.setToken(res.token);
    showToast('Password changed successfully', 'success');
    document.getElementById('passwordForm').reset();
    document.getElementById('strengthFill').style.width = '0%';
    document.getElementById('strengthLabel').textContent = 'Enter a new password';
  } catch (err) {
    showToast(err.message || 'Failed to change password', 'error');
  } finally {
    btn.disabled = false;
    text.textContent = 'Update Password';
  }
});

/* ── Audit log ── */
const ACTION_STYLES = {
  hired:      { label: 'Hired',      bg: 'rgba(16,185,129,0.2)',  color: '#34d399' },
  updated:    { label: 'Updated',    bg: 'rgba(99,102,241,0.2)',  color: '#a5b4fc' },
  terminated: { label: 'Terminated', bg: 'rgba(239,68,68,0.2)',   color: '#fca5a5' },
};

let auditLoaded = false;

async function loadAuditLog() {
  if (auditLoaded) return;
  const tbody = document.getElementById('auditTbody');

  try {
    const res  = await API.getAnalytics();
    const acts = res.data.recentActivity || [];
    auditLoaded = true;

    if (!acts.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px;">No activity yet</td></tr>';
      return;
    }

    tbody.innerHTML = acts.map(a => {
      const style = ACTION_STYLES[a.action] || ACTION_STYLES.updated;
      return `<tr>
        <td>
          <span style="padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:600;
            background:${style.bg};color:${style.color};">
            ${style.label}
          </span>
        </td>
        <td style="font-weight:500;">${a.entityName || '—'}</td>
        <td style="color:var(--text-secondary);">${a.userName || '—'}</td>
        <td style="color:var(--text-muted);font-size:12.5px;">${a.details || '—'}</td>
        <td style="color:var(--text-muted);font-size:12px;white-space:nowrap;">
          ${new Date(a.createdAt).toLocaleDateString('en-CA', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:32px;">${err.message}</td></tr>`;
  }
}

/* ── Init ── */
loadProfile();
