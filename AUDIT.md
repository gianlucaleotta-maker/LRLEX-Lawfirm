# AUDIT — repository LR LEX

Analisi eseguita sul working tree attualmente in checkout: branch **`seo/phase-2-insights`** (HEAD `5848920`).
Dove lo stato di `origin/main` (`d8cfa92`) differisce, è indicato nella risposta. Contenuto fattuale.

---

## 1. Framework, versione, package manager

- **Sito HTML statico.** Nessun framework applicativo: nessun file `next.config.*`, nessuna dipendenza `next`/`react`, nessuna cartella `app/` o `pages/` in senso Next.js. `vercel.json` dichiara `"framework": null`.
- Sul branch `seo/phase-2-insights` è presente un livello di **generazione statica (SSG) basato su script Node ESM**: `package.json` con `"type": "module"`, script `build` (`node scripts/build-insights.mjs`) e `check:content` (`node scripts/check-content.mjs`).
- **Nessun Next.js, nessuna versione Next.** Runtime: Node (script `.mjs`).
- **Package manager: npm** — presente `package-lock.json` (nessun `yarn.lock` né `pnpm-lock.yaml`).
- Dipendenze dichiarate: `gray-matter ^4.0.3`, `markdown-it ^14.1.0`.
- Su `origin/main`: `package.json`, `scripts/`, `content/` **non esistono** (introdotti solo dal commit `5848920`, non ancora in main). Su main il sito è HTML statico puro, senza toolchain Node.

## 2. vercel.json

Esiste. Contenuto integrale (versione sul branch `seo/phase-2-insights`):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": null,
  "buildCommand": "npm run build",
  "outputDirectory": null,
  "cleanUrls": true,
  "trailingSlash": false,
  "redirects": [
    { "source": "/avvocato-gianluca-leotta/", "destination": "/pages/team.html", "permanent": true },
    { "source": "/en/pages/aree-di-pratica", "destination": "/en/pages/practice-areas", "permanent": true },
    { "source": "/en/pages/aree-di-pratica.html", "destination": "/en/pages/practice-areas.html", "permanent": true },
    { "source": "/:path(avvocato-[^/]+(?:\\.html)?)", "destination": "/pages/team.html", "permanent": true },
    { "source": "/pages/news.html", "destination": "/insights", "permanent": true },
    { "source": "/pages/news", "destination": "/insights", "permanent": true },
    { "source": "/", "has": [{ "type": "host", "value": "^(www\\.)?elrlex\\.it$" }], "destination": "https://lrlex.it/", "permanent": true },
    { "source": "/home", "has": [{ "type": "host", "value": "^(www\\.)?elrlex\\.it$" }], "destination": "https://lrlex.it/", "permanent": true },
    { "source": "/professionisti", "has": [{ "type": "host", "value": "^(www\\.)?elrlex\\.it$" }], "destination": "https://lrlex.it/pages/team.html", "permanent": true },
    { "source": "/contatti", "has": [{ "type": "host", "value": "^(www\\.)?elrlex\\.it$" }], "destination": "https://lrlex.it/pages/contatti.html", "permanent": true },
    { "source": "/en", "has": [{ "type": "host", "value": "^(www\\.)?elrlex\\.it$" }], "destination": "https://lrlex.it/en/", "permanent": true },
    { "source": "/en/:path*", "has": [{ "type": "host", "value": "^(www\\.)?elrlex\\.it$" }], "destination": "https://lrlex.it/en/", "permanent": true },
    { "source": "/:path*", "has": [{ "type": "host", "value": "^(www\\.)?elrlex\\.it$" }], "destination": "https://lrlex.it/", "permanent": true }
  ],
  "rewrites": [
    { "source": "/category/:path*", "destination": "/410" }
  ],
  "headers": [
    { "source": "/category/(.*)", "headers": [{ "key": "X-Robots-Tag", "value": "noindex, nofollow" }] },
    { "source": "/assets/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/(.*\\.html)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }] },
    { "source": "/data/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=300" }] },
    { "source": "/sitemap.xml", "headers": [{ "key": "Cache-Control", "value": "public, max-age=3600" }, { "key": "Content-Type", "value": "application/xml; charset=utf-8" }] },
    { "source": "/robots.txt", "headers": [{ "key": "Cache-Control", "value": "public, max-age=3600" }, { "key": "Content-Type", "value": "text/plain; charset=utf-8" }] }
  ]
}
```

Differenze su `origin/main`: `"buildCommand"` è `null` (non `"npm run build"`) e **mancano** i due redirect `/pages/news.html` → `/insights` e `/pages/news` → `/insights`. Tutti gli altri redirect (incluso il set host-conditional `elrlex.it`) sono presenti anche su main.

## 3. JSON-LD

Presente. Blocchi `application/ld+json` per pagina (HTML committati):

| File | `@type` presenti |
|------|------------------|
| `index.html` | Organization+LegalService (nodo `#lawfirm`), WebSite; con `PostalAddress`, `GeoCoordinates`, `OpeningHoursSpecification`, `Country` (areaServed) |
| `pages/team.html` | Attorney (nodo `#gianluca-leotta`), Organization `#lawfirm`, PostalAddress, Country |
| `en/index.html` | WebSite, PostalAddress, Country |
| `en/pages/team.html` | Attorney, PostalAddress, Country |
| `en/story/2000-11-panorama-internet-aggregation.html` | NewsArticle, NewsMediaOrganization, Person, WebSite |

Le altre pagine (`pages/aree-di-pratica.html`, `pages/contatti.html`, `pages/track-record.html`, ecc.) non contengono JSON-LD.

Pagine `/insights` (generate da `scripts/build-insights.mjs`, output non committato): ogni articolo emette **`Article`** e **`FAQPage`** costruiti da `scripts/lib/schema.mjs` (`buildArticleSchema`/`buildFaqSchema`), con `FAQPage` derivato dal `faq` del frontmatter. Nel working tree la cartella `insights/` è un artefatto di build (git-ignored).

## 4. Generazione di title, meta description, canonical

Due meccanismi distinti:

- **Pagine statiche** (`index.html`, `pages/*.html`, `en/**`): `title`, `meta name="description"` e `link rel="canonical"` sono **hardcoded inline** nel `<head>` di ciascun file HTML. Esempio (`pages/contatti.html`):
  - `<title>Contatti — LR LEX</title>`
  - `<meta name="description" content="Contatta LR LEX a Milano. Foro Buonaparte 51, 20121 Milano. info@lrlex.it">`
  - `<link rel="canonical" href="https://lrlex.it/pages/contatti.html">`
  - `index.html` include inoltre, hardcoded, Open Graph, Twitter Card, `hreflang` it/en/x-default.
  - Le pagine legali `pages/privacy-policy.html`, `pages/note-legali.html`, `en/pages/legal-notice.html`, `en/pages/privacy-policy.html` hanno `<head>` minimale (title + favicon; sono stub con `meta http-equiv="refresh"` verso Iubenda) e non hanno canonical.
- **Pagine `/insights`** (branch phase-2): `title`, `description`, `canonical`, `hreflang` e Open Graph sono **generati da codice** dalla funzione `head()` in `scripts/build-insights.mjs`, a partire dal frontmatter MDX (`title`, `description`, `slug`, `alternate`, `lang`).

## 5. URL serviti e file corrispondente

Mapping file → URL (con `cleanUrls: true` l'estensione `.html` è servita anche senza estensione; `trailingSlash: false`).

**Italiano:**
| File | URL |
|------|-----|
| `index.html` | `/` |
| `pages/aree-di-pratica.html` | `/pages/aree-di-pratica` |
| `pages/team.html` | `/pages/team` |
| `pages/contatti.html` | `/pages/contatti` |
| `pages/track-record.html` | `/pages/track-record` |
| `pages/gianluca-leotta-storia.html` | `/pages/gianluca-leotta-storia` |
| `pages/gaetano-bentivegna-track-record.html` | `/pages/gaetano-bentivegna-track-record` |
| `pages/carla-talarico-track-record.html` | `/pages/carla-talarico-track-record` |
| `pages/news.html` | `/pages/news` (redirect 301 → `/insights`, phase-2) |
| `pages/rassegna-stampa.html` | `/pages/rassegna-stampa` |
| `pages/note-legali.html` | `/pages/note-legali` |
| `pages/privacy-policy.html` | `/pages/privacy-policy` |

**Inglese:**
| File | URL |
|------|-----|
| `en/index.html` | `/en/` |
| `en/pages/practice-areas.html` | `/en/pages/practice-areas` |
| `en/pages/team.html` | `/en/pages/team` |
| `en/pages/contatti.html` | `/en/pages/contatti` |
| `en/pages/track-record.html` | `/en/pages/track-record` |
| `en/pages/gianluca-leotta-story.html` | `/en/pages/gianluca-leotta-story` |
| `en/pages/gaetano-bentivegna-track-record.html` | `/en/pages/gaetano-bentivegna-track-record` |
| `en/pages/carla-talarico-track-record.html` | `/en/pages/carla-talarico-track-record` |
| `en/pages/news.html` | `/en/pages/news` |
| `en/pages/press-coverage.html` | `/en/pages/press-coverage` |
| `en/pages/aree-di-pratica.html` | `/en/pages/aree-di-pratica` (redirect 301 → `/en/pages/practice-areas`) |
| `en/pages/legal-notice.html` | `/en/pages/legal-notice` |
| `en/pages/privacy-policy.html` | `/en/pages/privacy-policy` |
| `en/story/2000-11-panorama-internet-aggregation.html` | `/en/story/2000-11-panorama-internet-aggregation` |

**Generate (branch phase-2, output di build, non committate):**
| Sorgente | URL |
|----------|-----|
| `content/insights/*.mdx` → `insights/index.html` | `/insights` |
| `content/insights/<file>.mdx` → `insights/<slug>.html` | `/insights/<slug>` |
| `content/argomenti/<practice>.md` → `insights/argomenti/<practice>.html` | `/insights/argomenti/<practice>` (generata solo se esiste il file intro) |

**Speciali:** `410.html` → `/410` (rewrite `/category/*` → `/410`); `robots.txt` → `/robots.txt`; `sitemap.xml` → `/sitemap.xml`.

**In repo ma NON serviti:** `archive/elrlex/snapshots/*.html` (esclusi dal deploy tramite `.vercelignore` che ignora `archive/`).

## 6. Design system, font, palette

- **CSS custom, nessun framework.** Un unico foglio: `assets/css/styles.css` (~56 KB). **Nessun Tailwind** (nessun riferimento `tailwind` in `.css`/`.json`/`.js`; nessuna config).
- **Font** caricati da **Google Fonts CDN** (non self-hosted), con questo URL in `index.html`:
  `https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400&family=Manrope:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap`
  - **Fraunces** (serif display), **Manrope** (sans, corpo), **JetBrains Mono** (monospace).
- **Palette** — token `:root` in `styles.css`:
  | Token | Valore |
  |-------|--------|
  | `--ink` | `#0F1419` |
  | `--ink-soft` | `#1B2027` |
  | `--cream` | `#F5F1E8` |
  | `--cream-deep` | `#ECE5D2` |
  | `--paper` | `#FFFFFF` |
  | `--brass` | `#B08D57` |
  | `--brass-deep` | `#8E6F3E` |
  | `--gray-700` | `#3D4148` |
  | `--gray-500` | `#6B6F76` |
  | `--gray-300` | `#C8C5BD` |
  | `--gray-100` | `#E8E4DA` |

## 7. robots.txt e sitemap.xml

Entrambi esistono nella root.

**`robots.txt`** (contenuto integrale):
```
# https://www.lrlex.it/ — LR LEX
User-agent: *
Allow: /

Sitemap: https://lrlex.it/sitemap.xml
```

**`sitemap.xml`** — 17 `<loc>` nel working tree del branch phase-2:
```
https://lrlex.it/
https://lrlex.it/pages/aree-di-pratica.html
https://lrlex.it/pages/team.html
https://lrlex.it/pages/news.html
https://lrlex.it/pages/contatti.html
https://lrlex.it/pages/track-record.html
https://lrlex.it/pages/gaetano-bentivegna-track-record.html
https://lrlex.it/pages/carla-talarico-track-record.html
https://lrlex.it/en/
https://lrlex.it/en/pages/practice-areas.html
https://lrlex.it/en/pages/team.html
https://lrlex.it/en/pages/news.html
https://lrlex.it/en/pages/contatti.html
https://lrlex.it/en/pages/track-record.html
https://lrlex.it/en/pages/gaetano-bentivegna-track-record.html
https://lrlex.it/en/pages/carla-talarico-track-record.html
https://lrlex.it/insights
```
La voce `https://lrlex.it/insights` è aggiunta dal build phase-2 (`scripts/build-insights.mjs`, funzione `updateSitemap`). Su `origin/main` il file contiene le 16 voci senza `/insights`. Nota: `/pages/news.html` è presente in sitemap ed è al contempo sorgente di un redirect 301 verso `/insights` (branch phase-2).

## 8. Stato merge di `seo/phase-2-insights`

- **NON mergiato in `main`.** `git branch -r --merged origin/main` elenca: `origin/main`, `origin/seo/phase-0-elrlex-migration`, `origin/seo/phase-0-hotfix-root-redirect`, `origin/seo/gbp-localbusiness-signals`. `seo/phase-2-insights` **non** compare.
- `origin/main` HEAD: `d8cfa92` (“Merge pull request #3 … seo/gbp-localbusiness-signals”).
- Commit presente su `seo/phase-2-insights` e assente da main: **`5848920`** — “feat(insights): sistema editoriale /insights come SSG (phase-2)”.
- Contenuto che il branch aggiunge rispetto a main (dal commit `5848920`):
  - Nuovi: `package.json`, `package-lock.json`, `scripts/` (`build-insights.mjs`, `check-content.mjs`, `lib/content.mjs`, `lib/practices.mjs`, `lib/schema.mjs`), `content/` (vedi §9), `.github/workflows/content-check.yml`.
  - Modificati: `vercel.json` (`buildCommand` + redirect news→insights), `sitemap.xml` (+`/insights`), `.gitignore` (aggiunta `/insights/` e `node_modules/`).
- Ciò che main **già contiene** (mergiato in precedenza): redirect host-conditional `elrlex.it`→`lrlex.it`; `index.html` con `geo`, `openingHoursSpecification`, `sameAs` (`company/lrlex` + `in/gianlucaleotta`).

## 9. Contenuto di `content/`

Presente solo sul branch `seo/phase-2-insights`. File:

```
content/
├── practices.json            # registro pillar/practice: slug, label, url. 12 voci.
├── blocklist.json            # { terms: [...] } nominativi vietati (ex professionisti + email storiche)
├── deals.json                # { deals: [{slug, published}] } — STAND-IN locale di Supabase, 5 voci
├── people/
│   ├── gianluca-leotta.json      # { slug, name, jsonldId, url }
│   ├── gaetano-bentivegna.json   # idem (+ _note: anchor da creare)
│   └── carla-talarico.json       # idem (+ _note: anchor da creare)
└── insights/
    └── 2026-08-golden-power-quando-notificare.mdx   # 1 articolo, frontmatter + corpo; marker <!-- DRAFT --> attivo
```

Non esiste `content/argomenti/` (le pagine argomento non hanno file intro). `content/insights/` contiene un solo `.mdx`, con `published`/`updated` a valore placeholder `"2026-08-XX"` e marker `DRAFT`.

## 10. Credenziali / riferimenti a Supabase

- **Nessuna credenziale Supabase nel repo.** Nessun `SUPABASE_URL`/`SUPABASE_*`/`ANON_KEY`/`service_role`; nessun file `.env*` versionato; nessuna dipendenza `@supabase/supabase-js`.
- Gli unici riferimenti a Supabase sono **testuali (commenti/nota)**, non configurazione attiva:
  - `content/deals.json` → campo `_note`: dichiara il file come “STAND-IN LOCALE per Supabase … a build non ci sono credenziali Supabase … sostituire con una fetch a Supabase quando le credenziali sono disponibili”.
  - `scripts/lib/content.mjs` → commenti (righe ~22, ~86) e messaggio di errore (~89): la validazione di `related_deals` avviene contro `content/deals.json` (funzione `loadDeals`), descritto come stand-in di Supabase.
- In sintesi: l'integrazione Supabase **non è configurata**; `related_deals` è validato contro il registro locale `content/deals.json`.

---

## Appendice — Incidente deploy Vercel del `buildCommand` (2026-07-29)

> ⚠️ **Log esatto non disponibile.** Non ho accesso al dashboard Vercel né ai build log del progetto. Quanto segue è la **diagnosi dedotta dai sintomi osservati via `curl`**, non il messaggio di errore catturato. Il log reale va recuperato dal dashboard Vercel (Deployments → deployment fallito → Build Logs) per conferma.

**Contesto.** Il merge di `seo/phase-2-insights` in `main` ha introdotto in `vercel.json` `"buildCommand": "npm run build"` (framework `null`, `outputDirectory` `null`).

**Sintomi osservati in produzione dopo il merge** (poll `curl`, ~3 min):
- `https://lrlex.it/` , `/pages/team`, `/pages/aree-di-pratica` → **200** (sito NON rotto)
- `https://lrlex.it/insights` → **404** (pagina generata non servita)
- `https://lrlex.it/pages/news.html` → 308 verso **`/pages/news`** (redirect *vecchio*, non il nuovo `→ /insights`)

Il fatto che anche i redirect di `vercel.json` fossero ancora quelli vecchi indica che **l'intero nuovo deploy non è andato live**: Vercel ha mantenuto l'ultimo deployment andato a buon fine (pre-phase-2).

**Causa dedotta.** Con framework "Other" (`null`) e un `buildCommand`, ma senza `outputDirectory`, Vercel cerca una cartella di output di default (`public/`) che nel repo non esiste. L'errore atteso è della famiglia:

```
Error: No Output Directory named "public" found after the Build completed.
Configure the Output Directory in your Project Settings.
```

Il build fallisce → Vercel **conserva il deploy precedente** (perciò il sito resta su, ma senza le novità).

**Fattore aggravante.** La sola presenza di uno script `"build"` in `package.json` fa sì che Vercel esegua comunque `npm run build` anche riportando `"buildCommand": null` in `vercel.json`: il tentativo di tornare statici cambiando solo `buildCommand` **non è bastato** (il deploy ha continuato a fallire allo stesso modo).

**Risoluzione applicata.** Ripristino di una pipeline **statica pura**: l'output SSG (`insights/`) è **committato** e la toolchain di build (`package.json`, `scripts/`, `content/`, `.github/`) è **esclusa dal deploy** via `.vercelignore`, così Vercel non rileva alcun build e serve direttamente l'HTML committato. Post-fix: `https://lrlex.it/insights` → **200**. Il build gira ora solo in locale e in CI (GitHub Actions), non su Vercel.
