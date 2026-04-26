# LR LEX — Sito Web Ufficiale

Sito statico per **Legali Riuniti Lex (LR LEX)** — Studio Legale d'Affari, Milano.

---

## Struttura del progetto

```
lrlex-website/
├── index.html                      ← Homepage
├── pages/
│   ├── aree-di-pratica.html        ← 9 pratiche con sidebar di navigazione
│   ├── team.html                   ← Partner, Senior Associate, Trainee
│   ├── news.html                   ← Archivio completo news (legge data/news.json)
│   └── contatti.html               ← Form, sede, mappa
├── data/
│   └── news.json                   ← ⭐ FILE NEWS — modifica qui per pubblicare nuove notizie
├── assets/
│   ├── css/styles.css              ← Design system completo
│   ├── js/main.js                  ← Navigazione, scroll-reveal, news loader
│   └── img/                        ← Cartella per future immagini (foto team, loghi)
└── README.md
```

---

## ⭐ Pubblicare una nuova notizia (30 secondi)

Apri `data/news.json` e aggiungi un blocco in **alto** (prima delle altre voci):

```json
{
  "id": "slug-univoco-della-notizia",
  "date": "2026-04-26",
  "category": "Deal Announcement",
  "title": "Titolo della notizia",
  "excerpt": "Breve descrizione che apparirà nella card (2-3 righe).",
  "url": "#",
  "external": false,
  "featured": true
}
```

**Categorie suggerite**: `Deal Announcement`, `M&A`, `Venture Capital`, `Riconoscimenti`, `Studio`, `Pubblicazioni`, `Insights`.

**Campi**:
- `id`: identificativo univoco (slug)
- `date`: formato `YYYY-MM-DD` — le news vengono ordinate dalla più recente
- `category`: visualizzata come "eyebrow" sopra il titolo
- `title`: max ~80 caratteri
- `excerpt`: max ~250 caratteri
- `url`: link a articolo esterno o `"#"` se non c'è
- `external`: `true` se il link è esterno (apre in nuova tab)
- `featured`: `true` se la prima card della homepage deve essere questa (più grande, sfondo nero)

**Importante**: la prima notizia (più recente) viene automaticamente mostrata in formato "featured" sulla homepage.

---

## Deploy in 5 minuti

### Opzione A — Hosting attuale (FTP)
1. Carica tutti i file (`index.html`, `pages/`, `assets/`, `data/`) nella root del sito via FTP.
2. Done.

### Opzione B — Vercel (consigliato, gratuito, CDN globale, deploy con un click)
1. Crea account su [vercel.com](https://vercel.com)
2. Drag-and-drop della cartella `lrlex-website/` su Vercel.
3. URL pubblicato automaticamente. Per dominio personalizzato `lrlex.it`: Settings → Domains → punta i DNS.

### Opzione C — Netlify (alternativa equivalente)
1. Account su [netlify.com](https://netlify.com)
2. Drag-and-drop cartella in [app.netlify.com/drop](https://app.netlify.com/drop)

### Opzione D — GitHub Pages
1. Push su repository GitHub
2. Settings → Pages → Branch: `main`, Folder: `/ (root)`

---

## Architettura API-ready (per il futuro)

Il sito è già strutturato per essere collegato a sistemi backend.

### News dinamiche (CMS / API)
In `assets/js/main.js`, modifica:

```js
window.LRLEX.config = {
  newsEndpoint: 'data/news.json'  // ← cambialo in: 'https://api.lrlex.it/news'
};
```

Il sito chiamerà l'endpoint con `fetch()` e renderizzerà le news. Il formato JSON atteso è esattamente lo stesso di `news.json`.

### Form contatti (CRM / Email service)
In `pages/contatti.html`, sezione `<script>` in fondo: il form attualmente apre il client di posta locale (`mailto:`). Per collegarlo a HubSpot, Salesforce, MailChimp o backend custom, sostituire con:

```js
fetch('https://api.lrlex.it/contact', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, email, company, area, message })
});
```

### Possibili integrazioni future
- **Area Clienti riservata** → aggiungere `pages/area-clienti.html` con auth JWT
- **Fatturazione/timesheet online** → API verso il gestionale studio
- **Newsletter** → integrazione MailChimp/Brevo
- **Calendario appuntamenti** → embed Calendly o API Google Calendar
- **Document automation** → integrazione DocuSign / Yousign
- **Search** → Algolia o Elasticsearch sulle news

---

## Personalizzazione design

Tutto il design è centralizzato in `assets/css/styles.css` nella sezione `:root` (variabili CSS):

```css
--ink: #0F1419;        /* nero principale */
--cream: #F5F1E8;      /* avorio sfondo */
--brass: #B08D57;      /* ottone accento */
--font-display: "Fraunces", serif;   /* titoli */
--font-body: "Manrope", sans-serif;  /* testo */
```

Modificando questi valori cambia automaticamente l'intero sito.

---

## Browser supportati

- Chrome / Edge / Safari / Firefox — ultime 2 versioni
- Mobile-responsive (breakpoint 900px e 600px)
- IntersectionObserver per scroll-reveal (fallback grazioso per browser legacy)

---

## SEO & Performance

- Meta tag OpenGraph e descrizioni su tutte le pagine
- Font caricati con `preconnect` per ottimizzazione
- Backdrop-filter sull'header con fallback
- Markup semantico (`<article>`, `<nav>`, `<section>`, `<header>`, `<footer>`)
- Contrasti AAA per accessibilità

---

## Note legali da completare

Prima della messa online, completare:
1. **P.IVA** nel footer di tutte le pagine
2. Pagine **Privacy Policy**, **Cookie Policy**, **Note Legali** (linkate ma vuote)
3. **Cookie banner** se si attivano analytics
4. Verifica **CCBE** + **CNF** per profili informativi (Codice Deontologico Forense — informazioni sull'attività professionale)

---

© 2026 Legali Riuniti Lex — Avvocati Associati
