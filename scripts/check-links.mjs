// CI: nessun link interno verso URL inesistenti.
// Ambito: link interni negli MDX autoriali (content/insights/) e nell'output
// generato (insights/). I link nelle bozze (DRAFT) sono warning, non bloccanti,
// perche' le destinazioni (pillar/argomenti) possono non esistere ancora (cfr. B.9).
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { isDraft } from './lib/content.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const EXCLUDE = new Set(['archive', '.git', 'node_modules', '.vercel', 'content', 'scripts', '.github']);

// --- insieme delle URL valide (dal filesystem servito) ---------------------
const valid = new Set(['/']);
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (EXCLUDE.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) { walk(full); continue; }
    const rel = '/' + relative(ROOT, full).split('\\').join('/');
    valid.add(rel);
    if (rel.endsWith('.html')) {
      const clean = rel.replace(/\.html$/, '').replace(/\/index$/, '') || '/';
      valid.add(clean);
    }
  }
})(ROOT);
// redirect di vercel.json: le source risolvono (via 3xx)
try {
  const vj = JSON.parse(readFileSync(resolve(ROOT, 'vercel.json'), 'utf8'));
  for (const r of vj.redirects || []) {
    if (!r.has) valid.add(r.source.replace(/\/:path.*$/, '').replace(/\(.*$/, '')); // forma base
  }
} catch {}

const isInternal = (h) => h.startsWith('/') && !h.startsWith('//');
const normalize = (h) => h.split('#')[0].split('?')[0].replace(/\/$/, '') || '/';

function linksIn(text) {
  const md = [...text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
  const href = [...text.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  return [...md, ...href].filter(isInternal);
}

let hard = 0, soft = 0;
// 1) MDX autoriali
const mdxDir = resolve(ROOT, 'content/insights');
if (existsSync(mdxDir)) {
  for (const f of readdirSync(mdxDir).filter((f) => f.endsWith('.mdx'))) {
    const raw = readFileSync(join(mdxDir, f), 'utf8');
    const { content: body } = matter(raw);
    const draft = isDraft(body);
    for (const link of linksIn(body)) {
      const n = normalize(link);
      if (!valid.has(n)) {
        (draft ? (soft++, console.log) : (hard++, console.error))(`  ${draft ? 'WARN' : 'FAIL'} content/insights/${f}: link interno inesistente "${link}"`);
      }
    }
  }
}
// 2) output generato non-draft (le pagine draft hanno noindex e non vanno in prod)
const genDir = resolve(ROOT, 'insights');
if (existsSync(genDir)) {
  (function walk(dir) {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (extname(full) !== '.html') continue;
      const html = readFileSync(full, 'utf8');
      if (/name="robots"[^>]*noindex/.test(html)) continue; // bozze
      for (const link of linksIn(html)) {
        const n = normalize(link);
        if (!valid.has(n)) { hard++; console.error(`  FAIL ${relative(ROOT, full)}: link interno inesistente "${link}"`); }
      }
    }
  })(genDir);
}

console.log(`check-links: ${hard} bloccanti, ${soft} warning`);
if (hard > 0) process.exit(1);
console.log('check-links: OK');
