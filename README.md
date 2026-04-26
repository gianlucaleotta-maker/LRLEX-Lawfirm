# LR LEX — Sito Web Ufficiale

Sito statico per **LR LEX** — Studio Legale d'Affari, Milano.

---

## Struttura del progetto

```
lrlex-website/
├── index.html                      ← Homepage
├── pages/
│   ├── aree-di-pratica.html        ← 9 pratiche con sidebar di navigazione
│   ├── team.html                   ← Partner, Office Manager
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
  "date": "2024-06-15",
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

## GitHub e Vercel (flusso consigliato)

1. **Repository** — codice sorgente su [GitHub](https://github.com) (`gianlucaleotta-maker/LRLEX-Lawfirm` o il tuo fork).
2. **Push** — lavora su `main` (o apri un branch e una Pull Request) e `git push origin main` per aggiornare il remoto.
3. **Vercel collegata a GitHub** — in [vercel.com](https://vercel.com) → **Add New** → **Project** → *Import* il repository GitHub. Tipo: **Other** (sito statico, nessun `npm build` necessario). La root del deploy è la root del repo; `vercel.json` imposta `cleanUrls` e le cache su asset / `data/`.
4. **Deploy** — ogni push su `main` (o su branch connessi in impostazioni) attiva un nuovo deploy. In **Settings → Domains** aggiungi `lrlex.it` (o altro) e configura i DNS come indicato da Vercel.
5. **Solo Vercel senza Git** (alternativa) — *Deploy* manuale trascinando la cartella su Vercel; meno comodo per aggiornamenti continui rispetto al collegamento Git.

### Altre opzioni di deploy

- **FTP** — carica in root `index.html`, `pages/`, `assets/`, `data/`.
- **Netlify** — [drop](https://app.netlify.com/drop) o collega il repo come per Vercel.
- **GitHub Pages** — repository → *Settings* → *Pages* → branch `main`, cartella `/ (root)`.

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

© 2026 LR LEX — Avvocati Associati
