# Shopify Theme Project Instructions

These instructions apply to the whole Shopify template repository. The
template should make new stores repeatable, auditable, and safe to work on.

## Template Scope

Keep this template deliberately small. It is a starter Theme plus a few
reusable checks, not a Shopify framework. Prefer a direct script over a
general-purpose sync framework, Service/Repository abstraction, or platform
for visual regression. Add a new abstraction only after the same problem has
appeared in at least two real projects and the repeated behavior is clear.

The default reusable foundation is limited to the minimal Theme skeleton,
ignored environment files, store/scope validation, a small Admin GraphQL
helper, and one storefront smoke test. Resource-specific sync scripts should
stay inside the real project that needs them until repetition justifies
promoting them here.

## Operating Rules

- Identify the target store explicitly at the start of every task. Never trust
  a script default, an old `.env`, or the currently selected Shopify Admin
  tab.
- Before any mutation, print or assert the store domain, app client identity,
  theme ID, and publication/channel IDs. After the mutation, query the same
  store and verify the result.
- Work against a Draft/Development Theme by default. Do not publish a theme,
  replace the live theme, delete products, or delete collections without an
  explicit user instruction.
- Treat a successful CLI command as only one part of verification. A deploy is
  not proof that the remote app scopes, API resources, or storefront output are
  correct.
- Keep a machine-readable audit file for bulk or structural work. Include the
  store, identity, action, stable handle/GID, counts, errors, and verification
  result.

## Testing Policy

- By default, do not create, run, repair, or delegate unit, integration, or
  end-to-end tests. Only do testing work when the user explicitly requests it;
  never add unit tests after implementing a feature.
  The existing storefront smoke test is available for opt-in use, not a
  mandatory step in every task.
- When testing is explicitly requested, strongly prefer end-to-end tests of
  complex storefront behavior on the named Draft/Development Theme over
  isolated unit tests. Use the smallest relevant flow during development;
  reserve the full end-to-end suite for the end of the task, and run it only
  when the user has authorized testing. Do not treat a passing browser flow as
  proof of Admin scopes, publication, or remote data state.
- If an isolated test is genuinely necessary and explicitly requested, write
  down the plausible failure modes and define its scope before implementing
  the feature or test. Keep that test scoped to those failure modes; do not
  add a unit-test suite by default.
- At the end of an authorized end-to-end run, retain a reproducible,
  verifiable artifact: the exact command and target store/theme, code revision,
  test result, and relevant trace or screenshot paths. Redact secrets and keep
  generated artifacts out of Git unless explicitly requested. If the run
  cannot complete, record the blocker rather than reporting a pass.
- Theme Check, syntax/JSON checks, Admin GraphQL readback, and targeted
  storefront browser inspection remain separate verification activities.
  Report which were performed and which tests were not run.

## Authentication, Scopes, and Secrets

- For merchant-owned Products, Collections, Menus, Pages, Blogs, Articles,
  Publications, Files, inventory, and Metaobjects, use one consistent Admin
  GraphQL identity. The direct CLI path is `shopify store auth` followed by
  `shopify store execute`; the project's own App is also supported. App-owned
  `$app` Metafield or Metaobject schemas and entries require their owning App.
- Shopify CLI is appropriate for store auth and execution, app build/deploy,
  theme check/dev/push, and other supported operations.
- For a full store-building project, request the broad site-building scope set
  at initial app installation: `write_products`, `write_publications`,
  `write_online_store_navigation`, `write_content`, `write_metaobjects`,
  `write_metaobject_definitions`, `write_files`, `write_inventory`, and
  `read_locations`. This covers catalog, collections, publication, navigation,
  pages/blogs/articles, structured content, Shopify Files, and inventory work
  without repeated scope changes during the build. A write scope includes its
  corresponding read capability, so explicit duplicate `read_*` declarations
  are not needed. Do not add customer, order, payment, or other unrelated
  operational scopes unless the project later requires them. Theme-only
  projects do not need this Admin GraphQL scope set.
- This template has no `shopify.app.toml`. Theme-only projects do not need an
  App solely to request candidate scopes. Merchant-owned resource work can use
  CLI store auth without scaffolding a project App. If project-owned schemas or
  a dedicated App identity are needed, create or link this project's own App
  before validating or deploying its configuration.
- For a dedicated project App, keep separate records of planned scopes,
  scopes declared in `shopify.app.toml`, and scopes actually granted to the
  installed App. Validate App config with `shopify app config validate --json`
  before deploying. For CLI store auth, compare requested and actually granted
  scopes through `connect:shopify`.
- Read `currentAppInstallation.accessScopes` before assuming a scope is active.
  Local `shopify.app.toml` changes do not update an existing installation by
  themselves; deploy and then re-authorize/reinstall the app when required.
- For the direct CLI path, run
  `npm run connect:shopify -- --store <store>.myshopify.com` before resource
  work. It checks existing authorization, requests the broad site-building
  scopes only if needed, then verifies the real store, App identity and scopes.
  Reuse the stored CLI authorization; rerun the command if it expires. For the
  dedicated project App path, run
  `npm run preflight:shopify -- --store <store>.myshopify.com` with this
  project's `SHOPIFY_APP_CLIENT_ID` and Admin token configured locally.
- Check the current app's ability to perform the planned operation, not merely
  whether both the `read_*` and `write_*` names appear in a local list. If the
  task only reads a resource, request its read scope instead of its write scope.
- `shopify app execute` permits mutations only on dev stores. For production
  data work under CLI store auth, use `shopify store execute --store ...
  --query-file ... --allow-mutations` and inspect GraphQL errors, userErrors,
  and readback. Scopes do not grant ownership of another App's Metaobjects.
- In non-interactive environments, app deployment needs an explicit approval
  flag, normally `shopify app deploy --allow-updates`.
- If CLI app installation only supports an organization dev store, do not
  mistake that for access to an arbitrary store. Use the normal OAuth flow in
  the already authenticated SunBrowser session or ask for the required manual
  authorization.
- Keep credentials in ignored `.env.local`/`.env.*` files or an OS credential
  store. Never print, commit, screenshot, or put tokens/passwords in command
  URLs, Liquid, audit files, or generated reports. A storefront password may
  be entered for the current SunBrowser session, but must not be persisted
  without explicit confirmation.

## Shopify Data Model

Keep the resource graph as the source of truth:

`Product attributes -> Automated Collection -> Shopify Menu -> Theme navigation -> Collection grid`

- Products own product data and classification attributes. Normalize new tags
  as lowercase `namespace:value` strings such as `gender:women`,
  `category:clothing`, and `subcategory:pants`.
- Preserve unrelated existing tags, product types, and metafields. Classify
  from deterministic evidence in title, product type, vendor, description,
  existing tags, and metafields. Report ambiguous/unclassified products
  instead of silently guessing.
- Collections must be automated/rule-based. Reuse an existing collection by
  stable handle before creating one. Do not store product ID lists in Liquid or
  JavaScript.
- When a collection mixes categories (for example, men's or children's items
  appearing in a women's collection), inspect product tags/metafields and the
  automated collection's conditions first. Check collection counts and sample
  products that should both match and fail the rules before changing Liquid.
- Do not make title/handle substring filtering in Liquid the permanent source
  of collection membership. If an explicitly authorized temporary storefront
  guard is necessary, document that pagination and `products_count` can differ
  from the visible items, then remove the guard after correcting Shopify
  product classification and collection rules.
- Publish required collections and products to the Online Store channel
  explicitly. `ACTIVE` status is not the same as Online Store publication;
  use `publishablePublish` (or the equivalent API) and verify publication.
- Menus own labels, hierarchy, and destinations. Update the existing menu by
  handle when possible; do not create duplicate menus for the same surface.
  Leaf items should link to real Shopify Collection resources.
- Use Metaobjects for optional structured presentation data such as mega-menu
  banners, headings, descriptions, images, and featured collections. Define
  app-owned schemas in `shopify.app.toml` using `$app:<type>`, deploy before
  creating entries, and record the remote definition GID and access settings.
  When Liquid reads an app-owned type, use the concrete deployed type returned
  by Shopify (for example `app--<app-id>--mega_menu`), not the `$app:` alias.
  Set merchant read/write access only when merchants must edit entries, and
  enable Storefront access only when the theme reads the type. If Shopify
  reports that a type is reserved or ownership is invalid, stop and record the
  limitation; do not retry the same mutation unchanged.

## Idempotent Scripts and GraphQL

- Every mutation script must default to a dry run and require an explicit
  `--store`. Before mutation, validate store, app identity, required scopes,
  and stable handles.
- Use stable handles with upsert/update behavior. A rerun must not create
  duplicate menus, collections, pages, articles, entries, or media.
- Prefer GraphQL variables over string interpolation. Pin an explicit supported
  Admin API version.
- Check HTTP status, top-level GraphQL errors, and every mutation's
  `userErrors`. Treat a partial batch as partial success and resume from an
  auditable checkpoint.
- Retry only transient TLS/connection-reset, 429, and 5xx failures with
  bounded backoff. Do not retry missing scopes, ownership, schema, or
  validation failures unchanged.
- For large imports, show a dry-run count, batch writes, preserve a progress
  report, and query final counts. Network interruption does not prove that a
  previous batch failed; verify before repeating it.
- Use structured output, for example:
  `{"store":"...","action":"...","handle":"...","gid":"...","count":0,"errors":[]}`.

## Content Pages and Blogs

- Footer links must resolve to real Shopify Pages, Blogs, and Articles. Use a
  stable handle mapping and an idempotent sync script rather than fake content
  or hardcoded 404 fallbacks.
- Content scripts must fail safely before mutation when the installed app lacks
  the ability to write content. Do not require both scope names when
  `write_content` already grants read capability. A theme can retain an official
  external help or store-locator link as a documented fallback, but must not
  invent order, store, or shipping data.

## Theme Architecture

- Header, mega menu, and mobile navigation must render
  `section.settings.menu.links` and nested `link.links`. Do not maintain a
  second navigation tree in Liquid or JavaScript.
- Collection templates must use `collection.products` with native Shopify
  sorting, filters, pagination, availability, price, variants, and PDP links.
  Do not add a second client-side product filtering system.
- Use native objects with safe fallbacks when optional Metaobject values are
  blank. Keep each edit in the section, snippet, asset, or template that owns
  the behavior.
- Variant behavior must be driven by `product.variants`, `variant.options`,
  `variant.featured_media`, and `selected_or_first_available_variant`. Match
  both `Color` and `Colour` option names when relevant. Never infer variants
  from image filenames.
- A catalog made mostly of `Default Title` products cannot prove real option,
  media, price, and URL linking. Reuse an existing multi-variant product when
  possible; otherwise create a clearly tagged, stable-handle QA fixture only
  after checking `write_products` and publication scopes. Fixture creation must
  be dry-run by default, idempotent, and must verify Online Store publication.
- Keep controls accessible: valid labels, keyboard operation, focus return,
  `aria-expanded`/`aria-hidden` synchronization, Escape/backdrop close paths,
  and mobile scroll locking.

## Interaction and Motion QA

Do not implement motion from screenshots alone when the source site can be
measured.

1. Inventory the original site's components before editing: header/sticky
   states, mega menu, product cards, swatches, gallery, variants, drawers,
   filters, accordions, carousels, video controls, and footer.
2. Use Playwright or DevTools to observe desktop and mobile default, hover,
   focus, active, expanded, collapsed, and scroll states. Record trigger,
   geometry, `display`/`visibility`/`opacity`, transforms, z-index, overflow,
   pointer events, transition property, duration, delay, and easing.
3. Distinguish real triggers (click, hover, `aria-expanded`, scroll listener,
   IntersectionObserver, pointer/touch) instead of converting everything to a
   CSS hover.
4. Compare the same action on the source and Draft Preview at before/mid/after
   states. Validate at least 1440px desktop and 390x844 mobile. Check behavior,
   motion, geometry, and responsive match, not just whether a click works.
5. Maintain `interaction-audit.md` with Component, Trigger, Initial/Active
   State, Transition, Duration, Delay, Easing, Desktop, Mobile, Evidence,
   Implementation, Confidence, and Validation Result. Label evidence as
   `Observed`, `Source-derived`, or `Inferred`; never present an inference as a
   measurement.
6. Prefer the existing theme JS/CSS and native Web APIs. Do not copy minified
   analytics, tracking, account, or support scripts and do not add a large
   animation framework for ordinary theme interactions.

Known implementation pitfalls:

- A CSS rule such as `display:grid` can override the browser's `[hidden]`
  behavior and show every mega-menu panel. Add an explicit hidden rule with
  the required specificity, then test opening one panel and closing it.
- A mobile drawer whose inner content is absolutely positioned can collapse to
  its header height even when it has `top:0; bottom:0`. Give the drawer a real
  viewport-sized wrapper (`inset:0`, `min-height:100dvh`) and verify backdrop,
  `aria-hidden`, and `body { overflow:hidden }` all reset on close.
- Do not treat Shopify `shop.app` iframe/CSP, favicon, telemetry, or third-party
  CDN errors as Theme JavaScript failures. Separate console noise from actual
  theme errors in the audit.

## Browser, CLI, and Local Workflow

Use this order of operations:

1. Shell, repository scripts, and static inspection.
2. Shopify CLI store auth/execute for merchant-owned resources, or the project
   App plus Admin GraphQL when it owns the target resources.
3. Shopify CLI for app/theme lifecycle.
4. Playwright for storefront interaction and screenshot QA.
5. Computer Use only for authentication or UI-only work. When Shopify Admin
   access is needed through a browser, SunBrowser is required: use the
   authenticated SunBrowser session and do not switch to an in-app browser or
   another browser profile for the same task.

## Theme Access and Deployment

- Prefer a Theme Access token for Shopify CLI theme operations. Load
  `SHOPIFY_CLI_THEME_TOKEN` from an ignored `.env.local` or an OS credential
  store into the command environment without printing it. A storefront password
  is not a Theme Access token. Do not start `shopify auth login` or change the
  selected account unless the user explicitly authorizes account-based login.
- Immediately before any operation targeting the live theme, run
  `shopify theme list --store <store>.myshopify.com --json` using Theme Access
  and identify the current live theme ID from that response. Do not trust a
  theme ID saved in a README, report, environment file, or prior session.
- For an explicitly authorized live file change, target that freshly resolved
  theme ID and use `--allow-live --nodelete`; add `--only` for every changed
  file when the change is narrow. Never treat these flags as permission to
  publish or alter unrelated live theme files.
- After a live push, list themes again to confirm the target remains live.
  Pull changed files into an isolated temporary directory with explicit
  `--store`, `--theme`, and `--only` flags, then compare their SHA-256 hashes
  with the local source files. Also verify the affected storefront pages on
  desktop and mobile. A successful upload or matching hash alone does not
  prove that the visible result is correct.
- If Theme CLI reports `401 Service is not valid for authentication`, first
  check that the intended Theme Access token is present in the command
  environment without displaying it, that it belongs to the target store and
  has the needed theme access, and that no stale theme process is running.
  Retry with explicit `--store`, `--path`, and `--theme`. If Theme Access cannot
  be restored, report the authentication blocker; use account-based
  `shopify auth logout` / `shopify auth login` only when the user has explicitly
  authorized that path. Theme authentication never authorizes using the CLI
  identity for Admin GraphQL data mutations.

Stop a long-running `theme dev` watcher before patching files if it holds a
lock or blocks writes; restart it with the explicit Draft Theme after edits.
If Theme Check hangs, record the tool blockage and continue with syntax,
template JSON, Liquid, and browser checks rather than claiming a pass.

Browser sampling can fill local temporary storage. Monitor free space and clean
only regenerable npm/browser caches; never remove project files or browser
profiles as a shortcut.

## Required Verification

For app or schema changes:

```bash
shopify app build
shopify app deploy --allow-updates
```

For theme changes:

```bash
shopify theme check --path theme
shopify theme dev --store <store>.myshopify.com --path theme --theme <draft-theme-id>
```

Also run `node --check` for changed JavaScript, parse changed JSON templates,
and run `git diff --check`.

Verify through Admin GraphQL:

- installed scopes and app identity;
- Metaobject definition GIDs, fields, and access;
- stable entry handles and references;
- collection rules, counts, and Online Store publication;
- menu handle, hierarchy, and resource destinations;
- Pages, Blogs, and Articles when content was requested.

Storefront QA must cover desktop and mobile navigation, nested menu items,
Collection URLs, representative positive and negative products, sorting,
filtering, pagination, variant/PDP navigation, and any changed drawer or
accordion paths. State clearly whether the tested theme is Draft or live.

## Git and Repository Hygiene

- Keep secrets, `.env*`, caches, generated screenshots, and large source media
  out of commits unless the project explicitly needs a tracked asset.
- Before pushing, inspect tracked file sizes and `.gitignore`. A Shopify theme
  should not accidentally carry hundreds of megabytes of generated media.
- If Git appears hung, check for stale `git status`/`git push`/pack processes and
  large objects before starting more commands. Clean the stale process safely,
  then retry with a bounded, lower-resource pack configuration or Git LFS for
  intentionally large assets. Verify the remote commit hash and repository
  visibility after push.

## Completion Report

Every Shopify task should finish with:

- store and app identity used;
- scopes and ownership model;
- created/updated stable handles and GIDs;
- files changed;
- build/deploy, Theme Check, Theme Dev, API audit, and browser QA results;
- Draft vs live theme/publication state;
- remaining manual approval, reauthorization, login, or publication steps;
- known limitations and the exact next command or action to resume safely.
