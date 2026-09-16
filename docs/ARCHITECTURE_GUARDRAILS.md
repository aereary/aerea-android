# Architecture guardrails

## Layers

| Layer | Main locations | Responsibility |
| --- | --- | --- |
| Safe configuration | `app/config/**`, `app/styles/manual-customization.css` | User-editable identity, ordinary defaults and design tokens |
| Presentation | `app/globals.css`, `app/*.module.css`, view components | Layout and visual rendering |
| Domain behavior | `app/planner-logic.ts`, `app/aerea-features.ts`, feature components | Pure calculations and feature rules |
| Persistence and integrations | `app/supabase-sync.ts`, `app/api/**`, `db/**`, `supabase/**` | Private state, auth, cloud data and server storage |
| Native platform | `android/**`, Capacitor plugin registration in `app/page.tsx` | Android storage, permissions, notifications, Back and widgets |

Dependencies should point downward. Safe configuration must stay free of
network, storage, authentication and native side effects. Run
`npm run check:boundaries` to enforce this boundary.

## Protected compatibility contracts

- Android application ID: `com.aereaary.aerea`.
- Stored keys and persisted IDs are migration-sensitive.
- Sunday-first calendars and 12-hour user-facing time are product contracts.
- App updates must preserve local data.
- AO3, private Library, Supabase reconciliation and Android plugin behavior are
  not styling helpers and must not move into configuration files.
- The recovery contracts in `docs/AEREA_RECOVERY_MANIFEST.md` remain mandatory.

## Refactoring rule

Move code without changing behavior first. A feature extraction and a visual
redesign should never share the same commit. Add a regression test before
changing any established persistence, notification, reader, Back, widget or
sync behavior.

Use `.github/workflows/verify.yml` for ordinary pull requests. The existing
`build-apk.yml` is a release workflow and intentionally publishes a prerelease;
it should not be used as the routine lint/build check.
