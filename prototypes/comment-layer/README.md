# CommentLayer (prototype review comments)

Figma-style pinned review comments on live prototype pages. Vendored from
[`neodisa/CommentLayer`](https://github.com/neodisa/CommentLayer) — self-hosted,
no data leaves your infrastructure.

## What's here

| File | Purpose |
|---|---|
| `comment-layer.min.js` | The review widget (browser IIFE, sets `window.CommentLayer`) |
| `supabase-adapter.min.js` | Optional storage adapter for shared/multi-user comments |
| `schema.sql` | Supabase table schema — only needed for the Supabase adapter |
| `CommentLayerMount.tsx` | Client-only mount, wired into `PrototypeBanner` so it loads on every `/prototypes/*` page |

Scope: **prototypes only**. `CommentLayerMount` is rendered from
`prototypes/components/PrototypeBanner/PrototypeBanner.tsx` — nothing in
production or `public/` is touched.

## Storage modes

### localStorage (current default — zero setup)
Comments live in the reviewer's browser. No account, no keys. Comments are
**not shared** — each browser sees only its own. Good for solo review while
iterating. This is what `CommentLayerMount.tsx` uses today:
`CommentLayer.init({ projectId })`.

### Supabase (shared, multi-user — opt-in)
Use this when reviewers on the deployed Vercel link should see each other's
comments.

1. Create a free Supabase project → SQL editor → run `schema.sql`.
2. Copy the Project URL + **publishable (anon)** key from Settings → API.
   (The anon key is client-side by design; it's safe to commit for a prototype.)
3. In `CommentLayerMount.tsx`, also import the adapter and pass it as `storage`:

   ```ts
   // @ts-expect-error vendored side-effect-only bundle
   await import('./comment-layer.min.js');
   // @ts-expect-error vendored side-effect-only bundle
   await import('./supabase-adapter.min.js');
   const store = (window as any).CommentLayerSupabase({
     url: 'https://YOUR.supabase.co',
     anonKey: 'sb_publishable_…',
     projectId,
   });
   await store.ready;
   (window as any).CommentLayer.init({ projectId, storage: store });
   ```

`supabase-js` loads from the jsdelivr CDN at runtime (the adapter injects it),
same as `html2canvas` for the element-screenshot feature.

## Updating the vendored bundle

```
npx --yes github:neodisa/CommentLayer <tmp-dir>
```

Then copy the refreshed `*.min.js` / `schema.sql` from `<tmp-dir>` into this
folder. Re-scan the bundle for network calls before trusting a new version.
