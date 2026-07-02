---
'astro': patch
'@astrojs/check': patch
---

Fixes `astro check` falsely reporting TypeScript as not installed when using TypeScript 7

TypeScript 7 removed its default CJS entry point, causing `require.resolve('typescript')` to throw `ERR_PACKAGE_PATH_NOT_EXPORTED`. The `getPackage()` function now falls back to resolving the package's `package.json` to confirm installation. The `@astrojs/check` package also handles this error when resolving TypeScript's path.
