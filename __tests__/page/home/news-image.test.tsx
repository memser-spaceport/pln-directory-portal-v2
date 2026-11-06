import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';

import { NewsImage } from '@/components/page/home/TeamNews/components/NewsImage';

const frame = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe('NewsImage', () => {
  it('renders the stored URL as a lazy, decorative image', () => {
    const { container } = render(<NewsImage src="https://cdn.example.com/a.jpg" variant="thumb" />);

    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/a.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('alt', '');
    // No srcset in phase 1 (LAB-3135 adds resized copies).
    expect(img).not.toHaveAttribute('srcset');
    expect(frame(container)).toHaveClass('frame', 'still', 'thumb');
  });

  it('shows the gradient tile while loading, and drops it once the image has loaded', () => {
    const { container } = render(<NewsImage src="https://cdn.example.com/a.jpg" variant="hero" />);

    expect(frame(container)).toHaveClass('pending', 'hero');
    expect(frame(container)).toHaveAttribute('data-state', 'loading');

    fireEvent.load(container.querySelector('img') as HTMLImageElement);
    expect(frame(container)).not.toHaveClass('pending');
    expect(frame(container)).toHaveAttribute('data-state', 'loaded');
  });

  it('swaps a failed image for the fallback tile, never a broken image', () => {
    const { container } = render(<NewsImage src="https://cdn.example.com/missing.jpg" variant="wide" />);

    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('.fallback')).toBeInTheDocument();
    expect(frame(container)).toHaveClass('pending', 'wide');
    expect(frame(container)).toHaveAttribute('data-state', 'failed');
  });

  it('starts over for a different image', () => {
    const { container, rerender } = render(<NewsImage src="https://cdn.example.com/missing.jpg" variant="hero" />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    rerender(<NewsImage src="https://cdn.example.com/b.jpg" variant="hero" />);

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://cdn.example.com/b.jpg');
    expect(frame(container)).toHaveAttribute('data-state', 'loading');
  });
});
