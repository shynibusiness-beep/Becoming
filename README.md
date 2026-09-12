# Becoming

Eine persönliche Self-Development-Webapp. Du entscheidest, wer du werden
möchtest; die App übersetzt das in wenige konkrete Handlungen, speichert das
tatsächlich Getane als Evidence und macht daraus über Wochen sichtbare
Entwicklung.

> **Status: Milestone 0 (Foundation).** Es gibt noch keine Produktfeatures —
> nur das technische Fundament und eine responsive App-Shell mit ehrlichen
> Empty States. Siehe [Roadmap](#roadmap).

---

## Setup

Voraussetzung: Node.js ≥ 20.9 (siehe `.nvmrc`, empfohlen: 22).

```bash
npm install
cp .env.example .env.local   # Werte eintragen, siehe unten
npm run dev                  # http://localhost:3000
```

### Environment

Die Konfiguration wird beim Build validiert (Zod, `src/lib/env/`). Fehlt eine
Variable oder hat sie ein falsches Format, bricht der Build mit einer Meldung
ab, die den Variablennamen nennt — nie den Wert.

| Variable                               | Erforderlich         | Zweck                                                                            |
| -------------------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_STAGE`                | nein (`development`) | `development` \| `staging` \| `production`                                       |
| `NEXT_PUBLIC_SUPABASE_URL`             | **ja**               | Projekt-URL                                                                      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **ja**               | Publishable Key (`sb_publishable_…`); alternativ `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER`       | nein (`noop`)        | aktuell nur `noop`                                                               |
| `SUPABASE_SECRET_KEY`                  | nein                 | Secret Key, **nur serverseitig**, in M0 ungenutzt                                |

**Regel:** Alles mit `NEXT_PUBLIC_`-Präfix landet im Browser-Bundle und ist
damit öffentlich. Secrets tragen dieses Präfix niemals. `src/lib/env/server.ts`
importiert `server-only`, ein Import aus einer Client-Komponente ist deshalb
ein Build-Fehler — und ein E2E-Test durchsucht das ausgelieferte Bundle
zusätzlich nach Secret-Mustern.

### Stages

`NODE_ENV` und Stage sind bewusst getrennt: Staging ist ein Production-_Build_,
der auf ein Staging-Supabase-Projekt zeigt.

| Stage       | Build        | Supabase-Projekt        | Badge in der UI |
| ----------- | ------------ | ----------------------- | --------------- |
| development | `next dev`   | lokal oder Dev-Projekt  | ja              |
| staging     | `next build` | eigenes Staging-Projekt | ja              |
| production  | `next build` | Production-Projekt      | nein            |

---

## Befehle

| Befehl                  | Zweck                                        |
| ----------------------- | -------------------------------------------- |
| `npm run dev`           | Dev-Server                                   |
| `npm run build`         | Production-Build (validiert das Environment) |
| `npm run start`         | Production-Server                            |
| `npm run lint`          | ESLint                                       |
| `npm run typecheck`     | `tsc --noEmit`                               |
| `npm run test`          | Unit-Tests (Vitest)                          |
| `npm run test:coverage` | Unit-Tests mit Coverage                      |
| `npm run e2e`           | End-to-End-Tests (Playwright, baut vorher)   |
| `npm run format:check`  | Prettier-Prüfung                             |
| `npm run verify`        | Alles oben in der CI-Reihenfolge             |

Playwright braucht einmalig `npx playwright install chromium`.

---

## Architektur

### Leitprinzip: Domain vor Framework

Fachlogik lebt nicht in React-Komponenten. Der Grund ist konkret: Später
kommt ein React-Native-Client dazu, der dieselben Regeln braucht.

```
Page/Route  →  Service  →  Domain  →  Result
                               ↑
                        (kein React, kein Next, kein DOM)
```

`src/domain/`, `src/validation/` und `src/analytics/` importieren nichts aus
`next` oder `react` und sind damit direkt wiederverwendbar.

### Verzeichnisse

```
src/
  app/                    Next.js App Router
    (app)/                Routen innerhalb der App-Shell
      today/ growth/ self/ settings/
    error.tsx             Route-Error-Boundary
    global-error.tsx      Fallback für Fehler im Root-Layout
    not-found.tsx
    globals.css           Design Tokens + Base Layer
  components/
    layout/               App-Shell, Navigation, Top Bar
    ui/                   kleine Primitives (Button, Card, EmptyState …)
  domain/                 Fachlogik, framework-unabhängig     (ab M2)
  features/               Feature-Module, UI + Zugriff        (ab M1)
  services/               Repositories, Server Actions        (ab M1)
  validation/             geteilte Zod-Schemas                (ab M2)
  analytics/              Vendor-neutraler Analytics-Contract
  lib/
    env/                  validierte Konfiguration (public/server getrennt)
    errors/               AppError, Fehlercodes, Result-Typ
    logging/              strukturierter Logger mit Redaction
    supabase/             Browser- und Server-Client, Session-Refresh
    utils/
  proxy.ts                Supabase-Session-Refresh (Next.js Proxy-Konvention)
e2e/                      Playwright
supabase/migrations/      Datenbank — reproduzierbar aus Migrationen
```

### Fehlerbehandlung

Eine Fehlerklasse über alle Schichten: `AppError` mit stabilem `code`, einer
Entwicklermeldung (`message`) und genau einer Meldung, die im UI erscheinen
darf (`userMessage`). Rohe Exception-Texte erreichen nie die Oberfläche.

Domain- und Service-Funktionen werfen nicht, sondern liefern
`Result<T, AppError>`. Jeder Aufrufer muss den Fehlerfall behandeln — das ist
der Punkt.

### Logging und Privacy

`logger` nimmt einen stabilen Event-Namen und einen Kontext aus Primitiven.
Vor der Ausgabe werden Keys redigiert, die nach Credentials, personenbezogenen
Identifikatoren oder Freitext aussehen. `console` ist außerhalb des Loggers per
Lint-Regel verboten, `process.env` außerhalb von `src/lib/env/` ebenfalls.

### Analytics

`src/analytics/` definiert den Contract (Event-Namen und pro Event getypte
Properties), nicht die Anbindung. Implementiert ist nur ein No-op. Das Typsystem
lässt keine Freitext-Properties zu — ein Ziel-Titel kann also gar nicht
versehentlich an einen Analytics-Anbieter gehen.

### Design Tokens

`globals.css` definiert eine Palette, darüber eine semantische Ebene
(`--surface-*`, `--content-*`, `--accent-*`) und bindet diese über Tailwinds
`@theme inline` an Utilities (`bg-surface`, `text-ink-muted`). Komponenten
verwenden ausschließlich die semantische Ebene.

Dark Mode folgt dem System und lässt sich per `data-theme` auf dem
`<html>`-Element explizit überschreiben (der Umschalter selbst kommt in M1).
`prefers-reduced-motion` wird global respektiert.

**Die Palette ist vorläufig.** Es gibt noch keine Brand-Entscheidung: neutrale
Grautöne mit einem zurückhaltenden Indigo-Akzent, Systemschriften. Der Wechsel
auf eine Brand-Palette ist später eine Änderung an den Tokens, nicht an den
Komponenten.

### Sicherheit

- Keine Secrets im Client. Öffentliche und serverseitige Konfiguration sind
  zwei getrennte Module (`public-schema.ts` / `server-schema.ts`), damit nicht
  einmal die _Namen_ der Server-Variablen im Browser-Bundle landen. Dazu
  `server-only` und ein E2E-Test, der das ausgelieferte Bundle prüft.
- Der Browser-Client nutzt ausschließlich den Publishable Key. Zugriff wird
  durch die Session und Row Level Security begrenzt, nicht durch den Schlüssel.
- Der Proxy ruft `getUser()` (nicht `getSession()`), validiert das Token
  also gegen Supabase Auth — ein widerrufenes Token lässt sich nicht aus einem
  Cookie replayen.
- Baseline-Security-Header in `next.config.ts`. Eine Content-Security-Policy
  fehlt bewusst noch: sie braucht eine Nonce pro Request und gehört in den
  Proxy — geplant für M8 zusammen mit der Security-Regression-Suite.

---

## Testing

| Ebene       | Werkzeug         | Scope                                 |
| ----------- | ---------------- | ------------------------------------- |
| Unit        | Vitest (Node)    | Domain, `lib/`, Analytics, Validation |
| Integration | pgTAP / Supabase | RLS, Ownership, Constraints (ab M1)   |
| E2E         | Playwright       | Kritische Flows, Mobile + Desktop     |

Vitest läuft bewusst ohne DOM-Umgebung: UI-Verhalten wird von Playwright in
einem echten Browser geprüft, statt in einer jsdom-Näherung. Das hält die
Abhängigkeiten klein und die Aussage der Tests ehrlich.

---

## Roadmap

| Milestone | Inhalt                                                                | Status            |
| --------- | --------------------------------------------------------------------- | ----------------- |
| **M0**    | Foundation: Toolchain, Tokens, Shell, Env, Errors, Analytics-Contract | **abgeschlossen** |
| M1        | Auth, Profile, RLS, Ownership- und Cross-User-Tests                   | offen             |
| M2        | Identity, Goal, Action, versionierter Schedule, Onboarding            | offen             |
| M3        | Occurrences, Today, Completion, Evidence (idempotent)                 | offen             |
| M4        | Growth Engine (versionierte Policy), History, Timeline                | offen             |
| M5        | Weekly Review, Recommendation Engine, Plananpassung                   | offen             |
| M6        | Digital Self: Avatar, Unlocks                                         | offen             |
| M7        | Optionale AI mit deterministischem Fallback                           | offen             |
| M8        | Beta Hardening: Analytics, Performance, A11y, CSP, Account Deletion   | offen             |
