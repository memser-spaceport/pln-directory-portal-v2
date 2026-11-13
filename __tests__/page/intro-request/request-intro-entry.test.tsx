import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { RequestIntroEntry } from '@/components/page/intro-request/RequestIntroEntry';

const createIntroRequest = jest.fn();

jest.mock('@/services/intro-requests/hooks/useCanRequestIntro', () => ({
  useCanRequestIntro: () => true,
}));

jest.mock('@/services/intro-requests/intro-requests.service', () => {
  const actual = jest.requireActual('@/services/intro-requests/intro-requests.service');
  return {
    ...actual,
    createIntroRequest: (...args: unknown[]) => createIntroRequest(...args),
  };
});

jest.mock('@/analytics/intro-requests.analytics', () => ({
  useIntroRequestAnalytics: () => ({ onAskSubmitted: jest.fn() }),
}));

describe('RequestIntroEntry', () => {
  it('becomes "✓ Intro requested" after a successful send', async () => {
    createIntroRequest.mockResolvedValue({ uid: 'req-1' });
    render(<RequestIntroEntry type="TEAM" targetId="team-1" targetName="Acme" />);

    fireEvent.click(screen.getByRole('button', { name: 'Request an intro' }));
    fireEvent.change(screen.getByLabelText('What do you need help with?'), {
      target: { value: 'We want to talk about events.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Intro requested')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Request an intro' })).not.toBeInTheDocument();
  });
});
