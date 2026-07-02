import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroIntegrationLogger } from 'astro';
import { unstable_readConfig } from 'wrangler';

const DEFAULT_WRANGLER_CONFIG_FILES = ['wrangler.toml', 'wrangler.json', 'wrangler.jsonc'];

function resolveWranglerConfigPath(root: URL, configPath: string | undefined): string | undefined {
	if (configPath) {
		return fileURLToPath(new URL(configPath, root));
	}
	for (const file of DEFAULT_WRANGLER_CONFIG_FILES) {
		const candidate = new URL(`./${file}`, root);
		if (existsSync(candidate)) {
			return fileURLToPath(candidate);
		}
	}
	return undefined;
}

/**
 * Reads the `vars` defined in the project's wrangler config (`wrangler.toml`,
 * `wrangler.json`, or `wrangler.jsonc`) and assigns them to `process.env`.
 *
 * Astro's `astro:env` inlines public variables at build time using Vite's
 * `loadEnv()`, which only reads from `process.env` and `.env` files. Cloudflare
 * makes wrangler `vars` available at runtime (through `cloudflare:workers`), but
 * they are invisible to the build-time step, so direct imports of public
 * variables resolve to `undefined`. Surfacing them on `process.env` here lets
 * `astro:env` pick them up during the build.
 */
export function loadWranglerVars(
	root: URL,
	configPath: string | undefined,
	logger: AstroIntegrationLogger,
): void {
	const resolvedConfigPath = resolveWranglerConfigPath(root, configPath);
	if (!resolvedConfigPath) {
		return;
	}

	try {
		const config = unstable_readConfig(
			{
				config: resolvedConfigPath,
				env: process.env.CLOUDFLARE_ENV,
			},
			{ hideWarnings: true },
		);

		if (!config.vars) {
			return;
		}

		for (const [key, value] of Object.entries(config.vars)) {
			// `vars` can hold non-string JSON values (numbers, booleans, objects).
			// `process.env` only stores strings, matching how `.dev.vars` is handled.
			if (value === undefined || value === null) {
				continue;
			}
			process.env[key] = typeof value === 'string' ? value : JSON.stringify(value);
		}
	} catch (e) {
		logger.warn(
			`Unable to read wrangler config, variables defined in it will not be available to astro:env at build time.`,
		);
		logger.debug(String(e));
	}
}
