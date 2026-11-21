# Song-Adventskalender v2

Ein vollkommen statischer, single-page Song-Adventskalender: jeden
Dezembertag ein Türchen mit einem Song zum Wohlfühlen und einem guten
Gedanken. Ohne Server, ohne Tracking — der gesamte Fortschritt bleibt auf
dem Gerät (localStorage). Deployt auf GitHub Pages.

Konzept & Umsetzungsplan: [`song-adventskalender-v2-konzept.md`](song-adventskalender-v2-konzept.md)
bzw. [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md).

## Entwicklung

```bash
npm install
npm run dev          # Vite dev server (HMR)
npm test             # Vitest (Logik + jsdom-Smoketests)
npm run build        # Inhaltsvalidierung + tsc + vite build → dist/
npm run preview      # statischen Build lokal ansehen
npm run fonts        # woff2-Fontsubsets aus assets-src/fonts neu erzeugen
```

Versteckte Dev-Flags: `?dev=all` schaltet alle Türchen frei (Test im
November/Dezember ohne Zeitreise); `?dev=open` schaltet sie zusätzlich alle auf
„geöffnet“ in der Übersicht — rein zur Anzeige, der gespeicherte Fortschritt
bleibt unverändert.

## Architektur in Kürze

- **Vanilla TypeScript + Vite**, keine Framework-Runtime, ein Bundle.
- **Ein Türchen = `day` + `type` + `payload`-Envelope** (Content-Dateien in
  `src/content/{jahr}.json`, lazy pro Jahr gebundelt). Neue Türchentypen
  (z. B. `image`) sind ein Renderer-File plus eine Registry-Zeile plus eine
  `CalendarEntry`-Variante — Grid, Router, State und Unlock-Logik bleiben
  unberührt.
- **Build-Time-Validierung**: `npm run build` schlägt fehl, wenn eine
  Season-Datei kaputt ist (24 eindeutige Türchen, Jahr ≠ Dateiname,
  unbekannte Payloads, fehlende Datei für die aktive Saison). Siehe
  `scripts/validate-content.ts`.
- **State pro Saison** unter `sak.{jahr}` mit Versionsfeld und Seed: Die
  Zuordnung Türchen ↔ Eintrag ist eine seeded Permutation (`mulberry32`) —
  ein Partial-Wipe des localStorage kann nichts „umsortieren“.
- **Deep Links** `#day=N&year=YYYY` (Jahr optional): teilbar,
  refresh-sicher, von der Unlock-Regel bewacht. Vergangene Saisons bleiben
  damit für immer erreichbar — alte Content-Dateien und State-Keys werden
  nie automatisch gelöscht. Ein Archiv-UI ist bewusst (noch) nicht verbaut.
- **Unlock-Regel**: Türchen N des Jahres Y öffnet am N. Dezember Y
  (lokale Gerätezeit) — eine beendete Saison ist dadurch automatisch
  vollständig offen. Uhrmanipulation wird akzeptiert (Feel-good-App, kein DRM).

## Neue Saison (Release-Routine)

1. `src/content/{jahr}.json` anlegen: exakt 24 Einträge, Tage 1–24,
   `year` = Dateiname, `schemaVersion: 2` — Payloads gegen
   `src/entries/schemas.ts` validiert (der Build prüft alles automatisch).
2. Türchen-Kunst in `public/img/doors/door_{n}.{jpg,webp}` bzw.
   `door_closed_{n}.{jpg,webp}` ergänzen oder aus v1 übernehmen
   (Download aus dem v1-Repo; JPEG/WebP via ImageMagick, siehe History).
3. Release taggen. Fertig — es sind keine Codeänderungen nötig.

## Status & Grenzen

- PWA-Manifest + Icons sind shipped; bewusst **ohne Service Worker**
  (Offline-Modus ist einer der offenen Punkte des Plans).
- Fonts: selbstgehostete woff2-Subsets (`public/fonts`), Quell-TTFs
  vendort in `assets-src/fonts`; Regenerierung via `npm run fonts`.
- Kein Analyse-Tracking.
- **Performance**: Pro Seitenaufruf lädt nur der aktive Jahres-Chunk
  (Archiv-Buttons laden lazy via Deep Link); Logik+CSS ≈ 10 kB gzip,
  dazu der Text-Content der aktiven Saison. Das <15-kB-Ziel des Plans gilt
  für Code — voll kuratierte deutsche Texte kommen darüber hinaus.

## Lizenz / Credits

Fotos & Icons sind selbst erstellt.
Song Embeds: YouTube (privacy-enhanced, nocookie) und Spotify — die App
hostet selbst keine Musik.
