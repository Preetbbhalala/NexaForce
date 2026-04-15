/* ================================================================
   NexaForce v2 — news.js
   ================================================================ */
'use strict';

if (!Auth.guard()) throw new Error('Unauthenticated');

/* ── State ── */
const state = {
  category: 'business',
  articles: [],
  searchQuery: '',
};

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

/* ── Category gradients ── */
const CAT_GRADIENTS = {
  business:      'linear-gradient(135deg, #7c3aed, #4f1d96)',
  technology:    'linear-gradient(135deg, #06b6d4, #0e7490)',
  health:        'linear-gradient(135deg, #10b981, #065f46)',
  science:       'linear-gradient(135deg, #6366f1, #3730a3)',
  entertainment: 'linear-gradient(135deg, #ec4899, #9d174d)',
};

function catGrad(cat) {
  return CAT_GRADIENTS[cat] || CAT_GRADIENTS.business;
}

function timeSince(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)   return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400)return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

/* ── Skeleton ── */
function showSkeleton() {
  document.getElementById('newsSkeleton').style.display = 'grid';
  document.getElementById('newsGrid').style.display     = 'none';
}
function hideSkeleton() {
  document.getElementById('newsSkeleton').style.display = 'none';
  document.getElementById('newsGrid').style.display     = 'grid';
}

/* ── Render cards ── */
function renderCards(articles) {
  const grid  = document.getElementById('newsGrid');
  const empty = document.getElementById('newsEmpty');

  const filtered = state.searchQuery
    ? articles.filter(a =>
        (a.title       || '').toLowerCase().includes(state.searchQuery) ||
        (a.description || '').toLowerCase().includes(state.searchQuery)
      )
    : articles;

  if (!filtered.length) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  const grad = catGrad(state.category);

  grid.innerHTML = filtered.map(a => {
    const title  = a.title       || 'No title';
    const desc   = a.description || 'No description available.';
    const source = a.source?.name || 'Unknown Source';
    const url    = a.url || '#';
    const time   = timeSince(a.publishedAt);
    const short  = desc.length > 130 ? desc.slice(0, 130) + '…' : desc;

    return `
      <div class="news-card">
        <div class="news-card-header" style="background: ${grad};">
          <span class="news-source-badge">${source}</span>
          <span class="news-time">${time}</span>
        </div>
        <div class="news-card-body">
          <h3 class="news-title">${title}</h3>
          <p class="news-desc">${short}</p>
          <a class="news-link" href="${url}" target="_blank" rel="noopener noreferrer">
            Read More →
          </a>
        </div>
      </div>`;
  }).join('');
}

/* ── Load news ── */
async function loadNews(category) {
  if (category) state.category = category;
  showSkeleton();

  try {
    const res = await API.getNews({ category: state.category });
    state.articles = res.articles || [];

    const badge = document.getElementById('mockBadge');
    if (res.isMock) {
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }

    const lastUp = document.getElementById('lastUpdated');
    if (lastUp) lastUp.textContent = 'Updated ' + new Date().toLocaleTimeString();

    hideSkeleton();
    renderCards(state.articles);
  } catch (err) {
    hideSkeleton();
    showToast('Could not load news: ' + err.message, 'error');
    state.articles = [];
    renderCards([]);
  }
}

/* ── Category tab clicks ── */
document.getElementById('catTabs').addEventListener('click', e => {
  const tab = e.target.closest('.cat-tab');
  if (!tab) return;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  loadNews(tab.dataset.cat);
});

/* ── Search ── */
let _searchTimer;
document.getElementById('newsSearch').addEventListener('input', e => {
  state.searchQuery = e.target.value.trim().toLowerCase();
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => renderCards(state.articles), 250);
});

/* ── Refresh ── */
document.getElementById('btnRefresh').addEventListener('click', () => {
  loadNews(state.category);
});

/* ── Init ── */
loadNews('business');
