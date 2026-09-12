# Domain

Fachlogik — und nichts sonst.

**Regel:** Module unter `src/domain/` importieren nichts aus `react`, `next`,
`@supabase/*` oder dem DOM. Sie nehmen einfache Werte entgegen und geben
`Result<T, AppError>` zurück.

Der Grund ist konkret: Growth Policy, Recommendation Rules, Schedule-Versionierung
und Evidence-Idempotenz sind dieselben Regeln, egal ob sie in einer Server
Component, einer Route Handler oder später in einem React-Native-Client laufen.
Sobald eine dieser Regeln in einer Komponente landet, existiert sie doppelt.

Erlaubte Importe aus dem Rest der Codebasis:

- `@/lib/errors` — `Result`, `AppError`
- `@/validation` — geteilte Zod-Schemas
- andere Module unter `@/domain`

Geplante Aufteilung (kommt mit den jeweiligen Milestones):

```
domain/
  identity/         M2
  goals/            M2
  actions/          M2
  schedules/        M2   versionierte Schedules
  evidence/         M3   Source of Truth, immutable
  growth/           M4   versionierte, deterministische Policy
  recommendations/  M5   regelbasiert, nie automatisch angewendet
```
