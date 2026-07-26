import { PRACTICE_LABELS } from './practices.mjs';

const ORIGIN = 'https://lrlex.it';

// A.4 — Article. Correzioni vs bozza appendice, allineate al grafo reale del sito:
//  - publisher @id = #lawfirm (l'entita reale in home; #organization era dangling)
//  - author @id    = person.jsonldId esistente (es. #gianluca-leotta), non /professionisti/<slug>
export function buildArticleSchema(post, author) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${ORIGIN}/insights/${post.slug}#article`,
    headline: post.h1,
    description: post.description,
    inLanguage: post.lang === 'it' ? 'it-IT' : 'en-US',
    datePublished: post.published,
    dateModified: post.updated,
    author: { '@id': author.jsonldId },
    publisher: { '@id': `${ORIGIN}/#lawfirm` },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${ORIGIN}/insights/${post.slug}` },
    about: post.related_practices.map((p) => ({ '@type': 'Thing', name: PRACTICE_LABELS[p] })),
    isAccessibleForFree: true,
  };
}

// A.4 — FAQPage. Sorgente UNICA: post.faq (la stessa che alimenta FaqBlock nel template).
export function buildFaqSchema(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${ORIGIN}/insights/${post.slug}#faq`,
    mainEntity: post.faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}
