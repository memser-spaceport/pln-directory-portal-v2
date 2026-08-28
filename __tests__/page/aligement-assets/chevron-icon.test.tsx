import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import ChevronIcon from '@/components/page/aligement-assets/profile/chevron-icon';

describe('ChevronIcon', () => {
  it('defaults to vertical: points down, rotates to up (180°) when expanded', () => {
    const { container, rerender } = render(<ChevronIcon expanded={false} />);
    const path = container.querySelector('path');
    expect(path?.getAttribute('d')).toBe('M6 9l6 6 6-6');
    expect(container.querySelector('svg')?.getAttribute('style')).not.toContain('rotate(180deg)');

    rerender(<ChevronIcon expanded={true} />);
    expect(container.querySelector('svg')?.getAttribute('style')).toContain('rotate(180deg)');
  });

  it('horizontal variant points right, rotates to left (180°) when expanded', () => {
    const { container, rerender } = render(<ChevronIcon expanded={false} direction="horizontal" />);
    const path = container.querySelector('path');
    expect(path?.getAttribute('d')).toBe('M9 6l6 6-6 6');

    rerender(<ChevronIcon expanded={true} direction="horizontal" />);
    expect(container.querySelector('svg')?.getAttribute('style')).toContain('rotate(180deg)');
  });
});
