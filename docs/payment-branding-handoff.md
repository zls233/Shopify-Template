# External Checkout Brand Logo Handoff

> Project-specific file: replace the placeholders after capturing branding and deploying the image. This file is **not** evidence that a payment system has been integrated or tested.

## Store / identity

- Brand: `<brand>`
- Shopify store: `<store>.myshopify.com`
- Reference Header URL: `<source URL>`
- Source evidence: `references/_shared/branding/checkout-logo-source.json` (or `<equivalent>`)
- Brand comparison: `<actual Header wordmark evidence; desktop/mobile>`

## Dedicated logo image

- Local path: `theme/assets/checkout-brand-logo.<ext>` (or `<document equivalent>`)
- Source SHA-256: `<hash>`
- Deployed image SHA-256: `<hash>`
- MIME / dimensions or SVG viewBox: `<record>`
- Background: `<light / dark / alternate variant>`
- Asset verification: `<valid image, brand match, proportions, background contrast, evidence path>`

**Do not use:** favicon, menu promotions (`menu-*.jpg`), banners, category tiles, or product photos. The Header rendering alone is not a usable image URL.

## Hosting / URL

- Hosting: `<Shopify Files | Theme asset>`
- Store / Theme ID / role at verification: `<actual identity>`
- Absolute HTTPS URL: `<verified URL | pending_live_url>`
- How URL was resolved: `<Files readback | current Theme Liquid asset_url / live readback>`
- HTTP status / MIME / decode / brand appearance: `<verified values, date, evidence>`
- After changing Live Theme or domain: **re-resolve and reverify the URL** if the asset is theme-hosted.
- If a Draft or password-protected storefront prevents public URL validation, leave `pending_live_url`. Do not invent a success state.

## Handoff and responsibilities

- `asset_handoff`: `pending` (later: `verified / failed / blocked`)
- `checkout_logo_display`: `not_run` (later: `verified / failed / blocked / not_run / excluded`)
- External integrator action: set their explicit checkout brand Logo URL to the **verified dedicated image URL**. If this integration's confirmed Logo URL variable is `_z9`, **configure `_z9` to this exact URL, not an empty string**. If the runtime uses `store_logo` or a renamed/minified field, locate and configure that real field; never create an unused `_z9` just to satisfy a check. Disable unsafe fallback to menu images or products.
- Actual integration field: `<_z9 | store_logo | confirmed alternate | pending_integration>`
- `payment_logo_mapping`: `pending_integration` (later: `verified / failed / blocked / pending_integration`)
- Mapping evidence: `<runtime value/image URL match, integration revision, browser evidence, date>`
- Theme team's action: provide the asset, URL and verification evidence. Do not change an external payment/proxy script without separate authorization.
- Final post-integration check: Desktop and Mobile checkout header logo matches this asset; optional safe `store_logo` request inspection; no payment, no order, no personal data.
- Integration owner / evidence / remaining action: `<record>`

## Status rationale

`asset_handoff` and `checkout_logo_display` are separate states. A missing external payment integration does **not** invalidate the Theme's verified asset handoff. Conversely, a verified asset and a successful HTTP response are **not** proof that the external checkout displays it.
