# AI prototypes

Isolated UI previews at `/prototypes` for exploring new ideas with mocked data. Nothing here affects production routes, services, or components.

## Visibility

Routes return 404 unless prototypes are enabled (`prototypes/config.ts`):

| `PROTOTYPES_ENABLED` | `NODE_ENV`    | Result   |
| -------------------- | ------------- | -------- |
| unset                | `development` | enabled  |
| unset                | `production`  | disabled |
| `true`               | any           | enabled  |
| `false`              | any           | disabled |

Set `PROTOTYPES_ENABLED=true` on a staging host to preview prototypes outside local dev.

## Rules

1. **Do not modify** production `app/` (except `app/prototypes/`), `components/`, `services/`, or `actions/` for a prototype.
2. **All prototype code** lives under `prototypes/` plus thin route files in `app/prototypes/`.
3. **Mock all data** — no real API calls, production data hooks, or auth side effects.
4. **Reuse read-only UI** from production only when it has no data fetching. Otherwise copy or simplify inside `prototypes/entries/<key>/`.
5. **Register every prototype** in `prototypes/registry.ts`.

## Layout

```
prototypes/
  registry.ts              # catalog — add new entries here
  types.ts
  components/              # shared prototype UI (banner, index)
  entries/
    <key>/
      <Key>Prototype.tsx   # default export — full mocked page
      mocks.ts
      *.module.scss

app/prototypes/
  page.tsx                 # index at /prototypes
  [key]/page.tsx           # loads entry from registry
```

## Add a prototype

1. Copy `prototypes/entries/template/` to `prototypes/entries/<key>/` and rename files.
2. Pick a unique `key` (kebab-case), `title`, `description`, and `category`.
3. Add an entry to `prototypes/registry.ts`:

```ts
{
  key: '<key>',
  title: '...',
  description: '...',
  category: 'Fundraising',
  load: () => import('./entries/<key>/<Key>Prototype'),
},
```

4. Verify `/prototypes` (card under the right category) and `/prototypes/<key>`.

Preview the starter at `/prototypes/template`.

No changes to `app/prototypes/[key]/page.tsx` are needed — it reads from the registry.

## Component template

```tsx
'use client';

import { mockData } from './mocks';
import s from './<Key>Prototype.module.scss';

export default function KeyPrototype() {
  return <div className={s.root}>{/* mocked UI only */}</div>;
}
```

Use `useState` for local interactions. Simulate async with `setTimeout` if needed.

## Copying from production

| Approach                                     | When                                          |
| -------------------------------------------- | --------------------------------------------- |
| Import presentational component              | No hooks, no API, no global store             |
| Copy JSX + styles into `prototypes/entries/` | Component uses data hooks or production flows |
| Simplified mock shell                        | Full page would pull auth or backend          |

## Styling

- SCSS modules co-located in the entry folder
- `@use 'styles/media'` and existing CSS variables
- Copy layout patterns; do not edit production source files

## Example

`prototypes/entries/template/` — minimal list + detail layout with mocked data and local state. Duplicate this folder for new prototypes.

## Checklist

- [ ] Entry in `prototypes/registry.ts`
- [ ] No edits to production feature files
- [ ] No `services/`, `app/actions/`, or react-query hooks
- [ ] Index and detail routes render correctly
