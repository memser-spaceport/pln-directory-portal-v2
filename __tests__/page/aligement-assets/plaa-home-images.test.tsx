import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';

import PlaaHome from '@/components/page/aligement-assets/home/plaa-home';
import type { PlaaHomeProps } from '@/components/page/aligement-assets/home/home.types';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({ onNavMenuClicked: jest.fn() }),
}));
jest.mock('@/services/plaa/hooks/useIsInfraMember', () => ({ useIsInfraMember: () => false }));

const PUBLIC = join(__dirname, '..', '..', '..', 'public');

const round: PlaaHomeProps['round'] = {
  roundNumber: 20,
  period: '2026-09-01',
  month: 'September',
  year: 2026,
  onboardedParticipants: 66,
  chart: [],
};

function localImages(variant: PlaaHomeProps['variant']) {
  const { container, unmount } = render(<PlaaHome variant={variant} round={round} />);
  const sources = Array.from(container.querySelectorAll('img'), (img) => img.getAttribute('src') ?? '');
  unmount();
  return sources.filter((src) => src.startsWith('/'));
}

describe.each(['prospect', 'member'] as const)('PLAA home page images (%s)', (variant) => {
  const images = localImages(variant);

  it('shows at least one local image', () => {
    expect(images.length).toBeGreaterThan(0);
  });

  it.each(images)('%s exists in public/ and is under 1 MB', (src) => {
    const file = join(PUBLIC, src);
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeLessThan(1024 * 1024);
  });
});
