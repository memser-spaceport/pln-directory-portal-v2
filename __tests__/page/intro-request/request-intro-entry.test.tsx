import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { RequestIntroEntry } from '@/components/page/intro-request/RequestIntroEntry';

const createIntroRequest = jest.fn();
const onButtonShown = jest.fn();
const onDialogOpened = jest.fn();
let canRequest = true;

jest.mock('@/services/intro-requests/hooks/useCanRequestIntro', () => ({
  useCanRequestIntro: () => canRequest,
}));

jest.mock('@/services/intro-requests/intro-requests.service', () => {
  const actual = jest.requireActual('@/services/intro-requests/intro-requests.service');
  return {
    ...actual,
    createIntroRequest: (...args: unknown[]) => createIntroRequest(...args),
  };
});

jest.mock('@/analytics/intro-requests.analytics', () => ({
  useIntroRequestAnalytics: () => ({
    onButtonShown,
    onDialogOpened,
    onAskSubmitted: jest.fn(),
    onSubmitFailed: jest.fn(),
    onDialogClosed: jest.fn(),
  }),
}));

describe('RequestIntroEntry', () => {
  beforeEach(() => {
    canRequest = true;
    onButtonShown.mockReset();
    onDialogOpened.mockReset();
  });

  it('sends intro-request-button-shown once a page view', () => {
    const { rerender } = render(<RequestIntroEntry type="TEAM" targetId="team-1" targetName="Acme" />);
    rerender(<RequestIntroEntry type="TEAM" targetId="team-1" targetName="Acme" className="x" />);

    expect(onButtonShown).toHaveBeenCalledTimes(1);
    expect(onButtonShown).toHaveBeenCalledWith({ targetType: 'team', entryPoint: 'team-header', source: 'modal' });
  });

  it('uses member-header for a member and accepts an explicit entry point', () => {
    render(<RequestIntroEntry type="MEMBER" targetId="m-1" targetName="Ada Lovelace" />);
    expect(onButtonShown).toHaveBeenCalledWith({ targetType: 'member', entryPoint: 'member-header', source: 'modal' });

    render(<RequestIntroEntry type="MEMBER" targetId="m-2" targetName="Grace" entryPoint="suggested-tab" />);
    expect(onButtonShown).toHaveBeenLastCalledWith({
      targetType: 'member',
      entryPoint: 'suggested-tab',
      source: 'modal',
    });
  });

  it('sends intro-request-button-shown once when the page mounts two copies for the same target', () => {
    render(
      <>
        <div data-testid="desktop">
          <RequestIntroEntry type="TEAM" targetId="team-1" targetName="Acme" />
        </div>
        <div data-testid="mobile">
          <RequestIntroEntry type="TEAM" targetId="team-1" targetName="Acme" />
        </div>
      </>,
    );

    expect(screen.getAllByRole('button', { name: 'Request an intro' })).toHaveLength(2);
    expect(onButtonShown).toHaveBeenCalledTimes(1);
    expect(onButtonShown).toHaveBeenCalledWith({ targetType: 'team', entryPoint: 'team-header', source: 'modal' });
  });

  it('sends intro-request-button-shown again on the next page view', () => {
    const first = render(<RequestIntroEntry type="TEAM" targetId="team-1" targetName="Acme" />);
    first.unmount();
    render(<RequestIntroEntry type="TEAM" targetId="team-1" targetName="Acme" />);

    expect(onButtonShown).toHaveBeenCalledTimes(2);
  });

  it('sends one event for each target when the page shows two targets', () => {
    render(
      <>
        <RequestIntroEntry type="TEAM" targetId="team-1" targetName="Acme" />
        <RequestIntroEntry type="TEAM" targetId="team-2" targetName="Beta" />
      </>,
    );

    expect(onButtonShown).toHaveBeenCalledTimes(2);
  });

  it('shows "Intro requested" in every copy after a send in one copy', async () => {
    createIntroRequest.mockResolvedValue({ uid: 'req-1' });
    render(
      <>
        <RequestIntroEntry type="TEAM" targetId="team-1" targetName="Acme" />
        <RequestIntroEntry type="TEAM" targetId="team-1" targetName="Acme" />
      </>,
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Request an intro' })[0]);
    fireEvent.change(screen.getByLabelText('What do you need help with?'), {
      target: { value: 'We want to talk about events.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(screen.getAllByText('Intro requested')).toHaveLength(2));
    expect(screen.queryByRole('button', { name: 'Request an intro' })).not.toBeInTheDocument();
  });

  it('does not send intro-request-button-shown when the control is hidden', () => {
    canRequest = false;
    render(<RequestIntroEntry type="TEAM" targetId="team-1" targetName="Acme" />);
    expect(onButtonShown).not.toHaveBeenCalled();
  });

  it('sends intro-request-dialog-opened on a click on "Request an intro"', () => {
    render(<RequestIntroEntry type="TEAM" targetId="team-1" targetName="Acme" />);
    fireEvent.click(screen.getByRole('button', { name: 'Request an intro' }));

    expect(onDialogOpened).toHaveBeenCalledTimes(1);
    expect(onDialogOpened).toHaveBeenCalledWith({ targetType: 'team', entryPoint: 'team-header', source: 'modal' });
    expect(screen.getByLabelText('What do you need help with?')).toBeInTheDocument();
  });

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
