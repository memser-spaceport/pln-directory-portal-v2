import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import PlaaMenu from '@/components/page/aligement-assets/plaa-menu';

jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({ onNavMenuClicked: jest.fn() }),
}));

describe('PlaaMenu — Kudos visibility by access level', () => {
  test('shows the Kudos entry for a logged-in PLAA/LabOS user', () => {
    render(<PlaaMenu isLoggedIn />);
    expect(screen.getByRole('button', { name: /kudos/i })).toBeInTheDocument();
  });

  test('hides the Kudos entry entirely for a guest (not logged into LabOS)', () => {
    render(<PlaaMenu isLoggedIn={false} />);
    expect(screen.queryByRole('button', { name: /kudos/i })).not.toBeInTheDocument();
  });

  test('hides the Kudos entry when the login state is not yet known', () => {
    render(<PlaaMenu />);
    expect(screen.queryByRole('button', { name: /kudos/i })).not.toBeInTheDocument();
  });

  test('keeps every other PLAA nav entry visible regardless of login state', () => {
    render(<PlaaMenu isLoggedIn={false} />);
    expect(screen.getByRole('button', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /activities/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /faq/i })).toBeInTheDocument();
  });
});
