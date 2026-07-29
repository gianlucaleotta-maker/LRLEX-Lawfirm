# LR LEX — Contesto per Claude Code

## Cosa è questo progetto

Sito di LR LEX Avvocati Associati, studio legale d'affari con sede a Milano,
Foro Buonaparte 51. Boutique attiva in M&A, private equity, venture capital
e operazioni di finanza straordinaria, con operatività cross-border tra
Italia, Regno Unito e Stati Uniti.

Founding Partner: Avv. Gianluca Leotta.

Il dominio storico `elrlex.it` è stato consolidato su `lrlex.it` con redirect
301. I brand storici ELR LEX e Legali Riuniti Lex si riferiscono alla stessa
entità e sono dichiarati in `alternateName` nel JSON-LD.

## Stack effettivo

- **HTML statico** servito da Vercel. Nessun framework.
- **Generatore statico in Node ESM**, dipendenze `gray-matter` e `markdown-it`
- **Sorgenti dei contenuti in Markdown/MDX** sotto `content/`
- **Design system in CSS custom** con token in `:root`, nessun Tailwind
- Font: Fraunces, Manrope, JetBrains Mono
- Nessun database. Nessuna dipendenza Supabase.

**L'output del build è committato in Git.** Il deploy Vercel è statico puro,
senza `buildCommand`. Vedi la sezione "Contenuti generati" più sotto.

## Documenti di specifica

Da leggere prima di qualsiasi intervento. Hanno precedenza su ogni altra
convenzione.

| Documento | Contenuto | Note |
|---|---|---|
| `SEO-IMPLEMENTATION.md` | Spec principale | Sezioni 1, 3.1, 3.3, 5.2 superate |
| `SEO-APPENDIX-A-EDITORIAL.md` | Sistema editoriale `/insights/` | In vigore |
| `SEO-APPENDIX-B-ARCHITECTURE.md` | Revisione post-audit | **Prevale in caso di conflitto** |
| `AUDIT.md` | Stato rilevato del repository | Riferimento |

**In caso di conflitto tra documenti, prevale l'Appendice B.**

## Priorità di progetto

Il posizionamento organico su Google Italia è l'obiettivo primario del sito.
Ogni decisione tecnica va valutata anche in termini di impatto SEO.

Lo studio è in una fase di costruzione, non di promozione. I contenuti devono
documentare competenza, non sollecitare mandati. Nessun contenuto va
pubblicato senza revisione di un partner.

## Regole non negoziabili

1. **Nessun URL esistente può restituire 404.** Ogni rimozione o rinomina
   richiede un 301 nella redirect map.
2. **Il design non si modifica.** `assets/css/styles.css` è invariante.
   I template riusano i token esistenti.
3. **Blocklist nominativi.** Vedi sezione dedicata. Vincolo assoluto.
4. **Contenuti generati marcati DRAFT** finché un partner non conferma
   la revisione. L'agente non rimuove mai il marker autonomamente.
5. **Nessun em-dash nei contenuti in lingua inglese.** Usare la virgola.
6. **Ogni pagina:** un solo H1, un canonical autoreferenziale, JSON-LD valido,
   title sotto 60 caratteri, description sotto 155.
7. **Tutti i contenuti stanno in Git.** Nessun database per il sito pubblico.
8. **Una fase, un branch, una PR.** Naming `seo/phase-N-descrizione`.

## VINCOLO INDEROGABILE: nominativi esclusi

I professionisti elencati in `content/blocklist.json` non fanno più parte
dello Studio. I loro nomi, biografie, fotografie, recapiti e attribuzioni
di incarico non devono comparire in nessun contenuto pubblicato, in nessuna
lingua, in nessun formato. Questo include pagine, meta tag, JSON-LD, alt
text, nomi di file e commenti nel codice.

Regole operative:

1. Contenuti recuperati da archivi storici o da Wayback Machine che
   contengono questi nomi vanno **scartati**, non riscritti né anonimizzati.
2. I loro URL storici su `elrlex.it` restituiscono **410 Gone**, mai un
   redirect verso `lrlex.it`. Un 301 trasferirebbe a LR LEX l'associazione
   con quei nominativi.
3. Il campo `team` in `content/deals.json` accetta solo slug presenti in
   `content/people/`.
4. La directory `archive/` è esclusa dai controlli e dal deploy. Conserva
   materiale storico che non viene mai pubblicato.
5. **In caso di dubbio su un nome, fermarsi e chiedere.** Non decidere.

`content/blocklist.json` è l'unico file del progetto che non può essere
validato automaticamente. Il suo contenuto è confermato manualmente dal
partner e non va modificato dall'agente.

## Contenuti generati

L'output del generatore è committato nel repository, perché il deploy Vercel
è statico puro.

**Disciplina obbligatoria:**

- Ogni file generato porta in testa
  `<!-- GENERATED FILE - DO NOT EDIT - source: content/... -->`
- I percorsi di output sono marcati `linguist-generated=true` in
  `.gitattributes`
- **Non modificare mai direttamente un file generato.** Si modifica il
  sorgente in `content/` e si rigenera.
- Dopo ogni modifica ai sorgenti: `npm run build` e commit dell'output
  nello stesso commit dei sorgenti. Mai separati.
- Il job CI `verify-build` rigenera e confronta: se l'output committato
  diverge dai sorgenti, la PR fallisce.

## Controlli automatici

I controlli girano in **GitHub Actions**, non nel deploy Vercel, poiché
la pipeline Vercel è statica.

| Job | Cosa verifica | Esito |
|---|---|---|
| `check-blocklist` | Nessuna occorrenza dei nominativi esclusi, esclusa `archive/` | Blocca il merge |
| `check-content` | Lunghezza minima, FAQ, link interni, title, description, H1, autore valido, marker DRAFT | Blocca il merge |
| `verify-build` | L'output committato corrisponde ai sorgenti | Blocca il merge |
| `check-links` | Nessun link interno verso URL inesistenti o che generano redirect | Blocca il merge |

## Struttura

```
content/
├── practices.json      tassonomia e label delle aree
├── blocklist.json      nominativi esclusi, non modificare
├── deals.json          archivio operazioni
├── practices/          MDX pillar e satellite
├── people/             MDX professionisti
└── insights/           MDX articoli

scripts/
├── build.mjs           orchestratore
├── build-*.mjs         generatori per tipologia
├── content.mjs         loader, validazioni, buildHead, JSON-LD Organization
└── check-*.mjs         controlli

templates/              template HTML
assets/css/styles.css   design system, invariante
pages/ en/              HTML statico esistente
archive/                materiale storico, mai pubblicato
```

## Comandi

- `npm run build` — genera l'output. Da eseguire prima di ogni commit
  che tocchi `content/`
- `npm run check` — esegue i controlli in locale
- Nessun `dev server`: il sito è statico, si apre l'HTML

## Verifica prima di ogni PR

Esegui la Definition of Done della sezione 8 di `SEO-IMPLEMENTATION.md`
e la sezione A.9 dell'Appendice A per i contenuti editoriali.

Verifica inoltre su preview Vercel che Lighthouse mobile non sia regredito
rispetto alla produzione. Il sito è oggi molto veloce perché statico:
qualsiasi peggioramento delle performance è un fallimento, non un
compromesso accettabile.

## Stato corrente

- Fase 0, consolidamento entità: **completata**
  (301 da `elrlex.it`, LinkedIn allineato a `/company/lrlex`, clone rimosso)
- Fase 2, sezione `/insights/`: **completata**, output committato
- Fase 1, architettura aree di pratica: **in corso**
- Contenuti editoriali: due articoli in stato DRAFT, non pubblicabili
  finché non esistono le pillar page verso cui linkare

## Contesto che l'agente non deve dedurre

- Audiencerate Ltd è una società **inglese**, con branch in Italia e USA
- Il nome della pagina LinkedIn è **LR LEX**, URL
  `linkedin.com/company/lrlex`
- La sede è **Foro Buonaparte 51**, non la sede storica di ELR LEX
- Non esiste alcun tenant Microsoft attivo su `elrlex.it`
- Il sito non ha e non deve avere un backend
