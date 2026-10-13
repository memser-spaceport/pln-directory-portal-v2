/**
 * One picture of the current viewport. A later Whole page or Pick a part of the
 * same view reuses it. Scroll, resize, typing, a DOM change, or a new animation
 * drops it. The feedback UI is not one of those changes.
 */

export type ViewportShot = { dataUrl: string; width: number; height: number };

const UI_SELECTOR = '[data-feedback-capture-ignore], [data-pln-bridge]';

type Entry = ViewportShot & { key: string };

let cached: Entry | null = null;
let drawing = false;
let observer: MutationObserver | null = null;

const viewKey = () => `${window.scrollX}:${window.scrollY}:${window.innerWidth}:${window.innerHeight}`;

const drop = () => {
  if (!drawing) cached = null;
};

const isUi = (node: Node) => {
  const el = node instanceof Element ? node : node.parentElement;
  return Boolean(el?.closest(UI_SELECTOR));
};

/** A change in the feedback UI does not change the picture. */
const changesPage = (record: MutationRecord) => {
  if (record.type !== 'childList') return !isUi(record.target);
  const nodes = [...record.addedNodes, ...record.removedNodes];
  return nodes.some((node) => !isUi(node));
};

function watch() {
  if (observer) return;
  window.addEventListener('scroll', drop, true);
  window.addEventListener('resize', drop);
  window.addEventListener('input', drop, true);
  window.addEventListener('animationstart', drop, true);
  observer = new MutationObserver((records) => {
    if (drawing) return;
    if (records.some(changesPage)) cached = null;
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true,
  });
}

/** Draw `render` for this viewport, or return the picture already drawn for it. */
export async function withViewportShot(render: () => Promise<ViewportShot>): Promise<ViewportShot> {
  watch();
  const key = viewKey();
  if (cached?.key === key) return { dataUrl: cached.dataUrl, width: cached.width, height: cached.height };
  /* Unhook while drawing. The draw itself edits the page, then puts it back. */
  observer?.disconnect();
  drawing = true;
  try {
    const shot = await render();
    if (viewKey() === key) cached = { ...shot, key };
    return shot;
  } finally {
    drawing = false;
    observer?.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      characterData: true,
    });
  }
}
