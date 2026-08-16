'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Mounts the vendored CommentLayer review widget on prototype pages only.
 *
 * The bundles are browser IIFEs that touch `window`/`document` at execution
 * time, so everything is loaded inside `useEffect` — never at module scope — to
 * keep it out of SSR (otherwise the route 500s).
 *
 * Storage uses the Supabase adapter so comments are shared across reviewers on
 * the deployed prototype link. The adapter calls `window.supabase.createClient`,
 * so `@supabase/supabase-js` MUST be loaded first (from the CDN, same as the
 * widget's own html2canvas dependency) — otherwise store creation throws and no
 * button ever appears. The anon key is publishable by design (safe in the
 * client); access is scoped by the `comments` table's RLS policy. To fall back
 * to per-browser localStorage, skip the adapter + supabase-js and call
 * `CommentLayer.init({ projectId })` with no `storage`. See this folder's README.
 */
const SUPABASE_URL = 'https://pxjjjnymhqfhxsopcido.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mPaSwBF7ZI9sLO4ebYY2Aw_0eqM4mO8';
const SUPABASE_JS_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

/** Inject a CDN script once and resolve when its global is available. */
function ensureScript(src: string, ready: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ready()) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[data-cl-src="${src}"]`);
    const el = existing ?? document.createElement('script');
    const onLoad = () => (ready() ? resolve() : reject(new Error(`${src} loaded but global missing`)));
    el.addEventListener('load', onLoad, { once: true });
    el.addEventListener('error', () => reject(new Error(`failed to load ${src}`)), { once: true });
    if (!existing) {
      el.src = src;
      el.async = true;
      el.dataset.clSrc = src;
      document.head.appendChild(el);
    }
  });
}

export function CommentLayerMount() {
  const pathname = usePathname();

  useEffect(() => {
    let disposed = false;

    // Scope comments per prototype route so each preview keeps its own thread.
    const projectId = `pln-prototype:${pathname ?? 'unknown'}`;

    (async () => {
      try {
        // Load the CDN dependency FIRST, in isolation. The vendored bundles
        // below attach their own global listeners (click/mousemove, for pin
        // placement) as a side effect of merely being imported — before
        // `.init()` ever runs. If they're imported in parallel with a CDN
        // script that then fails (e.g. no network egress to jsdelivr.net in
        // this environment), those listeners are already live and firing on
        // every click, throwing on DOM elements `.init()` never got to
        // create. That reads as "the whole page is unstable" even though it
        // has nothing to do with whatever's actually being reviewed.
        await ensureScript(SUPABASE_JS_CDN, () => !!(window as any).supabase);
        if (disposed) return;

        await Promise.all([
          // Vendored browser IIFEs, no exports — imported for their
          // `window.CommentLayer` / `window.CommentLayerSupabase` side effects.
          // @ts-expect-error vendored side-effect-only bundle
          import('./comment-layer.min.js'),
          // @ts-expect-error vendored side-effect-only bundle
          import('./supabase-adapter.min.js'),
        ]);
        if (disposed) return;

        const w = window as any;
        if (!w.CommentLayer || !w.CommentLayerSupabase || !w.supabase) {
          console.warn('[comment-layer] a required global is missing; widget not mounted');
          return;
        }
        if (w.__commentLayerInited === projectId) return;

        const store = w.CommentLayerSupabase({
          url: SUPABASE_URL,
          anonKey: SUPABASE_ANON_KEY,
          projectId,
        });
        await store.ready;
        if (disposed) return;

        // Re-key the thread when navigating between prototypes.
        if (w.__commentLayerInited) {
          w.CommentLayer.regenerated?.();
        }
        w.__commentLayerInited = projectId;
        w.CommentLayer.init({ projectId, storage: store });
      } catch (err) {
        // Review aid — never break the prototype, but surface why it didn't load.
        console.warn('[comment-layer] init failed:', err);
      }
    })();

    return () => {
      disposed = true;
    };
  }, [pathname]);

  return null;
}
