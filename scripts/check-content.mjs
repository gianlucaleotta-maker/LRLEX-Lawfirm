import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import matter from 'gray-matter';
import { ROOT, loadPeople, loadBlocklist, isIso, isDraft } from './lib/content.mjs';

// "destinato a produzione": build di produzione (Vercel prod o flag esplicito).
const PROD = process.env.VERCEL_ENV === 'production' || process.env.CONTENT_ENV === 'production';
const DIR = resolve(ROOT, 'content/insights');

const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, ' ');
const bodyText = (b) => stripComments(b);
const wordCount = (b) =>
  (bodyText(b).replace(/```[\s\S]*?```/g, ' ').replace(/<[^>]+>/g, ' ').replace(/[#*_>`~\-]/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').match(/\S+/g) || []).length;
const internalLinks = (b) => {
  const t = bodyText(b);
  const mdLinks = [...t.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
  const htmlLinks = [...t.matchAll(/<a[^>]+href="([^"]+)"/g)].map((m) => m[1]);
  return [...mdLinks, ...htmlLinks].filter((h) => /^\//.test(h) || /^https?:\/\/(www\.)?lrlex\.it/.test(h)).length;
};
const atxH1 = (b) => (bodyText(b).match(/^#\s+/gm) || []).length;

const people = loadPeople();
const blocklist = loadBlocklist();

let hard = 0;
let soft = 0;
const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith('.mdx')).sort() : [];
console.log(`check-content: ${files.length} file (${PROD ? 'PRODUCTION' : 'preview'})\n`);

for (const file of files) {
  const raw = readFileSync(join(DIR, file), 'utf8');
  const { data, content: body } = matter(raw);
  const draft = isDraft(body);
  const issues = [];
  const q = (cond, msg) => cond && issues.push(msg);

  q(wordCount(body) < 1200, `corpo < 1200 parole (${wordCount(body)})`);
  q(!Array.isArray(data.faq) || data.faq.length < 4, `< 4 FAQ (${Array.isArray(data.faq) ? data.faq.length : 0})`);
  q(internalLinks(body) < 3, `< 3 link interni nel corpo (${internalLinks(body)})`);
  q(typeof data.title === 'string' && data.title.length > 60, `title > 60 (${data.title?.length})`);
  q(typeof data.description === 'string' && data.description.length > 155, `description > 155 (${data.description?.length})`);
  q(atxH1(body) > 0, `H1 multipli: ${atxH1(body)} H1 nel corpo (l'H1 e' gia' nel frontmatter)`);
  q(!data.author || !people.has(data.author), `author non valido: "${data.author}"`);
  q(!isIso(data.published), `published non ISO: "${data.published}"`);
  q(!isIso(data.updated), `updated non ISO: "${data.updated}"`);
  const hit = blocklist.find(JSON.stringify(data) + '\n' + body);
  q(!!hit, `blocklist: "${hit}"`);
  q(draft && PROD, `marker DRAFT presente ma destinato a PRODUZIONE`);

  if (!issues.length) { console.log(`  OK   ${file}`); continue; }
  // Bozze in preview: le violazioni editoriali sono warning (gate = pubblicazione).
  const blocking = draft && !PROD ? issues.filter((m) => /DRAFT.*PRODUZIONE|blocklist|author non valido/.test(m)) : issues;
  if (blocking.length) {
    hard += blocking.length;
    console.log(`  FAIL ${file}${draft ? ' [DRAFT]' : ''}\n       - ${issues.join('\n       - ')}`);
  } else {
    soft += issues.length;
    console.log(`  WARN ${file} [DRAFT, non bloccante in preview]\n       - ${issues.join('\n       - ')}`);
  }
}

console.log(`\nrisultato: ${hard} bloccanti, ${soft} warning`);
if (hard > 0) { console.error('check-content: FALLITO'); process.exit(1); }
console.log('check-content: OK');
