export type AnchorTarget =
  | { kind: 'mention'; memberUid: string }
  | { kind: 'link'; linkType: 'http'; host: string }
  | { kind: 'link'; linkType: 'mailto' }
  | { kind: 'skip' };

/**
 * What did someone just click inside a comment?
 *
 * Deliberately reports the HOST and nothing else for a web link. A pasted URL's
 * path or query can carry a share token or a private document id, and neither
 * belongs in analytics — while the host answers the actual question, which is
 * what people link to.
 *
 * Three cases that are easy to get wrong:
 * - Mentions are checked FIRST. Their href is our own `/members/<uid>`, so the
 *   generic branch would count every mention as a link to our own domain.
 * - `mailto:` reports no host at all. The comment sanitizer permits it and
 *   NodeBB-authored comments carry real ones; `new URL(…).host` is empty for
 *   them, so any "fall back to the href" branch would put an email address on
 *   the event.
 * - No href means skip. DOMPurify strips hrefs outside its allowlist — NodeBB's
 *   own `/topic/123` links among them — leaving a bare anchor. Resolving that
 *   would invent an internal-link count out of nothing.
 */
export function classifyAnchor(anchor: HTMLAnchorElement): AnchorTarget {
  const memberUid = anchor.getAttribute('data-uid');
  if (anchor.classList.contains('ql-mention') && memberUid) {
    return { kind: 'mention', memberUid };
  }

  const href = anchor.getAttribute('href');
  if (!href) return { kind: 'skip' };

  try {
    const url = new URL(href, window.location.origin);
    if (url.protocol === 'mailto:') return { kind: 'link', linkType: 'mailto' };
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return { kind: 'skip' };
    return { kind: 'link', linkType: 'http', host: url.host };
  } catch {
    // A malformed href is not worth a broken click handler.
    return { kind: 'skip' };
  }
}
