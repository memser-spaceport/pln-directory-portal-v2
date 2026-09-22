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
