import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import MarkdownIt from 'markdown-it';
import { loadInsights, ROOT, isIso, isDraft } from './lib/content.mjs';
import { buildArticleSchema, buildFaqSchema } from './lib/schema.mjs';
import { PRACTICES, PRACTICE_LABELS, PRACTICE_URL } from './lib/practices.mjs';

const ORIGIN = 'https://lrlex.it';
const PROD = process.env.VERCEL_ENV === 'production' || process.env.CONTENT_ENV === 'production';
const OUT = resolve(ROOT, 'insights');
const md = new MarkdownIt({ html: true, linkify: true, typographer: true });

// Header per i file prodotti dal generatore (CLAUDE.md: ogni file generato lo porta).
const GEN = '<!-- GENERATED FILE — non modificare a mano. Sorgente: content/. Rigenera: npm run build -->';
const withGen = (html) => html.replace('<!DOCTYPE html>', `<!DOCTYPE html>\n${GEN}`);

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonld = (o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`;
const wordCount = (t) => (t.replace(/<[^>]+>/g, ' ').replace(/[#*_>`\-\[\]()!]/g, ' ').match(/\S+/g) || []).length;

function head({ title, description, canonical, alternate, lang = 'it', noindex = false, extra = '' }) {
  const hreflang = alternate
    ? `\n  <link rel="alternate" hreflang="${lang}" href="${canonical}">\n  <link rel="alternate" hreflang="${lang === 'it' ? 'en' : 'it'}" href="${ORIGIN}${alternate}">\n  <link rel="alternate" hreflang="x-default" href="${canonical}">`
    : '';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">${noindex ? '\n  <meta name="robots" content="noindex, nofollow">' : ''}
  <link rel="canonical" href="${canonical}">${hreflang}
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonical}">
  <link rel="icon" type="image/png" href="/assets/img/favicon.png">
  <link rel="stylesheet" href="/assets/css/styles.css">${extra}
</head>
<body class="theme-beige-header">
  <header class="site-header">
    <nav class="nav" aria-label="Main">
      <a href="/" class="logo logo--icon" aria-label="LR LEX home"><img src="/assets/img/lrlex-logo-icon-beige.png" alt="LR LEX" class="logo__img logo__img--icon"></a>
      <ul class="nav__menu">
        <li><a href="/" class="nav__link">Studio</a></li>
        <li><a href="/pages/aree-di-pratica.html" class="nav__link">Aree di Pratica</a></li>
        <li><a href="/pages/team.html" class="nav__link">Professionisti</a></li>
        <li><a href="/pages/news.html" class="nav__link">News &amp; Insights</a></li>
        <li><a href="/pages/contatti.html" class="nav__link">Contatti</a></li>
        <li><a href="/en/" class="nav__link">EN</a></li>
      </ul>
      <a href="/pages/contatti.html" class="nav__cta">Contatti &rarr;</a>
    </nav>
  </header>`;
}
const footer = `
  <footer class="site-footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__col">
          <p class="footer__brand"><img src="/assets/img/lrlex-logo-horizontal-dark.png" alt="LR LEX" class="footer__brand-logo footer__brand-logo--dark"></p>
          <p class="footer__tagline">LR LEX — Studio Legale d'Affari dedicato alle imprese e agli investitori.</p>
        </div>
        <div class="footer__col">
          <p class="footer__heading">Sede</p>
          <ul class="footer__list">
            <li>Foro Buonaparte, 51</li>
            <li>20121 Milano · Italia</li>
            <li><span class="label">Tel</span><a href="tel:+390282196887">+39 02 8219 6887</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <p class="footer__heading">Contatti</p>
          <ul class="footer__list">
            <li><a href="mailto:info@lrlex.it">info@lrlex.it</a></li>
            <li><span class="label">PEC</span><a href="mailto:legaliriunitilex@pec.it">legaliriunitilex@pec.it</a></li>
          </ul>
        </div>
        <div class="footer__col">
          <p class="footer__heading">Naviga</p>
          <ul class="footer__list">
            <li><a href="/pages/aree-di-pratica.html">Aree di Pratica</a></li>
            <li><a href="/pages/team.html">Professionisti</a></li>
            <li><a href="/pages/news.html">News &amp; Insights</a></li>
            <li><a href="/pages/contatti.html">Contatti</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© 2026 LR LEX — Avvocati Associati. P.IVA 11580530969</span>
      </div>
    </div>
  </footer>
</body>
</html>`;

// FaqBlock: HTML visibile e FAQPage schema dalla STESSA sorgente (d.faq).
function faqBlock(d) {
  const items = d.faq
    .map((f) => `    <details class="faq__item"><summary>${esc(f.q)}</summary><div>${esc(f.a)}</div></details>`)
    .join('\n');
  return `  <section class="faq" aria-label="Domande frequenti">\n    <h2>Domande frequenti</h2>\n${items}\n  </section>\n  ${jsonld(buildFaqSchema(d))}`;
}

function renderArticle(post) {
  const { data: d, body, author, draft } = post;
  const bodyHtml = md.render(body);
  const canonical = `${ORIGIN}/insights/${d.slug}`;
  const noindex = draft; // le bozze non vanno indicizzate
  const dateLine = `<p class="article__dates">Pubblicato: <time datetime="${esc(d.published)}">${esc(d.published)}</time> · Aggiornato: <time datetime="${esc(d.updated)}">${esc(d.updated)}</time>${d.reading_time ? ` · ${d.reading_time} min` : ''}</p>`;
  const authorLine = author ? `<p class="article__author">di <a href="${author.url}">${esc(author.name)}</a></p>` : '';
  const draftBanner = draft ? `<div class="draft-banner" style="background:#8E6F3E;color:#fff;padding:.6rem 1rem;font-weight:600">BOZZA — non pubblicata · revisione partner richiesta</div>` : '';
  const practices = d.related_practices
    .map((p) => `<a href="/insights/argomenti/${p}">${esc(PRACTICE_LABELS[p] || p)}</a>`)
    .join(' · ');
  return (
    head({
      title: d.title,
      description: d.description,
      canonical,
      alternate: d.alternate,
      lang: d.lang,
      noindex,
      extra: `\n  ${jsonld(buildArticleSchema(d, author))}`,
    }) +
    `\n  ${draftBanner}\n  <main class="article container">\n    <article>\n      <p class="article__practices">${practices}</p>\n      <h1>${esc(d.h1)}</h1>\n      ${authorLine}\n      ${dateLine}\n      <div class="article__body">${bodyHtml}</div>\n      ${faqBlock(d)}\n    </article>\n  </main>` +
    footer
  );
}

function card(post) {
  const d = post.data;
  const badge = post.draft ? ' <span class="badge">BOZZA</span>' : '';
  return `    <li class="insight-card"><a href="/insights/${d.slug}"><h3>${esc(d.title)}${badge}</h3><p>${esc(d.description)}</p><small>${esc(d.published)}</small></a></li>`;
}

function renderIndex(posts) {
  const list = posts.length
    ? `<div class="news__grid">\n${posts.map(card).join('\n')}\n      </div>`
    : '<p>Presto nuovi contenuti.</p>';
  return (
    head({
      title: 'Insights — LR LEX',
      description: 'Analisi e guide operative su M&A, private equity, venture capital, Golden Power e crisi d’impresa, a firma dei professionisti di LR LEX.',
      canonical: `${ORIGIN}/insights`,
      noindex: true,
    }) +
    `\n  <main>\n    <section class="section"><div class="container">\n      <h1>Insights</h1>\n      ${list}\n    </div></section>\n  </main>` +
    footer
  );
}

function renderArgomento(practice, posts) {
  const introFile = resolve(ROOT, `content/argomenti/${practice.slug}.md`);
  if (!existsSync(introFile)) {
    console.log(`  · argomento "${practice.slug}" SALTATO: manca content/argomenti/${practice.slug}.md (introduzione obbligatoria)`);
    return null;
  }
  const intro = readFileSync(introFile, 'utf8').trim();
  if (wordCount(intro) < 150) {
    throw new Error(`argomento "${practice.slug}": introduzione < 150 parole (${wordCount(intro)}). Vietata pagina thin.`);
  }
  const list = posts.length ? `<ul class="insight-list">\n${posts.map(card).join('\n')}\n  </ul>` : '<p>Presto nuovi contenuti su questo tema.</p>';
  return (
    head({
      title: `${practice.label} — Insights LR LEX`,
      description: `Approfondimenti di LR LEX in materia di ${practice.label.toLowerCase()}.`,
      canonical: `${ORIGIN}/insights/argomenti/${practice.slug}`,
    }) +
    `\n  <main class="insights container">\n    <p><a href="/insights">← Insights</a></p>\n    <h1>${esc(practice.label)}</h1>\n    <div class="argomento__intro">${md.render(intro)}</div>\n    ${list}\n  </main>` +
    footer
  );
}

// ---- sitemap: merge in place, sostituendo le sole URL /insights/ ----------
function updateSitemap(urls) {
  const file = resolve(ROOT, 'sitemap.xml');
  const NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
  const existing = existsSync(file)
    ? [...readFileSync(file, 'utf8').matchAll(/<url>[\s\S]*?<\/url>/g)].map((m) => m[0]).filter((b) => !/\/insights/.test(b))
    : [];
  const added = urls.map(
    (u) => `<url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`
  );
  const body = [...existing, ...added].join('\n  ');
  writeFileSync(file, `<?xml version="1.0" encoding="UTF-8"?>\n<!-- GENERATED FILE — non modificare a mano. Rigenera: npm run build -->\n<urlset xmlns="${NS}">\n  ${body}\n</urlset>\n`);
}

// ---- run ------------------------------------------------------------------
console.log(`Build insights (${PROD ? 'PRODUCTION' : 'preview'})`);
const posts = loadInsights({ production: PROD }).sort((a, b) => String(b.data.published).localeCompare(String(a.data.published)));
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, 'argomenti'), { recursive: true });

writeFileSync(join(OUT, 'index.html'), withGen(renderIndex(posts)));
console.log(`  · /insights (${posts.length} articoli)`);

const sitemapUrls = []; // /insights e' noindex finche' vuota: fuori dalla sitemap
for (const post of posts) {
  writeFileSync(join(OUT, `${post.data.slug}.html`), withGen(renderArticle(post)));
  console.log(`  · /insights/${post.data.slug}${post.draft ? ' [BOZZA noindex]' : ''}`);
  if (!post.draft && isIso(post.data.updated)) sitemapUrls.push({ loc: `${ORIGIN}/insights/${post.data.slug}`, lastmod: post.data.updated });
}

for (const practice of PRACTICES) {
  const of = posts.filter((p) => (p.data.related_practices || []).includes(practice.slug));
  const html = renderArgomento(practice, of);
  if (html) {
    writeFileSync(join(OUT, 'argomenti', `${practice.slug}.html`), withGen(html));
    console.log(`  · /insights/argomenti/${practice.slug} (${of.length})`);
    sitemapUrls.push({ loc: `${ORIGIN}/insights/argomenti/${practice.slug}`, lastmod: undefined });
  }
}

updateSitemap(sitemapUrls);
console.log(`  · sitemap.xml aggiornata (${sitemapUrls.length} URL /insights)`);
console.log('OK');
