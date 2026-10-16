import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import ChevronIcon from '@/components/page/aligement-assets/profile/chevron-icon';

const isRotated = (container: HTMLElement) =>
  (container.querySelector('svg')?.getAttribute('style') ?? '').includes('rotate(180deg)');

describe('ChevronIcon', () => {
  it.each([['vertical' as const], ['horizontal' as const]])('%s: rotates only when expanded', (direction) => {
    const { container, rerender } = render(<ChevronIcon expanded={false} direction={direction} />);
    expect(isRotated(container)).toBe(false);

    rerender(<ChevronIcon expanded direction={direction} />);
    expect(isRotated(container)).toBe(true);
  });

  it('draws a different shape for each direction', () => {
    const shape = (direction: 'vertical' | 'horizontal') =>
      render(<ChevronIcon expanded={false} direction={direction} />)
        .container.querySelector('path')
        ?.getAttribute('d');

    expect(shape('vertical')).not.toEqual(shape('horizontal'));
  });
});
