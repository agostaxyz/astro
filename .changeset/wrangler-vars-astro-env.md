---
'@astrojs/cloudflare': patch
---

Loads `vars` from your Wrangler config so `astro:env` public variables resolve at build time

Public variables (`access: 'public'`) are inlined at build time, but the adapter only read `.dev.vars` into the environment — variables defined under `vars` in `wrangler.toml`/`wrangler.json`/`wrangler.jsonc` were missing, so direct imports from `astro:env/client` and `astro:env/server` resolved to `undefined` (only `getSecret` worked). The adapter now reads `vars` from your Wrangler config (respecting `CLOUDFLARE_ENV`) so these imports work as documented. `.dev.vars` still takes precedence, matching Wrangler.
