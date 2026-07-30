// Orchestratore del generatore statico. Ordine: contenuti -> aree -> sitemap
// (la sitemap raccoglie tutto l'output e va per ultima).
await import('./build-insights.mjs');
await import('./build-practices.mjs');
await import('./build-sitemap.mjs');
