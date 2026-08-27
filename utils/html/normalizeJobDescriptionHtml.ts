/**
 * Repairs the converter artifacts an ingest ships in `IJobRole.descriptionHtml`.
 *
 * Three defects, all of them **encoding** rather than content — a `&` that was
 * escaped twice, a link whose converter never ran, a list emitted one element
 * per item. Repairing them shows more of what the team wrote, not less, which
 * is why this does not reverse the drawer's "sanitize + style only, no content
 * normalization" rule: that rule forbids editing what the posting SAYS (the
 * duplicated titles, the trailing in-body apply link), and those stay untouched.
 *
 * **One source.** Measured across the 83 live bodies on dev, every one of these
 * defects came from `jobs.polychain.capital` — Protocol Labs' own board, 4 of 4
 * roles — plus a single greenhouse role with the entity defect alone. The other
 * 78 bodies pass through this function byte-identical, which is why there is no
 * host check here: there is nothing to branch on, and the next source with the
 * same broken converter gets fixed for free.
 *
 * **The backend is not the cause.** `job-description-html.util.ts` wraps
 * `sanitize-html`, which is entity-idempotent and never merges lists. This
 * markup arrives from a service in neither repo, so the repair lives here until
 * that is fixed — at which point all three transforms quietly become no-ops and
 * nothing has to be removed.
 *
 * **Run it BEFORE sanitizing, never after** — the same rule `linkifyHtml`
 * documents, for the same reason: this emits markup, and letting the sanitizer
 * see that markup means a malformed URL cannot smuggle an attribute past it.
 */

/**
 * One layer of a double-escaped entity: `&amp;amp;` → `&amp;`, which then
 * renders as `&`.
 *
 * The named/numeric alternation is not decoration, it is the safety property.
 * This pattern can only ever emit ANOTHER entity reference — `&amp;lt;` becomes
 * `&lt;`, which still renders as text. A blanket `&amp;` → `&` replacement, or
 * a second pass over the output, would turn a double-escaped
 * `&amp;lt;img src=x onerror=…&amp;gt;` into a live tag. Exactly one layer.
 */
const DOUBLE_ESCAPED_ENTITY = /&amp;(#\d{1,7}|#[xX][0-9a-fA-F]{1,6}|[a-zA-Z][a-zA-Z0-9]{1,31});/g;

/**
 * `[label](url)` left as literal text by a markdown-to-HTML converter that
 * handled block elements and gave up on inline ones.
 *
 * The label may contain parentheses — a real posting carries
 * `[2024 PL Summit Video (Remote Update)](…)` — so it is bounded by `]` rather
 * than by balance. The URL may not: it stops at the first `)`, so a link whose
 * own URL contains one would be truncated. No body in the corpus has one, and
 * the alternative is counting parens in text we do not control.
 */
const MARKDOWN_LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

/**
 * Which of those URLs we are willing to turn into an anchor.
 *
 * The scheme half mirrors `JOB_DESCRIPTION_SANITIZE_CONFIG.ALLOWED_URI_REGEXP`
 * deliberately: building an anchor the sanitizer then strips the href off would
 * leave a link that goes nowhere, which is worse than the brackets. A relative
 * `[Careers](/careers)` stays literal text for exactly that reason — it would
 * resolve against OUR origin.
 *
 * The character half guards the href we are about to write. The sanitizer runs
 * after us and would catch it anyway, but a function that emits markup should
 * not depend on its caller for that.
 */
const SAFE_HREF = /^(?:https?:|mailto:)[^"'<>`]*$/i;

/** Elements whose text is not prose: an existing link, and code. */
const SKIP_TAG = /^<(\/?)(a|code|pre)[\s>/]/i;

/**
 * Adjacent lists of the same type, which is one list the converter cut up.
 *
 * `\s*` and nothing else between them, so a heading, a paragraph or any real
 * boundary blocks the merge — the CMO posting goes from 52 `<ul>` to 10, and 10
 * is exactly how many section lists it has. `\1` keeps `<ul>` and `<ol>` apart,
 * and nested lists never match because a `</li><li>` sits between them.
 */
const ADJACENT_LIST = /<\/(ul|ol)>\s*<\1[^>]*>/gi;

/**
 * Convert markdown link syntax in text, leaving markup alone.
 *
 * Splits on tags the way `linkifyHtml` does, and inherits its one limitation: a
 * `>` inside an attribute value would split in the wrong place. Job bodies
 * arrive already sanitized by the backend with `href` as the only surviving
 * attribute, and the sanitizer here runs afterwards regardless.
 */
function markdownLinksToAnchors(html: string): string {
  const depth = { a: 0, code: 0, pre: 0 };

  return html
    .split(/(<[^>]+>)/g)
    .map((part) => {
      if (part.startsWith('<')) {
        const tag = part.match(SKIP_TAG);
        if (tag) {
          const name = tag[2].toLowerCase() as keyof typeof depth;
          depth[name] = tag[1] ? Math.max(0, depth[name] - 1) : depth[name] + 1;
        }
        return part;
      }

      if (depth.a || depth.code || depth.pre) return part;

      return part.replace(MARKDOWN_LINK, (whole, label: string, href: string) =>
        /* Both halves are slices of an HTML text node, so they are ALREADY
           escaped and are passed through untouched. Do not reach for
           `linkifyHtml`'s `escapeHtml` here: running it over the label would
           turn the `&amp;` this function just repaired back into `&amp;amp;`. */
        SAFE_HREF.test(href) ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>` : whole,
      );
    })
    .join('');
}

export function normalizeJobDescriptionHtml(html: string): string {
  /* Entities first: an escaped `&` inside a markdown URL has to be repaired
     before that URL is read. The list merge is structural and independent, so
     it goes last. */
  const decoded = (html ?? '').replace(DOUBLE_ESCAPED_ENTITY, '&$1;');

  return markdownLinksToAnchors(decoded).replace(ADJACENT_LIST, '');
}
