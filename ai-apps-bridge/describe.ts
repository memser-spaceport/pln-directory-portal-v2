import { LIMITS, type BridgeRect, type ElementDescriptor } from './protocol';

/**
 * Turns a picked element into the data a reader (or a coding agent) needs to
 * find it again. Runs INSIDE the app, so it is also where redaction happens:
 * nothing that looks like a secret or a typed value leaves the frame.
 */

const SENSITIVE_ATTR = /(token|secret|password|passwd|auth|session|csrf|api[-_]?key|credential|signature)/i;
/** Attributes whose value is what the user typed, not what the author wrote. */
const VALUE_ATTRS = ['value', 'checked', 'selected'];
const URL_ATTRS = ['href', 'src', 'action', 'formaction', 'srcset', 'poster'];
/** Kept verbatim: they locate the element and are author-written, even when a class is called `auth-form`. */
const STRUCTURAL_ATTRS = ['class', 'id', 'role', 'type', 'name', 'for', 'alt', 'title', 'placeholder'];
/**
 * A long unbroken run of token characters (API keys, session ids). Dots count:
 * a JWT is three base64url segments joined by `.`, each often under 32 chars.
 */
const OPAQUE_TOKEN = /[A-Za-z0-9_\-+/=.]{32,}/;

export function clip(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function cssEscape(value: string): string {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value.replace(/[^\w-]/g, (c) => `\\${c}`);
}

function isUnique(doc: Document, selector: string): boolean {
  try {
    return doc.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
}

/** Framework-generated ids (`:r3:`, `radix-17`, `mui-4821`) change per render and make useless anchors. */
function isStableId(id: string): boolean {
  return /^[A-Za-z][\w-]*$/.test(id) && !/\d{3,}/.test(id) && !/^(radix|mui|headlessui|react-aria)/i.test(id);
}

export function selectorFor(el: Element): string {
  const doc = el.ownerDocument;
  if (el.id && isStableId(el.id) && isUnique(doc, `#${cssEscape(el.id)}`)) return `#${cssEscape(el.id)}`;

  for (const attr of ['data-testid', 'data-test', 'data-cy']) {
    const v = el.getAttribute(attr);
    if (v) {
      const sel = `[${attr}="${v.replace(/"/g, '\\"')}"]`;
      if (isUnique(doc, sel)) return sel;
    }
  }

  const parts: string[] = [];
  let node: Element | null = el;
  while (node && node !== doc.documentElement && parts.length < 8) {
    if (node.id && isStableId(node.id) && isUnique(doc, `#${cssEscape(node.id)}`)) {
      parts.unshift(`#${cssEscape(node.id)}`);
      break;
    }
    const tag = node.tagName.toLowerCase();
    const parent: Element | null = node.parentElement;
    if (!parent) {
      parts.unshift(tag);
      break;
    }
    const sameTag = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
    parts.unshift(sameTag.length > 1 ? `${tag}:nth-of-type(${sameTag.indexOf(node) + 1})` : tag);
    node = parent;
  }
  return clip(parts.join(' > '), LIMITS.selector);
}

export function visibleText(el: Element): string {
  const raw = el instanceof HTMLElement ? (el.innerText ?? el.textContent ?? '') : (el.textContent ?? '');
  return clip(raw.replace(/\s+/g, ' ').trim(), LIMITS.text);
}

/**
 * `outerHTML` with typed values, secret-looking attributes, scripts, styles and
 * SVG bodies removed, then truncated. Works on a clone — the live DOM is never
 * touched.
 */
export function redactedHtml(el: Element): string {
  const clone = el.cloneNode(true) as Element;
  const all = [clone, ...Array.from(clone.querySelectorAll('*'))];
  for (const node of all) {
    const tag = node.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'noscript' || tag === 'template') {
      node.remove();
      continue;
    }
    if (tag === 'svg') {
      node.innerHTML = '';
    }
    if (tag === 'textarea') node.textContent = '';
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase();
      if (URL_ATTRS.includes(name)) {
        /* A query string or hash is where tokens and magic links live. */
        if (attr.value.startsWith('data:')) node.removeAttribute(attr.name);
        else node.setAttribute(attr.name, attr.value.replace(/[?#].*$/, ''));
        continue;
      }
      const keep = STRUCTURAL_ATTRS.includes(name) || name.startsWith('aria-');
      if (
        VALUE_ATTRS.includes(name) ||
        SENSITIVE_ATTR.test(name) ||
        name.startsWith('on') ||
        name === 'style' ||
        (!keep && (SENSITIVE_ATTR.test(attr.value) || OPAQUE_TOKEN.test(attr.value)))
      ) {
        node.removeAttribute(attr.name);
      }
    }
  }
  return clip(clone.outerHTML, LIMITS.html);
}

type Fiber = {
  type?: unknown;
  return?: Fiber | null;
  _debugSource?: { fileName?: string; lineNumber?: number } | null;
};

function fiberOf(el: Element): Fiber | null {
  const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
  return key ? ((el as unknown as Record<string, Fiber>)[key] ?? null) : null;
}

function componentName(type: unknown): string | null {
  if (!type || (typeof type !== 'function' && typeof type !== 'object')) return null;
  const t = type as { displayName?: string; name?: string; render?: { displayName?: string; name?: string } };
  const name = t.displayName || t.name || t.render?.displayName || t.render?.name || '';
  /* A minified build leaves one- or two-letter names; those point nowhere. */
  return /^[A-Z][A-Za-z0-9_]{2,}$/.test(name) ? clip(name, LIMITS.name) : null;
}

/** Nearest named React component, and `_debugSource` if a dev build left it. */
export function reactInfo(el: Element): { component: string | null; source: string | null } {
  let fiber = fiberOf(el);
  let source: string | null = null;
  for (let depth = 0; fiber && depth < 40; depth += 1) {
    if (!source && fiber._debugSource?.fileName) {
      const file = fiber._debugSource.fileName.replace(/^.*?\/(src|app|components|pages)\//, '$1/');
      source = clip(`${file}:${fiber._debugSource.lineNumber ?? 0}`, LIMITS.name);
    }
    const name = componentName(fiber.type);
    if (name) return { component: name, source };
    fiber = fiber.return ?? null;
  }
  return { component: null, source };
}

export function rectOf(el: Element): BridgeRect | null {
  if (!el.isConnected) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null;
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
}

export function describeElement(el: Element, win: Window): ElementDescriptor {
  const { component, source } = reactInfo(el);
  return {
    selector: selectorFor(el),
    tag: el.tagName.toLowerCase(),
    text: visibleText(el),
    html: redactedHtml(el),
    role: el.getAttribute('role'),
    ariaLabel: el.getAttribute('aria-label') ? clip(el.getAttribute('aria-label')!, LIMITS.name) : null,
    component,
    source,
    rect: rectOf(el) ?? { x: 0, y: 0, w: 0, h: 0 },
    page: {
      /* Path only: a query string is where tokens and magic links live. */
      path: clip(win.location.pathname, LIMITS.path),
      title: clip(win.document.title, LIMITS.title),
      viewportW: win.innerWidth,
      viewportH: win.innerHeight,
    },
  };
}
