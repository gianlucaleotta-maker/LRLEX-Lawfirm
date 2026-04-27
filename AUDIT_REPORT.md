# Audit tecnico — LR LEX (sito statico → Next.js 15 + Sanity, Turborepo)

**Contesto:** codebase esaminata in workspace `/Users/gianlucaleotta/Developer/lrlex`. Il sito pubblicabile risiede in **`lrlex-website/`** (HTML/CSS/JS, deploy Vercel). Nessun altro file è stato modificato oltre la creazione di questo report.

**Data audit:** 28 aprile 2026.

---

## 1. INVENTARIO STRUTTURALE

### 1.1 Albero logico (esclusi `node_modules`, `.git`, `.vercel`)

```
lrlex/
├── AUDIT_REPORT.md          (questo file)
└── lrlex-website/
    ├── README.md
    ├── .gitignore
    ├── vercel.json
    ├── index.html
    ├── pages/                 (9 file HTML — italiano)
    ├── en/
    │   ├── index.html
    │   └── pages/             (9 file HTML — inglese)
    ├── assets/
    │   ├── css/styles.css
    │   ├── js/main.js
    │   ├── img/…
    │   ├── brand/…            (loghi sorgente, PDF, PNG, ecc.)
    │   └── vcards/*.vcf
    └── data/
        ├── news.json
        └── news-en.json
```

*(Nel workspace compaiono anche `.env.local` sotto `lrlex-website/` — da non versionare; escluso dal dettaglio strutturale.)*

### 1.2 File HTML — titolo, dimensione, meta SEO di base

| File | Titolo (`<title>`) | Dimensione (byte) | Meta description | Open Graph | `rel="canonical"` | JSON-LD schema.org |
|------|-------------------|-------------------|------------------|------------|-------------------|---------------------|
| `lrlex-website/index.html` | LR LEX \| Studio Legale d'Affari, Milano | 17 845 | Sì | Sì (`og:title`, `og:description`, `og:type`) | **No** | **No** |
| `pages/aree-di-pratica.html` | Aree di Pratica — LR LEX | 17 835 | Sì | **No** | **No** | **No** |
| `pages/team.html` | Professionisti — LR LEX | 20 843 | Sì | **No** | **No** | **No** |
| `pages/news.html` | News & Insights — LR LEX | 4 961 | Sì | **No** | **No** | **No** |
| `pages/contatti.html` | Contatti — LR LEX | 12 952 | Sì | **No** | **No** | **No** |
| `pages/track-record.html` | Track Record di Gianluca Leotta — LR LEX | 14 959 | Sì | **No** | **No** | **No** |
| `pages/carla-talarico-track-record.html` | Track Record di Carla Talarico — LR LEX | 6 105 | Sì | **No** | **No** | **No** |
| `pages/gaetano-bentivegna-track-record.html` | Track Record di Gaetano Bentivegna — LR LEX | 3 387 | Sì | **No** | **No** | **No** |
| `pages/privacy-policy.html` | Privacy Policy — LR LEX | 3 924 | Sì | **No** | **No** | **No** |
| `en/index.html` | LR LEX \| Business Law Firm, Milan | 5 492 | Sì | **No** | **No** | **No** |
| `en/pages/*.html` (9 file) | Varianti EN dei titoli sopra | 3 378–15 266 | Sì | **No** | **No** | **No** |

### 1.3 Cartella `assets/` — riepilogo

| Categoria | File / note | Formati | Dimensioni indicative |
|-----------|-------------|---------|------------------------|
| **CSS** | `assets/css/styles.css` | CSS | ~46 KB |
| **JS** | `assets/js/main.js` | JS | ~11 KB |
| **Font** | Nessun file font in repo | — | Caricati da **Google Fonts** (CDN): Fraunces, Manrope, JetBrains Mono |
| **Immagini `img/`** | Logo varianti, favicon, foto team (jpg/png @1x/@2x), loghi associazioni, ritratti PNG singoli | PNG, JPG, SVG | Singoli file da ~2 KB a ~347 KB (`team/*@2x.jpg`) |
| **`img/team/`** | 8 professionisti + varianti @2x dove presente | JPG/PNG | ~56 KB–347 KB per file @2x |
| **`brand/`** | Moltiplicazione asset marchio (PDF ~390 KB, PNG, JPG, TIFF, JPF, biglietti da visita PDF) | PDF, PNG, JPG, TIFF, JPF | **~3,8 MB** totali cartella (soprattutto PDF) |
| **vCard** | 9 file `.vcf` | VCF | ~254–286 B ciascuno *(il JS genera anche vCard on-the-fly al click su link download)* |

**Peso aggregato (comando `du -sh`):** `assets/` **~6,4 MB** (di cui `img/` ~2,5 MB, `brand/` ~3,8 MB).

### 1.4 Cartella `data/`

| File | Contenuto |
|------|-----------|
| `news.json` | Array JSON di **10** articoli/notizie per la lingua italiana (campi: `id`, `date`, `category`, `title`, `excerpt`, `url`, `external`, `featured`). |
| `news-en.json` | Stessa struttura, **10** voci in inglese. |

Consumati da `main.js` (`LRLEX.loadNews`) con override del path su `en/index.html` e `en/pages/news.html` verso `news-en.json`.

### 1.5 Cartella `en/` vs versione italiana

| Aspetto | Italiano | Inglese (`en/`) |
|---------|----------|-----------------|
| **Numero pagine HTML** | 1 root + 9 in `pages/` = **10** | 1 + 9 = **10** — **stesso insieme di URL logici** |
| **Pagine mancanti in EN** | — | Nessuna rispetto all’IT per elenco file |
| **Pagine “in più” in EN** | — | Nessuna |
| **Differenze di contenuto** | `aree-di-pratica.html`: **testi lunghi** per sezione (molteplici paragrafi). | `en/pages/aree-di-pratica.html`: **stesso numero di ancore** (#corporate, #ma, …) ma **copy fortemente compressa** (principalmente titolo + `lede` breve). |
| **News** | Default `data/news.json` | `newsEndpoint` impostato a `../data/news-en.json` o `../../data/news-en.json` dove previsto |
| **UI/UX** | Pagina `news.html` IT: nessun blocco CTA dedicato a Track Record sotto la griglia | `en/pages/news.html`: sezione aggiuntiva con pulsante **“Track Record & Publications”** |
| **Footer “Naviga”** | Su `news.html` IT la colonna navigazione **non** include il link a Track Record (presente altrove sull’home) | Footer EN in `news.html` include **Track Record** nella lista |

**Anchor ID:** in EN `aree-di-pratica` il link sidebar “Capital Markets” punta a `#capital` mentre l’articolo usa `id="capital"` — coerente; “Real estate” usa `#realestate` vs articolo `id="realestate"` — coerente.

---

## 2. CONTENUTI ESTRATTI (italiano)

*Metodologia:* estrazione automatica da HTML (testo nel `<body>`, script esclusi). Il file `privacy-policy.html` risulta **troncato** nel repository (vedi §5/§8); il conteggio parole è pertanto solo parziale.

### 2.1 Per pagina — H1, outline H2/H3, parole, CTA principali

#### `index.html` (Home)
- **H1:** *Diritto d'affari che genera valore.* (con `<em>` interno)
- **H2:** Nove aree…; Una boutique…; Operazioni recenti…; Premi e riconoscimenti.
- **H3:** 9 titoli area nella griglia pratiche + struttura news generata da JS (template con `<h3>` per card).
- **Parole (corpo, stima):** ~633
- **CTA principali (testo → destinazione):**
  - *Le nostre aree* → `pages/aree-di-pratica.html`
  - *Parla con un partner* → `pages/contatti.html`
  - *Conosci i professionisti* → `pages/team.html`
  - *Tutte le news* → `pages/news.html`
  - *Track record e pubblicazioni* → `pages/track-record.html`
  - Link esterni membership (AmCham, British Chamber, Assifact, AIFO, Assoprevidenza)
  - Nav: *Contatti →* → `pages/contatti.html`, switch lingua *EN* → `en/index.html`

#### `pages/aree-di-pratica.html`
- **H1:** *Aree di Pratica*
- **H2:** 10 sezioni dettaglio (Corporate, M&A, VC/PE, Capital Markets, Ristrutturazioni, Tech, IP, Privacy, Contenzioso, Real estate/admin)
- **H3:** 0 nel corpo principale
- **Parole:** ~1 150
- **CTA:** navigazione interna ad ancore `#corporate`, `#ma`, … (sidebar); nessun form.

#### `pages/team.html`
- **H1:** *I Professionisti*
- **H2:** Founding Partner; I Partner; Associate e Of Counsel; Office Manager; *Lavora con noi* (blocco CTA)
- **H3:** Nomi (Gianluca Leotta, Debora Folisi, Carla Talarico, Gaetano Bentivegna, Maria Francesca Tucci, Shqipe Mahmuti, Francesco Cordova, Rocco Pierri, Giulia Savorelli)
- **Parole:** ~530
- **CTA:** Email (mailto via `data-mail-*`), vCard, LinkedIn per ciascuno; *Track record* dove applicabile; *Invia la candidatura* → `mailto:segreteria@lrlex.it?subject=…`

#### `pages/news.html`
- **H1:** *News & Insights*
- **H2/H3:** 0 statici; griglia popolata da JS
- **Parole:** ~101 (hero + footer; contenuto dinamico)
- **CTA:** carica da JSON (link “Leggi” per card)

#### `pages/contatti.html`
- **H1:** *Contatti.*
- **H2:** Sede di Milano; Scrivici subito; Foro Buonaparte… (sede)
- **H3:** Foro Buonaparte, 51 (card sede)
- **Parole:** ~209
- **CTA:** *Invia richiesta* (apre `mailto:info@lrlex.it` con body precompilato); *Indicazioni stradali* → Google Maps; telefono `tel:`; marker mappa → Maps esterno

#### `pages/track-record.html`, `carla-talarico-track-record.html`, `gaetano-bentivegna-track-record.html`
- **H1:** rispettivamente Track Record di **Gianluca Leotta** / **Carla Talarico** / **Gaetano Bentivegna**
- **H2:** sezioni tipo “Operazioni pubbliche selezionate” / struttura analoga
- **Parole (stima):** ~401 / ~169 / ~51
- **CTA:** link a fonti esterne (Legalcommunity, ecc.) dove presenti

#### `pages/privacy-policy.html`
- **H1:** *Privacy Policy*
- **H2:** almeno “1. Titolare…”, “2. Tipologie…” (file **incompleto** nel repo)
- **Parole:** ~165 nel frammento presente (il documento non termina con `</html>` / chiusure complete)

### 2.2 Bio avvocati / team

| Aspetto | Dettaglio |
|---------|-----------|
| **Formato** | **HTML hardcoded** in `pages/team.html` (e mirror EN). Nessun JSON/CMS per anagrafiche. |
| **Struttura** | Sezioni: Founder (layout `founder--compact`); Partner (card `team-card`); Associate/Of Counsel; Office Manager. |
| **Campi ricorrenti** | `person__role`, `h3.person__name`, `p.person__bio` o `founder__lede` / `founder__bio`, azioni Email/vCard/LinkedIn. |
| **Conteggio profili con bio testuale** | **9** figure con paragrafo biografico: Gianluca Leotta, Debora Folisi, Carla Talarico, Gaetano Bentivegna, Maria Francesca Tucci, Shqipe Mahmuti, Francesco Cordova, Rocco Pierri, Giulia Savorelli. |

### 2.3 Aree di pratica — lista (titolo + descrizione breve da home)

Allineate alla griglia in `index.html` (9 card in home; la pagina dettaglio include anche **Real estate / amministrativo** come decima area nel long-form):

1. **Diritto societario & Corporate governance** — Consulenza su governance, organi, partecipazioni e vita societaria.  
2. **M&A e Finanza straordinaria** — Acquisizioni, fusioni, JV, ristrutturazioni, mid-market e family business.  
3. **Venture capital & Private equity** — Seed/Series, exit, fondi e startup.  
4. **Capital markets & ECM/DCM** — Quotazioni, aumenti, debito, tokenizzazione dove pertinente.  
5. **Ristrutturazioni & Crisi d’impresa** — Debito, concordati, Codice della crisi, debitore/creditore.  
6. **Tech, Data & IT/Media** — IT, media, telecom, dati, compliance e M&A di settore.  
7. **Intellectual property (IP)** — Marchi, brevetti, know-how, software.  
8. **Diritto della privacy** — GDPR, governance dati, cookie, breach.  
9. **Contenzioso & Arbitrati** — Civile, societario, arbitrati, ADR.  
10. **Diritto amministrativo, ambientale e Real estate** — Progetti immobiliari, autorizzazioni, fondi/SGR (dettaglio principalmente in `aree-di-pratica.html`, non nella card home se si conta solo 9 tile — in home sono **9** link tile; la decima area compare nel dettaglio pagina aree).

*Nota numerica:* in home la griglia `practices__grid` contiene **9** tile `<a class="practice">`; la pagina `aree-di-pratica.html` elenca **10** voci nella sidebar (include Real estate come voce separata). Allineare in migrazione il modello dati (9 vs 10) se si unifica con Sanity.

---

## 3. DESIGN SYSTEM (osservato dal CSS)

### 3.1 Palette e token (`:root` in `styles.css`)

| Token / uso | Valore |
|---------------|--------|
| `--ink` | `#0F1419` |
| `--ink-soft` | `#1B2027` |
| `--cream` | `#F5F1E8` |
| `--cream-deep` | `#ECE5D2` |
| `--paper` | `#FFFFFF` |
| `--brass` | `#B08D57` |
| `--brass-deep` | `#8E6F3E` |
| `--gray-700` / `--gray-500` / `--gray-300` / `--gray-100` | `#3D4148` / `#6B6F76` / `#C8C5BD` / `#E8E4DA` |
| Header/footer scuri | `#24272b` (hardcoded oltre ai token) |
| Linee | `rgba(15, 20, 25, 0.12)` ecc. |

**Inconsistenza:** in più punti del CSS compaiono **`var(--gray-600)`** (es. `.contact-info__label`, track-record overrides) ma **`--gray-600` non è definito** in `:root` → rischio colore invalido / fallback imprevedibile nei browser.

### 3.2 Tipografia

- **Display:** `"Fraunces", "Cormorant Garamond", Georgia, serif` — pesi dichiarati nel link Google (300–500, italic).  
- **Body:** `"Manrope", …` — 300–700.  
- **Mono:** `"JetBrains Mono", …` — 400–500.  
- **Scala:** `--text-xs` … `--text-6xl` (rem); heading con `clamp()` su viewport.  
- **Pesi heading:** regole globali `h1…h5` con `font-weight: 350` (Fraunces variable).

### 3.3 Spaziature

- Token `--space-1` … `--space-8` (0,5rem → 9rem).  
- Sezioni: `.section` con `padding: clamp(4rem, 10vw, var(--space-8))`.  
- Gutter: `--gutter: clamp(1.25rem, 4vw, 3rem)`.

### 3.4 Breakpoint responsive

- **`@media (max-width: 900px)`** — menu mobile, griglie a colonna singola, footer 2 colonne, ecc.  
- **`@media (max-width: 600px)`** — ulteriore compattazione (membership 1 col, logo più piccolo).  
- **`@media (max-width: 1200px)`** — override specifici pagine Track Record.

### 3.5 Componenti riconoscibili

- **Header sticky** `.site-header` + nav `.nav`, CTA pill `.nav__cta`, toggle `.nav__toggle`.  
- **Hero** `.hero` / sottopagine `.page-hero`.  
- **Bottoni** `.btn`, varianti `--primary`, `--ghost`, `--dark`.  
- **Card pratiche** `.practice`, **card news** `.news__card`, **card team** `.team-card`, **blocco founder** `.founder`.  
- **Footer** `.site-footer` con griglia 4 colonne.  
- **Marquee metriche**, **riconoscimenti** `.recognitions__*`, **CTA block** `.cta-block`, **sede** `.sede-card`, **form contatti** (markup in pagina).

### 3.6 Pattern inconsistenti

- Stili **inline** diffusi (`style="margin:…"`, colori) accanto al design system — maggiore debito in migrazione a componenti React.  
- Colore **`#24272b`** ripetuto invece di token.  
- **`--gray-600`** usato ma non definito.  
- `privacy-policy.html` usa markup header leggermente diverso (`<div class="container nav">` vs `<nav class="nav">`) rispetto alle altre pagine.

---

## 4. SEO READINESS

| Elemento | Stato |
|----------|--------|
| **`sitemap.xml`** | **Assente** nel repository |
| **`robots.txt`** | **Assente** nel repository |
| **`vercel.json`** | `cleanUrls: true`, `trailingSlash: false`. **Headers:** cache lunga su `/assets/*`, `no-cache` su `*.html`, cache 300s su `/data/*`. **Nessun** redirect/rewrite esplicito nel file. |
| **Meta title/description** | Presenti su tutte le pagine campionate (IT e EN) |
| **Open Graph** | Solo **homepage IT** (`og:title`, `og:description`, `og:type`). Mancano `og:url`, `og:image`, `og:locale`. **EN home:** nessun OG. |
| **Twitter Card** | **Assente** ovunque |
| **Canonical** | **Assente** su tutte le pagine |
| **Schema.org JSON-LD** | **Assente** |
| **Immagini** | Prevalentemente **PNG/JPG**; nessun AVIF/WebP in `img/`. `loading="lazy"` usato su molte immagini (membership, team); hero/founder in parte `eager`. |
| **Font** | **CDN Google Fonts** (non self-hosted). |
| **hreflang** | **Non configurato** (nessun `<link rel="alternate" hreflang="…">`) |

---

## 5. COMPLIANCE LEGALE (studio legale italiano)

| Requisito | Evidenza nel codebase |
|-----------|------------------------|
| **Privacy policy** | File `pages/privacy-policy.html` (e `en/pages/privacy-policy.html`) con testo GDPR-oriented in apertura, **ma il file IT nel repo è troncato** (termina a metà elenco puntato, senza chiusure HTML complete) → **non pubblicabile così com’è**. |
| **Link da footer / form** | Footer su home e pagine principali: `Privacy Policy`, `Cookie Policy`, `Note Legali` puntano a **`href="#"`** (segnaposto). Il form contatti collega la checkbox a **`href="#"`** per la privacy → **non conforme** a buona prassi né al testo della checkbox. |
| **Cookie banner** | **Assente.** Nessuno script di categorizzazione cookie, nessun layer CMP. Con Google Maps embed e Fonts da Google si generano trattamenti da informativa/banner se qualificati non strettamente tecnici — da valutare con legale. |
| **Footer D.Lgs. 70/2003** | Presenti: **ragione sociale** (“LR LEX — Avvocati Associati”), **P.IVA**, **indirizzo** (Foro Buonaparte 51, Milano), **PEC**, telefono/fax, email. **Non** risultano nel footer: **iscrizione albo avvocati**, **numero di iscrizione**, **C.F.** se richiesto dal modello informativa — **grep** su HTML: nessun match per “Ordine”, “Albo”, “D.Lgs. 70”, “70/2003”. |
| **Termini di utilizzo** | Link “**Note Legali**” presente come testo ma con **`href="#"`** — **nessun contenuto** dedicato nel repo. |
| **Form contatti** | Presente con checkbox testuale GDPR; **link privacy rotto**; invio tramite **`mailto:`** lato client (nessun backend documentato in produzione). |

---

## 6. ACCESSIBILITÀ

| Criterio | Valutazione |
|----------|--------------|
| **`alt` immagini** | Copertura **molto alta** su logo, team, membership. Eccezione: `contatti.html` — `alt=""` sul logo nel marker mappa (link padre con `aria-label` “Apri l’indirizzo…”) → difendibile ma da allineare a linee guida interne. |
| **Gerarchia heading** | Ogni pagina analizzata ha **un solo `<h1>`** nel markup statico. La home dopo load news aggiunge `<h3>` nelle card (struttura tipica lista articoli). |
| **Contrasto** | Palette scura `#24272b` + testo cream / brass su hero: **qualitativamente buona**; pagine Track Record con override chiaro/scuro e molte regole `!important` per evitare testo illeggibile — indicano problemi già mitigati in CSS. |
| **`lang`** | IT: `<html lang="it">` sulle pagine italiane; EN: `lang="en"` su `en/*`. **Coerente.** |
| **ARIA** | `aria-label` su logo home, menu toggle, alcuni `aria-hidden` su frecce; **aria-expanded** su toggle presente in markup in alcune pagine ma **non aggiornato da `main.js`** al click → gap WCAG per stato del menu. |
| **Form** | Campi senza `<label>` associato via `for`/`id` (solo `placeholder`) → **debole** per screen reader. |

---

## 7. ASSET DA MIGRARE

### 7.1 Immagini per funzione

- **Logo / brand:** `lrlex-logo*.png/svg`, `favicon.png`, varianti orizzontali/bianche per footer e header.  
- **Foto professionisti:** `gianluca-leotta.png`, `debora-folisi.png`, `team/*.jpg|png` (+ `@2x`).  
- **Partner istituzionali:** loghi AmCham, British Chamber, Assifact, AIFO, Assoprevidenza.  
- **Hero/social:** `lrlex-logo-hero-1200x627.png` (candidato OG image).  
- **`assets/brand/`:** archivio sorgente stampa/social (PDF pesanti, duplicati “copia”) — valutare cosa serve al web vs solo archivio studio.

### 7.2 Video / PDF / download

- **Video:** nessun file video nel tree esaminato.  
- **PDF:** in `assets/brand/` (loghi vettoriali, biglietti da visita).  
- **vCard:** `.vcf` in `assets/vcards/` + generazione Blob in JS.

### 7.3 Font e licenze

- **Fraunces, Manrope, JetBrains Mono** via **Google Fonts** — tipicamente licenza **SIL OFL** / **Apache 2.0** a seconda della famiglia; verificare scheda Google Fonts per compliance e self-hosting in Next (ottimizzazione `next/font`).

### 7.4 Peso totale asset

- **`assets/`:** ~**6,4 MB** (include brand non tutti usati in pagina).  
- **Dati JSON news:** ~5 KB + ~4,8 KB.  
- **HTML complessivo:** ordine di decine di KB per pagina.

---

## 8. DEBIT TECNICO

| Area | Osservazione |
|------|----------------|
| **CSS** | Un solo file grande (~1 750 righe) con sezioni ben commentate; **duplicazione limitata** ma molti override pagina-specifici (track-record). Token **`--gray-600` mancante**. |
| **JS** | Quasi tutto in **`main.js`** esterno; **inline:** snippet minimo su `index.html` / `news.html` / `contatti.html` / `en/*` per news e form. |
| **Tracker** | **Nessun** Google Analytics, gtag, Facebook Pixel, Hotjar, Clarity nei file analizzati. |
| **Hardcoded** | Contatti, testi legali parziali, news in JSON, percorsi lingua, URL esterni riconoscimenti. |
| **Internazionalizzazione** | Duplicazione HTML IT/EN → rischio **drift** (già visibile tra `aree-di-pratica` IT vs EN). |
| **`privacy-policy.html` IT** | File **corrotto/incompleto** — priorità alta prima di qualsiasi go-live. |
| **Link legali** | `href="#"` ovunque per privacy/cookie/note → **debito UX/compliance**. |
| **SEO tecnico** | No sitemap/robots/canonical/hreflang/structured data. |
| **Form** | Nessuna API; mailto; checkbox privacy con link non valido. |
| **Inconsistenze nav/footer** | Esempio: colonna “Naviga” su `news.html` IT senza Track Record; altre pagine sì; EN news ha CTA a Track Record. |

---

## Sintesi per la migrazione (Next.js 15 + Sanity + Turborepo)

1. **Modello contenuti:** Practice areas (allineare 9 vs 10), People, News, Track records, Legal pages, Settings globali (footer, contatti, P.IVA, iscrizione albo se disponibile).  
2. **i18n:** sostituire duplicazione HTML con routing `app/[locale]` o equivalente + `hreflang` + contenuti Sanity localizzati.  
3. **SEO:** generare `sitemap.xml` / `robots.txt`, canonical, OG complete (incluso `og:image` da asset esistente 1200×627), JSON-LD `LegalService` / `Organization` / `Person` dove appropriato.  
4. **Compliance:** ripristinare privacy completa, collegare footer e form a route reali, valutare CMP + informativa cookie per Maps/Fonts/eventuali analytics futuri, integrare requisiti **D.Lgs. 70/2003** e albo forense nei testi footer o pagina “Note legali”.  
5. **Performance:** `next/image` (WebP/AVIF), self-host o `next/font` per ridurre terze parti, lazy map iframe.  
6. **Pulizia repo:** escludere o spostare fuori web build la cartella `assets/brand` se non serve al runtime (riduce peso deploy).

---

*Fine report.*
