import { useRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { NoteImageChrome } from '@/components/ui/RichTextEditor/NoteImageChrome/NoteImageChrome';

const ENCODED = encodeURIComponent(
  JSON.stringify({
    version: 1,
    strokes: [{ color: '#1b4dff', width: 0.006, points: [{ x: 0.1, y: 0.2 }] }],
    shapes: [],
    comments: [],
  }),
);

function rect(width: number, height: number): DOMRect {
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    width,
    height,
    toJSON: () => ({}),
  } as DOMRect;
}

function Harness(props: {
  annotated?: boolean;
  onAnnotate?: (image: HTMLImageElement) => void;
  onRemove?: (image: HTMLImageElement) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref}>
      <div className="ql-editor">
        <img src="https://cdn.test/a.png" alt="pic" {...(props.annotated ? { 'data-annotations': ENCODED } : {})} />
      </div>
      <NoteImageChrome
        containerRef={ref}
        onAnnotate={props.onAnnotate ?? jest.fn()}
        onRemove={props.onRemove ?? jest.fn()}
      />
    </div>
  );
}

describe('NoteImageChrome', () => {
  beforeEach(() => {
    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0);
      return 1;
    });
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return this.tagName === 'IMG' ? rect(120, 80) : rect(400, 300);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('puts an Annotate button on the image and draws its marks', () => {
    render(<Harness annotated />);

    expect(screen.getByRole('button', { name: 'Annotate image' })).toBeTruthy();
    expect(document.querySelector('canvas')).toBeTruthy();
  });

  it('puts an Annotate button on an image with no marks', () => {
    render(<Harness />);

    expect(screen.getByRole('button', { name: 'Annotate image' })).toBeTruthy();
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('shows the controls after a pasted image finishes loading', () => {
    const image = document.createElement('img');
    let loaded = false;
    Object.defineProperty(image, 'complete', { configurable: true, get: () => loaded });
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.tagName !== 'IMG') return rect(400, 300);
      return this === image && !loaded ? rect(120, 0) : rect(120, 80);
    });

    const ref = { current: document.createElement('div') };
    const editor = document.createElement('div');
    editor.className = 'ql-editor';
    editor.appendChild(image);
    ref.current.appendChild(editor);
    document.body.appendChild(ref.current);

    render(<NoteImageChrome containerRef={ref} onAnnotate={jest.fn()} onRemove={jest.fn()} />);
    expect(screen.queryByRole('button', { name: 'Annotate image' })).toBeNull();

    loaded = true;
    fireEvent.load(image);

    expect(screen.getByRole('button', { name: 'Annotate image' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove image' })).toBeTruthy();
    ref.current.remove();
  });

  it('removes that image', () => {
    const onRemove = jest.fn();
    render(<Harness onRemove={onRemove} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remove image' }));

    expect(onRemove).toHaveBeenCalledWith(expect.any(HTMLImageElement));
  });

  it('opens the annotator for that image', () => {
    const onAnnotate = jest.fn();
    render(<Harness annotated onAnnotate={onAnnotate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Annotate image' }));

    expect(onAnnotate).toHaveBeenCalledWith(expect.any(HTMLImageElement));
    expect(onAnnotate.mock.calls[0][0].getAttribute('src')).toBe('https://cdn.test/a.png');
  });
});
