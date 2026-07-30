// Genera l'albero URL delle aree di pratica (sezione B.4) da content/practices/*.mdx.
// Output: aree-di-pratica/<pillar>.html, aree-di-pratica/<pillar>/<satellite>.html,
//         aree-di-pratica/index.html (hub). Clean URL via cleanUrls in vercel.json.
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import MarkdownIt from 'markdown-it';
import { ROOT, SITE, esc, buildHead, ORGANIZATION, verifyOrganization, verifyHreflangReciprocity, loadPractices, loadPracticePages } from './content.mjs';

const md = new MarkdownIt({ html: true, linkify: true, typographer: true });
const OUT = resolve(ROOT, 'aree-di-pratica');
const TEMPLATE = readFileSync(resolve(ROOT, 'templates/practice.html'), 'utf8');

function fill(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : ''));
}

verifyOrganization(); // B.7: fallisce il build se l'Organization non e' conforme
console.log('Build practices');

const { practices } = loadPractices();
const bySlug = new Map(practices.map((p) => [p.slug, p]));
const pages = loadPracticePages();
const pageSlugs = new Set(pages.map((p) => p.data.slug));

// coerenza registro <-> file
for (const pg of pages) if (!bySlug.has(pg.data.slug)) throw new Error(`content/practices/${pg.file}: slug "${pg.data.slug}" assente da practices.json`);
for (const p of practices) if (!pageSlugs.has(p.slug)) throw new Error(`practices.json: manca content/practices/${p.slug}.mdx`);

if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const generated = []; // { path }  per sitemap
const hreflangPairs = [];

function breadcrumb(p) {
  const items = [`<a href="/">Home</a>`, `<a href="/aree-di-pratica">Aree di Pratica</a>`];
  if (p.parent) items.push(`<a href="${bySlug.get(p.parent).url}">${esc(bySlug.get(p.parent).label)}</a>`);
  items.push(`<span>${esc(p.label)}</span>`);
  return items.join(' / ');
}

function outPathFor(p) {
  // pillar: aree-di-pratica/<slug>.html ; satellite: aree-di-pratica/<parent>/<slug>.html
  return p.parent ? join(OUT, p.parent, `${p.slug}.html`) : join(OUT, `${p.slug}.html`);
}

for (const pg of pages) {
  const p = bySlug.get(pg.data.slug);
  const d = pg.data;
  const children = practices.filter((x) => x.parent === p.slug);
  const satellites = children.length
    ? `<section class="practice__satellites"><h2>Temi</h2><ul>${children.map((c) => `<li><a href="${c.url}">${esc(c.label)}</a></li>`).join('')}</ul></section>`
    : '';
  const head = buildHead({
    title: d.title,
    description: d.description,
    path: p.url,
    alternatePath: d.alternate,
    lang: d.lang || 'it',
    schema: [ORGANIZATION],
  });
  const html = fill(TEMPLATE, {
    LANG: d.lang || 'it',
    HEAD: head,
    BREADCRUMB: breadcrumb(p),
    H1: esc(d.h1),
    BODY: md.render(pg.body),
    SATELLITES: satellites,
  });
  const outFile = outPathFor(p);
  mkdirSync(resolve(outFile, '..'), { recursive: true });
  writeFileSync(outFile, html);
  generated.push({ path: p.url });
  hreflangPairs.push({ path: p.url, alternatePath: d.alternate });
  console.log(`  · ${p.url}${p.parent ? ' (satellite)' : ' (pillar)'}`);
}

// hub /aree-di-pratica: indice dei pillar (pagina strutturale)
const pillars = practices.filter((p) => !p.parent);
const hubHead = buildHead({
  title: 'Aree di Pratica | LR LEX',
  description: "Le aree di pratica di LR LEX: M&A, private equity, venture capital, capital markets, crisi d'impresa, tech e contenzioso.",
  path: '/aree-di-pratica',
  lang: 'it',
  schema: [ORGANIZATION],
});
const hubHtml = fill(TEMPLATE, {
  LANG: 'it',
  HEAD: hubHead,
  BREADCRUMB: `<a href="/">Home</a> / <span>Aree di Pratica</span>`,
  H1: 'Aree di Pratica',
  BODY: `<ul class="practice-hub__list">${pillars.map((p) => `<li><a href="${p.url}">${esc(p.label)}</a></li>`).join('')}</ul>`,
  SATELLITES: '',
});
writeFileSync(join(OUT, 'index.html'), hubHtml);
generated.push({ path: '/aree-di-pratica' });
console.log(`  · /aree-di-pratica (hub, ${pillars.length} pillar)`);

verifyHreflangReciprocity(hreflangPairs); // B.5: reciprocita' (nessun alternate ora => passa)
console.log(`OK — ${generated.length} pagine aree di pratica`);

export { generated };
