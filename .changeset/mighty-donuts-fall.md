---
'astro': patch
---

Fixes a bug where the `astroConfig` option of `AstroContainer.create()` was ignored. Configuration values such as `site` are now applied, making `Astro.site` available when rendering components with the Container API
