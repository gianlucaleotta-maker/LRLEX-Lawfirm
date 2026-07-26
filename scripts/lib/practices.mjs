import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const { practices } = JSON.parse(readFileSync(resolve(ROOT, 'content/practices.json'), 'utf8'));

export const PRACTICES = practices;
export const PRACTICE_LABELS = Object.fromEntries(practices.map((p) => [p.slug, p.label]));
export const PRACTICE_URL = Object.fromEntries(practices.map((p) => [p.slug, p.url]));
export const isPractice = (slug) => Object.prototype.hasOwnProperty.call(PRACTICE_LABELS, slug);
