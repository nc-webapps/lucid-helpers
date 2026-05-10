# @nc-webapps/lucid-helpers

Shared `@column()` option presets for AdonisJS Lucid models across nc-webapps services.

Ships one helper today (`numericColumn`) — the canonical fix for the `numeric`/`decimal`
hydration trap that birthed QC-2026-01202.

---

## Install

```bash
npm install @nc-webapps/lucid-helpers
```

The `@nc-webapps` scope resolves to the internal Verdaccio registry. The repo's
`.npmrc` already points at it; consuming repos that already pull
`@nc-webapps/sso-client` or `@nc-webapps/feedback-widget` need no extra config.

Peer dependency: `@adonisjs/core ^6.0.0 || ^7.0.0`.

---

## Quick start

```ts
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { numericColumn } from '@nc-webapps/lucid-helpers'

export default class BankrecConfig extends BaseModel {
  @column(numericColumn)
  declare beginningBankBalance: number

  @column(numericColumn)
  declare beginningOutstandingChecks: number | null

  // Integer columns come back as JS numbers natively from node-postgres
  // and do NOT need this preset:
  @column()
  declare creditCount: number

  get adjustedBeginningBankBalance() {
    return (
      this.beginningBankBalance
      + (this.beginningDepositsInTransit || 0)
      - (this.beginningOutstandingChecks || 0)
    )
  }
}
```

`null` is preserved (nullable columns stay nullable). The helper is just an
options object spread into the decorator — no factory call, no init.

---

## Why this exists — QC-2026-01202

PostgreSQL `numeric` is arbitrary-precision. To avoid silent precision loss,
node-postgres returns `numeric`/`decimal`/`real`/`double precision` values as
**JavaScript strings**. Lucid passes that string through the model unchanged.

Any model getter that does arithmetic on a bare `@column()` numeric column
silently breaks:

- `string + (string || 0)` does string concatenation: `"846306.46" + "0.00"` → `"846306.460.00"`
- The next subtraction tries `Number("846306.460.00")` → **NaN**
- `JSON.stringify(NaN)` → `"null"`
- API consumers receive `null` instead of the value.

**The 2026-05-03 incident:** users reported "Adjusted Bank and Adjusted Book
balances are not showing" on the bankrec reconciliation report. The API was
returning `beginningBalances.adjustedBankBalance: null` — but those weren't
DB columns. They were computed Lucid getters on `BankrecConfig`, deriving from
`beginning_*` numeric columns. A unit test with a real PG round-trip surfaced
the bug: `expected '100.00' to be a number`.

Fixed in commit `5753f63` (BankrecConfig, 10 columns) → sweep commit `38c0a3d`
(14 models, 51 columns total) using the local helper this package extracts.

The lesson generalizes: every AdonisJS + Lucid + PostgreSQL repo that stores
money / balances / amounts almost certainly has the same trap. Hence this
shared package, BP-LH-2605-01.

See ADR-0025 ("Derived state computed live, not cached") in cortex for the
meta-principle this hydration helper enforces.

---

## Audit recipe — find the trap in your repo

Use this when onboarding the helper into a new repo, or when chasing a
"field that should be a number is `null` in the API response" bug.

### 1. Find every numeric column in the schema

```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type IN ('numeric', 'decimal', 'real', 'double precision')
ORDER BY table_name, column_name;
```

### 2. Grep models for bare `@column()` on those columns

```bash
# In the repo root:
grep -rn "@column()" app/models/ | grep -v "@column(numericColumn)"
```

For each match, cross-reference the column name against the SQL output. If
the underlying DB column is in step (1)'s list, flip the decorator:

```diff
-  @column()
+  @column(numericColumn)
   declare amount: number
```

### 3. Add a regression test

Pattern (mirrors `bankrec/tests/unit/bankrec_config_adjusted_balances.spec.ts`):

```ts
const row = await MyModel.findOrFail(rowId)
assert.equal(typeof row.amount, 'number')
assert.isFalse(Number.isNaN(row.amount))
// If a getter does arithmetic, assert the math invariant too:
assert.equal(row.derivedTotal, expectedNumericValue)
```

### 4. The redundant `Number(...)` wrapping in controllers stays

Many repos defensively wrap reads with `Number(...)` at the API boundary.
That hid the bug for consumers who explicitly coerced — but model getters
that skipped it broke. Don't sweep the redundant wrappers in the same PR;
scope-bound the fix to the model layer.

---

## What's in v1.0.0

| Export | Purpose |
| --- | --- |
| `numericColumn` | `@column()` option preset coercing PG `numeric` / `decimal` / `real` / `double precision` from JS string to JS number. `null` preserved. |

Future variants ship as additional named exports (e.g. `numericColumnNullable`)
— additive, not breaking. See CHANGELOG.md.

---

## Development

```bash
npm install
npm run build      # tsc → build/
npm test           # node --test build/tests/*.spec.js
npm run typecheck  # tsc --noEmit
```

Publishing is gated by signed-tag push to `main` and runs through the
`publish.yml` workflow (lifted from `nc-webapps/sso-client`).

---

## License

MIT — see `LICENSE`.
