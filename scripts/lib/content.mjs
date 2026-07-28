import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import matter from 'gray-matter';
import { isPractice } from './practices.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const P = (...s) => resolve(ROOT, ...s);

// ---- registri -------------------------------------------------------------
export function loadPeople() {
  const dir = P('content/people');
  const map = new Map();
  if (!existsSync(dir)) return map;
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const p = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    map.set(p.slug, p);
  }
  return map;
}

// STAND-IN Supabase: legge content/deals.json. Sostituire con fetch a Supabase
// (published=true) quando disponibili le credenziali. Firma invariata a valle.
export function loadDeals() {
  const file = P('content/deals.json');
  const map = new Map();
  if (!existsSync(file)) return map;
  for (const d of JSON.parse(readFileSync(file, 'utf8')).deals || []) map.set(d.slug, !!d.published);
  return map;
}

export function loadBlocklist() {
  const file = P('content/blocklist.json');
  const terms = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).terms || [] : [];
  const matchers = terms.map((t) => {
    const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = /^[A-Za-z ]+$/.test(t) ? new RegExp(`\\b${esc}\\b`, 'i') : new RegExp(esc, 'i');
    return { term: t, re };
  });
  return {
    terms,
    find(text) {
      for (const m of matchers) if (m.re.test(text)) return m.term;
      return null;
    },
  };
}

// ---- helper ---------------------------------------------------------------
export const isIso = (v) =>
  typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})?)?$/.test(v) &&
  !Number.isNaN(Date.parse(v));

export const isDraft = (body) => /<!--\s*DRAFT/i.test(body);

const REQUIRED = ['slug', 'type', 'lang', 'title', 'description', 'h1', 'keyword_primary', 'author', 'published', 'updated', 'related_practices', 'faq'];

// ---- validazione A.3 ------------------------------------------------------
// Ritorna array di stringhe-errore (vuoto = ok). Non lancia: l'aggregazione
// e il fail del build avvengono in loadInsights.
export function validateInsight({ data, body, file, people, deals, blocklist, draft }) {
  const e = [];
  for (const k of REQUIRED) {
    const v = data[k];
    const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
    if (empty) e.push(`campo obbligatorio mancante: ${k}`);
  }
  if (data.type !== undefined && data.type !== 'insight') e.push(`type deve essere "insight" (trovato: ${data.type})`);
  if (data.lang !== undefined && !['it', 'en'].includes(data.lang)) e.push(`lang deve essere "it" o "en"`);
  if (typeof data.title === 'string' && data.title.length > 60) e.push(`title > 60 caratteri (${data.title.length})`);
  if (typeof data.description === 'string' && data.description.length > 155) e.push(`description > 155 caratteri (${data.description.length})`);
  if (data.h1 && data.title && data.h1 === data.title) e.push('h1 deve essere diverso da title');
  if (!Array.isArray(data.keyword_secondary) || data.keyword_secondary.length < 2) e.push('keyword_secondary: minimo 2');
  if (Array.isArray(data.related_practices)) {
    const bad = data.related_practices.filter((p) => !isPractice(p));
    if (bad.length) e.push(`related_practices slug inesistenti: ${bad.join(', ')}`);
  }
  if (Array.isArray(data.faq) && data.faq.length < 4) e.push(`faq: minimo 4 (trovate ${data.faq.length})`);
  if (Array.isArray(data.faq)) {
    data.faq.forEach((f, i) => {
      if (!f || typeof f.q !== 'string' || typeof f.a !== 'string') e.push(`faq[${i}] deve avere q e a stringa`);
    });
  }
  // author esiste
  if (data.author && !people.has(data.author)) e.push(`author "${data.author}" non presente in content/people/`);
  // related_deals: solo slug Supabase (stand-in) con published=true
  if (Array.isArray(data.related_deals)) {
    for (const d of data.related_deals) {
      if (!deals.has(d)) e.push(`related_deals "${d}" non presente nel registro deal (Supabase)`);
      else if (deals.get(d) !== true) e.push(`related_deals "${d}" non ha published=true`);
    }
  }
  // date ISO: obbligatorio, tranne bozze (placeholder tollerato solo in preview/DRAFT)
  for (const k of ['published', 'updated']) {
    if (data[k] !== undefined && !isIso(data[k])) {
      if (draft) e.push(`WARN:${k} non ISO ("${data[k]}") — ammesso solo perche' DRAFT/preview`);
      else e.push(`${k} in formato non ISO ("${data[k]}")`);
    }
  }
  // blocklist su ogni campo testuale + corpo
  const blob = JSON.stringify(data) + '\n' + body;
  const hit = blocklist.find(blob);
  if (hit) e.push(`blocklist: trovato nominativo vietato "${hit}"`);
  return e;
}

// Carica e valida tutti gli insight. In produzione le bozze (DRAFT) sono escluse.
// Se una validazione (non-WARN) fallisce, lancia => build fallito.
export function loadInsights({ production = false } = {}) {
  const dir = P('content/insights');
  const people = loadPeople();
  const deals = loadDeals();
  const blocklist = loadBlocklist();
  const out = [];
  const seenSlug = new Map();
  const errors = [];
  if (!existsSync(dir)) return out;
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.mdx')).sort()) {
    const raw = readFileSync(join(dir, file), 'utf8');
    const { data, content: body } = matter(raw);
    const draft = isDraft(body);
    const errs = validateInsight({ data, body, file, people, deals, blocklist, draft });
    const hard = errs.filter((x) => !x.startsWith('WARN:'));
    if (data.slug) {
      if (seenSlug.has(data.slug)) hard.push(`slug duplicato "${data.slug}" (anche in ${seenSlug.get(data.slug)})`);
      else seenSlug.set(data.slug, file);
    }
    if (hard.length) { errors.push(`\n  ${file}:\n    - ${hard.join('\n    - ')}`); continue; }
    if (production && draft) continue; // le bozze non entrano in produzione
    out.push({ file, draft, data, body, author: people.get(data.author) });
  }
  if (errors.length) throw new Error(`Validazione insight fallita:${errors.join('')}`);
  return out;
}
