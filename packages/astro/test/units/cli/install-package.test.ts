import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { getPackage } from '../../../dist/cli/install-package.js';
import { defaultLogger } from '../test-utils.ts';

describe('getPackage', () => {
	it('detects packages with no default CJS export as installed (e.g. TypeScript 7)', async () => {
		// Create a package that has an exports map with no "." entry (like TypeScript 7)
		const projectDir = join(tmpdir(), `astro-test-no-cjs-export-${Date.now()}`);
		const pkgDir = join(projectDir, 'node_modules', 'no-default-export-pkg');

		try {
			await mkdir(pkgDir, { recursive: true });
			await writeFile(
				join(pkgDir, 'package.json'),
				JSON.stringify({
					name: 'no-default-export-pkg',
					version: '1.0.0',
					type: 'module',
					exports: {
						'./package.json': './package.json',
						'./sub': './sub.js',
					},
				}),
			);
			await writeFile(join(pkgDir, 'sub.js'), 'export const loaded = true;\n');

			// getPackage should detect it as installed (return truthy) instead of prompting to install
			const result = await getPackage('no-default-export-pkg', defaultLogger, {
				cwd: projectDir,
				optional: true,
			});

			assert.ok(result, 'Expected getPackage to detect the package as installed');
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	});

	it('resolves packages from the project cwd, not from astro install location', async () => {
		// Create a temporary directory simulating a project with a fake package
		const projectDir = join(tmpdir(), `astro-test-getpackage-${Date.now()}`);
		const pkgDir = join(projectDir, 'node_modules', 'fake-test-pkg');

		try {
			await mkdir(pkgDir, { recursive: true });
			await writeFile(
				join(pkgDir, 'package.json'),
				JSON.stringify({
					name: 'fake-test-pkg',
					version: '1.0.0',
					main: 'index.js',
					type: 'module',
				}),
			);
			await writeFile(join(pkgDir, 'index.js'), 'export const loaded = true;\n');

			// getPackage should resolve from the project cwd, finding the fake package
			const result = await getPackage<{ loaded: boolean }>('fake-test-pkg', defaultLogger, {
				cwd: projectDir,
				optional: true,
			});

			assert.ok(result, 'Expected getPackage to find the package in the project cwd');
			assert.equal(result.loaded, true, 'Expected the loaded export to be true');
		} finally {
			await rm(projectDir, { recursive: true, force: true });
		}
	});
});
