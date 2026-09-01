/**
 * Route stub for the design-review canvas' captured screens. Next's router requires a file here; the
 * handler lives in `design-canvas/core/shots-route.ts` and 404s in production.
 *
 * The declarations are wired in HERE rather than imported by the handler, so nothing in `design-canvas/core/`
 * knows which project it is looking at. ALL of them are passed: the route resolves which canvas is being
 * asked about from `?canvas=<slug>`, and infers it when a project has only one.
 *
 * DELETE WITH: the `design-canvas/` folder.
 */
import { shotsRoute } from "../../../../design-canvas/core/shots-route";
import { CANVASES } from "../../../../design-canvas/project/flows";

/* Declared here rather than re-exported from the handler. Next 16 parses route
   segment config statically and refuses a re-export — "Next.js can't recognize
   the exported `runtime` field in route. It mustn't be reexported" — which left
   both fields silently falling back to their defaults. The values are the ones
   `core/shots-route.ts` declares; it reads pictures off disk, so it needs the
   node runtime and must not be statically optimised. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET } = shotsRoute(CANVASES);
