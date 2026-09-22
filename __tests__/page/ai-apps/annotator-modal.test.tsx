import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { AnnotatorModal } from '@/components/page/ai-apps/components/screenshot-feedback/AnnotatorModal';

const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const renderModal = (props: Partial<React.ComponentProps<typeof AnnotatorModal>> = {}) =>
  render(
    <AnnotatorModal
      imageSrc={PIXEL_PNG}
      onDiscard={props.onDiscard ?? jest.fn()}
      onAdd={props.onAdd ?? jest.fn()}
      {...props}
    />,
  );

const tool = (name: string) => screen.getByRole('button', { name });

describe('AnnotatorModal toolbar', () => {
  beforeEach(() => {
    HTMLElement.prototype.setPointerCapture = jest.fn();
    HTMLCanvasElement.prototype.setPointerCapture = jest.fn();
  });

  it('offers a box and an oval beside freehand drawing', () => {
    renderModal();

    expect(tool('Box')).toBeInTheDocument();
    expect(tool('Oval')).toBeInTheDocument();
    expect(tool('Draw')).toBeInTheDocument();
    expect(tool('Comment')).toBeInTheDocument();
  });

  it('opens on the draw tool, as before', () => {
    renderModal();

    expect(tool('Draw')).toHaveAttribute('aria-pressed', 'true');
    expect(tool('Box')).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches to the shape tool that was pressed', () => {
    renderModal();

    fireEvent.click(tool('Box'));

    expect(tool('Box')).toHaveAttribute('aria-pressed', 'true');
    expect(tool('Draw')).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(tool('Oval'));

    expect(tool('Oval')).toHaveAttribute('aria-pressed', 'true');
    expect(tool('Box')).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the shape tools to analytics by name', () => {
    const onToolSelected = jest.fn();
    renderModal({ onToolSelected });

    fireEvent.click(tool('Box'));
    expect(onToolSelected).toHaveBeenCalledWith('rect');

    fireEvent.click(tool('Oval'));
    expect(onToolSelected).toHaveBeenCalledWith('ellipse');
  });

  /**
   * Picking a colour is choosing what the ACTIVE tool draws in.
   *
   * The swatch used to force the draw tool unconditionally, so reaching for a
   * colour while Box was active silently dropped the user back to freehand —
   * the next drag scribbled a line where they had just asked for a box.
   */
  it('keeps the active shape tool when a colour is picked', () => {
    renderModal();

    fireEvent.click(tool('Box'));
    fireEvent.click(tool('Draw in #0a9952'));

    expect(tool('Box')).toHaveAttribute('aria-pressed', 'true');
    expect(tool('Draw')).toHaveAttribute('aria-pressed', 'false');
  });

  /* The comment tool draws nothing, so a colour press there has to mean
     "go back to drawing" for the colour to mean anything at all. */
  it('leaves the comment tool for freehand when a colour is picked', () => {
    renderModal();

    fireEvent.click(tool('Comment'));
    fireEvent.click(tool('Draw in #0a9952'));

    expect(tool('Draw')).toHaveAttribute('aria-pressed', 'true');
    expect(tool('Comment')).toHaveAttribute('aria-pressed', 'false');
  });
});

/**
 * Discarding asks first — but only when there is something to lose.
 *
 * A confirmation that fires on an untouched capture is one people learn to
 * dismiss without reading, and that habit is what loses real work later.
 */
describe('AnnotatorModal discard confirmation', () => {
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
    HTMLElement.prototype.setPointerCapture = jest.fn();
    HTMLElement.prototype.releasePointerCapture = jest.fn();
    HTMLCanvasElement.prototype.setPointerCapture = jest.fn();
    HTMLCanvasElement.prototype.releasePointerCapture = jest.fn();
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(BOUNDS);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** Draws one box, which is the cheapest way to put something in the history. */
  const drawSomething = () => {
    const canvas = document.querySelector('canvas')!;
    jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue(BOUNDS);
    Object.defineProperty(canvas, 'width', { value: 200, configurable: true });
    Object.defineProperty(canvas, 'height', { value: 200, configurable: true });

    fireEvent.click(tool('Box'));
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
  };

  it('discards an untouched capture without asking', () => {
    const onDiscard = jest.fn();
    renderModal({ onDiscard });

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

    expect(onDiscard).toHaveBeenCalled();
    expect(screen.queryByText('Discard screenshot?')).not.toBeInTheDocument();
  });

  it('asks before discarding a capture that has been drawn on', () => {
    const onDiscard = jest.fn();
    renderModal({ onDiscard });

    drawSomething();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

    expect(screen.getByText('Discard screenshot?')).toBeInTheDocument();
    expect(onDiscard).not.toHaveBeenCalled();
  });

  it('throws the work away only once the confirmation is accepted', () => {
    const onDiscard = jest.fn();
    renderModal({ onDiscard });

    drawSomething();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }));

    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it('returns to the editor with the drawing intact when kept', () => {
    const onDiscard = jest.fn();
    renderModal({ onDiscard });

    drawSomething();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));

    expect(onDiscard).not.toHaveBeenCalled();
    expect(screen.queryByText('Discard screenshot?')).not.toBeInTheDocument();
    /* Undo is still live, so the box is still in the history rather than having
       been rolled back along with the dialog. */
    expect(screen.getByRole('button', { name: 'Undo' })).not.toBeDisabled();
  });

  /* The ✕ is the quiet exit. If it skipped the confirmation, the guard would
     only cover the door people already look at twice. */
  it('takes the close button down the same path', () => {
    const onDiscard = jest.fn();
    renderModal({ onDiscard });

    drawSomething();
    fireEvent.click(screen.getByRole('button', { name: 'Discard screenshot' }));

    expect(screen.getByText('Discard screenshot?')).toBeInTheDocument();
    expect(onDiscard).not.toHaveBeenCalled();
  });

  /* Undoing back to the opening state leaves nothing to lose, so the guard
     stands down again rather than asking about an empty change set. */
  it('stops asking once the work has been undone', () => {
    const onDiscard = jest.fn();
    renderModal({ onDiscard });

    drawSomething();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

    expect(onDiscard).toHaveBeenCalled();
  });

  /**
   * The confirmation is portalled to the body rather than nested in the modal.
   *
   * `ConfirmDialog` positions itself `fixed`, which is laid out against the
   * nearest TRANSFORMED ancestor rather than the viewport — and `Modal` animates
   * its container with framer-motion. Left inside, any surviving transform
   * (`scale(1)` counts) would confine the confirmation to the modal's own box.
   */
  it('mounts the confirmation outside the modal container', () => {
    renderModal();

    drawSomething();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));

    const dialog = screen.getByText('Discard screenshot?');
    expect(dialog.closest('[class*="modalContainer"]')).toBeNull();
  });

  it('says the screenshot survives when it is an edit being discarded', () => {
    renderModal({
      initialAnnotations: {
        version: 1,
        strokes: [],
        shapes: [],
        comments: [{ id: 'c1', x: 0.5, y: 0.5, text: 'Existing' }],
      },
    });

    drawSomething();
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));

    expect(screen.getByText('Discard changes?')).toBeInTheDocument();
    expect(screen.getByText(/stays in your feedback/)).toBeInTheDocument();
  });
});
