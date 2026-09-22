import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { AnnotationCanvas } from '@/components/page/ai-apps/components/screenshot-feedback/AnnotationCanvas';
import { EMPTY_ANNOTATIONS } from '@/components/page/ai-apps/components/screenshot-feedback/types';
import canvasStyles from '@/components/page/ai-apps/components/screenshot-feedback/AnnotationCanvas.module.scss';

const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('AnnotationCanvas comments', () => {
  beforeEach(() => {
    HTMLElement.prototype.setPointerCapture = jest.fn();
    HTMLElement.prototype.releasePointerCapture = jest.fn();
    HTMLCanvasElement.prototype.setPointerCapture = jest.fn();
    HTMLCanvasElement.prototype.releasePointerCapture = jest.fn();
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 200,
      right: 200,
      width: 200,
      height: 200,
      toJSON: () => ({}),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps the composer after click and saves a pin on Enter', () => {
    const onChange = jest.fn();
    const { container } = render(
      <AnnotationCanvas imageSrc={PIXEL_PNG} annotations={EMPTY_ANNOTATIONS} onChange={onChange} tool="comment" />,
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    jest.spyOn(canvas!, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 200,
      right: 200,
      width: 200,
      height: 200,
      toJSON: () => ({}),
    });

    fireEvent(
      canvas!,
      new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: 40, clientY: 60 }),
    );
    fireEvent(
      canvas!,
      new MouseEvent('pointerup', { bubbles: true, cancelable: true, button: 0, clientX: 40, clientY: 60 }),
    );
    fireEvent.click(canvas!, { button: 0, clientX: 40, clientY: 60 });

    const input = screen.getByPlaceholderText('Add a comment');
    fireEvent.blur(input);
    expect(screen.getByPlaceholderText('Add a comment')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'Broken button' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        comments: [expect.objectContaining({ text: 'Broken button', x: 0.2, y: 0.3 })],
      }),
    );
  });

  it('saves the comment when clicking outside the composer', () => {
    const onChange = jest.fn();
    const { container } = render(
      <AnnotationCanvas imageSrc={PIXEL_PNG} annotations={EMPTY_ANNOTATIONS} onChange={onChange} tool="comment" />,
    );
    const canvas = container.querySelector('canvas')!;
    jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 200,
      right: 200,
      width: 200,
      height: 200,
      toJSON: () => ({}),
    });
    fireEvent(
      canvas,
      new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: 40, clientY: 60 }),
    );
    fireEvent(
      canvas,
      new MouseEvent('pointerup', { bubbles: true, cancelable: true, button: 0, clientX: 40, clientY: 60 }),
    );

    fireEvent.change(screen.getByPlaceholderText('Add a comment'), { target: { value: 'Keep this' } });
    fireEvent.blur(screen.getByPlaceholderText('Add a comment'));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        comments: [expect.objectContaining({ text: 'Keep this' })],
      }),
    );
  });

  it('opens a saved comment for editing', () => {
    const onChange = jest.fn();
    render(
      <AnnotationCanvas
        imageSrc={PIXEL_PNG}
        annotations={{ version: 1, strokes: [], shapes: [], comments: [{ id: 'c1', x: 0.5, y: 0.5, text: 'Hi' }] }}
        onChange={onChange}
        tool="comment"
      />,
    );

    const pin = screen.getByRole('button', { name: 'Comment 1' });
    fireEvent.pointerDown(pin, { button: 0, pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(pin, { button: 0, pointerId: 1, clientX: 100, clientY: 100 });

    const input = screen.getByDisplayValue('Hi');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        comments: [expect.objectContaining({ id: 'c1', text: 'Hello' })],
      }),
    );
  });

  it('removes a saved comment', () => {
    const onChange = jest.fn();
    render(
      <AnnotationCanvas
        imageSrc={PIXEL_PNG}
        annotations={{ version: 1, strokes: [], shapes: [], comments: [{ id: 'c1', x: 0.5, y: 0.5, text: 'Hi' }] }}
        onChange={onChange}
        tool="comment"
      />,
    );

    const pin = screen.getByRole('button', { name: 'Comment 1' });
    fireEvent.pointerDown(pin, { button: 0, pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerUp(pin, { button: 0, pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Remove' }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ comments: [] }));
  });

  it('moves a saved comment by dragging the pin', () => {
    const onChange = jest.fn();
    const { container } = render(
      <AnnotationCanvas
        imageSrc={PIXEL_PNG}
        annotations={{ version: 1, strokes: [], shapes: [], comments: [{ id: 'c1', x: 0.5, y: 0.5, text: 'Hi' }] }}
        onChange={onChange}
        tool="comment"
      />,
    );
    jest.spyOn(container.firstChild as HTMLElement, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 200,
      right: 200,
      width: 200,
      height: 200,
      toJSON: () => ({}),
    });

    const pin = screen.getByRole('button', { name: 'Comment 1' });
    fireEvent(
      pin,
      new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: 100, clientY: 100 }),
    );
    fireEvent(pin, new MouseEvent('pointermove', { bubbles: true, clientX: 140, clientY: 80 }));
    fireEvent(pin, new MouseEvent('pointerup', { bubbles: true, clientX: 140, clientY: 80 }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        comments: [expect.objectContaining({ id: 'c1', x: 0.7, y: 0.4, text: 'Hi' })],
      }),
    );
  });
});

/**
 * A comment panel flips to the other side of its pin near an edge.
 *
 * `.stage` scrolls, so a 240px panel hanging off a pin near the right edge does
 * not just look cramped — it gives the whole editor a horizontal scrollbar and
 * pushes the panel's own text out of reach.
 */
describe('AnnotationCanvas comment panel placement', () => {
  const IMAGE = { width: 800, height: 600 };

  const renderWithComment = (x: number, y: number) => {
    /* The canvas sizes itself from the image's client box, which jsdom reports
       as 0 — state it so the flip has room to reason about. */
    jest.spyOn(HTMLImageElement.prototype, 'clientWidth', 'get').mockReturnValue(IMAGE.width);
    jest.spyOn(HTMLImageElement.prototype, 'clientHeight', 'get').mockReturnValue(IMAGE.height);

    const result = render(
      <AnnotationCanvas
        imageSrc={PIXEL_PNG}
        annotations={{ ...EMPTY_ANNOTATIONS, comments: [{ id: 'c1', x, y, text: 'Look here' }] }}
        readOnly
      />,
    );
    fireEvent.load(result.container.querySelector('img')!);
    fireEvent.click(screen.getByRole('button', { name: 'Comment 1' }));
    return screen.getByText('Look here');
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('hangs the panel down-and-right of a pin with room around it', () => {
    const panel = renderWithComment(0.1, 0.1);

    expect(panel.style.getPropertyValue('--flip-x')).toBe('0');
    expect(panel.style.getPropertyValue('--flip-y')).toBe('0');
  });

  it('flips the panel left of a pin near the right edge', () => {
    const panel = renderWithComment(0.95, 0.1);

    expect(panel.style.getPropertyValue('--flip-x')).toBe('1');
    expect(panel.style.getPropertyValue('--flip-y')).toBe('0');
  });

  it('flips the panel above a pin near the bottom edge', () => {
    const panel = renderWithComment(0.1, 0.95);

    expect(panel.style.getPropertyValue('--flip-y')).toBe('1');
  });

  it('flips both ways in the bottom-right corner', () => {
    const panel = renderWithComment(0.98, 0.98);

    expect(panel.style.getPropertyValue('--flip-x')).toBe('1');
    expect(panel.style.getPropertyValue('--flip-y')).toBe('1');
  });

  /* A pin just inside the panel's own width still has room, so it must not flip
     — an over-eager rule would send panels off the LEFT edge instead. */
  it('does not flip while the panel still fits', () => {
    const panel = renderWithComment(0.6, 0.1);

    expect(panel.style.getPropertyValue('--flip-x')).toBe('0');
  });
});

/**
 * Which cursor a pin wears, and why the tool decides it.
 *
 * A pin is a `<button>`, so its own cursor beats the canvas's crosshair
 * underneath it — and while someone is placing comments, crossing an existing
 * pin used to flip the cursor to "press me" over a surface whose whole job at
 * that moment is "click to place".
 *
 * Asserted on class names: jsdom loads no stylesheet, so a computed `cursor`
 * would be the empty string whatever the rules said. What is pinned here is
 * which classes are applied; the values live one file away in the stylesheet.
 */
describe('AnnotationCanvas pin cursor', () => {
  const WITH_COMMENT = {
    ...EMPTY_ANNOTATIONS,
    comments: [{ id: 'c1', x: 0.5, y: 0.5, text: 'Look here' }],
  };

  const pin = () => screen.getByRole('button', { name: 'Comment 1' });

  it('holds the crosshair over pins while the comment tool is active', () => {
    render(<AnnotationCanvas imageSrc={PIXEL_PNG} annotations={WITH_COMMENT} onChange={jest.fn()} tool="comment" />);

    expect(pin().className).toContain(canvasStyles.pinCrosshair);
    expect(pin().className).not.toContain(canvasStyles.pinMove);
  });

  /* With the draw tool a pin is an ordinary draggable object and goes on saying
     so — the crosshair belongs to the mode that places them, not to the canvas
     for ever. */
  it('leaves the drag cursor alone under the draw tool', () => {
    render(<AnnotationCanvas imageSrc={PIXEL_PNG} annotations={WITH_COMMENT} onChange={jest.fn()} tool="draw" />);

    expect(pin().className).toContain(canvasStyles.pinMove);
    expect(pin().className).not.toContain(canvasStyles.pinCrosshair);
  });

  /* Nothing is draggable in a read-only view, so neither cursor claims it is. */
  it('offers no drag cursor when read-only', () => {
    render(
      <AnnotationCanvas imageSrc={PIXEL_PNG} annotations={WITH_COMMENT} onChange={jest.fn()} tool="comment" readOnly />,
    );

    expect(pin().className).not.toContain(canvasStyles.pinMove);
    expect(pin().className).not.toContain(canvasStyles.pinCrosshair);
  });
});

/**
 * Shapes are asserted through `onChange`, never through pixels: jsdom has no 2D
 * context and `jest-canvas-mock` is not installed, so `getContext('2d')` returns
 * null here and every drawing call is a no-op.
 */
describe('AnnotationCanvas shapes', () => {
  const BOUNDS = {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    bottom: 200,
    right: 200,
    width: 200,
    height: 200,
    toJSON: () => ({}),
  };

  beforeEach(() => {
    HTMLCanvasElement.prototype.setPointerCapture = jest.fn();
    HTMLCanvasElement.prototype.releasePointerCapture = jest.fn();
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(BOUNDS);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const dragOn = (
    tool: 'rect' | 'ellipse' | 'arrow',
    from: { x: number; y: number },
    to: { x: number; y: number },
    annotations = EMPTY_ANNOTATIONS,
  ) => {
    const onChange = jest.fn();
    const { container } = render(
      <AnnotationCanvas imageSrc={PIXEL_PNG} annotations={annotations} onChange={onChange} tool={tool} />,
    );
    const canvas = container.querySelector('canvas')!;
    jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(BOUNDS);
    /* The canvas is sized from the image's client box, which jsdom reports as 0.
       Commit falls back to the canvas's own width/height, so state them. */
    Object.defineProperty(canvas, 'width', { value: 200, configurable: true });
    Object.defineProperty(canvas, 'height', { value: 200, configurable: true });

    fireEvent(
      canvas,
      new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: from.x, clientY: from.y }),
    );
    fireEvent(
      canvas,
      new MouseEvent('pointermove', { bubbles: true, cancelable: true, button: 0, clientX: to.x, clientY: to.y }),
    );
    fireEvent(
      canvas,
      new MouseEvent('pointerup', { bubbles: true, cancelable: true, button: 0, clientX: to.x, clientY: to.y }),
    );

    return onChange;
  };

  it('commits a normalized box from a drag', () => {
    const onChange = dragOn('rect', { x: 20, y: 40 }, { x: 100, y: 140 });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        shapes: [
          expect.objectContaining({
            kind: 'rect',
            x: expect.closeTo(0.1),
            y: expect.closeTo(0.2),
            w: expect.closeTo(0.4),
            h: expect.closeTo(0.5),
          }),
        ],
      }),
    );
  });

  it('commits an oval from a drag', () => {
    const onChange = dragOn('ellipse', { x: 20, y: 40 }, { x: 100, y: 140 });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ shapes: [expect.objectContaining({ kind: 'ellipse' })] }),
    );
  });

  /* Dragging up-and-left is the same box as dragging down-and-right. Left
     un-normalized it stores a negative extent, which every later reader — the
     replay, the badge, a future hit test — has to remember to handle. */
  it('normalizes a drag made up and to the left', () => {
    const onChange = dragOn('rect', { x: 100, y: 140 }, { x: 20, y: 40 });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        shapes: [
          expect.objectContaining({
            x: expect.closeTo(0.1),
            y: expect.closeTo(0.2),
            w: expect.closeTo(0.4),
            h: expect.closeTo(0.5),
          }),
        ],
      }),
    );
  });

  it('commits an arrow from a drag', () => {
    const onChange = dragOn('arrow', { x: 20, y: 40 }, { x: 100, y: 140 });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        shapes: [
          expect.objectContaining({
            kind: 'arrow',
            x: expect.closeTo(0.1),
            y: expect.closeTo(0.2),
            w: expect.closeTo(0.4),
            h: expect.closeTo(0.5),
          }),
        ],
      }),
    );
  });

  /**
   * Direction is the entire content of an arrow.
   *
   * Box shapes fold a drag in any direction into the same non-negative box,
   * which is right for them and catastrophic here: normalized, an arrow drawn
   * up-and-left comes back pointing down-and-right, at whatever happens to sit
   * in the opposite corner. Nothing errors — the annotation just points at the
   * wrong thing.
   */
  it('keeps an arrow drawn up and to the left pointing that way', () => {
    const onChange = dragOn('arrow', { x: 100, y: 140 }, { x: 20, y: 40 });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        shapes: [
          expect.objectContaining({
            kind: 'arrow',
            // The tail stays where the drag started...
            x: expect.closeTo(0.5),
            y: expect.closeTo(0.7),
            // ...and the delta stays negative, so the head lands where released.
            w: expect.closeTo(-0.4),
            h: expect.closeTo(-0.5),
          }),
        ],
      }),
    );
  });

  /* Two arrows drawn between the same two points in opposite directions must not
     serialize to the same shape — the check a normalizing arrow would fail. */
  it('distinguishes an arrow from its reverse', () => {
    const forward = dragOn('arrow', { x: 20, y: 40 }, { x: 100, y: 140 });
    const backward = dragOn('arrow', { x: 100, y: 140 }, { x: 20, y: 40 });

    expect(forward.mock.calls[0][0].shapes[0]).not.toEqual(backward.mock.calls[0][0].shapes[0]);
  });

  it('ignores a tap that never became a drag', () => {
    const onChange = dragOn('rect', { x: 50, y: 50 }, { x: 52, y: 51 });

    expect(onChange).not.toHaveBeenCalled();
  });

  /* Strokes and shapes share one canvas. The thing this guards is a second
     clearing pass wiping whatever the first one drew — invisible to jsdom, so
     what is asserted instead is that committing a shape carries the strokes
     through rather than replacing them. */
  it('keeps existing strokes when a shape is added', () => {
    const withStroke = {
      ...EMPTY_ANNOTATIONS,
      strokes: [{ color: '#dc2626', width: 0.006, points: [{ x: 0.1, y: 0.1 }] }],
    };

    const onChange = dragOn('rect', { x: 20, y: 40 }, { x: 100, y: 140 }, withStroke);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ strokes: withStroke.strokes, shapes: [expect.anything()] }),
    );
  });

  it('appends to shapes already on the screenshot', () => {
    const withShape = {
      ...EMPTY_ANNOTATIONS,
      shapes: [{ kind: 'ellipse' as const, color: '#dc2626', width: 0.006, x: 0, y: 0, w: 0.1, h: 0.1 }],
    };

    const onChange = dragOn('rect', { x: 20, y: 40 }, { x: 100, y: 140 }, withShape);

    expect(onChange.mock.calls[0][0].shapes).toHaveLength(2);
  });

  it('draws the shape in the selected color', () => {
    const onChange = jest.fn();
    const { container } = render(
      <AnnotationCanvas
        imageSrc={PIXEL_PNG}
        annotations={EMPTY_ANNOTATIONS}
        onChange={onChange}
        tool="rect"
        strokeColor="#0a9952"
      />,
    );
    const canvas = container.querySelector('canvas')!;
    jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(BOUNDS);
    Object.defineProperty(canvas, 'width', { value: 200, configurable: true });
    Object.defineProperty(canvas, 'height', { value: 200, configurable: true });

    fireEvent(
      canvas,
      new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: 20, clientY: 20 }),
    );
    fireEvent(
      canvas,
      new MouseEvent('pointermove', { bubbles: true, cancelable: true, button: 0, clientX: 120, clientY: 120 }),
    );
    fireEvent(
      canvas,
      new MouseEvent('pointerup', { bubbles: true, cancelable: true, button: 0, clientX: 120, clientY: 120 }),
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ shapes: [expect.objectContaining({ color: '#0a9952' })] }),
    );
  });

  /**
   * A pointerup that never saw a pointermove is a tap, wherever it lands.
   *
   * The drag extent is measured from what the move handler recorded, not from
   * the up event's coordinates — so a press at one corner and a release at
   * another, with no move between, stores nothing.
   */
  it('ignores a press and release with no movement between them', () => {
    const onChange = jest.fn();
    const { container } = render(
      <AnnotationCanvas imageSrc={PIXEL_PNG} annotations={EMPTY_ANNOTATIONS} onChange={onChange} tool="rect" />,
    );
    const canvas = container.querySelector('canvas')!;
    jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(BOUNDS);

    fireEvent(
      canvas,
      new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: 20, clientY: 20 }),
    );
    fireEvent(
      canvas,
      new MouseEvent('pointerup', { bubbles: true, cancelable: true, button: 0, clientX: 120, clientY: 120 }),
    );

    expect(onChange).not.toHaveBeenCalled();
  });
});
