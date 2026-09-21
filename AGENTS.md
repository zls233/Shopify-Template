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

## Authentication, Scopes, and Secrets

- Use the project's own Shopify app identity for Admin GraphQL resource work.
  Do not use `shopify store auth` or a CLI built-in identity for new Products,
  Collections, Menus, Publications, or Metaobjects automation.
- Shopify CLI is appropriate for `app build`, `app deploy`, `theme check`,
  `theme dev`, and `theme push`.
- Read `currentAppInstallation.accessScopes` before assuming a scope is active.
  Local `shopify.app.toml` changes do not update an existing installation by
  themselves; deploy and then re-authorize/reinstall the app when required.
- Request only the scopes needed for the operation. Typical scopes are:
  `read_products`, `write_products`, `read_publications`,
  `write_publications`, `write_online_store_navigation`,
  `read_metaobjects`, `write_metaobjects`,
  `read_metaobject_definitions`, `write_metaobject_definitions`,
  `read_content`, and `write_content`.
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
- Content scripts must fail safely before mutation when `read_content` or
  `write_content` is missing. A theme can retain an official external help or
  store-locator link as a documented fallback, but must not invent order,
  store, or shipping data.

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
2. Project App plus Admin GraphQL API for data/resource work.
3. Shopify CLI for app/theme lifecycle.
4. Playwright for storefront interaction and screenshot QA.
5. Computer Use only for authentication or UI-only work. When Shopify Admin
   access is needed through a browser, SunBrowser is required: use the
   authenticated SunBrowser session and do not switch to an in-app browser or
   another browser profile for the same task.

If Theme CLI reports `401 Service is not valid for authentication`, confirm no
stale Theme CLI process is running, run `shopify auth logout`, run
`shopify auth login`, select the intended account, and retry with explicit
`--store`, `--path`, and `--theme`. This recovery does not authorize using the
CLI identity for Admin GraphQL data mutations.

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
