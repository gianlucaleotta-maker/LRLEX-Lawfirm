/* ================================================================
   LR LEX — Main JS
   - Navigation toggle
   - Scroll reveal animations
   - News loader (JSON-based, API-ready)
   ================================================================ */

(() => {
  'use strict';

  /* --- Mobile nav toggle --- */
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.querySelector('.nav__menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('is-open');
      toggle.classList.toggle('is-active');
    });
  }

  /* --- Scroll reveal --- */
  // Expose observer so dynamically-added .reveal elements (e.g. news cards loaded
  // from JSON) can be registered post-load.
  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  }
  window.LRLEX = window.LRLEX || {};
  window.LRLEX.observeReveals = function (root) {
    if (!io) {
      (root || document).querySelectorAll('.reveal:not(.is-visible)').forEach(el => el.classList.add('is-visible'));
      return;
    }
    (root || document).querySelectorAll('.reveal:not(.is-visible)').forEach(el => io.observe(el));
  };

  // Safety fallback: any .reveal element still hidden 2.5s after load (long pages
  // that haven't been scrolled, screenshot tools, print-to-PDF, dynamically-added
  // content like news cards) gets revealed automatically.
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => el.classList.add('is-visible'));
  }, 2500);

  /* --- Smooth header background on scroll for hero pages --- */
  const header = document.querySelector('.site-header');
  const hero = document.querySelector('.hero, .page-hero');
  if (header && hero) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          header.classList.toggle('is-dark', entry.isIntersecting);
        });
      },
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(hero);
  }
})();

/* ================================================================
   News loader — drives the news section from data/news.json
   Easily replaceable with an API endpoint in the future:
       const NEWS_ENDPOINT = '/api/news';                  // future API
       const NEWS_ENDPOINT = 'data/news.json';             // current static
   ================================================================ */

window.LRLEX = window.LRLEX || {};
window.LRLEX.config = {
  // Single point of truth — change this when you switch to a real API
  newsEndpoint: 'data/news.json',
  // For the homepage we show featured + 2 latest. For news.html we show all.
  homepageLimit: 3
};

window.LRLEX.loadNews = async function (containerId, opts = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const { limit = null, featuredFirst = true } = opts;

  // Build URL — works both on root and /pages/ subpages
  const path = window.location.pathname;
  const inSubdir = path.includes('/pages/');
  const endpoint = (inSubdir ? '../' : '') + window.LRLEX.config.newsEndpoint;

  try {
    const res = await fetch(endpoint, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Fetch failed');
    let data = await res.json();

    // Sort newest first
    data.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Apply limit
    if (limit) data = data.slice(0, limit);

    // Render
    container.innerHTML = data.map((item, i) => renderNewsCard(item, i === 0 && featuredFirst)).join('');
    // Hook newly-added .reveal elements into the IntersectionObserver
    if (window.LRLEX.observeReveals) window.LRLEX.observeReveals(container);
  } catch (err) {
    console.warn('News loading failed, falling back to static markup', err);
    // Static fallback: keep whatever the HTML originally had
  }
};

function renderNewsCard(item, featured) {
  const dateStr = formatDate(item.date);
  const cls = featured ? 'news__card news__card--featured' : 'news__card';
  const url = item.url && item.url.length ? item.url : '#';
  return `
    <article class="${cls} reveal">
      <div class="news__card-meta">
        <span class="news__card-cat">${escapeHtml(item.category || 'News')}</span>
        <time class="news__card-date" datetime="${item.date}">${dateStr}</time>
      </div>
      <h3 class="news__card-title">${escapeHtml(item.title)}</h3>
      <p class="news__card-excerpt">${escapeHtml(item.excerpt)}</p>
      <a class="news__card-link" href="${url}"${item.external ? ' target="_blank" rel="noopener"' : ''}>Leggi <span aria-hidden="true"></span></a>
    </article>
  `;
}

function formatDate(iso) {
  const d = new Date(iso);
  const months = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
