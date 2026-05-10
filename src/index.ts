/**
 * Shared @column() option presets for Lucid models.
 *
 * QC-2026-01202 cautionary tale: PG `numeric`/`decimal` columns hydrate as JS
 * strings by default (Lucid's choice — preserves IEEE-754 precision). Without
 * a `consume` coercion every model getter that does arithmetic on these fields
 * silently produces NaN, which JSON-serializes to `null`. The bug surfaced as
 * Adjusted Bank/Book showing "-" in the reconciliation report; the underlying
 * BankrecConfig getter was doing `string + string` instead of `number + number`.
 *
 * Use `numericColumn` for any decimal/numeric column. Null is preserved
 * (some columns are nullable). Integer columns (creditCount, importSequence,
 * year, month, etc.) come back as JS numbers natively from node-postgres
 * and do NOT need this preset.
 */
export const numericColumn = {
  consume: (value: any) => (value === null ? null : Number(value)),
}
