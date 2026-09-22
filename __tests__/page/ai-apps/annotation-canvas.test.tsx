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
        annotations={{ version: 1, strokes: [], comments: [{ id: 'c1', x: 0.5, y: 0.5, text: 'Hi' }] }}
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
        annotations={{ version: 1, strokes: [], comments: [{ id: 'c1', x: 0.5, y: 0.5, text: 'Hi' }] }}
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
        annotations={{ version: 1, strokes: [], comments: [{ id: 'c1', x: 0.5, y: 0.5, text: 'Hi' }] }}
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
