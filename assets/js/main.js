/* ================================================================
   LR LEX — Main JS
   - Navigation toggle
   - Scroll reveal animations
   - News loader (JSON-based, API-ready)
   ================================================================ */

(() => {
  'use strict';

  // Safety: ensure Track Record pages always get the dedicated contrast styles,
  // even if an older cached HTML version misses the body class.
  const isTrackRecordPath = /track-record/i.test(window.location.pathname);
  if (isTrackRecordPath && document.body) {
    document.body.classList.add('track-record-page');
  }

  // Build email links client-side from data attributes (basic obfuscation).
  document.querySelectorAll('[data-mail-user][data-mail-domain]').forEach((link) => {
    const user = link.getAttribute('data-mail-user');
    const domain = link.getAttribute('data-mail-domain');
    if (!user || !domain) return;
    const subject = link.getAttribute('data-mail-subject') || '';
    const address = `${user}@${domain}`;
    const params = subject ? `?subject=${encodeURIComponent(subject)}` : '';
    link.setAttribute('href', `mailto:${address}${params}`);
    if (!link.getAttribute('aria-label')) {
      link.setAttribute('aria-label', `Invia email a ${address}`);
    }
  });

  // Generate vCard files on-the-fly (no server-side .vcf required).
  const VCARD_ORG = 'LR LEX - Studio Legale';
  const VCARD_TEL_WORK = '+39 02 8219 6887';
  const VCARD_ADDRESS = ';;Foro Buonaparte 51;Milano;MI;20121;Italy';
  const VCARD_URL = 'https://lrlex.it';
  /** Cellulari di riferimento (allineati agli asset statici in assets/vcards/). */
  const mobileTelByName = {
    'Gianluca Leotta': ['+39 3497853587'],
    'Debora Folisi': ['+39 3458490473', '+1 8134890911'],
    'Carla Talarico': ['+39 3315987822'],
    'Gaetano Bentivegna': ['+39 3931362807'],
    'Maria Francesca Tucci': ['+39 3428907772'],
    'Shqipe Mahmuti': ['+39 3801397140'],
    'Francesco Cordova': ['+39 3896817825'],
    'Rocco Pierri': ['+39 3476754600'],
    'Giulia Savorelli': ['+39 3420355817']
  };
  const titleByName = {
    'Gianluca Leotta': 'Founder / Managing Partner',
    'Debora Folisi': 'Partner',
    'Carla Talarico': 'Partner',
    'Gaetano Bentivegna': 'Partner',
    'Maria Francesca Tucci': 'Associate',
    'Shqipe Mahmuti': 'Associate',
    'Francesco Cordova': 'Of Counsel',
    'Rocco Pierri': 'Of Counsel',
    'Giulia Savorelli': 'Office Manager'
  };

  function getNameFromLabel(label = '') {
    const trimmed = label.trim();
    return trimmed
      .replace(/^Download vCard\s+/i, '')
      .replace(/^Scarica vCard\s+/i, '')
      .replace(/^Send email to\s+/i, '')
      .replace(/^Invia email a\s+/i, '')
      .trim();
  }

  function slugifyName(name = '') {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'contatto-lrlex';
  }

  function escapeVCard(value = '') {
    return String(value)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  function mobilesForPerson(fullName) {
    const key = String(fullName).replace(/\s+/g, ' ').trim();
    return mobileTelByName[key] || [];
  }

  function buildVCard({ fullName, title, email }) {
    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escapeVCard(fullName)}`,
      `ORG:${escapeVCard(VCARD_ORG)}`,
      `TITLE:${escapeVCard(title)}`,
      `EMAIL;TYPE=INTERNET,WORK:${escapeVCard(email)}`,
      `TEL;TYPE=WORK,VOICE:${escapeVCard(VCARD_TEL_WORK)}`
    ];
    mobilesForPerson(fullName).forEach((tel) => {
      lines.push(`TEL;TYPE=CELL,VOICE:${escapeVCard(tel)}`);
    });
    lines.push(
      `ADR;TYPE=WORK,PREF:${escapeVCard(VCARD_ADDRESS)}`,
      `URL:${escapeVCard(VCARD_URL)}`,
      'END:VCARD'
    );
    return lines.join('\n');
  }

  function inferEmailForVCard(link) {
    const container = link.closest('.person__actions, .contact-info__links, .contact-info, .team-card, .founder__body');
    const emailLink = container ? container.querySelector('[data-mail-user][data-mail-domain]') : null;
    if (!emailLink) return '';
    const user = emailLink.getAttribute('data-mail-user') || '';
    const domain = emailLink.getAttribute('data-mail-domain') || '';
    return user && domain ? `${user}@${domain}` : '';
  }

  function inferNameForVCard(link) {
    const ariaLabel = link.getAttribute('aria-label') || '';
    const nameFromLabel = getNameFromLabel(ariaLabel);
    if (nameFromLabel) return nameFromLabel;
    const personName = link.closest('.person, .founder__body, .page-hero__inner')?.querySelector('.person__name, .founder__name, .page-hero__title');
    if (!personName) return '';
    return personName.textContent.replace(/\s+/g, ' ').replace('Track Record di', '').replace('Track Record of', '').trim();
  }

  function inferTitleForVCard(link, fullName) {
    const role = link.closest('.person, .founder__body')?.querySelector('.person__role');
    if (role && role.textContent.trim()) return role.textContent.trim();
    return titleByName[fullName] || 'Professionista';
  }

  document.querySelectorAll('a[download][href*="assets/vcards/"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const fullName = inferNameForVCard(link);
      const email = inferEmailForVCard(link);
      if (!fullName || !email) return;
      event.preventDefault();
      const title = inferTitleForVCard(link, fullName);
      const vcard = buildVCard({ fullName, title, email });
      const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${slugifyName(fullName)}.vcf`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      URL.revokeObjectURL(url);
    });
  });

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
  const hasBeigeHeader = document.body.classList.contains('theme-beige-header');
  if (header && hero && !hasBeigeHeader) {
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
  // Path from site root (works on /, /en/, /pages/…, /en/pages/… without double ../ bugs)
  newsEndpoint: '/data/news.json',
  pressEndpoint: '/data/press.json',
  // For the homepage we show featured + 2 latest. For news.html we show all.
  homepageLimit: 3
};

function resolveNewsEndpoint() {
  const configEp = (window.LRLEX.config && window.LRLEX.config.newsEndpoint) || '/data/news.json';
  if (configEp.startsWith('http') || configEp.startsWith('/')) return configEp;
  if (configEp.indexOf('..') !== -1) return configEp;
  const inSubdir = window.location.pathname.includes('/pages/');
  return (inSubdir ? '../' : '') + configEp;
}

/*
  CONTESTO / editorial stack — prime voci in evidenza:
  assistenza soci Sòphia High Tech vs Genenta (Nasdaq GNTA → Saentra Forge), Golden Power,
  Aerospace & Defense; accordo Audiencerate / Microsoft / Postel (PMI, dati & AI); Dipres / Aldo Martelli (M&A).
  Ordine fisso in lista News completa e (opzionale) griglia home: Genenta → Postel → Dipres (poi il resto per data).
*/
const NEWS_EDITORIAL_DEALS_ORDER = [
  'genenta-sophia-high-tech-golden-power',
  'audiencerate-microsoft-postel-sme-platform',
  'dipres-aldo-martelli-ramo-azienda',
  'dipres-aldo-martelli-business-unit-acquisition',
];

function applyEditorialNewsOrder(items) {
  const pinnedSet = new Set(NEWS_EDITORIAL_DEALS_ORDER);
  const byId = new Map(items.map((x) => [x.id, x]));
  const pinned = NEWS_EDITORIAL_DEALS_ORDER.map((id) => byId.get(id)).filter(Boolean);
  const rest = items.filter((x) => !pinnedSet.has(x.id));
  rest.sort((a, b) => new Date(b.date) - new Date(a.date));
  return [...pinned, ...rest];
}

window.LRLEX.loadNews = async function (containerId, opts = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const { limit = null, featuredFirst = true, editorialDealOrder = false } = opts;
  const endpoint = resolveNewsEndpoint();
  const isEn = document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('en');

  try {
    const res = await fetch(endpoint, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Fetch failed');
    let data = await res.json();
    if (!data || !data.length) throw new Error('No items');

    if (limit) {
      if (editorialDealOrder) {
        data = applyEditorialNewsOrder(data).slice(0, limit);
      } else {
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        data = data.slice(0, limit);
      }
    } else {
      data = applyEditorialNewsOrder(data);
    }

    container.innerHTML = data
      .map((item, i) => renderNewsCard(item, i === 0 && featuredFirst))
      .join('');
    if (window.LRLEX.observeReveals) window.LRLEX.observeReveals(container);
  } catch (err) {
    console.warn('News loading failed', err);
    container.innerHTML = isEn
      ? '<p class="news__error" role="alert" style="color: var(--gray-700); max-width: 36rem; line-height:1.6;">We could not load the news list. If you are viewing this file offline, open the site on <strong>lrlex.it</strong> or <a class="subtle-link" href="/data/news-en.json">/data/news-en.json</a>.</p>'
      : '<p class="news__error" role="alert" style="color: var(--gray-700); max-width: 36rem; line-height:1.6;">Non è stato possibile caricare l&rsquo;elenco. Se stai aprendo la pagina in <em>file</em> locale, visita <strong>lrlex.it</strong> oppure verifica <a class="subtle-link" href="/data/news.json">/data/news.json</a>.</p>';
  }
};

function renderNewsCard(item, featured) {
  const isEnglish = document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('en');
  const dateStr = formatDate(item.date);
  const cls = featured ? 'news__card news__card--featured' : 'news__card';
  const url = item.url && item.url.length ? item.url : '#';
  const readLabel = isEnglish ? 'Read' : 'Leggi';
  return `
    <article class="${cls} reveal">
      <div class="news__card-meta">
        <span class="news__card-cat">${escapeHtml(item.category || 'News')}</span>
        <time class="news__card-date" datetime="${item.date}">${dateStr}</time>
      </div>
      <h3 class="news__card-title">${escapeHtml(item.title)}</h3>
      <p class="news__card-excerpt">${item.excerptHtml ? item.excerptHtml : escapeHtml(item.excerpt)}</p>
      <a class="news__card-link" href="${url}"${item.external ? ' target="_blank" rel="noopener"' : ''}>${readLabel} <span aria-hidden="true"></span></a>
    </article>
  `;
}

function formatDate(iso) {
  const d = new Date(iso);
  const isEnglish = document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('en');
  const months = isEnglish
    ? ['January','February','March','April','May','June','July','August','September','October','November','December']
    : ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
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

/* ================================================================
   Press loader — drives rassegna stampa from data/press.json
   ================================================================ */

function resolvePressEndpoint() {
  const configEp = (window.LRLEX.config && window.LRLEX.config.pressEndpoint) || '/data/press.json';
  if (configEp.startsWith('http') || configEp.startsWith('/')) return configEp;
  if (configEp.indexOf('..') !== -1) return configEp;
  const inSubdir = window.location.pathname.includes('/pages/');
  return (inSubdir ? '../' : '') + configEp;
}

window.LRLEX.loadPress = async function (containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const endpoint = resolvePressEndpoint();
  const isEn = document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('en');
  try {
    const res = await fetch(endpoint, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Fetch failed');
    let data = await res.json();
    if (!data || !data.length) throw new Error('No items');
    // Cronologico crescente: dal più vecchio al più recente
    data.sort((a, b) => new Date(a.date) - new Date(b.date));
    container.innerHTML = data.map((item) => renderPressCard(item)).join('');
    if (window.LRLEX.observeReveals) window.LRLEX.observeReveals(container);
    // Inizializza il lightbox sulle card appena renderizzate
    initPressLightbox(container);
  } catch (err) {
    console.warn('Press loading failed', err);
    container.innerHTML = isEn
      ? '<p class="press__error">We could not load the press archive. Please try again later.</p>'
      : '<p class="press__error">Non è stato possibile caricare la rassegna stampa. Riprova più tardi.</p>';
  }
};

function renderPressCard(item) {
  const isEnglish = document.documentElement.lang && document.documentElement.lang.toLowerCase().startsWith('en');
  const dateStr = formatDate(item.date);
  const hasExternalUrl = item.url && item.url !== '#' && item.external;
  const hasImage = item.image && item.image.length;
  const readLabel = hasExternalUrl
    ? (isEnglish ? 'Read the original article' : 'Leggi articolo originale')
    : (isEnglish ? 'View the clipping' : 'Vedi il ritaglio');
  const downloadLabel = isEnglish ? 'Download original' : 'Scarica originale';

  // Trigger del lightbox: solo se c'è immagine
  // Card thumbnail = item.image (placeholder); lightbox = item.clipping se c'è, altrimenti item.image
  const lightboxImg = item.clipping && item.clipping.length ? item.clipping : item.image;
  const lightboxAttrs = hasImage
    ? ` data-lightbox-src="${escapeHtml(lightboxImg)}" data-lightbox-caption="${escapeHtml(item.publication + ' — ' + item.title)}"`
    : '';
  // Anteprima immagine (cliccabile per lightbox)
  const imageBlock = hasImage
    ? `<button type="button" class="press__card-image-link" aria-label="${escapeHtml(item.imageAlt || item.title)}"${lightboxAttrs}>
        <img class="press__card-image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt || item.title)}" loading="lazy" decoding="async">
      </button>`
    : '';

  // Tag (opzionale)
  const tagBlock = item.tag
    ? `<span class="press__card-tag">${escapeHtml(item.tag)}</span>`
    : '';

  // Link "Leggi": va all'URL esterno se c'è, altrimenti apre il lightbox
  const readLink = hasExternalUrl
    ? `<a class="press__card-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${readLabel} <span aria-hidden="true">→</span></a>`
    : (hasImage
        ? `<button type="button" class="press__card-link press__card-link--btn"${lightboxAttrs}>${readLabel} <span aria-hidden="true">→</span></button>`
        : '');

  // Link "Scarica originale": appare solo per articoli storici (non esterni) con immagine
  const downloadLink = (!hasExternalUrl && hasImage)
 ? `<a class="press__card-download" href="${escapeHtml(lightboxImg)}" target="_blank" rel="noopener">${downloadLabel} <span aria-hidden="true">↓</span></a>`
     : '';

  return `
    <article class="press__card reveal">
      ${imageBlock}
      <div class="press__card-body">
        <div class="press__card-meta">
          <span class="press__card-pub">${escapeHtml(item.publication || 'Press')}</span>
          <time class="press__card-date" datetime="${escapeHtml(item.date)}">${dateStr}</time>
        </div>
        <h3 class="press__card-title">${escapeHtml(item.title)}</h3>
        ${tagBlock}
        <div class="press__card-actions">
          ${readLink}
          ${downloadLink}
        </div>
      </div>
    </article>
  `;
}

function initPressLightbox(container) {
  // Crea il lightbox una volta sola (se non già presente)
  let lightbox = document.getElementById('press-lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'press-lightbox';
    lightbox.className = 'press-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = `
      <button type="button" class="press-lightbox__close" aria-label="Chiudi">×</button>
      <div class="press-lightbox__inner">
        <img class="press-lightbox__img" alt="">
        <p class="press-lightbox__caption"></p>
      </div>
    `;
    document.body.appendChild(lightbox);

    // Chiusura: clic su sfondo, clic su X, tasto ESC
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('press-lightbox__close')) {
        closePressLightbox();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('is-open')) {
        closePressLightbox();
      }
    });
  }

  // Aggancia i listener alle card del container
  const triggers = container.querySelectorAll('[data-lightbox-src]');
  triggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const src = trigger.getAttribute('data-lightbox-src');
      const caption = trigger.getAttribute('data-lightbox-caption') || '';
      openPressLightbox(src, caption);
    });
  });
}

function openPressLightbox(src, caption) {
  const lightbox = document.getElementById('press-lightbox');
  if (!lightbox) return;
  const img = lightbox.querySelector('.press-lightbox__img');
  const cap = lightbox.querySelector('.press-lightbox__caption');
  img.src = src;
  img.alt = caption;
  cap.textContent = caption;
  lightbox.classList.add('is-open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closePressLightbox() {
  const lightbox = document.getElementById('press-lightbox');
  if (!lightbox) return;
  lightbox.classList.remove('is-open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  // Pulisce l'immagine per evitare flash al prossimo apri
  setTimeout(() => {
    const img = lightbox.querySelector('.press-lightbox__img');
    if (img && !lightbox.classList.contains('is-open')) img.src = '';
  }, 300);
}
