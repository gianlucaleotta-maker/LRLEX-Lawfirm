# elrlex.it — Inventario URL storici (Wayback Machine)

> Fonte: Internet Archive CDX API + snapshot `id_` (HTML pulito, senza toolbar Wayback).
> Dominio **offline** (ERR_TIMED_OUT) — contenuti recuperati esclusivamente dall'archivio.
> Generato per la migrazione SEO **elrlex.it → lrlex.it** (branch `seo/phase-0-elrlex-migration`).

## Pagine HTML di contenuto (statuscode 200)

Snapshot salvati in `archive/elrlex/snapshots/`. Sono le uniche 4 pagine "vere" del vecchio
sito (template Bootstrap single-page): tutto il resto in CDX erano asset o endpoint PHP.

| # | URL originale | Title | H1 / heading principale | Ultimo snapshot 200 | Snapshot salvato | Destinazione proposta su lrlex.it |
|---|---------------|-------|-------------------------|---------------------|------------------|-----------------------------------|
| 1 | `http://www.elrlex.it/home` | Home | *(nessun H1; H2: «Lo studio», «L'esperienza», «I settori di interesse»)* | 2016-05-27 | 2016-03-25 ¹ | `https://lrlex.it/` |
| 2 | `http://www.elrlex.it/professionisti` | PROFESSIONISTI | *(nessun H1; H2: «I Partner»)* | 2016-05-27 | 2016-05-27 | `https://lrlex.it/pages/team.html` |
| 3 | `http://www.elrlex.it/contatti` | Contatti | *(nessun H1; H2: «Contattaci»)* | 2016-04-25 | 2016-04-25 | `https://lrlex.it/pages/contatti.html` |
| 4 | `http://www.elrlex.it/en/` | ELRLEX - Law firm in Milan | `Dura lex, sed lex` | 2019-04-24 | 2019-04-24 | `https://lrlex.it/en/` |

¹ Il capture 200 del 2016-05-27 per `/home` non rispondeva al download (timeout ripetuto lato Wayback);
salvato il 200 immediatamente precedente (2016-03-25). Il contenuto è identico (sito statico).

### Nota redirect di root
- `http://elrlex.it/` restituiva storicamente **301** verso `/home`. Nella migrazione il root del
  vecchio dominio va mappato direttamente su `https://lrlex.it/` (vedi `vercel.json`).
- La versione **EN 2019** è lo snapshot più recente e più ricco dell'intero sito (bio complete,
  premio *Le Fonti 2017*, track record) → è la fonte primaria di `REUSABLE-CONTENT.md`.

## URL esclusi dal recupero

Scartati come da specifica (asset o non-contenuto). Elenco per tracciabilità.

| URL | Motivo esclusione |
|-----|-------------------|
| `www.elrlex.it/?startcss=true&ts=...` / `?startjs=true&ts=...` | Query-string di loading, duplicati della home (200 ma non contenuto) |
| `www.elrlex.it/assets/**` (css, js, fonts, ico) | Asset statici |
| `www.elrlex.it/images/**` | Immagini (vedi sotto: alcune riutilizzabili come reference) |
| `www.elrlex.it/contatti/formContattiAsync.php` | Endpoint backend form |
| `www.elrlex.it/contatti/mappa.php` | Endpoint backend mappa |
| `www.elrlex.it/js/**`, `assets/plugins/**` | Script |
| `elrlex.it/favicon.ico`, `robots.txt`, `/deadlink/`, `/category/*` | 404/301/robots |

### Immagini d'archivio potenzialmente utili (non scaricate, referenziate)
Da valutare per recupero manuale se servono asset storici:
`images/LeFonti-05.png` (logo premio Le Fonti), `images/trophies.jpg` (riconoscimenti),
`images/clientiELRLEX.jpg` (loghi clienti), `images/about/partner1..4.jpg` (foto partner).
Recuperabili via `http://web.archive.org/web/2018id_/http://www.elrlex.it/images/<file>`.

## Metodo (riproducibile)

```bash
# 1) inventario completo dominio
curl -s 'http://web.archive.org/cdx/search/cdx?url=elrlex.it*&output=json&fl=original,timestamp,statuscode&collapse=urlkey&limit=2000'
# 2) ultimo snapshot 200 per URL
curl -s 'http://web.archive.org/cdx/search/cdx?url=www.elrlex.it/<path>&output=json&fl=timestamp,statuscode&filter=statuscode:200'
# 3) download HTML pulito
curl -sL 'http://web.archive.org/web/<timestamp>id_/http://www.elrlex.it/<path>' -o snapshots/<name>.html
```
