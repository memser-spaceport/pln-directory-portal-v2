import { Quill } from 'react-quill-new';
import { MutableRefObject, PointerEvent, RefObject, useCallback, useEffect, useRef, useState } from 'react';

import { IMAGE_FLOATS, ImageFloat } from '@/utils/richText/imageFloats';
import { imageFloatClass } from '@/utils/richText/imageFloatClass';

import { imageWidthPercent } from '../utils/imageWidthPercent';
import { moveImageEmbed } from '../utils/moveImageEmbed';
import { indexFromRange } from '../utils/indexFromRange';
import { rangeAtTextOffset } from '../utils/rangeAtTextOffset';
import { imageLineStepOffset } from '../utils/imageLineStepOffset';

const MIN_WIDTH_PX = 48;
// A float only wraps what fits beside it, so an image spanning the whole
// content width wraps nothing at all and the control looks broken. Half the
// block is the widest an image can be and still leave a text column.
const WRAP_MAX_PERCENT = 50;
// A press that never travels this far is a click on a handle, not a resize.
const DRAG_THRESHOLD_PX = 3;

interface Options {
  quillRef: MutableRefObject<any>;
  editorContainerRef: RefObject<HTMLDivElement | null>;
  /** The overlay's own root, so a press on its controls can be told apart. */
  overlayRef: RefObject<HTMLDivElement | null>;
  qlEditorClass: string;
}

interface ImageRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface Overlay {
  rect: ImageRect;
  float: ImageFloat | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

/**
 * Where the image goes when there is no line to step onto: the coarse ladder,
 * used at the edges of a block where the rendered text runs out.
 *
 * The rungs are the head and the end of each block:
 *
 *     … end of block N-1 → head of block N → end of block N → head of block N+1 …
 *
 * Both matter. The head is the only place a wrap does anything — a float is
 * only wrapped by the content that FOLLOWS it — while the end is what lets an
 * image travel at all in a post that is one long paragraph, which block-to-
 * block steps alone left with nowhere to go.
 *
 * A candidate that would put the image back where it already is (asking an
 * image that already ends its block to move to the end of its block) is
 * skipped rather than offered, so a button is only enabled when pressing it
 * moves something.
 */
function moveTargetIndex(editor: any, index: number, direction: 1 | -1): number | null {
  const [line] = editor.getLine(index);
  if (!line) {
    return null;
  }

  const head = editor.getIndex(line);
  // The block's trailing newline: inserting there lands after its last
  // content, which is what "the end of this block" means as an index.
  const end = head + line.length() - 1;

  const candidates =
    direction === -1
      ? [head, line.prev ? editor.getIndex(line.prev) + line.prev.length() - 1 : null]
      : [end, line.next ? editor.getIndex(line.next) : null];

  for (const target of candidates) {
    if (target == null) {
      continue;
    }

    // Deleting the embed first shifts every later index down by one, so this
    // is where it would actually land — the only fair test of "does anything
    // change?".
    const insertAt = target > index ? target - 1 : target;
    if (insertAt !== index) {
      return target;
    }
  }

  return null;
}

/**
 * Ends the image's block right after it, so what followed starts on its own
 * line.
 */
function breakAfterImage(editor: any, index: number, line: any): void {
  if (!line) {
    return;
  }

  // The block's trailing newline — the first index that is no longer content.
  const contentEnd = editor.getIndex(line) + line.length() - 1;
  if (index + 1 >= contentEnd) {
    return;
  }

  editor.insertText(index + 1, '\n', 'user');
}

/**
 * The index one rendered line above or below the image — the step that lets an
 * image sit in the MIDDLE of a paragraph, which the block ladder alone could
 * never do: it only ever offered the top or the bottom of the text.
 *
 * Returns null when there is no such line (the image is already on the first
 * or last one), leaving the caller to fall back to the ladder.
 */
function lineStepIndex(editor: any, image: HTMLImageElement, index: number, direction: 1 | -1): number | null {
  const block = image.parentElement;
  const editorRoot = editor.root as HTMLElement | undefined;
  if (!block || !editorRoot) {
    return null;
  }

  const offset = imageLineStepOffset({ editorRoot, block, image, direction });
  if (offset == null) {
    return null;
  }

  const target = indexFromRange(editor, rangeAtTextOffset(block, offset));
  if (target == null) {
    return null;
  }

  const insertAt = target > index ? target - 1 : target;
  return insertAt === index ? null : target;
}

function overlayFor(image: HTMLImageElement, container: HTMLElement, editor: any): Overlay {
  const imageBox = image.getBoundingClientRect();
  const containerBox = container.getBoundingClientRect();
  const blot = editor && Quill.find(image);
  const index = blot ? editor.getIndex(blot) : null;

  return {
    rect: {
      top: imageBox.top - containerBox.top,
      left: imageBox.left - containerBox.left,
      width: imageBox.width,
      height: imageBox.height,
    },
    float: IMAGE_FLOATS.find((value) => image.classList.contains(imageFloatClass(value))) ?? null,
    canMoveUp: index != null && moveTargetIndex(editor, index, -1) != null,
    canMoveDown: index != null && moveTargetIndex(editor, index, 1) != null,
  };
}

function contentWidthOf(element: HTMLElement): number {
  const { paddingLeft, paddingRight } = getComputedStyle(element);
  return element.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight);
}

/**
 * The width a stored percentage will resolve against: the content box of the
 * image's containing block, which is the editor body for a plain paragraph but
 * a narrower box inside a list or a quote. Measuring the wrong one makes the
 * image jump the moment the drag is committed. An inline parent — an image
 * inside a link — reports no width of its own, and the body is the closest
 * honest answer.
 */
function referenceWidthOf(image: HTMLImageElement, editorRoot: HTMLElement): number {
  const block = image.parentElement;
  const blockWidth = block ? contentWidthOf(block) : 0;
  return blockWidth > 0 ? blockWidth : contentWidthOf(editorRoot);
}

/**
 * Click-to-select, drag-to-resize and wrap-text-around for the images in an
 * editor's body.
 *
 * Both settings are formats on the `<img>` — a `width` attribute Quill's Image
 * blot already understands, and the `float` class this app's ImageBlot adds —
 * so they land in the document delta, come back out of `getHTML()`, and are
 * restored when that HTML is loaded into an editor again. Nothing here writes
 * `height`: an image with only a width keeps its aspect ratio wherever it
 * renders.
 */
export function useImageLayout(options: Options) {
  const { quillRef, editorContainerRef, overlayRef, qlEditorClass } = options;

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const endDragRef = useRef<(() => void) | null>(null);

  const syncOverlay = useCallback(() => {
    const container = editorContainerRef.current;
    if (!image || !container) {
      return;
    }

    if (!container.contains(image)) {
      setImage(null);
      setOverlay(null);
      return;
    }

    setOverlay(overlayFor(image, container, quillRef.current?.getEditor()));
  }, [image, editorContainerRef, quillRef]);

  // One document-level listener covers both halves of selection: an image in
  // this editor's body selects, anything else deselects.
  //
  // A press on the overlay is neither, and it is recognised by asking the
  // overlay whether the press came from inside it — NOT by having the overlay
  // stop propagation. In the App Router React's root container is `document`
  // itself (see next/dist/client/app-index: `const appElement = document`), so
  // its delegated listeners are siblings of this one on the same node, and
  // `stopPropagation()` from a React handler cannot stop a listener there.
  // Relying on it deselected the image on the way to its own controls, which
  // unmounted them before the click could land.
  useEffect(() => {
    const onPointerDown = (event: globalThis.PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const container = editorContainerRef.current;
      if (!target || !container) {
        return;
      }

      if (overlayRef.current?.contains(target)) {
        return;
      }

      const nextImage =
        target.tagName === 'IMG' && container.contains(target) && target.closest(`.${qlEditorClass}`)
          ? (target as HTMLImageElement)
          : null;

      // Measured here, where a real event is in hand, rather than in the
      // effect that reacts to the selection: the overlay then draws in the
      // same commit that selects, with no frame at the wrong size.
      setImage(nextImage);
      setOverlay(nextImage && overlayFor(nextImage, container, quillRef.current?.getEditor()));
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [editorContainerRef, overlayRef, qlEditorClass, quillRef]);

  useEffect(() => {
    if (!image) {
      return;
    }

    const editor = quillRef.current?.getEditor();
    // A ResizeObserver reports the current size as soon as it observes, so
    // this both keeps the overlay on a reflowing image and re-measures the
    // one just selected.
    const observer = new ResizeObserver(syncOverlay);
    observer.observe(image);
    editor?.on('text-change', syncOverlay);
    window.addEventListener('scroll', syncOverlay, true);
    window.addEventListener('resize', syncOverlay);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setImage(null);
        setOverlay(null);
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      observer.disconnect();
      editor?.off('text-change', syncOverlay);
      window.removeEventListener('scroll', syncOverlay, true);
      window.removeEventListener('resize', syncOverlay);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [image, syncOverlay, quillRef]);

  const formatImage = useCallback(
    (target: HTMLImageElement, name: string, value: unknown) => {
      const editor = quillRef.current?.getEditor();
      const blot = Quill.find(target);
      if (!blot) {
        return;
      }

      editor.formatText(editor.getIndex(blot), 1, name, value, 'user');
    },
    [quillRef],
  );

  const onHandlePointerDown = useCallback(
    (event: PointerEvent<HTMLElement>, directionX: 1 | -1) => {
      const editorRoot = quillRef.current?.getEditor()?.root as HTMLElement | undefined;
      if (!image || !editorRoot || event.button !== 0) {
        return;
      }

      // Stops the editor moving the caret and the browser starting a native
      // image drag.
      event.preventDefault();

      const drag = {
        image,
        startX: event.clientX,
        startWidth: image.getBoundingClientRect().width,
        referenceWidth: referenceWidthOf(image, editorRoot),
        resized: false,
      };

      // A handle only ever STARTS a resize; the resize itself follows the
      // pointer on the window until it is released. Nothing is listening for
      // movement until this press happens, so passing the cursor over a handle
      // cannot resize anything — and once a drag is under way it survives the
      // pointer leaving the 10px handle, the image, or the editor.
      const onPointerMove = (moveEvent: globalThis.PointerEvent) => {
        const travelled = moveEvent.clientX - drag.startX;
        if (!drag.resized && Math.abs(travelled) < DRAG_THRESHOLD_PX) {
          return;
        }
        drag.resized = true;

        // An inline style, not the width attribute: style is invisible to the
        // document model (Image.formats reads attributes only), so a drag
        // previews without pushing an edit — and an undo step — per pointer
        // move. The width Quill gets told about is the one on release.
        const next = drag.startWidth + directionX * travelled;
        drag.image.style.width = `${Math.min(Math.max(next, MIN_WIDTH_PX), drag.referenceWidth)}px`;
        syncOverlay();
      };

      const endDrag = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
        endDragRef.current = null;
      };

      function onPointerUp() {
        endDrag();
        if (!drag.resized) {
          return;
        }

        const widthPx = drag.image.getBoundingClientRect().width;
        drag.image.style.removeProperty('width');
        formatImage(drag.image, 'width', `${imageWidthPercent(widthPx, drag.referenceWidth)}%`);
        syncOverlay();
      }

      function onPointerCancel() {
        endDrag();
        drag.image.style.removeProperty('width');
        syncOverlay();
      }

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerCancel);
      endDragRef.current = onPointerCancel;
    },
    [image, quillRef, syncOverlay, formatImage],
  );

  /**
   * Relocating an embed replaces its DOM node, so the selection has to be
   * re-pointed at whichever `<img>` Quill has just built. It is identified by
   * elimination — the one that wasn't in the body a moment ago — rather than
   * by index, which would need Quill's leaf lookup to agree about an embed's
   * boundary.
   */
  const relocateImage = useCallback(
    (target: HTMLImageElement, fromIndex: number, toIndex: number) => {
      const editor = quillRef.current?.getEditor();
      const editorRoot = editor?.root as HTMLElement | undefined;
      const container = editorContainerRef.current;
      if (!editorRoot || !container) {
        return;
      }

      const before = new Set(editorRoot.querySelectorAll('img'));
      moveImageEmbed(editor, target, fromIndex, toIndex);

      const moved = [...editorRoot.querySelectorAll('img')].find((node) => !before.has(node)) ?? null;
      setImage(moved as HTMLImageElement | null);
      setOverlay(moved ? overlayFor(moved as HTMLImageElement, container, editor) : null);
    },
    [quillRef, editorContainerRef],
  );

  const onMove = useCallback(
    (direction: 1 | -1) => {
      const editor = quillRef.current?.getEditor();
      const blot = image && Quill.find(image);
      if (!image || !blot) {
        return;
      }

      const index = editor.getIndex(blot);
      const target = lineStepIndex(editor, image, index, direction) ?? moveTargetIndex(editor, index, direction);
      if (target == null) {
        return;
      }

      relocateImage(image, index, target);
    },
    [image, quillRef, relocateImage],
  );

  const onFloatChange = useCallback(
    (float: ImageFloat | null) => {
      const editor = quillRef.current?.getEditor();
      const blot = image && Quill.find(image);
      if (!image || !blot) {
        return;
      }

      // `false`, not null: Quill's own convention for removing a format.
      formatImage(image, 'float', float ?? false);

      // An image as wide as the block has no room for text beside it. Narrow
      // it enough to leave a column, or the wrap that was just asked for is
      // invisible.
      const editorRoot = editor.root as HTMLElement;
      if (float) {
        const referenceWidth = referenceWidthOf(image, editorRoot);
        const percent = imageWidthPercent(image.getBoundingClientRect().width, referenceWidth);
        if (percent > WRAP_MAX_PERCENT) {
          formatImage(image, 'width', `${WRAP_MAX_PERCENT}%`);
        }
      }

      const index = editor.getIndex(blot);
      const [line] = editor.getLine(index);

      // A float is only wrapped by the content that FOLLOWS it, so asking an
      // image at the end of a paragraph to wrap does nothing visible at all —
      // the text above it is already laid out. Pull it to the head of its
      // block, where the paragraph it sits in becomes the text that wraps.
      const lineStart = line ? editor.getIndex(line) : index;
      if (float && index > lineStart) {
        relocateImage(image, index, lineStart);
        return;
      }

      if (!float) {
        breakAfterImage(editor, index, line);
      }

      syncOverlay();
    },
    [image, quillRef, formatImage, syncOverlay, relocateImage],
  );

  // An editor unmounted mid-drag (a modal closed on top of one) would
  // otherwise leave its window listeners behind.
  useEffect(() => () => endDragRef.current?.(), []);

  return { overlay, onHandlePointerDown, onFloatChange, onMove };
}
