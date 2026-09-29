// Bundles the AI Apps bridge (ai-apps-bridge/) into two classic scripts that
// LabOS serves to embedded apps:
//
//   public/ai-apps/bridge/v1.js       the bridge — loaded by every app
//   public/ai-apps/bridge/v1-crop.js  the element renderer — loaded on first crop
//
// Classic IIFE scripts rather than ES modules on purpose: a cross-origin
// <script src> needs no CORS headers, a cross-origin `import()` does.
//
// Runs before `next dev` and `next build` (predev / prebuild). The output is
// gitignored — the source of truth is ai-apps-bridge/.
import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import path from 'path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outdir = path.join(root, 'public/ai-apps/bridge');

const common = {
  bundle: true,
  format: 'iife',
  target: ['es2019'],
  minify: true,
  legalComments: 'none',
  logLevel: 'warning',
};

await Promise.all([
  build({ ...common, entryPoints: [path.join(root, 'ai-apps-bridge/entry.ts')], outfile: path.join(outdir, 'v1.js') }),
  build({
    ...common,
    entryPoints: [path.join(root, 'ai-apps-bridge/crop-entry.ts')],
    outfile: path.join(outdir, 'v1-crop.js'),
  }),
]);
