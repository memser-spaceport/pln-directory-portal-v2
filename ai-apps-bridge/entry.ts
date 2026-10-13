import { createBridge } from './bridge';

/**
 * Bundled to `public/ai-apps/bridge/v1.js`. An app includes it with
 *
 *   <script src="https://os.pl.xyz/ai-apps/bridge/v1.js" defer></script>
 *
 * The LabOS deployment that SERVED this file is the only parent the bridge will
 * obey. The starter kit writes the environment's own LabOS origin into that
 * tag, so a dev app trusts dev LabOS and a prod app trusts prod — with no
 * allowlist to keep in sync.
 */
(() => {
  const script = document.currentScript as HTMLScriptElement | null;
  if (!script?.src) return;
  const src = new URL(script.src);
  createBridge(window, {
    parentOrigin: src.origin,
    /* The query carries over, so a cache-busting `?v=` on the tag reaches the crop chunk too. */
    cropScriptUrl: new URL(`v1-crop.js${src.search}`, src).toString(),
  });
})();
