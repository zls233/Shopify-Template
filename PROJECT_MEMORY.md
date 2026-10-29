# Shopify Project Memory

<!-- Copy this file into each project and replace the placeholders. Keep it current after every task that changes store, theme, content, catalog, or verification state. -->

Last updated: `YYYY-MM-DD`

## Target

- Store: `<store>.myshopify.com`
- Reference site: `<https://...>`
- Admin identity: `<CLI store auth or project App>`
- Live theme: `<name> (<id>)`
- Draft theme: `<name> (<id>)`
- Publication/channel IDs: `<record or N/A>`
- Never publish or modify Live without explicit authorization.

## Repository

- GitHub: `<owner/repository>`
- Visibility: `<private/public>`
- Default branch: `<branch>`
- Secrets stay in ignored `.env.local` or an OS credential store.

## FAST core readiness (updated at stage end)

- Execution mode: `FAST | FULL`; stage result: `completed_core | completed_full | partial | blocked_core`.
- P0 blocking issues: `<count and exact issues>`; P1 affecting launch: `<count>`; P2 / nonblocking P1 deferred: `<short list>`.
- Evidence reuse: `<current store/theme/input hash and proof>`; only rerun changed/failed checks.
- Browser smoke: `<core pages sampled and desktop/mobile coverage, not whole-site UI claims>`.
- Next precise unfinished action: `<command or N/A>`.

## Stage execution checkpoint

- Stage entry / canonical Prompt path: `<ID/path>`
- Stage state and checklist: `agent-evidence/stage-state.json` / `TASK_CHECKLIST.md`
- Current actionable remainder / blocker / resume command: `<actual evidence>`
- Scope: all target-store products `ACTIVE`; tracked variants available `9999` at verified location `<GID>`; Online Store publication separate.
- Catalog status/inventory readback: `<counts, exact failed GIDs, time>`
- Footer template generation: `output/footer-pages/manifest.json` (`<brand/email/url verified>`); eight Page/Policy handles and technical/live scope: `<readback>`

## Completed phases

- `<phase>`: `<result>`

## Current Shopify data

- Products: `<count and verification date>`
- Collections: `<handles, GIDs, counts>`
- Menus: `<handles and hierarchy status>`
- Pages/blogs/articles: `<handles and GIDs>`
- Metaobjects/files/inventory: `<status>`


## External checkout brand Logo handoff

- Brand Logo source: `references/_shared/branding/checkout-logo-source.json` (or documented equivalent)
- Dedicated asset: `theme/assets/checkout-brand-logo.<ext>` (or documented equivalent)
- Handoff: `docs/payment-branding-handoff.md`
- Hosting/absolute URL: `<Shopify Files URL | Live theme asset URL | pending_live_url>`
- Asset source hash / MIME / dimensions: `<record>`
- `asset_handoff`: `<verified / failed / blocked>`
- `checkout_logo_display`: `<verified / failed / blocked / not_run / excluded>`
- External integrator action: `<point store_logo or equivalent at the handed-off URL; verify after integration>`
- Never infer external checkout branding from favicon or Header Logo alone.

## Known limits and blockers

- `<password protection, missing scopes, missing approved content, empty catalog, or N/A>`

## Verification baseline

- `npm run check`: `<pass/fail/date>`
- `shopify theme check --path theme`: `<pass/fail/offenses/date>`
- `git diff --check`: `<pass/fail/date>`
- Admin GraphQL readback: `<what was verified/date>`
- Browser QA: `<Draft/live, viewport, result, artifact paths>`

## Important files

- Theme: `theme/`
- Audit records: `docs/`
- Reference evidence: `references/`

## Safe next steps

1. Read this file and `AGENTS.md` before changing the project.
2. Resolve the target store and current Draft/Live theme roles immediately before operations.
3. Run static checks and read back remote state after each mutation.
4. Record blockers and the exact resume command instead of claiming unverified success.
