/**
 * Route stub for the design-review canvas' comment file. Next's router requires a file here; the
 * handlers live in `design-canvas/core/comments-route.ts`, and 404 in production.
 *
 * DELETE WITH: the `design-canvas/` folder.
 */
export {
  DELETE,
  GET,
  PATCH,
  POST,
} from "../../../../design-canvas/core/comments-route";

/* Declared here rather than re-exported alongside the handlers — see the note in
   the shots stub beside this one. Next 16 parses route segment config statically
   and ignores a re-exported `runtime`/`dynamic`. The values are the ones
   `core/comments-route.ts` declares: it reads and writes the comment file and its
   PNGs on disk. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
