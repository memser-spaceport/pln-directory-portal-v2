/**
 * The viewport redraw inlines every font the picture uses, and that fetch is
 * the slow part of a small page. This reads the page's own `@font-face` rules
 * while the page is idle and keeps the files in memory. The capture then hands
 * that CSS to the renderer and skips the fetch. It does not draw a picture.
 */

const FONT_FETCH_MS = 8000;

type FontCache = { sig: string; css: string };

type FontWindow = Window & {
  __plnBridgeFontCss?: FontCache;
  __plnBridgeFontCssTask?: Promise<string | null>;
  __plnBridgeFontCssSig?: string;
};

const URL_RE = /url\((['"]?)([^'")]+)\1\)/g;
const FORMAT_RE = /url\((['"]?)([^'")]+)\1\)\s*format\((['"]?)([^'")]+)\3\)/gi;
const IMPORT_RE = /@import\s+(?:url\()?['"]?([^'")\s]+)['"]?\)?/gi;

function allMatches(re: RegExp, text: string): RegExpExecArray[] {
  const copy = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
  const found: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = copy.exec(text))) found.push(match);
  return found;
}

const escapeRe = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function sheetSignature(doc: Document): string {
  return Array.from(doc.styleSheets)
    .map((sheet) => {
      let count = 0;
      try {
        count = sheet.cssRules.length;
      } catch {
        count = -1;
      }
      return `${sheet.href ?? 'inline'}:${count}`;
    })
    .join('|');
}

function resolveUrl(url: string, baseHref: string | null): string {
  try {
    return new URL(url, baseHref ?? document.baseURI).href;
  } catch {
    return url;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

const files = new Map<string, Promise<string | null>>();

function fetchDataUrl(url: string): Promise<string | null> {
  const hit = files.get(url);
  if (hit) return hit;
  const task = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FONT_FETCH_MS);
    try {
      const response = await fetch(url, { cache: 'force-cache', signal: controller.signal });
      if (!response.ok) return null;
      return await blobToDataUrl(await response.blob());
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  })();
  files.set(url, task);
  return task;
}

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FONT_FETCH_MS);
  try {
    const response = await fetch(url, { cache: 'force-cache', signal: controller.signal });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Keep a woff2 when the face lists one. A face with no format hint keeps every file. */
function chooseUrls(cssText: string): { keep: string[]; drop: string[] } {
  const formats = allMatches(FORMAT_RE, cssText);
  if (!formats.length) {
    return {
      keep: allMatches(URL_RE, cssText)
        .map((match) => match[2])
        .filter((url) => !url.startsWith('data:')),
      drop: [],
    };
  }
  const woff2 = formats.filter((match) => match[4].toLowerCase() === 'woff2').map((match) => match[2]);
  const keep = woff2.length ? woff2 : [formats[0][2]];
  return { keep, drop: formats.map((match) => match[2]).filter((url) => !keep.includes(url)) };
}

async function inlineFace(cssText: string, baseHref: string | null): Promise<string | null> {
  const { keep, drop } = chooseUrls(cssText);
  let next = cssText;
  for (const url of drop) {
    next = next.replace(
      new RegExp(`\\s*,?\\s*url\\((['"]?)${escapeRe(url)}\\1\\)(\\s*format\\([^)]*\\))?`, 'gi'),
      '',
    );
  }
  for (const raw of keep) {
    if (raw.startsWith('data:')) continue;
    const dataUrl = await fetchDataUrl(resolveUrl(raw, baseHref));
    if (!dataUrl) return null;
    next = next.replace(new RegExp(`(url\\(['"]?)${escapeRe(raw)}(['"]?\\))`, 'g'), `$1${dataUrl}$2`);
  }
  next = next.replace(/src:\s*,/gi, 'src:').replace(/,\s*,/g, ',').replace(/,\s*;/g, ';');
  if (!/url\(/.test(next)) return null;
  return next;
}

function rulesFromCss(css: string): CSSRuleList | null {
  const doc = document.implementation.createHTMLDocument('');
  const style = doc.createElement('style');
  doc.head.appendChild(style);
  style.textContent = css;
  return style.sheet?.cssRules ?? null;
}

async function walkRules(
  rules: CSSRuleList,
  baseHref: string | null,
  out: string[],
  seen: Set<string>,
  depth: number,
) {
  for (const rule of Array.from(rules)) {
    if (rule.type === CSSRule.IMPORT_RULE) {
      const imported = rule as CSSImportRule;
      if (imported.styleSheet) await walkRules(imported.styleSheet.cssRules, imported.styleSheet.href, out, seen, depth);
      else if (imported.href) await loadSheetText(resolveUrl(imported.href, baseHref), out, seen, depth + 1);
      continue;
    }
    if (rule.type === CSSRule.FONT_FACE_RULE) {
      if (seen.has(rule.cssText)) continue;
      seen.add(rule.cssText);
      const css = await inlineFace(rule.cssText, baseHref);
      if (css) out.push(css);
      continue;
    }
    if ('cssRules' in rule && rule.cssRules instanceof CSSRuleList) {
      await walkRules(rule.cssRules, baseHref, out, seen, depth);
    }
  }
}

async function loadSheetText(href: string, out: string[], seen: Set<string>, depth: number) {
  if (depth > 4 || seen.has(`sheet:${href}`)) return;
  seen.add(`sheet:${href}`);
  const css = await fetchText(href);
  if (!css) return;
  for (const match of allMatches(IMPORT_RE, css)) {
    await loadSheetText(resolveUrl(match[1], href), out, seen, depth + 1);
  }
  const rules = rulesFromCss(css);
  if (rules) await walkRules(rules, href, out, seen, depth);
}

async function readSheet(sheet: CSSStyleSheet, out: string[], seen: Set<string>) {
  try {
    await walkRules(sheet.cssRules, sheet.href, out, seen, 0);
  } catch {
    if (sheet.href) await loadSheetText(sheet.href, out, seen, 0);
  }
}

async function buildFontCss(doc: Document): Promise<string> {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const sheet of Array.from(doc.styleSheets)) await readSheet(sheet, out, seen);
  return out.join('\n');
}

/** The inlined `@font-face` CSS, or null when this document has no font files. */
export function ensureFontCache(win: Window = window): Promise<string | null> {
  const host = win as FontWindow;
  const sig = sheetSignature(win.document);
  const cached = host.__plnBridgeFontCss;
  if (cached && cached.sig === sig) return Promise.resolve(cached.css || null);
  if (host.__plnBridgeFontCssTask && host.__plnBridgeFontCssSig === sig) return host.__plnBridgeFontCssTask;
  const task = buildFontCss(win.document)
    .then((css) => {
      host.__plnBridgeFontCss = { sig, css };
      return css || null;
    })
    .catch(() => null);
  host.__plnBridgeFontCssSig = sig;
  host.__plnBridgeFontCssTask = task;
  return task;
}

/** Start the font fetch on idle. The returned function cancels it if it has not started. */
export function scheduleFontCache(win: Window = window): () => void {
  const host = win as FontWindow & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    cancelIdleCallback?: (id: number) => void;
  };
  let cancel = () => {};
  const run = () => {
    cancel = () => {};
    void ensureFontCache(win);
  };
  if (typeof host.requestIdleCallback === 'function') {
    const id = host.requestIdleCallback(run, { timeout: 2000 });
    cancel = () => host.cancelIdleCallback?.(id);
  } else {
    const id = win.setTimeout(run, 500);
    cancel = () => win.clearTimeout(id);
  }
  return cancel;
}
