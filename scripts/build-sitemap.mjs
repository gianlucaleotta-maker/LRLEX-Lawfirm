// Genera sitemap.xml (sezione B.6): pagine statiche (elenco esplicito) + pagine
// generate (insights, aree di pratica). Esclude noindex, DRAFT e URL che
// generano redirect.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { ROOT, SITE } from './content.mjs';

// Elenco esplicito delle pagine statiche indicizzabili (no redirect, no stub Iubenda,
// no hub vecchio /pages/aree-di-pratica.html superato dall'albero /aree-di-pratica).
const STATIC = [
  '/',
  '/pages/team',
  '/pages/contatti',
  '/pages/track-record',
  '/pages/gaetano-bentivegna-track-record',
  '/pages/carla-talarico-track-record',
  '/pages/rassegna-stampa',
  '/en/',
  '/en/pages/practice-areas',
  '/en/pages/team',
  '/en/pages/contatti',
  '/en/pages/track-record',
  '/en/pages/gaetano-bentivegna-track-record',
  '/en/pages/carla-talarico-track-record',
  '/en/pages/news',
];

const NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const GEN = '<!-- GENERATED FILE — non modificare a mano. Rigenera: npm run build -->';

// mappa file generato -> URL servito (clean, no .html, index -> dir)
const toUrl = (relPath) => {
  let u = '/' + relPath.split('\\').join('/');
  u = u.replace(/\.html$/, '').replace(/\/index$/, '');
  return u || '/';
};

function collectGenerated(dir) {
  const out = [];
  if (!existsSync(resolve(ROOT, dir))) return out;
  (function walk(d) {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!full.endsWith('.html')) continue;
      const html = readFileSync(full, 'utf8');
      if (/name="robots"[^>]*noindex/i.test(html)) continue; // esclude noindex/DRAFT
      out.push(toUrl(relative(ROOT, full)));
    }
  })(resolve(ROOT, dir));
  return out;
}

const urls = [
  ...STATIC,
  ...collectGenerated('insights'),
  ...collectGenerated('aree-di-pratica'),
];
// dedup + ordine stabile
const unique = [...new Set(urls)].sort();

const body = unique.map((u) => `<url><loc>${SITE}${u === '/' ? '/' : u}</loc></url>`).join('\n  ');
writeFileSync(
  resolve(ROOT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n${GEN}\n<urlset xmlns="${NS}">\n  ${body}\n</urlset>\n`
);
console.log(`Build sitemap: ${unique.length} URL (${STATIC.length} statiche + generate)`);
