# Appendice A — Sistema editoriale /insights/

**Documento collegato:** SEO-IMPLEMENTATION.md
**Versione:** 1.0
**Da committare nella root del repo accanto alla spec principale.**

Questa appendice definisce l'architettura, il contratto dati e il calendario della sezione editoriale. Vale come estensione delle sezioni 3, 4 e 5 della spec principale, e ne eredita tutte le regole di ingaggio, in particolare la blocklist dei nominativi.

---

## A.1 Perché una sezione insights, e cosa non deve essere

Non è un blog. Un blog generalista da studio legale, fatto di commenti alle novità normative, non produce posizionamento perché compete con centinaia di contenuti identici e non ha nulla di proprietario.

La sezione insights ha tre funzioni precise, e ogni articolo deve assolverne almeno due:

1. **Intercettare** una ricerca reale con intento informativo o commerciale
2. **Rinforzare** con link interni una pillar page delle aree di pratica
3. **Dimostrare** competenza su un tema in cui LR LEX ha autorità verificabile con un deal

Il filtro editoriale è una sola domanda: *esiste qualcuno che sta cercando questo argomento, e abbiamo qualcosa da dire che altri studi non possono dire?* Se la risposta al secondo membro è no, l'articolo non si scrive.

Dieci contenuti l'anno che nessun altro può scrivere valgono più di quaranta rassegne normative.

---

## A.2 Architettura

```
app/
└── insights/
    ├── page.tsx                    # indice, paginato, filtrabile per practice
    ├── [slug]/
    │   └── page.tsx                # articolo singolo
    └── argomenti/
        └── [practice]/page.tsx     # archivio per area di pratica

content/
└── insights/
    ├── 2026-08-golden-power-quando-notificare.mdx
    ├── 2026-08-earn-out-clausola.mdx
    └── ...
```

**Convenzione di naming dei file:** `AAAA-MM-slug.mdx`. Il prefisso data serve all'ordinamento in filesystem e non compare nell'URL.

**URL finale:** `https://lrlex.it/insights/[slug]`, senza data nel path. Una data nell'URL invecchia il contenuto agli occhi dell'utente e complica gli aggiornamenti.

**Archivio per argomento:** `/insights/argomenti/[practice]` genera pagine di raccolta che rinforzano i cluster tematici. Queste pagine devono avere un'introduzione originale di almeno 150 parole, non un semplice elenco, altrimenti sono thin content.

**La vecchia `/pages/news.html` diventa `/insights`**, con il 301 già previsto nella redirect map della spec principale.

---

## A.3 Contratto MDX per gli insight

Estende il frontmatter della sezione 3.2 della spec. Il build fallisce se manca un campo obbligatorio.

```yaml
---
slug: string                    # obbligatorio, univoco, senza data
type: "insight"                 # obbligatorio, discrimina dal contenuto practice
lang: "it" | "en"               # obbligatorio
alternate: string               # path della controparte linguistica
title: string                   # obbligatorio, max 60 caratteri
description: string             # obbligatorio, max 155 caratteri
h1: string                      # obbligatorio, diverso dal title
keyword_primary: string         # obbligatorio
keyword_secondary: string[]     # min 2
author: string                  # obbligatorio, slug presente in content/people/
published: date                 # obbligatorio, ISO
updated: date                   # obbligatorio, ISO
reading_time: number            # minuti
related_practices: string[]     # min 1, slug esistenti
related_deals: string[]         # slug presenti in Supabase, opzionale
related_insights: string[]      # opzionale
faq: {q: string, a: string}[]   # obbligatorio, min 4
---
```

**Validazioni da implementare nel loader:**

- `author` deve corrispondere a un file in `content/people/`. Un articolo firmato da una persona inesistente rompe lo schema `Person` e il collegamento di entità.
- `related_practices` deve contenere solo slug di pillar esistenti. Un link interno rotto vale meno di zero.
- `related_deals` deve contenere solo slug presenti in Supabase con `published = true`.
- Nessun campo può contenere stringhe presenti nella blocklist nominativi.

---

## A.4 Schema JSON-LD per gli insight

Ogni articolo emette due blocchi, `Article` e `FAQPage`. Il `FAQPage` si genera dal frontmatter, mai scritto a mano, così testo visibile e markup non si disallineano.

```ts
export function buildArticleSchema(post: Insight, author: Person) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `https://lrlex.it/insights/${post.slug}#article`,
    headline: post.h1,
    description: post.description,
    inLanguage: post.lang === "it" ? "it-IT" : "en-US",
    datePublished: post.published,
    dateModified: post.updated,
    author: { "@id": `https://lrlex.it/professionisti/${author.slug}#person` },
    publisher: { "@id": "https://lrlex.it/#organization" },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://lrlex.it/insights/${post.slug}`,
    },
    about: post.related_practices.map((p) => ({
      "@type": "Thing",
      name: PRACTICE_LABELS[p],
    })),
    isAccessibleForFree: true,
  };
}

export function buildFaqSchema(post: Insight) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `https://lrlex.it/insights/${post.slug}#faq`,
    mainEntity: post.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
```

**Nota sul collegamento di entità.** `author` e `publisher` usano riferimenti `@id`, non oggetti annidati. È il meccanismo che consente a Google di collegare articolo, autore e studio in un unico grafo. Ogni articolo firmato rafforza la pagina autore, e la pagina autore rafforza tutti gli articoli. È l'effetto cumulativo che costruisce E-E-A-T nel tempo.

---

## A.5 Struttura obbligatoria di un articolo

| # | Blocco | Note |
|---|--------|------|
| 1 | Apertura | La situazione concreta in due o tre frasi. Nessuna premessa normativa, nessun "com'è noto" |
| 2 | Il problema | Perché la domanda si pone, cosa viene comunemente frainteso |
| 3 | Corpo tecnico | H2 e H3 che riprendono le formulazioni di ricerca reali |
| 4 | Sezione operativa | Cosa fare in pratica, distinta per posizione: chi compra, chi vende, chi consolida |
| 5 | FAQ | Minimo 4, con schema. Domande vere da prima call, non retoriche |
| 6 | Link interni | Minimo 3 contestuali: pillar padre, articolo correlato, deal |
| 7 | Firma e CTA | Collegamento alla pagina autore e ai contatti |
| 8 | Disclaimer | Finalità informative, non parere legale |

**Lunghezza minima: 1.200 parole.** Sotto questa soglia il contenuto non regge la concorrenza organica.

**Due regole che pesano più della struttura:**

- **Data di pubblicazione e di aggiornamento sempre visibili.** In ambito legale la freschezza è un fattore di ranking esplicito e un segnale di affidabilità per il lettore.
- **Firma sempre personale.** Mai "la redazione", mai "LR LEX". In questo settore l'autorità si attribuisce a una persona, e il grafo di entità la richiede.

---

## A.6 Calendario editoriale, sei mesi

Due articoli al mese. È il ritmo sostenibile per un professionista che opera, ed è preferibile a un piano ambizioso abbandonato dopo il terzo mese.

I contenuti sono classificati in due tipi. I pezzi **ricerca** intercettano domanda esistente e sono costruiti per posizionarsi. I pezzi **autorità** hanno volume basso ma generano citazioni, rassegna stampa e materiale per le submission ai ranking internazionali.

| # | Titolo di lavoro | Keyword primaria | Tipo | Pillar |
|---|---|---|---|---|
| 1 | Golden Power: quando un'operazione va notificata, e cosa succede se non lo fai | golden power notifica operazione | ricerca | M&A |
| 2 | Earn-out: come si struttura una clausola che regge davvero | clausola earn out cessione azienda | ricerca | M&A |
| 3 | Comprare un'azienda che vive di dati: la due diligence che nessuno fa | due diligence dati acquisizione | autorità | Tech/Data |
| 4 | Patti parasociali nel passaggio generazionale | patti parasociali passaggio generazionale | ricerca | Societario |
| 5 | Golden Power e investitori esteri: la prospettiva di chi compra | investimenti esteri italia golden power | autorità | M&A |
| 6 | Aggiustamento prezzo: locked box o completion accounts | aggiustamento prezzo compravendita partecipazioni | ricerca | M&A |
| 7 | Quotare una società italiana al Nasdaq: cosa comporta davvero | quotazione nasdaq società italiana | autorità | Capital markets |
| 8 | Buy-and-build: gli errori legali che si pagano al terzo add-on | strategia buy and build acquisizioni | autorità | Private equity |
| 9 | Composizione negoziata: quando conviene e quando è tardi | composizione negoziata crisi impresa | ricerca | Ristrutturazioni |
| 10 | Vendere l'azienda di famiglia: le tre decisioni che vengono prima del prezzo | vendere azienda di famiglia | ricerca | M&A |
| 11 | W&I insurance nel mid-market italiano: serve o è un lusso | warranty indemnity insurance italia | ricerca | M&A |
| 12 | Cross-border Italia, Regno Unito, Stati Uniti: cosa cambia nelle aspettative | operazioni m&a cross border italia | autorità | M&A |

**Ordine di priorità se si parte con tre soli:** 1, 3, 10. Uno per il ranking, uno per la differenziazione, uno per il volume di ricerca.

**Nota strategica sul Golden Power.** I pezzi 1 e 5 non servono solo al posizionamento organico. Costituiscono materiale documentale per la candidatura alla nuova tabella Foreign Investment di Chambers Europe 2027 e per la submission Legal 500 EMEA. Vanno prodotti con quello standard qualitativo.

---

## A.7 Il moltiplicatore

Ogni articolo, se impostato correttamente, produce cinque asset distinti. Questo è il motivo per cui conviene scrivere pochi contenuti fatti bene.

1. La pagina indicizzata su `/insights/`
2. Un post LinkedIn con estratto e link, dalla pagina LR LEX
3. Una sezione della newsletter trimestrale
4. Una proposta di contributo per le riviste specializzate (Diritto della Crisi, Il Fallimentarista, IlCaso.it per l'area crisi; LegalCommunity e TopLegal per le operazioni)
5. Una riga di credenziali nelle submission ai ranking internazionali

Il flusso di pubblicazione va progettato tenendo conto di tutti e cinque, non solo del primo.

---

## A.8 Prompt per Claude Code

### P9 — Sezione insights

```
Implementa la sezione editoriale come da SEO-APPENDIX-A-EDITORIAL.md.
- Route /insights, /insights/[slug], /insights/argomenti/[practice]
- Estendi lib/content.ts per gestire type: "insight" con le validazioni
  della sezione A.3. Il build deve fallire se un campo obbligatorio manca,
  se author non esiste in content/people/, o se related_practices contiene
  slug inesistenti.
- Implementa buildArticleSchema e buildFaqSchema come da sezione A.4
- Il componente FaqBlock renderizza le FAQ dal frontmatter ed emette il
  FAQPage schema dalla stessa sorgente. Mai due sorgenti separate.
- Le pagine argomento richiedono un'introduzione da file, non generata
- Aggiorna app/sitemap.ts includendo gli insight
- Redirect /pages/news.html verso /insights

Branch: seo/phase-2-insights. Non scrivere contenuti.
```

### P10 — Pubblicazione primo articolo

```
Aggiungi content/insights/2026-08-golden-power-quando-notificare.mdx
al repo. Il file è già redatto.
- Non modificare il corpo del testo
- Compila i campi published e updated con la data effettiva
- Verifica che related_deals contenga solo slug presenti in Supabase con
  published = true, altrimenti svuota il campo
- Verifica che il link a /contatti risolva
- Il marker DRAFT e il blocco commenti VERIFICARE restano nel file finché
  un partner non conferma la revisione. Non rimuoverli autonomamente.
- Non pubblicare in produzione: apri PR e lascia in preview
```

### P11 — Controllo qualità editoriale

```
Crea scripts/check-content.ts eseguito in CI su ogni PR che tocca
content/. Deve fallire il build se un file MDX:
- ha meno di 1.200 parole nel corpo
- ha meno di 4 FAQ
- ha meno di 3 link interni
- ha title oltre 60 caratteri o description oltre 155
- ha più di un H1
- non ha author valido
- contiene una stringa della blocklist nominativi
- ha published o updated in formato non ISO
- contiene ancora il marker DRAFT ed è destinato a produzione
```

---

## A.9 Definition of Done editoriale

Da aggiungere alla checklist della sezione 8 della spec principale.

- [ ] Corpo dell'articolo oltre 1.200 parole
- [ ] Minimo 4 FAQ, coerenti tra testo visibile e schema
- [ ] Minimo 3 link interni contestuali, tutti risolventi 200
- [ ] Schema `Article` e `FAQPage` validi su validator.schema.org
- [ ] `author` collegato via `@id` alla pagina persona esistente
- [ ] Date di pubblicazione e aggiornamento visibili nella pagina
- [ ] Nessuna occorrenza della blocklist nominativi
- [ ] Disclaimer presente
- [ ] Revisione di un partner completata e marker DRAFT rimosso
- [ ] Riferimenti normativi verificati alla data di pubblicazione
- [ ] Articolo incluso in sitemap.xml
- [ ] Post LinkedIn predisposto

---

## A.10 Manutenzione

I contenuti giuridici invecchiano, e un articolo con riferimenti normativi superati danneggia la credibilità più di quanto il traffico che genera valga.

**Revisione semestrale obbligatoria** per tutti gli articoli con riferimenti normativi. Alla revisione si aggiorna il campo `updated`, che è visibile e che Google legge.

**Revisione immediata** in caso di modifica normativa rilevante sul tema trattato. Per il Golden Power questo significa monitorare l'esito della procedura di infrazione europea e i provvedimenti applicativi.

Un articolo aggiornato batte quasi sempre un articolo nuovo sullo stesso tema, perché conserva i segnali accumulati e aggiunge la freschezza. Prima di scrivere un pezzo nuovo, verificare sempre se esiste un pezzo esistente da aggiornare.
