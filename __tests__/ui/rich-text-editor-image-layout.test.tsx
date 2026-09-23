/**
 * Pins the image overlay's contract.
 *
 * The resize: a handle only ever STARTS one. Nothing listens for movement
 * until a press lands on a handle, so passing the cursor over one can't resize
 * anything, and a press that never travels isn't a resize either. What gets
 * committed is a `width` — a percentage of the block the image sits in — on
 * the image's own index, with the inline drag preview cleared so it never
 * reaches the HTML the editor hands back.
 *
 * The wrap: a `float` format on the image. Because a float is only wrapped by
 * the content that FOLLOWS it, asking for one also walks the image to the head
 * of its block — otherwise an image at the end of a paragraph gets a float
 * that changes nothing on screen, which is exactly what shipped first. Asking
 * for no wrap ends the block after the image instead, because an unfloated
 * image is still an inline embed: the rest of the paragraph carries on from its
 * bottom edge unless a newline stops it.
 *
 * The move: the image steps between the head and the end of each block — the
 * end matters as much as the head, or a post that is one long paragraph has
 * nowhere to move to — and stays selected across the relocation even though
 * Quill rebuilds the `<img>` element.
 */
import React, { useRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { useImageLayout } from '@/components/ui/RichTextEditor/hooks/useImageLayout';
import { ImageLayoutOverlay } from '@/components/ui/RichTextEditor/ImageLayoutOverlay';

// The blot Quill.find returns for the selected image. Tests move it around the
// document by changing `index`.
const imageBlot = { index: 7 };

// Overrides the null-rendering stub from jest.setup.js: this suite needs
// Quill.find to resolve the clicked <img> to a blot.
jest.mock('react-quill-new', () => ({
  __esModule: true,
  default: () => null,
  Quill: {
    register: jest.fn(),
    import: jest.fn(() => class {}),
    find: jest.fn(() => imageBlot),
  },
}));

const CONTENT_WIDTH = 600;
const START_WIDTH = 300;
const SRC = 'https://images.example.com/diagram.png';

const formatText = jest.fn();
const deleteText = jest.fn();
const insertEmbed = jest.fn();
const insertText = jest.fn();
const setSelection = jest.fn();

interface Block {
  index: number;
  length: () => number;
}

/** The block the image sits in, and its neighbours. `null` = no such block. */
let line: Block & { prev: Block | null; next: Block | null };

/**
 * A line step is measured against the rendered text, which jsdom does not lay
 * out — so every move here exercises the block ladder the step falls back to.
 * The step's own search is pinned in image-line-step-offset.test.ts.
 */
const caretIndex: number | null = null;

function editorRoot() {
  return document.querySelector('.ql-editor') as HTMLElement;
}

function fakeEditor() {
  return {
    root: editorRoot(),
    getIndex: (blot: { index: number }) => blot.index,
    getLine: () => [line],
    getLeaf: () => [imageBlot],
    formatText,
    // Modelled, not stubbed: a move deletes the embed and inserts a new one,
    // and the hook has to find the replacement element to stay selected.
    deleteText: (...args: unknown[]) => {
      deleteText(...args);
      editorRoot().querySelector('img')?.remove();
    },
    insertEmbed: (...args: unknown[]) => {
      insertEmbed(...args);
      const image = document.createElement('img');
      image.setAttribute('src', SRC);
      image.setAttribute('alt', 'diagram');
      editorRoot().appendChild(image);
    },
    insertText,
    setSelection,
    selection: {
      normalizeNative: (range: unknown) => range,
      normalizedToRange: () => (caretIndex == null ? null : { index: caretIndex }),
    },
    on: jest.fn(),
    off: jest.fn(),
  };
}

function Harness() {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef({ getEditor: fakeEditor });

  const imageLayout = useImageLayout({
    quillRef,
    editorContainerRef: containerRef,
    overlayRef,
    qlEditorClass: 'ql-editor',
  });

  return (
    <div ref={containerRef}>
      <div className="ql-editor" style={{ padding: '0px' }}>
        <img src={SRC} alt="diagram" />
      </div>
      {imageLayout.overlay && (
        <ImageLayoutOverlay
          ref={overlayRef}
          rect={imageLayout.overlay.rect}
          float={imageLayout.overlay.float}
          canMoveUp={imageLayout.overlay.canMoveUp}
          canMoveDown={imageLayout.overlay.canMoveDown}
          onHandlePointerDown={imageLayout.onHandlePointerDown}
          onFloatChange={imageLayout.onFloatChange}
          onMove={imageLayout.onMove}
        />
      )}
    </div>
  );
}

// jsdom implements no layout. The image reports whatever width the drag has
// set on it, so a committed percentage is computed from a real number instead
// of zero.
function stubLayout() {
  const image = screen.getAllByAltText('diagram')[0] as HTMLImageElement;
  jest.spyOn(image, 'getBoundingClientRect').mockImplementation(() => {
    const width = parseFloat(image.style.width) || START_WIDTH;
    return {
      width,
      height: width / 2,
      top: 0,
      left: 0,
      right: width,
      bottom: width / 2,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };
  });
  Object.defineProperty(editorRoot(), 'clientWidth', { configurable: true, value: CONTENT_WIDTH });
  return image;
}

function selectImage() {
  const image = stubLayout();
  fireEvent.pointerDown(image);
  return image;
}

function handles() {
  return document.querySelectorAll('span[class*="handle"]');
}

// jsdom has no PointerEvent, and without one React normalizes every coordinate
// on a synthetic pointer event to null — a drag with no clientX isn't a drag.
class FakePointerEvent extends MouseEvent {
  pointerId: number;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 0;
  }
}

beforeAll(() => {
  global.PointerEvent = FakePointerEvent as unknown as typeof PointerEvent;
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

beforeEach(() => {
  [formatText, deleteText, insertEmbed, insertText, setSelection].forEach((mock) => mock.mockClear());
  imageBlot.index = 7;
  // Three blocks: 0-2, 3-12 (the image's, its newline at 12), 13-17.
  line = {
    index: 3,
    length: () => 10,
    prev: { index: 0, length: () => 3 },
    next: { index: 13, length: () => 5 },
  };
});

describe('selecting an image', () => {
  it('shows a handle per corner and the layout controls', () => {
    render(<Harness />);
    stubLayout();

    expect(handles()).toHaveLength(0);

    fireEvent.pointerDown(screen.getByAltText('diagram'));

    expect(handles()).toHaveLength(4);
    expect(screen.getByLabelText('Image left, text wraps')).toBeTruthy();
    expect(screen.getByLabelText('Move image up')).toBeTruthy();
  });

  it('deselects when the press lands anywhere else', () => {
    render(<Harness />);
    selectImage();

    fireEvent.pointerDown(document.body);

    expect(handles()).toHaveLength(0);
  });
});

describe('resizing', () => {
  it('does nothing while the pointer merely passes over a handle', () => {
    render(<Harness />);
    const image = selectImage();

    fireEvent.pointerMove(handles()[3], { clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 200 });

    expect(image.style.width).toBe('');
    expect(formatText).not.toHaveBeenCalled();
  });

  it('resizes only after a press on a handle, and commits on release', () => {
    render(<Harness />);
    const image = selectImage();

    fireEvent.pointerDown(handles()[3], { clientX: 0, button: 0 });
    fireEvent.pointerMove(window, { clientX: 100 });

    // Mid-drag the size is a local preview only — nothing has been told to Quill.
    expect(image.style.width).toBe('400px');
    expect(formatText).not.toHaveBeenCalled();

    fireEvent.pointerUp(window, { clientX: 100 });

    // 400 of 600 content pixels.
    expect(formatText).toHaveBeenCalledWith(7, 1, 'width', '67%', 'user');
    expect(image.style.width).toBe('');
  });

  it('keeps resizing once the pointer has left the handle', () => {
    render(<Harness />);
    selectImage();

    fireEvent.pointerDown(handles()[3], { clientX: 0, button: 0 });
    fireEvent.pointerMove(document.body, { clientX: 60 });
    fireEvent.pointerUp(document.body, { clientX: 60 });

    expect(formatText).toHaveBeenCalledWith(7, 1, 'width', '60%', 'user');
  });

  it('treats a press that never travels as a click, not a resize', () => {
    render(<Harness />);
    const image = selectImage();

    fireEvent.pointerDown(handles()[3], { clientX: 40, button: 0 });
    fireEvent.pointerMove(window, { clientX: 41 });
    fireEvent.pointerUp(window, { clientX: 41 });

    expect(formatText).not.toHaveBeenCalled();
    expect(image.style.width).toBe('');
  });

  it('ignores a press from a non-primary button', () => {
    render(<Harness />);
    const image = selectImage();

    fireEvent.pointerDown(handles()[3], { clientX: 0, button: 2 });
    fireEvent.pointerMove(window, { clientX: 100 });

    expect(image.style.width).toBe('');
  });

  it('stops listening for movement once the drag is over', () => {
    render(<Harness />);
    const image = selectImage();

    fireEvent.pointerDown(handles()[3], { clientX: 0, button: 0 });
    fireEvent.pointerMove(window, { clientX: 100 });
    fireEvent.pointerUp(window, { clientX: 100 });
    fireEvent.pointerMove(window, { clientX: 500 });

    expect(image.style.width).toBe('');
    expect(formatText).toHaveBeenCalledTimes(1);
  });

  it('reverts the preview without committing when the drag is cancelled', () => {
    render(<Harness />);
    const image = selectImage();

    fireEvent.pointerDown(handles()[3], { clientX: 0, button: 0 });
    fireEvent.pointerMove(window, { clientX: 100 });
    fireEvent.pointerCancel(window);

    expect(image.style.width).toBe('');
    expect(formatText).not.toHaveBeenCalled();
  });
});

describe('wrapping text', () => {
  it('formats the image with the chosen side', () => {
    render(<Harness />);
    selectImage();

    fireEvent.click(screen.getByLabelText('Image right, text wraps'));

    expect(formatText).toHaveBeenCalledWith(7, 1, 'float', 'right', 'user');
  });

  it('walks an image at the end of a paragraph up to its head, where a float has text to wrap', () => {
    render(<Harness />);
    selectImage();

    fireEvent.click(screen.getByLabelText('Image left, text wraps'));

    expect(deleteText).toHaveBeenCalledWith(7, 1, 'user');
    expect(insertEmbed).toHaveBeenCalledWith(3, 'image', SRC, 'user');
  });

  it('leaves an image that already heads its block where it is', () => {
    imageBlot.index = 3;
    render(<Harness />);
    selectImage();

    fireEvent.click(screen.getByLabelText('Image left, text wraps'));

    expect(formatText).toHaveBeenCalledWith(3, 1, 'float', 'left', 'user');
    expect(deleteText).not.toHaveBeenCalled();
  });

  it('does not move the image when the wrap is being removed', () => {
    render(<Harness />);
    selectImage();

    fireEvent.click(screen.getByLabelText('No text wrap'));

    expect(formatText).toHaveBeenCalledWith(7, 1, 'float', false, 'user');
    expect(deleteText).not.toHaveBeenCalled();
  });

  it('ends the block after the image when the wrap is removed, so the text below starts on its own line', () => {
    render(<Harness />);
    selectImage();

    fireEvent.click(screen.getByLabelText('No text wrap'));

    expect(insertText).toHaveBeenCalledWith(8, '\n', 'user');
  });

  it('adds no break to an image that already ends its block, so pressing it twice stacks nothing', () => {
    // The block runs 3-12, with its newline at 12: an image at 11 is its last
    // content.
    imageBlot.index = 11;
    render(<Harness />);
    selectImage();

    fireEvent.click(screen.getByLabelText('No text wrap'));

    expect(insertText).not.toHaveBeenCalled();
  });

  it('leaves the text after a wrapped image where it is — that text is the wrap', () => {
    render(<Harness />);
    selectImage();

    fireEvent.click(screen.getByLabelText('Image right, text wraps'));

    expect(insertText).not.toHaveBeenCalled();
  });

  it('narrows a full-width image so the text has a column to wrap into', () => {
    render(<Harness />);
    const image = selectImage();
    // 590 of 600 content pixels: nothing could fit beside it.
    image.style.width = '590px';

    fireEvent.click(screen.getByLabelText('Image left, text wraps'));

    expect(formatText).toHaveBeenCalledWith(7, 1, 'width', '50%', 'user');
  });

  it('leaves the width of an image that already has room alone', () => {
    render(<Harness />);
    selectImage();

    fireEvent.click(screen.getByLabelText('Image left, text wraps'));

    expect(formatText).not.toHaveBeenCalledWith(7, 1, 'width', expect.anything(), 'user');
  });

  it('shows the wrap the image already carries as the active one', () => {
    render(<Harness />);
    const image = stubLayout();
    image.classList.add('ql-img-float-left');

    fireEvent.pointerDown(image);

    expect(screen.getByLabelText('Image left, text wraps').getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByLabelText('No text wrap').getAttribute('aria-pressed')).toBe('false');
  });
});

describe('moving through the text', () => {
  it('takes a mid-paragraph image to the head of its own block', () => {
    render(<Harness />);
    selectImage();

    fireEvent.click(screen.getByLabelText('Move image up'));

    expect(insertEmbed).toHaveBeenCalledWith(3, 'image', SRC, 'user');
  });

  it('takes a mid-paragraph image to the end of its own block', () => {
    render(<Harness />);
    selectImage();

    fireEvent.click(screen.getByLabelText('Move image down'));

    // The block's newline is at 12; removing the embed at 7 shifts it to 11.
    expect(deleteText).toHaveBeenCalledWith(7, 1, 'user');
    expect(insertEmbed).toHaveBeenCalledWith(11, 'image', SRC, 'user');
  });

  it('steps into the previous block, at its end, once it already heads its own', () => {
    imageBlot.index = 3;
    render(<Harness />);
    selectImage();

    fireEvent.click(screen.getByLabelText('Move image up'));

    // The previous block's newline sits at 2.
    expect(insertEmbed).toHaveBeenCalledWith(2, 'image', SRC, 'user');
  });

  it('steps into the next block, at its head, once it already ends its own', () => {
    imageBlot.index = 11;
    render(<Harness />);
    selectImage();

    fireEvent.click(screen.getByLabelText('Move image down'));

    expect(insertEmbed).toHaveBeenCalledWith(12, 'image', SRC, 'user');
  });

  it('still moves in a post that is one single paragraph', () => {
    // The case block-to-block steps could not serve: one block, image at its
    // head after a wrap, so "down" has to reach the end of that same block.
    line = { index: 0, length: () => 40, prev: null, next: null };
    imageBlot.index = 0;
    render(<Harness />);
    selectImage();

    expect(screen.getByLabelText('Move image up').hasAttribute('disabled')).toBe(true);
    expect(screen.getByLabelText('Move image down').hasAttribute('disabled')).toBe(false);

    fireEvent.click(screen.getByLabelText('Move image down'));

    expect(insertEmbed).toHaveBeenCalledWith(38, 'image', SRC, 'user');
  });

  it('carries the width and the wrap across the move', () => {
    render(<Harness />);
    const image = selectImage();
    image.setAttribute('width', '45%');
    image.classList.add('ql-img-float-left');

    fireEvent.click(screen.getByLabelText('Move image down'));

    expect(formatText).toHaveBeenCalledWith(11, 1, 'width', '45%', 'user');
    expect(formatText).toHaveBeenCalledWith(11, 1, 'float', 'left', 'user');
  });

  it('keeps the image selected on the element Quill rebuilt', () => {
    render(<Harness />);
    selectImage();

    fireEvent.click(screen.getByLabelText('Move image down'));

    expect(handles()).toHaveLength(4);
  });

  it('offers nothing at the very ends of the document', () => {
    // Alone in the only block: no rung above, none below.
    line = { index: 0, length: () => 2, prev: null, next: null };
    imageBlot.index = 0;
    render(<Harness />);
    selectImage();

    expect(screen.getByLabelText('Move image up').hasAttribute('disabled')).toBe(true);
    expect(screen.getByLabelText('Move image down').hasAttribute('disabled')).toBe(true);
  });
});

/**
 * The overlay survives a press on its own controls by asking whether the press
 * came from inside itself — not by stopping propagation.
 *
 * It cannot use propagation: in the App Router React's root container is
 * `document` (next/dist/client/app-index: `const appElement = document`), so
 * React's delegated listeners are siblings of the hook's own listener on that
 * node, and `stopPropagation()` from a React handler does not stop a listener
 * there. Under Testing Library the root is a plain <div> and propagation DOES
 * work, which is exactly why the first version of this passed here and failed
 * in the app: the press deselected the image and unmounted the controls before
 * the click could land on them. These tests assert the press reaches a
 * document listener and the selection survives anyway.
 */
describe('a press on the overlay itself', () => {
  function pressAndWatchDocument(element: Element) {
    const reachedDocument = jest.fn();
    document.addEventListener('pointerdown', reachedDocument);
    fireEvent.pointerDown(element, { clientX: 0, button: 0 });
    document.removeEventListener('pointerdown', reachedDocument);
    return reachedDocument;
  }

  it('does not deselect the image when a wrap control is pressed', () => {
    render(<Harness />);
    selectImage();

    const reachedDocument = pressAndWatchDocument(screen.getByLabelText('No text wrap'));

    expect(reachedDocument).toHaveBeenCalled();
    expect(handles()).toHaveLength(4);
  });

  it('does not deselect the image when a resize handle is pressed', () => {
    render(<Harness />);
    selectImage();

    const reachedDocument = pressAndWatchDocument(handles()[3]);

    expect(reachedDocument).toHaveBeenCalled();
    expect(handles()).toHaveLength(4);
  });
});
