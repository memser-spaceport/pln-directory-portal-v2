import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { AnnotationCanvas } from '@/components/page/ai-apps/components/screenshot-feedback/AnnotationCanvas';
import { AnnotatorModal } from '@/components/page/ai-apps/components/screenshot-feedback/AnnotatorModal';
import { AnnotatedPreview } from '@/components/page/ai-apps/components/screenshot-feedback/AnnotatedPreview';
import { ShortcutHelp } from '@/components/page/ai-apps/components/GiveAiAppFeedbackDialog/GiveAiAppFeedbackDialog';
import {
  EMPTY_ANNOTATIONS,
  hasAnyAnnotation,
  parseAnnotations,
  serializeAnnotations,
  type AnnotationState,
  type TextLabel,
} from '@/components/page/ai-apps/components/screenshot-feedback/types';

const PIXEL_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

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

const LABEL: TextLabel = { id: 'l-1', x: 0.25, y: 0.5, text: 'Wrong total', color: '#dc2626', size: 24, bold: true };

const withLabel = (label: TextLabel = LABEL): AnnotationState => ({ ...EMPTY_ANNOTATIONS, labels: [label] });

const pointer = (target: Element, type: string, clientX: number, clientY: number) =>
  fireEvent(target, new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX, clientY }));

const clickCanvas = (clientX = 40, clientY = 60) => {
  const canvas = document.querySelector('canvas')!;
  pointer(canvas, 'pointerdown', clientX, clientY);
  pointer(canvas, 'pointerup', clientX, clientY);
};

const labelElement = (text: string) => screen.getByText(text).parentElement!;

/** Lets the field finish taking the focus, as it has long before anyone leaves it. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

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

describe('AnnotationCanvas text labels', () => {
  it('places a bold label in the chosen color where the picture is clicked, ready to type', async () => {
    const onChange = jest.fn();
    render(
      <AnnotationCanvas
        imageSrc={PIXEL_PNG}
        annotations={EMPTY_ANNOTATIONS}
        onChange={onChange}
        tool="text"
        strokeColor="#1b4dff"
      />,
    );

    clickCanvas(40, 60);
    await settle();
    const field = screen.getByRole('textbox', { name: 'Label text' });
    expect(field).toHaveFocus();

    fireEvent.change(field, { target: { value: 'Wrong total\nshould be 42' } });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.blur(field);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        comments: [],
        labels: [
          expect.objectContaining({
            text: 'Wrong total\nshould be 42',
            x: 0.2,
            y: 0.3,
            color: '#1b4dff',
            bold: true,
          }),
        ],
      }),
    );
  });

  it('drops a label left empty', () => {
    const onChange = jest.fn();
    render(<AnnotationCanvas imageSrc={PIXEL_PNG} annotations={EMPTY_ANNOTATIONS} onChange={onChange} tool="text" />);

    clickCanvas();
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'Label text' }), { key: 'Escape' });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox', { name: 'Label text' })).not.toBeInTheDocument();
  });

  it('keeps the text on ⌘↩ / Ctrl+Enter and leaves the field', () => {
    const onChange = jest.fn();
    render(<AnnotationCanvas imageSrc={PIXEL_PNG} annotations={EMPTY_ANNOTATIONS} onChange={onChange} tool="text" />);

    clickCanvas();
    const field = screen.getByRole('textbox', { name: 'Label text' });
    fireEvent.change(field, { target: { value: 'Typo' } });
    fireEvent.keyDown(field, { key: 'Enter', ctrlKey: true });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ labels: [expect.objectContaining({ text: 'Typo' })] }),
    );
    expect(screen.queryByRole('textbox', { name: 'Label text' })).not.toBeInTheDocument();
  });

  it('reopens a label for typing on double-click', async () => {
    const onChange = jest.fn();
    render(<AnnotationCanvas imageSrc={PIXEL_PNG} annotations={withLabel()} onChange={onChange} tool="draw" />);

    fireEvent.doubleClick(labelElement('Wrong total'));
    await settle();
    const field = screen.getByRole('textbox', { name: 'Label text' });
    expect(field).toHaveValue('Wrong total');

    fireEvent.change(field, { target: { value: 'Right total' } });
    fireEvent.blur(field);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ labels: [expect.objectContaining({ id: 'l-1', text: 'Right total' })] }),
    );
  });

  it('removes a label whose text is cleared', async () => {
    const onChange = jest.fn();
    render(<AnnotationCanvas imageSrc={PIXEL_PNG} annotations={withLabel()} onChange={onChange} tool="draw" />);

    fireEvent.doubleClick(labelElement('Wrong total'));
    await settle();
    const field = screen.getByRole('textbox', { name: 'Label text' });
    fireEvent.change(field, { target: { value: '  ' } });
    fireEvent.blur(field);

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ labels: [] }));
  });

  it('moves a label by dragging it', () => {
    const onChange = jest.fn();
    render(<AnnotationCanvas imageSrc={PIXEL_PNG} annotations={withLabel()} onChange={onChange} tool="draw" />);

    const label = labelElement('Wrong total');
    pointer(label, 'pointerdown', 50, 100);
    pointer(label, 'pointermove', 90, 120);
    pointer(label, 'pointerup', 90, 120);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ labels: [expect.objectContaining({ x: 0.45, y: 0.6, text: 'Wrong total' })] }),
    );
  });

  it('sets the wrap width from the corner handle', () => {
    const onChange = jest.fn();
    const { container } = render(
      <AnnotationCanvas imageSrc={PIXEL_PNG} annotations={withLabel()} onChange={onChange} tool="draw" />,
    );

    const label = labelElement('Wrong total');
    pointer(label, 'pointerdown', 50, 100);
    pointer(label, 'pointerup', 50, 100);
    const grip = container.querySelector('[class*="labelGrip"]')!;
    label.getBoundingClientRect = () => ({ ...BOUNDS, width: 60 });
    pointer(grip, 'pointerdown', 110, 110);
    pointer(grip, 'pointermove', 90, 110);
    pointer(grip, 'pointerup', 90, 110);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ labels: [expect.objectContaining({ width: 0.2, text: 'Wrong total' })] }),
    );
  });

  it('sets the size in pixels of the saved image, typed or picked', () => {
    const onChange = jest.fn();
    render(<AnnotationCanvas imageSrc={PIXEL_PNG} annotations={withLabel()} onChange={onChange} tool="draw" />);

    const label = labelElement('Wrong total');
    pointer(label, 'pointerdown', 50, 100);
    pointer(label, 'pointerup', 50, 100);

    fireEvent.change(screen.getByRole('combobox', { name: 'Text size presets' }), { target: { value: '64' } });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ labels: [expect.objectContaining({ size: 64 })] }),
    );

    const sizeField = screen.getByRole('spinbutton', { name: 'Text size in pixels' });
    fireEvent.change(sizeField, { target: { value: '1000' } });
    fireEvent.blur(sizeField);
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ labels: [expect.objectContaining({ size: 400 })] }),
    );
  });

  it('shows labels on a read-only canvas without the editing controls', () => {
    render(<AnnotationCanvas imageSrc={PIXEL_PNG} annotations={withLabel()} readOnly />);

    expect(screen.getByText('Wrong total')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete label' })).not.toBeInTheDocument();
  });
});

describe('AnnotatorModal with text labels', () => {
  const renderModal = (props: Partial<React.ComponentProps<typeof AnnotatorModal>> = {}) =>
    render(<AnnotatorModal imageSrc={PIXEL_PNG} onDiscard={jest.fn()} onAdd={jest.fn()} {...props} />);

  it('shows the tools as named icons with their shortcut in a tooltip', () => {
    renderModal();

    for (const [name, letter] of [
      ['Draw', 'P'],
      ['Box', 'R'],
      ['Oval', 'O'],
      ['Arrow', 'A'],
      ['Text', 'T'],
    ]) {
      const button = screen.getByRole('button', { name });
      expect(button).toHaveAttribute('data-tip', `${name} (${letter})`);
      expect(button).toHaveAttribute('aria-keyshortcuts', letter);
      expect(button).not.toHaveTextContent(name);
    }
  });

  it('picks the text tool with T', () => {
    const onToolSelected = jest.fn();
    renderModal({ onToolSelected });

    fireEvent.keyDown(document, { key: 't' });

    expect(screen.getByRole('button', { name: 'Text' })).toHaveAttribute('aria-pressed', 'true');
    expect(onToolSelected).toHaveBeenCalledWith('text');
  });

  it('steps Esc out of a label one level at a time before discarding', () => {
    const onDiscard = jest.fn();
    const onAdd = jest.fn();
    renderModal({ onDiscard, onAdd, initialAnnotations: EMPTY_ANNOTATIONS });

    fireEvent.click(screen.getByRole('button', { name: 'Text' }));
    clickCanvas();
    const field = screen.getByRole('textbox', { name: 'Label text' });
    fireEvent.change(field, { target: { value: 'Note' } });

    fireEvent.keyDown(field, { key: 'Escape' });
    expect(screen.queryByRole('textbox', { name: 'Label text' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete label' })).toBeInTheDocument();
    expect(onDiscard).not.toHaveBeenCalled();

    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.queryByRole('button', { name: 'Delete label' })).not.toBeInTheDocument();
    expect(onDiscard).not.toHaveBeenCalled();
    expect(screen.getByText('Note')).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: 'Escape' });
    expect(screen.getByRole('button', { name: 'Yes, discard' })).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('leaves a label on ⌘↩ without adding the screenshot', () => {
    const onAdd = jest.fn();
    renderModal({ onAdd });

    fireEvent.click(screen.getByRole('button', { name: 'Text' }));
    clickCanvas();
    const field = screen.getByRole('textbox', { name: 'Label text' });
    fireEvent.change(field, { target: { value: 'Note' } });
    fireEvent.keyDown(field, { key: 'Enter', metaKey: true });

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox', { name: 'Label text' })).not.toBeInTheDocument();
    expect(screen.getByText('Note')).toBeInTheDocument();
  });

  it('adds the label with the screenshot, kept apart from the picture', async () => {
    const onAdd = jest.fn();
    renderModal({ onAdd });

    fireEvent.click(screen.getByRole('button', { name: 'Text' }));
    clickCanvas();
    await settle();
    const field = screen.getByRole('textbox', { name: 'Label text' });
    fireEvent.change(field, { target: { value: 'Note' } });
    fireEvent.blur(field);
    fireEvent.click(screen.getByRole('button', { name: /Add to feedback/ }));

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ labels: [expect.objectContaining({ text: 'Note' })] }),
    );
  });
});

describe('text labels after Annotate closes', () => {
  it('round-trips through the stored attribute and counts as an annotation', () => {
    const parsed = parseAnnotations(serializeAnnotations(withLabel()));

    expect(parsed?.labels).toEqual([LABEL]);
    expect(hasAnyAnnotation(parsed)).toBe(true);
  });

  it('draws the label on the preview', () => {
    render(<AnnotatedPreview src={PIXEL_PNG} alt="Screenshot" annotations={withLabel()} />);

    expect(screen.getByText('Wrong total')).toBeInTheDocument();
  });
});

describe('ShortcutHelp', () => {
  it('lists the text tool and the label keys', () => {
    render(
      <ShortcutHelp
        isOpen
        onClose={jest.fn()}
        shortcuts={{
          mod: 'Ctrl',
          enter: 'Enter',
          open: 'Alt+F',
          openAlt: 'Ctrl+Alt+Enter',
          sendAria: 'Control+Enter',
          openAria: 'Alt+F Control+Alt+Enter',
          undoAria: 'Control+Z',
          redoAria: 'Shift+Control+Z Control+Y',
          send: 'Ctrl+Enter',
          screenshot: 'Ctrl+Shift+S',
          undo: 'Ctrl+Z',
          redo: 'Ctrl+Shift+Z',
          redoAlt: 'Ctrl+Y',
          prevField: 'Shift+Tab',
          screenshotAria: 'Control+Shift+S',
        }}
      />,
    );

    const row = (label: string) => screen.getByText(label).closest('li')!;
    expect(row('Text')).toHaveTextContent('T');
    expect(row('New line in a label')).toHaveTextContent('Enter');
    expect(row('Leave a label, keeping the text')).toHaveTextContent('Ctrl+Enter');
    expect(row('Leave a label, then deselect it, before discarding')).toHaveTextContent('Esc');
  });
});
