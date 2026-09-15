// Runs the unit tests in scripts/tests without extra dependencies:
// esbuild (bundled with Vite) compiles the TypeScript modules under test, then node:test runs.
import { build } from 'esbuild';
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outdir = join(root, 'node_modules', '.cache', 'kin-tests');

await build({
  entryPoints: {
    readingSessionLogic: join(root, 'src/services/readingSessionLogic.ts'),
    recap: join(root, 'api/recap.ts'),
    ppTimeline: join(root, 'src/features/ppMode/ppTimeline.ts'),
  },
  outdir,
  bundle: true,
  platform: 'node',
  format: 'esm',
  outExtension: { '.js': '.mjs' },
  logLevel: 'warning',
});

process.env.KIN_TEST_BUILD = outdir;
const testDir = join(root, 'scripts', 'tests');
for (const file of readdirSync(testDir).filter((f) => f.endsWith('.test.mjs')).sort()) {
  await import(pathToFileURL(join(testDir, file)).href);
}
