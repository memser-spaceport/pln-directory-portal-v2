# design-canvas

An infinite canvas of every screen in a flow, with the flows drawn as diagrams and a comment layer that
hands an agent the picture of what you pointed at.

One page, and two jobs around it:

```bash
# LOOK AT IT, and prove it — the dev server, because /design-canvas is dev-only
open http://localhost:3000/design-canvas            # lists this project's canvases
node design-canvas/check-canvas.mjs --canvas <slug>

# TAKE THE PICTURES — a production build, because `next dev` compiles routes inside the capture's own
# load budget and makes the run a lottery. Never build while a dev server is up: they share .next.
NEXT_PUBLIC_CANVAS_PINS=1 npm run build
npx next start --port 3055
node design-canvas/dump-screens.mjs --canvas <slug> > /tmp/screens.json
node design-canvas/capture.mjs --canvas <slug> --url http://localhost:3055 --screens-file /tmp/screens.json --no-warm
```

**A project can hold several canvases, one per feature, each at `/design-canvas/<slug>`.** The slug is also the
namespace for that canvas's pictures (`shots/<slug>/`) and its review (`comments/<slug>.json`), so
`--canvas` is not optional on a project with more than one: a run without it captures the wrong screens AND
deletes the other canvas's frames as orphans. It defaults to `main`, which is what a single-canvas project uses.

Every script above assumes port 3000, because that is the only port a shipped file can know. **The ports
this project actually uses, and the commands that carry them, are at the bottom of this file** — under a
heading no re-install overwrites. Pass `--url http://localhost:<port>` whenever a server is somewhere else.

It is not a page of the app. It has no sidebar, no app chrome and no navigation of its own: the whole
interface is one bar with three things in it — which grouping, the zoom, and comment mode. Drag anywhere
to pan, two fingers or ⌘ and scroll to zoom, `c` for comment mode, `0` to fit everything. Switching view is
the tabs in the toolbar and nothing else: a shortcut for a labelled control one press away is undiscoverable
and redundant.

**Grouped screens** is what it opens on: the same screens put together by what they are, so near-identical
states sit side by side and disagree with each other visibly. **User flows** is the second tab, and draws
each journey as a diagram. Every group is a panel one step lighter than the stage: that is what says these
belong together, rather than a word saying so. A group always holds at least two screens, because a
heading over one frame is not a group — `check-canvas.mjs` fails if a declaration ever produces one.

**Exploration** is a third tab that appears only while the declaration has an open design question on it: one
panel per question, one frame per competing direction, side by side at full size. It draws no arrows, because
directions are alternatives rather than steps — only one of them will ever exist. It is scaffolding: once the
question is decided, the winner moves into the flows and grouped screens above, and the exploration is deleted
along with whatever URL scaffolding made its directions reachable.

The stage is a dark grey rather than near-black, because a captured screen can be light or dark and both
have to read as sitting on something. Each frame's edge is a hairline drawn as a shadow, never a border: a
1px border on an element the canvas is scaling lands on fractional pixels and the browser rounds the
border and the picture differently, which is a visible seam.

Every piece of text on the canvas is sized in world pixels, so it scales with the frames and never moves.
Above each frame there is one thing, its **title** — brief, and about the same length on every frame,
because the titles are what tell two similar screens apart. Below it, quiet: an **Open** button that opens
the running page in this exact state, and **badges** naming the files it is built from. No state chips and
no descriptions; both said a second time what the title already said.

**The canvas's appearance is not configurable and is not adapted to this project's brand.** Its colours,
type scale and spacing are literals in `core/`, recorded in `core/design-tokens.md`. A canvas that takes
on the host app's palette competes with the frames it holds, which is the one thing it must never do.

**One line in the Tailwind config** puts `design-canvas/` in the `content` globs. Without it every class this
tool uses that the app does not already use is silently dropped, and the canvas renders as a wireframe of
itself.

## The frames are captured, and that is the interesting part

Every frame is a real route of this app, screenshotted. It was a live iframe of the route and the fidelity
was unbeatable, but a surface holding dozens of live pages cannot be panned or zoomed smoothly, and on a
canvas that is not a detail — the interaction IS the instrument.

The whole difficulty of a screenshot is knowing when to press the shutter, so `capture.mjs` does this, in
order, and records what it found:

1. **Loaded.** Document complete, text rendered, fonts loaded, and every image that will be in the shot
   finished — in the page and in the frames it mounts of its own.
2. **Not lazy.** Lazy loading is switched off first and then waited on. This is the step that matters
   most: a headless page never scrolls, so the first run of this pipeline captured a store front page as a
   correct layout with no photographs in it. Every claim passed. The picture was worthless. An image on
   screen with no natural size now fails the capture outright.
3. **Finished.** Every animation and transition that ends has ended, rather than being paused wherever it
   happened to be. Only the endless ones are paused, because those never finish — and scroll-driven ones are
   not waited for at all, because what advances them is a scroll position and nothing here scrolls.
4. **Frozen.** A stylesheet then pins everything still in every document, and every video is paused. The
   same stylesheet forces scroll-driven reveals into their revealed state: a band that fades up as it comes
   into view is invisible until it does, and a whole-page shot never scrolls, so without this a long page
   photographs with white holes in it where its best sections are.
5. **True.** Every claim the screen declares is present, checked across every document in the page. A
   mislabelled screen is caught here, before it becomes a picture.
6. **Stable.** Two consecutive captures come out byte for byte identical. A page still loading or still
   moving cannot do that, so this is the proof that the picture is of a settled design.

All of it lands in `shots/manifest.json`. The canvas reads that manifest, so a frame whose capture failed
its own claims says so on the canvas rather than looking fine.

A page taller than its viewport is captured WHOLE, at its real height, and one that is not stays one screen
— that is a fact about each page rather than a list of pages. The height is recorded per shot and the canvas
draws each frame at the size it was captured at.

Recapture named screens with `--only <id>,<id>`. Roughly two seconds a screen, four lanes at a time.

**Capture on a quiet tree.** A dev server recompiling under another agent's edits returns blank pages, and
a blank capture then looks like a pipeline bug when it is not one.

## Comments are outlines, and the agent gets the picture

Press the comment button (or `c`), then **drag a rectangle around the thing you mean** and type. Two files
are written:

- `comments.json` — the screen, its real route, the pinned state, the rectangle in percentages, your note.
- `comments/<id>.png` — **the captured screen with your outline drawn on it**, numbered to match the pin.

That second file is the point. There is no document to resolve a click against once a frame is a picture,
so instead of describing a region to an agent, the record hands it a picture with the region marked. Read
the note, open the image, look inside the outline.

Recapturing a screen marks every comment on it `stale`, because what is under the outline may have moved.
Staleness is never a reason to drop a comment — reconcile it. Acting on a comment means
`PATCH /api/design-canvas/comments` with `{ id, consumed: true }`; consumed is not resolved, it only means an
agent has ingested it.

A stale pin is also where the reviewer answers. It offers **Approve**, which deletes the comment because a
closed comment is one that is gone, and **Still wrong**, which reopens the same rectangle with an empty
field and replaces the old comment with what lands there. **Edit** rewrites the words on any pin without
touching the region or the picture: what was wrong was the sentence, not the place.

**Hand off** in the toolbar gives you the one line to paste into an agent, and says exactly where the
comments live. The comments are gitignored; the captured screens are not, so a fresh clone opens this canvas
on real frames.

## Flows: the arrows do the explaining

In a flow the frames carry no titles. It reads picture → what the person did → picture, and the chip on
the arrow is the explanation. Every label is an action starting with a verb, or a condition starting with
"When", and every one is 12 to 24 characters — enforced by `check-canvas.mjs`, not trusted. Titles live in
**Grouped screens**, where they are the only thing telling near-identical screens apart.

**No edge ever crosses a frame**, and that is geometry rather than luck. A frame only occupies its own
column, so an edge between neighbouring columns can always go straight across the gap. An edge that spans
two columns or more takes the long way instead: down out of the bottom of its frame, along a clear lane
under the diagram, and up into the frame it lands on, one lane per edge. `check-canvas.mjs` samples forty
points along every path and fails if one lands inside a frame that is neither of its ends.

## Layout

```
design-canvas/
  core/            generic. imports NOTHING from this project
    types.ts             the declaration, the shot manifest, the comment record
    cn.ts                class names, joined — the core's own, so it needs none of yours
    design-tokens.md     every literal the canvas draws itself with, and why it is a literal
    graph-layout.ts      nodes and edges → world coordinates (a layered graph, no library)
    canvas-surface.tsx   the infinite canvas: one transform, pan, wheel and pinch zoom
    canvas-edges.tsx     the edges and their labels
    canvas-frame.tsx     one screen: its picture, its outlines, drag-to-comment
    canvas-view.tsx      the canvas: zoom, comment mode, and nothing else
    comments-client.ts   the browser half of persistence
    comments-route.ts    the dev-only JSON file store, and the annotated PNGs
    shots-route.ts       serves the pictures, and the declaration the capture script reads
  project/         the ONLY project-specific code
    flows.ts             the declaration — the only place screens and edges are named
    states.ts            named states, applied to this project's stores (optional)
    canvas-state-pin.tsx what the root layout mounts so a state lands before the page renders
  canvas-page.tsx  the page itself
  capture.mjs      the pictures. Run it against a PRODUCTION build, never the dev server
  dump-screens.mjs the declaration, read from the file, for capturing against that build
  check-canvas.mjs the oracle
  shots/<slug>/    written by capture.mjs, and committed: a clone with no shots has no canvas
  comments/        <slug>.json and <slug>/ per canvas, written at runtime. Gitignored
```

It has to be served from the app's own origin: the annotated PNG is drawn from the shot in a `<canvas>`,
and a cross-origin image would taint it.

## Publishing it read only

The canvas is dev-only by default: the page and both routes 404 under `NODE_ENV=production`, because the comment
layer reads and writes real files in the repository and the canvas has no auth of its own. One build variable
changes that, and nothing else does:

```bash
NEXT_PUBLIC_CANVAS_VIEW_ONLY=1 NEXT_PUBLIC_CANVAS_PINS=1 npm run build
```

- **`NEXT_PUBLIC_CANVAS_VIEW_ONLY=1`** serves the canvas and its pictures, and takes the comment layer away. Not
  disabled — absent: no Comment button, no Hand Off, no Clear All, no drag. Writes are refused at the route with
  405 as well, because a client is not a permission system. There are no pins to draw either: the comment file is
  gitignored, so a deployment has no review in it.
- **`NEXT_PUBLIC_CANVAS_PINS=1`** is not optional here. Every frame carries an Open button to the real route with
  `?canvas=<state>`, and without pins those states do not apply — the button would land on the resting page and
  quietly lie. Setting it also means anyone with the URL can force the app's review-only states.
- **The pictures have to be traced into the function bundle.** They live in `design-canvas/shots/`, outside
  `public/` on purpose, and nothing imports them, so a serverless deployment receives an empty folder unless the
  project says otherwise. For Next: `experimental.outputFileTracingIncludes` with
  `"/api/design-canvas/shots": ["./design-canvas/shots/**"]`. Prove it locally by reading
  `.next/server/app/api/design-canvas/shots/route.js.nft.json` after a build — the shots should be listed there.
- **Nothing protects it.** Whatever gates the deployment gates the canvas.

## Deleting it

Delete the `design-canvas/` folder, then every seam marked `DELETE WITH: the design-canvas/ folder` — the three
route stubs, the Tailwind content glob, the chromeless-layout branch, the state-pin line in the root
layout, the `.gitignore` lines, and any review-only URL flag added to make a state reachable. Nothing else
in the app knows this tool exists.

<!-- design-canvas:project — everything from this line down belongs to this project and survives a re-install -->

## This project

pln-directory-portal-v2 — Next.js 16 App Router, React 19, **SCSS modules**. Installed 2026-08-20 for the
job board prototype.

### Canvases

| Slug | URL | Covers |
| --- | --- | --- |
| `job-board` | `/design-canvas/job-board` | The job board prototype's apply flow. See the gaps at the top of `project/flows.ts`. |
| `cv-upload` | `/design-canvas/cv-upload` | The CV importer, across all three surfaces that mount it. See the note above `CV_UPLOAD`. |

**`cv-upload` is hosted almost entirely on `/prototypes/onboarding`.** The `parseMocks` fixtures are Polina
Bublii's CV and that page is Polina Bublii's profile, so the whole journey — blank profile, one document, a
newer document a year later — photographs as one story. The apply drawer and the settings page appear only in
the grouped set, where they say something the profile page cannot.

Its scaffolding is two files, `prototypes/entries/onboarding/canvasStates.ts` and
`prototypes/entries/profile-settings/canvasStates.ts`, both reading `?canvas=` exactly as the job board's does.
Both hosts gate their render on a mount flag, and that gate is **not optional**: `ExperienceImportPanel` seeds
its own `useState` from the props it mounts with, so a state applied one paint later never reaches it.

### Ports and commands

The dev server runs on **4200**, not 3000 — the generic half above says 3000 and is wrong here. Captures run
against **3055**, which is the app served from its own build folder.

**`capture-run.mjs` does not work on Windows.** It shells out with `spawnSync("npx", …)` and no `shell: true`,
and Node refuses to spawn a `.cmd` that way, so the run reports "the build failed" in under a tenth of a
second without ever starting a build. Use the four-step version instead:

```bash
CANVAS_BUILD_DIR=.next-canvas NEXT_PUBLIC_CANVAS_PINS=1 npx next build
CANVAS_BUILD_DIR=.next-canvas npx next start --port 3055
node design-canvas/dump-screens.mjs --canvas job-board > /tmp/screens.json
node design-canvas/capture.mjs --canvas job-board --url http://localhost:3055 --screens-file /tmp/screens.json --no-warm
node design-canvas/check-canvas.mjs --canvas job-board --url http://localhost:3055
```

**Stopping the capture server needs care.** Killing the shell that launched `next start` leaves the server
itself listening, so the next `next start` dies with `EADDRINUSE` while the OLD build keeps answering on 3055
— and a capture then photographs the previous build while every URL returns a healthy 200. Free the port
before rebuilding:

```powershell
Get-NetTCPConnection -LocalPort 3055 -State Listen | Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force }
```

**Never pipe a build or a capture through `tail`.** The exit code you read is `tail`'s. A `next build` that
fails its type check reports 0 that way; check for `.next-canvas/BUILD_ID` instead.

`npm run canvas:css` does not exist — no script was added, to keep the guardrail exception (below) as narrow
as it was agreed. The Tailwind command is in the next section.

### Seams

Every edit outside `design-canvas/` this install needed. Each carries a `DELETE WITH: the design-canvas/
folder` comment at the edit site, except `tsconfig.json`, which is strict JSON and cannot hold one.

| File | What, and why |
| --- | --- |
| `next.config.mjs` | `distDir: process.env.CANVAS_BUILD_DIR \|\| '.next'`. Without it the capture build overwrites `.next` and takes down the dev server. Fails silently. |
| `tailwind.config.js` *(new)* | Tailwind exists **only** for the vendored core, which is written in Tailwind utilities and may not be edited. `content` names only `design-canvas/`, and `preflight: false` — verified safe because the core uses no `border-*`, `ring-*` or `divide-*` class. |
| `app/design-canvas/canvas.tailwind.css` *(new)* | Tailwind source. Compiled ahead of time rather than through a root `postcss.config`, which would replace Next's built-in PostCSS chain for every stylesheet in the repo, SCSS modules included. Rebuild with:<br>`npx tailwindcss -c tailwind.config.js -i app/design-canvas/canvas.tailwind.css -o app/design-canvas/canvas.generated.css --minify` |
| `app/design-canvas/canvas.generated.css` *(new)* | The compiled output, committed so a fresh clone renders the canvas. Regenerate after upgrading the skill. |
| `app/design-canvas/layout.tsx` *(new)* | Loads the compiled Tailwind for both canvas routes. |
| `app/design-canvas/AppChromeGate.tsx` *(new)* + `app/layout.tsx` | The no-app-shell seam. A client wrapper reading `usePathname()`, around `SiteHeader` and `MobileBottomNav` in the root layout, rendering nothing under `/design-canvas`. **Hiding them with CSS is not enough** — the first attempt copied the prototypes' `:has([data-…])` trick, which looks right and leaves the elements in the DOM; `check-canvas.mjs` reads with `querySelectorAll` and failed it as an app shell around the canvas. |
| `tsconfig.json` | `.next-canvas/types/**/*.ts` added to `include`. |
| `.gitignore` | Three lines for the comment file and its pictures. The shots are committed on purpose. |
| `package.json` | `tailwindcss ^3.4` as a devDependency. |
| `app/api/design-canvas/*/route.ts` | The shipped stubs re-export `runtime`/`dynamic`; Next 16 parses route segment config statically and ignores a re-export. Both are declared inline instead. |
| `.claude/hooks/guard-prototype-scope.mjs` | This repo blocks agent edits outside `prototypes/`. A narrow exception was added for the three `design-canvas` roots and the four seam files above — nothing else in production was re-opened. |
| `prototypes/entries/job-board/canvasStates.ts` *(new)* | The review-only URL states. See below. |

### Publishing it

Deployed read-only to the **`pln-prototypes`** Vercel project (team `plnetwork`), the same project the
prototypes themselves are shared from. This repo is already linked, so `npx vercel --prod --force` uploads
the current working directory — **the branch you are on decides what is live**.

Four project env vars, all on Production and Preview:

| Var | Why |
| --- | --- |
| `PROTOTYPES_ENABLED=true` | Without it `/prototypes/*` returns the app's own 404, and every Open button lands there. |
| `PRIVY_AUTH_ID` | The root layout always wraps the app in Privy; missing, it throws and the page dies. |
| `NEXT_PUBLIC_CANVAS_VIEW_ONLY=1` | Lifts the production 404 on the canvas, and removes the comment layer. |
| `NEXT_PUBLIC_CANVAS_PINS=1` | Not optional. Without it every Open button lands on the resting page and lies. |

Two config lines exist only for this, both in `next.config.mjs` and both marked:

- `outputFileTracingIncludes` for `/api/design-canvas/shots`. The frames live outside `public/` and nothing
  imports them, so serverless tracing drops them — the build succeeds and every frame comes back empty.
  Prove it by reading `.next/server/app/api/design-canvas/shots/route.js.nft.json` after a build.
- `typescript.ignoreBuildErrors` also matches `NEXT_PUBLIC_CANVAS_VIEW_ONLY`. Vercel never sets
  `CANVAS_BUILD_DIR`, so without that second condition the published build dies on the vendored core's four
  type errors.

**What is lost when published:** the comment layer, entirely — no Comment button, no Hand Off, no drag, and
writes refused with 405. The comment file is gitignored, so a deployment carries no review either. Review on
the dev server; share the deployment for reading.

**Nothing protects it.** The canvas has no auth of its own — whatever gates the deployment gates it.

### Two things the frames cannot show

- **Modal frames are mostly the board behind them.** A frame is the whole page when the page runs past the
  fold, and this board does — so the sign-up and apply frames are ~2540px tall with the modal near the top.
  That is the tool's own rule (`core/types.ts`: height is the page's to decide) and `check-canvas.mjs`
  **refuses** a per-screen viewport that only raises height, so it cannot be tuned per screen. Zoom in on the
  canvas, or press Open to see the real thing.
- **Typed-in values are invisible to text claims.** `innerText` never contains an input's value, so the two
  filled-form frames prove themselves with `expectSelector` and `:not(:placeholder-shown)` instead. If you
  add another filled state, do the same — a text claim on a field value will always fail, no matter that the
  value is plainly in the picture.

### How states are pinned here — NOT through the adapter

`project/states.ts` and `project/canvas-state-pin.tsx` are **present but inert**. Nothing mounts the pin, and
`applyCanvasState` is never called. They are kept only because `capture.mjs` hashes both paths as global
inputs to its stamp.

This project pins states inside the prototype instead. The board already read `?viewer=`, `?profile=1`,
`?email=1` and its whole filter rail from the URL, for the Preview-as switch a reviewer uses by hand — so the
canvas declares those directly, and only the overlays needed anything new. Those read `?canvas=<state>` in
`prototypes/entries/job-board/canvasStates.ts`, which is the one file to delete.

Two props on `JobSignUpModal` (`canvasFilled`, `canvasRefused`) are the exception: they force states held
inside react-hook-form, which no URL read by the parent can reach.

### Gaps

- **Mobile is not covered.** `viewport` is per canvas, so mobile wants a second one at 390x844. The mobile
  Filters sheet has no URL of its own yet, so that canvas begins with scaffolding work.
- **The refer flow is not covered.** `JobReferRoleRow` and its modal are on the board and undeclared.
- **The profile drawer's other cards.** Empty, waiting, and the Experience card's importer (seven frames)
  are covered. Skills, bio, contributions and repositories each have an empty and a filled design and are
  not.
- **The vendored core does not typecheck under this repo's `strict: true`, and this DOES break the build.**
  Four errors in `core/comments-route.ts`: TypeScript drops the guard's narrowing inside the `mutate()`
  closure, and `shotHash` has no guard. `next build` fails on them, with no `BUILD_ID` written — and because
  the capture pipes the build through `tail`, the failure surfaces as a misleading exit code 0.

  The core may not be edited, so `next.config.mjs` sets `typescript.ignoreBuildErrors` **only when
  `CANVAS_BUILD_DIR` is set**. `npm run build` sets nothing and still typechecks everything, core included.
  A defect to report upstream rather than fix here.
- **The impeccable PostToolUse hook writes `core/.impeccable/hook.cache.json`**, which breaks the core's
  byte-for-byte check. Delete that folder before running `check-install.mjs`.

- **`check-canvas.mjs` reports `0 edges declared` on every canvas here, and always has.** Its second-opinion
  scrape of `project/flows.ts` matches `from: "…", to: "…"` with **double** quotes, and this repo's prettier is
  `singleQuote: true`, so it finds nothing and then fails on the mismatch with what the page drew. Writing the
  edges in double quotes would not survive `npm run prettier:all`, and the script may not be edited.

  **What this actually costs is the edge-label rule**, which is the half of the check that is not also done on
  the rendered page: the geometry checks read the canvas itself and still pass ("7 edges drawn, 7 attached", "no
  edge crosses a frame it does not belong to"). Every label here was held to 12-24 characters and to the verb
  list by hand. A defect to report upstream rather than fix here.
