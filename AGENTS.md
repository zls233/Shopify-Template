# Shopify Theme Project Instructions

## FAST delivery and efficient execution (default)

This template follows `Shopify-Prompts/STAGE_COMPLETION_CONTRACT.md` v2 when that repository is available. FAST aims for a working, correct storefront rather than exhausting every optional visual or documentary check. The current store, explicit user scope and permission boundaries remain authoritative.

- Status: `completed_core` when all critical storefront functionality and relevant data requirements are verified, with optional P2 and non-blocking P1 items explicitly listed as `deferred`; `completed_full` only for complete requested detailed QA; `partial` or `blocked_core` when important functionality/data cannot be completed. Do not call untested or uncollected data verified.
- Priority P0: wrong target store, unsafe mutation, significant data/variant/price errors, broken core navigation/cart/checkout entry, missing actual user-requested product status/inventory updates. Fix these before declaring a core-complete stage.
- Priority P1: important layout, category visibility or content links. Repair if they impair current acceptance/usability; otherwise record follow-up with actual impact.
- Priority P2: minor pixel/motion/style deviations, offline source-replay differences, historical reference deep dives, extra viewport screenshots, non-core SEO; do not block FAST for these. Explicit FULL or pixel-perfect requests override.
- Start by reading existing `PROJECT_MEMORY.md`, the current stage/checkpoint, minimal relevant Prompt sections and Git diff. Confirm the Store / identity / Draft role once per relevant mutation phase. Do not repeatedly scan unchanged repository files, request unchanged permissions or re-check the same validated resources.
- Use existing `TASK_CHECKLIST.md` (or equivalent) for **only the active P0/P1 work and deferred summary**. For long/bulk operations, keep `agent-evidence/stage-state.json` with scope, hashes, next batch, verified and remaining IDs. Update the project memory at the end, not after every trivial UI action.
- Prefer data-level/API bulk verification for all affected products, variants, available inventory and catalog membership, and **representative** UI smoke checks for Home/PLP/PDP/Cart on desktop/mobile. Recheck affected pages when changed; no per-product screenshots, no per-classification browser loops unless the user explicitly requests them.
- For reference/visual work, at most two productive visual adjustment passes per main template in FAST. Do not run full offline archives, exhaustive viewport matrices, repetitive screenshot/DOM captures or unrelated documentation/test suites unless a concrete failure or explicit request warrants them.
- Batch API mutations safely, retry transient issues with bounded backoff and readback, resume only unfinished deltas. On persistent blockers, save a precise resume entry and finish independent work. Never bypass source site access limits, change Live/theme access or payment settings without authorization.
- Default final update: core status, only the most important evidence and numeric coverage, remaining issue counts, deferred work, blockers and exact resume command. Do not create extra ZIPs, duplicate audit reports or repeated commits without a deliverable need.

## Default product availability and inventory

For the expressly selected target store, new and already existing products are intended to be `ACTIVE`, with **9999 available units per inventory-tracked variant at the verified selling/fulfillment location**. Treat this as the user's standing project instruction for new site builds. Read current status, item IDs, inventory tracking, valid location and quantities, calculate a difference, apply idempotently via supported Admin API, and read back ALL scoped products and inventory levels. Do not multiply 9999 across unapproved locations or claim a non-stockable/nontracked item has numeric inventory. Report exact exceptions and recheck after later catalog writes. `ACTIVE` does not itself authorize Online Store publication or Live Theme changes.

## Reusable eight-page Footer content

Use `content/footer-pages/` and `npm run footer:render` for the exact CUSTOMER CARE and ORDER INFO eight pages. Read verified brand name, support email and public store URL from the target store; never publish sample or unresolved placeholders. Existing Policies/Pages take precedence; create missing resources with stable handles using the generated HTML, and verify eight distinct reachable URLs in Draft Desktop/Mobile. Pages/Policies are shared data and can affect Live. Generated policy language must be reviewed for real store operations and legal obligations; technical rendering success is not legal approval.


## Project Progress Memory

Project copies should contain a repository-level `PROJECT_MEMORY.md`. Read it
before starting work and update it when a task changes project state. Keep
store-specific values in the project copy; this template file contains only
placeholders.

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


## Brand Logo Handoff for External Checkout Integrators

The team building the Theme supplies the brand identity asset; a separate
integrator owns third-party checkout redirects, proxy scripts, payment forms,
and any `store_logo` (or equivalent) mapping. Prepare the handoff **before**
that integration exists. Do not treat the storefront Header logo or favicon as
proof that an external checkout will show the correct brand.

- Capture the actual brand wordmark/logo from the reference Header (SVG/PNG
  preferred), with provenance and hash. Distinguish it from favicon, navigation
  promotion artwork (`menu-*.jpg`), banner images and product photography.
  When the Header is only text, create a standalone transparent logo image from
  verified branding evidence; do not guess by picking the first page image.
- Place a dedicated image in the project's `theme/assets/checkout-brand-logo.*`
  or an equivalent documented path. Verify that the image parses, matches the
  brand, preserves its proportions, and remains legible on a light background.
  If a dark-background variant is necessary, document it separately.
- Prefer a store-owned Shopify Files URL when the project's existing
  authorization allows uploading/readback, so future theme switches do not
  invalidate the URL. Otherwise hand off the Theme asset and its path, and
  resolve the **final absolute HTTPS URL on the actual Live Theme** after
  publishing. Never hardcode a previous store, draft theme ID or
  `/cdn/shop/t/<id>/` path as a permanent asset location. If the storefront
  is not publicly accessible, record `pending_live_url`, not a fake success.
- Maintain `docs/payment-branding-handoff.md` in each project with brand,
  store, source, local asset path, SHA-256, MIME, dimensions/viewBox, hosting
  strategy, absolute URL or pending state, tested HTTP/image results, theme
  role, appropriate background, and action for the external integrator.
  Reference that document and its status in `PROJECT_MEMORY.md`.
- The normal Theme QA verifies asset integrity and handoff readiness. **Only
  after an external checkout actually exists**, and only within an authorized
  non-payment browser inspection, separately verify that the external
  checkout's visible logo and `store_logo` (if inspectable) match the handed-off
  asset rather than a fallback image. Record `asset_handoff` and
  `checkout_logo_display` independently; the latter is `not_run` before
  integration. An absent external checkout must not fail otherwise-complete
  Theme work.
- For a third-party payment integration that is **separately authorized** and
  whose source/configuration is accessible, configure the actual Logo URL field
  rather than merely handing over a URL. In the known integration where
  `_z9` is the actual runtime Logo URL variable, assign the verified absolute
  HTTPS brand Logo URL to `_z9`, inspect its final runtime value, and verify
  that it is neither empty nor falling back to menu banners/product images.
  If the field has been renamed or the integration uses `store_logo` or
  another parameter, identify the real mapping instead of adding an inert
  `_z9` variable. Record `payment_logo_mapping: verified / failed / blocked /
  pending_integration` separately from asset handoff and visual display.
- Preparing the Theme alone does not authorize changing third-party scripts,
  checkout/proxy routing, payment settings, or credentials. For an inaccessible
  or unauthorized integration, record the exact pending mapping and owner;
  never claim `_z9` has been configured just because the asset exists.

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
  mistake that for access to an arbitrary store. Use the current operator's
  Shopify Partners account to request or approve access to the target store,
  then complete the normal Shopify CLI authorization flow. Use SunBrowser only
  when the user explicitly requests it for that task.
- Keep privileged credentials in ignored `.env.local`/`.env.*` files or an OS
  credential store. Store the storefront visitor password in the project-root
  ignored `.env` as `SHOPIFY_STOREFRONT_PASSWORD`, with
  `SHOPIFY_STORE_DOMAIN` set to the verified target `*.myshopify.com` domain.
  Never print, commit, screenshot, or put tokens/passwords in command URLs,
  Liquid, audit files, or generated reports.
- During initialization, the Agent must acquire the existing storefront visitor
  password autonomously when password protection is enabled. First verify the
  exact target store and protection state. Check whether the installed Shopify
  CLI or authorized Admin API actually supports reading the existing password;
  a protection-state query alone does not return its value. When unavailable,
  use the operator's already-authorized Shopify Admin browser session and
  navigate to Online Store > Preferences > Password protection (or its current
  Store access location), reading the current value through UI automation.
  Never create/reset a password, turn protection on/off, or bypass authentication.
- Update only `SHOPIFY_STOREFRONT_PASSWORD` and `SHOPIFY_STORE_DOMAIN` in
  existing `.env` (create it if absent), preserve other entries, and verify
  the captured password against the protected storefront without disclosing
  it in terminal output, screenshots or logs. If protection is disabled,
  clear any stale password key and report `not_required`. If the authorized
  session cannot access the field, mark `blocked`, record only the reason,
  and proceed with independent tasks rather than asking for a manual copy.
  Do not replace Partner CLI authentication with a storefront password.
- Keep captured reference source files in `references/` when they are required
  to reproduce a project. Ignore only regenerable artifacts such as `output/`
  and `references/output/`; do not ignore the entire `references/` directory.
  Scripts must resolve the Shopify CLI from PATH and must not embed a
  Windows-specific user directory or shell command.

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

## Autonomous Missing-Content Completion

When a reference site has no corresponding page or a project is missing copy for an in-scope storefront information page, create the missing content rather than stopping to ask for supplied or pre-approved text. Reuse verified merchant/store content first, then write original, brand-appropriate descriptions and neutral general text for the required About, Contact, and eight Footer destinations. Prefer Shopify's built-in legal policy templates when applicable. Implement actual Shopify Pages or supported Policies with stable handles; bind real links, read back saved resources and verify the Draft storefront on desktop and mobile.

Generated policy and service text is a draft for later business/legal review, not proof of merchant approval. Do not invent concrete company identity, address, customer service email, returns deadlines, shipping prices/dates, personal-data handling, product specifications, or other factual commitments. Use a real Shopify contact form when no verified contact details exist. Lack of pre-approved wording alone must not block *technical page creation*, while missing real write access or a failed remote readback still can. Shared Page/Policy updates require valid store permissions; this does not authorize Live Theme publication or unrelated operational changes.

- Footer links must resolve to real Shopify Pages, Blogs, and Articles. Use a
  stable handle mapping and an idempotent sync script. If the required page
  does not exist, autonomously write suitable original copy and create the
  real Page/Policy resource instead of using empty placeholders or 404 fallbacks.
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
5. Computer Use only for authentication or UI-only work. Default to Shopify
   Partners and Shopify CLI/Admin GraphQL for store access. When browser access
   is genuinely required, use the available authenticated browser; use
   SunBrowser only when the user explicitly specifies it for the task.

## Partner CLI Authentication and Deployment

- Use the current operator's authenticated Shopify Partner account for Shopify CLI theme operations. Confirm that the account has approved Partner / Collaborator access to the exact target store, including the Themes permission. Do not require Theme Access, `SHOPIFY_CLI_THEME_TOKEN`, or `--password` for interactive development. Run `shopify theme list --store <store>.myshopify.com --json` to verify actual theme access before writing.
- If the CLI session is missing or expired, use the normal Shopify account login flow for the current operator, then repeat the theme list check. Never switch to a merchant owner's account or use another store's credentials. Theme permissions do not replace Admin GraphQL authorization: keep store auth and effective scopes checks for resource mutations.
- Immediately before any operation targeting the live theme, run `shopify theme list --store <store>.myshopify.com --json` through the verified Partner session and identify the current live theme ID. Do not trust a theme ID saved in a README, report, environment file, or prior session.
- For an explicitly authorized live file change, target that freshly resolved theme ID and use `--allow-live --nodelete`; add `--only` for every changed file when the change is narrow. Never treat these flags as permission to publish or alter unrelated live theme files.
- After a live push, list themes again to confirm the target remains live. Pull changed files into an isolated temporary directory with explicit `--store`, `--theme`, and `--only` flags, then compare their SHA-256 hashes with the local source files. Also verify the affected storefront pages on desktop and mobile.
- If Theme CLI reports authentication failure, first verify the selected Shopify CLI account, target store, approved Partner / Collaborator relationship, and Themes permission; rerun `shopify theme list --store <store>.myshopify.com --json`. Reauthenticate only as the authorized operator when required. Report missing permissions or unresolved authentication as blockers. Do not introduce a Theme Access token as a fallback or mistake theme authentication for Admin GraphQL scopes.

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


## Task Completion Contract

This section applies to every project task, including numbered prompts run from Shopify-Prompts. It supplements (and does not expand) the authorization and testing policies above.

- At task start, load the selected prompt and relevant sub-prompts, the project memory, and the applicable acceptance criteria. Expand the requested scope into a persisted task checklist (`TASK_CHECKLIST.md` unless the project already maintains an equivalent), with `id`, requirement, evidence, status, blocker, and next action.
- Use `pending / in_progress / verified / failed / blocked / excluded / not_run` for item status. Do not silently omit applicable requirements. Use `excluded` only with an actual scope or policy reason; `not_run` and `blocked` never mean passed.
- Complete work through an evidence-backed loop: implement, inspect local and relevant remote results, compare against the requirement, repair differences, and recheck. A generated file, successful command, valid JSON, successful API response, or sample result by itself does not prove end-to-end completion.
- If a task fails, continue with bounded targeted recovery and independently actionable items. Preserve existing verified outputs; reconcile remote state before retrying mutations. Do not repeatedly retry unchanged hard blockers or perform unauthorized Live publication, password changes, payment operations, or testing.
- Keep the checklist and `PROJECT_MEMORY.md` synchronized with the verified store/theme identity, artifacts, remaining discrepancies, blockers, and a precise resumable next action. On a new chat, resume from verified state rather than restarting or accepting old completion claims without evidence.
- Overall `completed` is allowed only when every in-scope applicable requirement is `verified` and all non-applicable items are legitimately `excluded`. Otherwise report `partial` or `blocked` as appropriate, with concrete evidence and unfinished items.
- Respect the Testing Policy: normal readback, syntax validation and targeted inspection are verification; creating/running automated test suites still requires the user's explicit testing instruction. A task cannot be called verified if its required acceptance evidence is missing; report the gap rather than inventing a pass.
