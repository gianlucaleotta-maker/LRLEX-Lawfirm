// Modulo centrale del generatore statico (sezioni B.5 e B.7).
// - buildHead: metadati <head> con validazione (build fallisce su title/description troppo lunghi)
// - ORGANIZATION: UNICA sorgente del JSON-LD Organization/LegalService, iniettata da tutti i template
// - verifyOrganization: i 4 controlli della sezione B.7
// - loadPractices / loadPracticePages: sorgenti delle aree di pratica
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import matter from 'gray-matter';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const SITE = 'https://lrlex.it';

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- B.5 — generazione metadati ------------------------------------------
export function buildHead({ title, description, path, alternatePath, lang = 'it', schema = [] }) {
  if (typeof title !== 'string' || title.length === 0) throw new Error(`buildHead: title mancante per ${path}`);
  if (typeof description !== 'string' || description.length === 0) throw new Error(`buildHead: description mancante per ${path}`);
  if (title.length > 60) throw new Error(`buildHead: title > 60 caratteri (${title.length}) per ${path}: "${title}"`);
  if (description.length > 155) throw new Error(`buildHead: description > 155 caratteri (${description.length}) per ${path}`);

  const url = `${SITE}${path}`;
  const parts = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:site_name" content="LR LEX">`,
    `<meta property="og:locale" content="${lang === 'it' ? 'it_IT' : 'en_US'}">`,
    `<meta property="og:type" content="website">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ];
  if (alternatePath) {
    const itUrl = lang === 'it' ? url : `${SITE}${alternatePath}`;
    const enUrl = lang === 'en' ? url : `${SITE}${alternatePath}`;
    parts.push(`<link rel="alternate" hreflang="it-IT" href="${itUrl}">`);
    parts.push(`<link rel="alternate" hreflang="en-US" href="${enUrl}">`);
    parts.push(`<link rel="alternate" hreflang="x-default" href="${itUrl}">`);
  }
  for (const s of schema) parts.push(`<script type="application/ld+json">${JSON.stringify(s)}</script>`);
  return parts.join('\n  ');
}

// Reciprocita' hreflang: se A dichiara B come alternate, B deve dichiarare A.
// pages: [{ path, alternatePath }]. Da eseguire a fine build su tutte le coppie.
export function verifyHreflangReciprocity(pages) {
  const byPath = new Map(pages.map((p) => [p.path, p]));
  const errors = [];
  for (const p of pages) {
    if (!p.alternatePath) continue;
    const other = byPath.get(p.alternatePath);
    if (!other) errors.push(`hreflang: ${p.path} punta a ${p.alternatePath} che non esiste`);
    else if (other.alternatePath !== p.path) errors.push(`hreflang non reciproco: ${p.path} -> ${p.alternatePath}, ma ${p.alternatePath} -> ${other.alternatePath || '(nessuno)'}`);
  }
  if (errors.length) throw new Error('Reciprocita\' hreflang fallita:\n  ' + errors.join('\n  '));
}

// ---- B.7 — JSON-LD Organization: UNICA sorgente --------------------------
export const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'LegalService'],
  '@id': `${SITE}/#lawfirm`,
  name: 'LR LEX',
  legalName: 'LR LEX — Avvocati Associati',
  alternateName: ['LR LEX', 'Legali Riuniti Lex', 'ELR LEX'],
  url: SITE,
  logo: `${SITE}/assets/img/lrlex-logo-horizontal.png`,
  image: `${SITE}/assets/img/lrlex-logo-hero-1200x627.png`,
  email: 'info@lrlex.it',
  telephone: '+39-02-8219-6887',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Foro Buonaparte, 51',
    addressLocality: 'Milano',
    postalCode: '20121',
    addressRegion: 'MI',
    addressCountry: 'IT',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 45.4719, longitude: 9.1824 },
  areaServed: [{ '@type': 'Country', name: 'IT' }, { '@type': 'Country', name: 'GB' }, { '@type': 'Country', name: 'US' }],
  founder: { '@id': `${SITE}/#gianluca-leotta` },
  sameAs: ['https://www.linkedin.com/company/lrlex', 'https://www.linkedin.com/in/gianlucaleotta/'],
};

// I 4 punti da verificare della sezione B.7 (lancia se falliti).
export function verifyOrganization(org = ORGANIZATION) {
  const e = [];
  const brands = ['LR LEX', 'Legali Riuniti Lex', 'ELR LEX'];
  if (!Array.isArray(org.alternateName) || !brands.every((b) => org.alternateName.includes(b)))
    e.push(`alternateName deve contenere i 3 brand storici: ${brands.join(', ')}`);
  if (!Array.isArray(org.sameAs) || !org.sameAs.includes('https://www.linkedin.com/company/lrlex'))
    e.push('sameAs deve puntare a https://www.linkedin.com/company/lrlex');
  if (!org.founder || !org.founder['@id'] || org.founder.name)
    e.push('founder deve usare un riferimento @id, non un oggetto annidato');
  if (!org.address || org.address.streetAddress !== 'Foro Buonaparte, 51')
    e.push('address deve essere Foro Buonaparte, 51 (non la sede precedente)');
  if (e.length) throw new Error('verifyOrganization (B.7) fallita:\n  ' + e.join('\n  '));
  return true;
}

// ---- loader --------------------------------------------------------------
export function loadPractices() {
  return JSON.parse(readFileSync(resolve(ROOT, 'content/practices.json'), 'utf8'));
}

export function loadPracticePages() {
  const dir = resolve(ROOT, 'content/practices');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .sort()
    .map((file) => {
      const { data, content: body } = matter(readFileSync(join(dir, file), 'utf8'));
      return { file, data, body };
    });
}
