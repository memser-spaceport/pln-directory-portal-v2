import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';

import { getNewsImageSources, NewsImage } from '@/components/page/home/TeamNews/components/NewsImage';

const frame = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe('NewsImage', () => {
  it('renders the stored URL as a lazy, decorative image', () => {
    const { container } = render(<NewsImage src="https://cdn.example.com/a.jpg" variant="thumb" />);

    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/a.jpg');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('alt', '');
    // No resized copies: the stored URL as is, no srcset (LAB-3135).
    expect(img).not.toHaveAttribute('srcset');
    expect(img).not.toHaveAttribute('sizes');
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

describe('NewsImage srcset (LAB-3135)', () => {
  const srcSet = 'https://s3/n/400.jpg 400w, https://s3/n/800.jpg 800w';

  it.each([
    ['thumb', '(min-width: 640px) 168px, 100vw'],
    ['wide', '(min-width: 640px) 592px, 100vw'],
    ['hero', '(min-width: 640px) 632px, 100vw'],
  ] as const)('gives the %s image a srcset and its sizes', (variant, sizes) => {
    const { container } = render(<NewsImage src="https://s3/n/800.jpg" srcSet={srcSet} variant={variant} />);

    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toHaveAttribute('src', 'https://s3/n/800.jpg');
    expect(img).toHaveAttribute('srcset', srcSet);
    expect(img).toHaveAttribute('sizes', sizes);
  });

  it('keeps the fallback tile when a resized copy fails', () => {
    const { container } = render(<NewsImage src="https://s3/n/800.jpg" srcSet={srcSet} variant="thumb" />);

    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.querySelector('.fallback')).toBeInTheDocument();
  });
});

describe('getNewsImageSources (LAB-3135)', () => {
  const image = {
    width: 1120,
    height: 630,
    variants: [
      { width: 400, url: 'https://s3/n/400.jpg' },
      { width: 800, url: 'https://s3/n/800.jpg' },
      { width: 1120, url: 'https://s3/n/1120.jpg' },
    ],
  };

  it('lists the variants as a srcset and uses the largest as src', () => {
    expect(getNewsImageSources('https://cdn.example.com/og.jpg', image)).toEqual({
      src: 'https://s3/n/1120.jpg',
      srcSet: 'https://s3/n/400.jpg 400w, https://s3/n/800.jpg 800w, https://s3/n/1120.jpg 1120w',
    });
  });

  it('sorts the variants by width', () => {
    const shuffled = { ...image, variants: [image.variants[2], image.variants[0], image.variants[1]] };
    expect(getNewsImageSources(null, shuffled)?.src).toBe('https://s3/n/1120.jpg');
    expect(getNewsImageSources(null, shuffled)?.srcSet).toMatch(/^https:\/\/s3\/n\/400\.jpg 400w/);
  });

  it('falls back to the plain imageUrl when image is null', () => {
    expect(getNewsImageSources('https://cdn.example.com/og.jpg', null)).toEqual({
      src: 'https://cdn.example.com/og.jpg',
    });
    expect(getNewsImageSources('https://cdn.example.com/og.jpg', undefined)).toEqual({
      src: 'https://cdn.example.com/og.jpg',
    });
  });

  it('falls back to imageUrl when image has no usable variants', () => {
    expect(
      getNewsImageSources('https://cdn.example.com/og.jpg', {
        width: 800,
        height: 450,
        variants: [{ width: 0, url: '' }],
      }),
    ).toEqual({ src: 'https://cdn.example.com/og.jpg' });
  });

  it('is null for a text-only story', () => {
    expect(getNewsImageSources(null, null)).toBeNull();
    expect(getNewsImageSources(undefined, undefined)).toBeNull();
  });
});
