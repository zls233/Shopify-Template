# Navigation fidelity and source-domain link integrity gate

This template inherits `Shopify-Prompts/NAVIGATION_LINK_GATE.md` and `STAGE_COMPLETION_CONTRACT.md` v3. Scope: authorized source sites and project-approved components only. Theme changes target a verified **unpublished Draft**, not Live; Shopify Menus/Pages/Collections are shared resources and require separate impact/scopes review.

## Source evidence and mapping (2-1 → 3-1)

Before writing navigation, capture source Desktop 1440×900, Mobile 390×844 and the actual breakpoint(s), including default/hover/click/focus/touch/expanded/collapsed/scroll states. Observe whether Products is a single Mega Menu trigger with nested columns, rather than assuming flattened header links. Preserve screenshots, DOM, computed geometry, actual label/order/hierarchy, banner and CTA destinations.

Maintain `references/navigation-link-map.json` (or equivalent) with one row per in-scope entry: `source_page`, `selector_or_menu_path`, `label`, `hierarchy`, `device_state`, `source_href`, `expected_kind`, `target_url`, `resource_id`, `publication`, `status` and `evidence`. Include hidden submenu links, Logo, Home cards/CTAs, Search/Cart and the approved Footer eight pages. After catalog import resolve Collections/Products by actual Shopify resource ID, publication and content, not by guessed URL shape.

## Implementation rules (4-1)

- Preserve the source Header/Mega Menu columns, category switching, animations, breakpoints, drawer behavior, search/cart and accessibility. Missing menu data must not be disguised by switching to a simplistic header.
- Bind to verified local collections/products/pages/search/cart. **Never** fall back to the source brand domain, `#`, empty href, `javascript:void(0)`, homepage redirect or a guessed `/pages/<handle>`. Fix menu-generating scripts as well as rendered Theme files, and retest after re-sync.
- Content Pages can be created with permission where appropriate; an actual product category, parts finder or dealer locator cannot be replaced with an unrelated generic Page while claiming equivalent functionality. Do not invent dealer listings, product details or operational/legal facts. Mark genuine dependency gaps `blocked`; user-approved excluded features `excluded`.
- Allow legitimate external payment/help/legal destinations **only** with a documented per-URL purpose and authorization. Do not automatically allowlist the original brand website.

## Checks before 4-1 and 6-1 completion

Run local static scanner (no network, no Shopify write):

```bash
npm run audit:links -- --source https://www.source.example --theme theme --report agent-evidence/navigation-link-static.json
```

For a specifically approved original-site external URL, add a **per-URL** `--allow-url https://www.source.example/approved-path` and document why. This tool scans text Theme files; it cannot examine Shopify Admin menus, runtime JS redirects or actual page content and must never be described as a complete storefront audit.

Next, read Shopify menus/Section Settings, map all in-scope destinations to real published resources and inspect rendered Desktop and Mobile navigation (including expanded hidden states). Compare source and Draft Header/Products layout, geometry, hover category switching, touch drawers, Escape/focus, scroll locking and adjacent search/cart behavior. For actual clicks follow HTTP redirects/new tabs, assert final origin, correct resource template and content; a 200 on the original website is a failure unless explicitly approved.

Record `agent-evidence/navigation-link-audit.json`: checked store/theme ID/role, reference version, total/verified/failed/blocked/excluded, each expected/actual URL and evidence, post-fix recheck. Repeat the affected areas after corrections. Missing structural fidelity **or** link correctness is P0/P1, not an optional P2. Syntax checks, Theme Check and SHA/readback are helpful but insufficient alone. Do not perform unauthorized Live pushes, payment changes, or checkout submissions.
