// CI: nessuna occorrenza dei nominativi di content/blocklist.json nei file del repo.
// Esclusi (per intento B.10 = "contenuto servito"): archive/, .git, node_modules
// (richiesti), content/blocklist.json (e' la lista stessa), e i documenti interni
// non deployati (.vercelignore'd) che discutono legittimamente la storia dello studio.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const { terms } = JSON.parse(readFileSync(resolve(ROOT, 'content/blocklist.json'), 'utf8'));

const EXCLUDE_DIRS = new Set(['archive', '.git', 'node_modules', '.vercel']);
const EXCLUDE_FILES = new Set([
  'content/blocklist.json',
  'SEO-IMPLEMENTATION.md', 'SEO-APPENDIX-A-EDITORIAL.md', 'SEO-APPENDIX-B-ARCHITECTURE.md',
  'CLAUDE.md', 'AUDIT.md', 'AUDIT_REPORT.md',
]);
const TEXT_EXT = new Set(['.html', '.htm', '.md', '.mdx', '.json', '.js', '.mjs', '.css', '.txt', '.xml', '.yml', '.yaml', '.svg', '.vcf']);

const matchers = terms.map((t) => {
  const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return { term: t, re: /^[A-Za-z ]+$/.test(t) ? new RegExp(`\\b${esc}\\b`, 'i') : new RegExp(esc, 'i') };
});

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (EXCLUDE_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const hits = [];
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  if (EXCLUDE_FILES.has(rel)) continue;
  if (!TEXT_EXT.has(extname(file).toLowerCase())) continue;
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const m of matchers) if (m.re.test(line)) hits.push(`${rel}:${i + 1}: "${m.term}"  →  ${line.trim().slice(0, 120)}`);
  });
}

if (hits.length) {
  console.error(`check-blocklist: ${hits.length} occorrenze VIETATE:\n  ${hits.join('\n  ')}`);
  process.exit(1);
}
console.log(`check-blocklist: OK — nessuna occorrenza (${terms.length} termini, esclusi archive/ .git node_modules + blocklist/doc interni)`);
