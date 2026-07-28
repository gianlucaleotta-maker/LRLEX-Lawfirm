# Appendice B — Revisione architetturale post-audit

**Documento collegato:** SEO-IMPLEMENTATION.md
**Versione:** 1.0
**Stato:** questa appendice SOSTITUISCE le sezioni 1, 3.1, 3.3 e 5.2 della spec principale.
In caso di conflitto, prevale questa appendice.

---

## B.1 Cosa è cambiato e perché

La spec principale è stata redatta assumendo uno stack Next.js 15 App Router con Supabase. L'audit del repository ha rilevato una realtà diversa:

- il sito è **HTML statico**, senza framework
- sul branch `seo/phase-2-insights` esiste un **generatore statico in Node ESM** (gray-matter + markdown-it) che produce HTML da sorgenti MDX
- il design system è **CSS custom** con token in `:root`, senza Tailwind
- non esiste alcuna dipendenza o credenziale Supabase
- il sito conta circa 17 URL

**Decisione: la migrazione a Next.js è annullata.** Il generatore statico esistente viene esteso per coprire tutte le tipologie di pagina.

### Motivazione

Il rischio principale identificato nella sezione 9 della spec principale era il degrado delle performance a seguito della migrazione. Su un sito di questa dimensione, senza funzionalità dinamiche, Next.js introdurrebbe un runtime, un bundle JavaScript e una superficie di build sproporzionati rispetto al beneficio. L'HTML statico prodotto da uno script Node ha il profilo di performance migliore possibile ed è già in produzione.

Il generatore statico fornisce ciò che serviva davvero: templating, sorgenti in Markdown, generazione automatica di metadati e JSON-LD, sitemap generata al build. Nessuno di questi richiede un framework.

**Questa decisione va rivalutata solo se** il sito acquisisce funzionalità che richiedono rendering dinamico o autenticazione, ad esempio l'area riservata del network legale. In quel caso l'ipotesi corretta non è migrare il sito pubblico, ma affiancare un'applicazione separata su sottodominio.

---

## B.2 Architettura effettiva

```
/                                    root del repo
├── SEO-IMPLEMENTATION.md            spec principale
├── SEO-APPENDIX-A-EDITORIAL.md      sistema editoriale
├── SEO-APPENDIX-B-ARCHITECTURE.md   questo documento
├── CLAUDE.md                        contesto per l'agente
├── AUDIT.md                         stato del repo
│
├── package.json                     npm, deps: gray-matter, markdown-it
├── vercel.json                      redirect + buildCommand
├── .vercelignore                    esclude archive/
│
├── scripts/
│   ├── build.mjs                    orchestratore
│   ├── build-insights.mjs           esistente
│   ├── build-practices.mjs          DA CREARE
│   ├── build-people.mjs             DA CREARE
│   ├── build-deals.mjs              DA CREARE
│   ├── build-sitemap.mjs            DA CREARE
│   ├── content.mjs                  loader + validazioni
│   └── check-blocklist.mjs          controllo CI
│
├── content/
│   ├── practices.json               tassonomia e label
│   ├── blocklist.json               nominativi esclusi
│   ├── deals.json                   archivio operazioni
│   ├── practices/                   MDX pillar e satellite
│   ├── people/                      MDX professionisti
│   └── insights/                    MDX articoli
│
├── templates/                       DA CREARE
│   ├── practice.html
│   ├── person.html
│   ├── insight.html
│   └── partials/
│
├── assets/
│   ├── css/styles.css               design system, NON MODIFICARE
│   └── img/
│
├── pages/                           HTML statico esistente
└── en/                              HTML statico esistente
```

**Principio di convivenza.** Le pagine HTML statiche esistenti restano dove sono e continuano a funzionare. Il generatore aggiunge pagine, non sostituisce quelle presenti. La migrazione delle pagine statiche verso il generatore è opzionale e successiva, da valutare pagina per pagina.

---

## B.3 Sostituzione della sezione 1: dove vivono i contenuti

La regola della spec principale ("se il testo deve posizionarsi sta in MDX, se il dato deve essere filtrato sta in Supabase") si semplifica:

> **Tutto sta in Git.**

| Contenuto | Formato | Percorso |
|---|---|---|
| Pillar e satellite | MDX con frontmatter | `content/practices/` |
| Professionisti | MDX con frontmatter | `content/people/` |
| Insight | MDX con frontmatter | `content/insights/` |
| Tassonomia aree | JSON | `content/practices.json` |
| Archivio deal | JSON | `content/deals.json` |
| Blocklist nominativi | JSON | `content/blocklist.json` |
| Rassegna stampa | JSON | `content/press.json` (da creare) |

**Supabase esce dal perimetro del sito pubblico.** Resta pertinente solo per progetti che richiedono scrittura da parte di utenti, come il form contatti con persistenza o l'area riservata del network legale. Per il form contatti, l'alternativa più semplice è un servizio di form endpoint o una funzione serverless su Vercel, senza database.

Lo schema SQL della sezione 3.3 della spec principale è **sospeso**, non cancellato: resta valido come riferimento se e quando servirà un backend.

---

## B.4 Sostituzione della sezione 3.1: albero degli URL

Gli URL target restano quelli della spec principale. Cambia il modo in cui sono generati.

```
/aree-di-pratica                                    hub, esistente da migrare
/aree-di-pratica/ma-finanza-straordinaria           PILLAR
/aree-di-pratica/ma-finanza-straordinaria/golden-power
/aree-di-pratica/ma-finanza-straordinaria/acquisizione-pmi
/aree-di-pratica/ma-finanza-straordinaria/cessione-ramo-azienda
/aree-di-pratica/ma-finanza-straordinaria/due-diligence-legale
/aree-di-pratica/ma-finanza-straordinaria/spa-compravendita-partecipazioni
/aree-di-pratica/ma-finanza-straordinaria/patti-parasociali
/aree-di-pratica/ma-finanza-straordinaria/joint-venture
/aree-di-pratica/ma-finanza-straordinaria/ma-cross-border
/aree-di-pratica/private-equity                     PILLAR
/aree-di-pratica/venture-capital                    PILLAR
/aree-di-pratica/diritto-societario                 PILLAR
/aree-di-pratica/capital-markets                    PILLAR
/aree-di-pratica/ristrutturazioni-crisi-impresa     PILLAR
/aree-di-pratica/tech-data-ai                       PILLAR
/aree-di-pratica/proprieta-intellettuale
/aree-di-pratica/privacy
/aree-di-pratica/contenzioso-arbitrati
/aree-di-pratica/amministrativo-real-estate

/professionisti                                     esistente da migrare
/professionisti/gianluca-leotta

/insights                                           già implementato
/insights/[slug]
/insights/argomenti/[practice]

/deal
/deal/[slug]

/en/...                                             mirror
```

**Output del generatore:** file HTML statici. Con `cleanUrls: true` in `vercel.json`, `pagina.html` viene servito come `/pagina`. Verificare che i canonical siano coerenti con la forma servita, senza estensione.

**Nota su `/aree-di-pratica`.** La pagina esistente `/pages/aree-di-pratica.html` va mantenuta come hub, con i suoi `id` ancora come fallback, e i link interni vanno riscritti verso le nuove pagine figlie. Il 301 da `/pages/aree-di-pratica.html` verso `/aree-di-pratica` è già previsto nella redirect map della spec principale.

---

## B.5 Sostituzione della sezione 5.2: generazione dei metadati

Il helper `buildMetadata` in TypeScript non è applicabile. La funzione equivalente va implementata in `scripts/content.mjs`:

```js
const SITE = "https://lrlex.it";

export function buildHead({ title, description, path, alternatePath, lang = "it", schema = [] }) {
  const url = `${SITE}${path}`;
  const parts = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:site_name" content="LR LEX">`,
    `<meta property="og:locale" content="${lang === "it" ? "it_IT" : "en_US"}">`,
    `<meta property="og:type" content="website">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ];

  if (alternatePath) {
    const itUrl = lang === "it" ? url : `${SITE}${alternatePath}`;
    const enUrl = lang === "en" ? url : `${SITE}${alternatePath}`;
    parts.push(`<link rel="alternate" hreflang="it-IT" href="${itUrl}">`);
    parts.push(`<link rel="alternate" hreflang="en-US" href="${enUrl}">`);
    parts.push(`<link rel="alternate" hreflang="x-default" href="${itUrl}">`);
  }

  for (const s of schema) {
    parts.push(`<script type="application/ld+json">${JSON.stringify(s)}</script>`);
  }

  return parts.join("\n");
}
```

**Validazione al build.** Il build deve fallire se `title` supera 60 caratteri o `description` supera 155. Sono i due errori più frequenti e i più facili da intercettare automaticamente.

**Reciprocità hreflang.** Il build deve verificare che se la pagina A dichiara B come alternate, B dichiari A. Una mancata reciprocità invalida l'intera dichiarazione. Questo controllo va eseguito a fine build su tutte le coppie, non sulla singola pagina.

---

## B.6 Sitemap e robots

Oggi `sitemap.xml` è un file statico manutenuto a mano, con 17 voci. Non è sostenibile con l'aggiunta delle pillar, dei satellite e degli insight.

**`scripts/build-sitemap.mjs` deve generarlo** raccogliendo:
- le pagine HTML statiche esistenti, da un elenco esplicito
- tutte le pagine generate dal build

Regole: solo URL che rispondono 200, nessun URL che genera redirect, nessuna pagina con `noindex`, nessuna pagina in stato DRAFT.

`robots.txt` resta statico. Nessun `Disallow` sui percorsi di contenuto.

---

## B.7 JSON-LD: consolidamento

L'audit rileva JSON-LD presente su `index`, `team`, `en/*` e `story`, presumibilmente duplicato in ciascun file.

**Va centralizzato.** Il blocco `LegalService` della sezione 5.3 della spec principale deve avere una sola sorgente in `scripts/content.mjs`, iniettata da tutti i template. Un'organizzazione descritta in modo divergente su pagine diverse indebolisce il grafo di entità invece di rafforzarlo.

Punti da verificare nel JSON-LD esistente:
- `alternateName` contiene i tre brand storici (LR LEX, Legali Riuniti Lex, ELR LEX)
- `sameAs` punta al nuovo URL LinkedIn `https://www.linkedin.com/company/lrlex`
- `founder` usa il riferimento `@id` verso la pagina persona, non un oggetto annidato
- l'indirizzo è Foro Buonaparte 51, non la sede precedente

---

## B.8 Registri da riconciliare

Claude Code ha seedato tre registri con valori derivati, in assenza della specifica. Vanno verificati manualmente.

### `content/blocklist.json` — priorità critica

Contiene nominativi **dedotti**, non forniti. Un nome mancante comporta la pubblicazione di contenuti che non devono essere pubblicati. Un nome eccedente comporta la cancellazione silenziosa di un professionista ancora in organico.

È l'unico file del progetto che non può essere validato automaticamente. Richiede conferma esplicita, con cognome e nome esatti.

### `content/practices.json`

Gli slug devono corrispondere esattamente all'albero della sezione B.4. `related_practices` viene validato contro questo file e uno slug divergente fa fallire il build.

### `content/deals.json`

Struttura minima per ciascuna voce:

```json
{
  "slug": "string",
  "title": "string",
  "client": "string | null",
  "year": 2026,
  "practice_slug": "string",
  "sector": "string",
  "cross_border": true,
  "summary": "string",
  "team": ["slug-persona"],
  "press": [{ "outlet": "string", "url": "string" }],
  "published": true
}
```

Il campo `team` accetta solo slug presenti in `content/people/`. Nessun nome della blocklist può comparire in alcun campo.

---

## B.9 Ordine di esecuzione rivisto

| # | Attività | Stato |
|---|---|---|
| 1 | Commit di spec, appendici e CLAUDE.md in root | da fare |
| 2 | Verifica manuale di `blocklist.json` | da fare, bloccante |
| 3 | Verifica preview deploy della PR phase-2 | da fare |
| 4 | Merge di `seo/phase-2-insights` | subordinato a 3 |
| 5 | Estensione del generatore: `build-practices.mjs` e template | prossimo |
| 6 | Redazione della prima pillar `ma-finanza-straordinaria` | dopo 5 |
| 7 | Pagina `gianluca-leotta` con schema Person | dopo 5 |
| 8 | Satellite M&A, priorità a `golden-power` | dopo 6 |
| 9 | Pubblicazione dei due insight in draft | dopo 6, servono i link interni |
| 10 | Consolidamento JSON-LD e sitemap generata | in parallelo |
| 11 | Mirror EN e verifica reciprocità hreflang | ultimo |

**Nota sul punto 9.** I due articoli in `content/insights/` restano in stato DRAFT finché non esistono le pillar page. Il requisito di almeno tre link interni non può essere soddisfatto prima, perché le destinazioni non esistono e produrrebbero 404. Il check CI impedisce correttamente la pubblicazione nel frattempo.

---

## B.10 Vincoli invariati

Tutto il resto della spec principale resta in vigore, in particolare:

- **Definition of Done**, sezione 8: nessuna PR viene mergiata con anche un solo FAIL
- **Anti-pattern**, sezione 9, con una precisazione: l'anti-pattern "migrare a Next.js peggiorando le performance" è ora risolto per costruzione, ma il principio resta. Ogni PR va verificata con Lighthouse mobile sul preview, e nessun regresso rispetto a produzione è accettabile.
- **Blocklist nominativi**: nessuna occorrenza in pagine, meta tag, JSON-LD, alt text, nomi file o commenti nel codice
- **Design invariato**: `assets/css/styles.css` non si modifica. I template riusano i token esistenti.
- **Marker DRAFT**: nessun contenuto raggiunge la produzione senza revisione di un partner
- **Nessun em-dash nei contenuti in lingua inglese**
