# Changelog

All notable changes to `@nc-webapps/lucid-helpers` are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-05-10

### Added

- `numericColumn` — `@column()` option preset that coerces hydrated PostgreSQL
  `numeric`/`decimal`/`real`/`double precision` values from JS strings to JS
  numbers, with `null` preserved. Extracted verbatim from `bankrec/app/models/_lucid_helpers.ts`
  (introduced 2026-05-03 to fix QC-2026-01202). See README for the cautionary
  tale and audit-SQL recipe.

[1.0.0]: https://github.com/nc-webapps/lucid-helpers/releases/tag/v1.0.0
