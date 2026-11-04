import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { RequestIntroDialog } from '@/components/page/intro-request/RequestIntroDialog';
import { INTRO_REQUEST_RECEIVED_MESSAGE } from '@/services/intro-requests/intro-requests.service';

const createIntroRequest = jest.fn();
const onAskSubmitted = jest.fn();

jest.mock('@/services/intro-requests/intro-requests.service', () => {
  const actual = jest.requireActual('@/services/intro-requests/intro-requests.service');
  return {
    ...actual,
    createIntroRequest: (...args: unknown[]) => createIntroRequest(...args),
  };
});

jest.mock('@/analytics/intro-requests.analytics', () => ({
  useIntroRequestAnalytics: () => ({ onAskSubmitted }),
}));

describe('RequestIntroDialog', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    createIntroRequest.mockReset();
    onAskSubmitted.mockReset();
    onClose.mockReset();
  });

  it('keeps Send off until the text has words', () => {
    render(<RequestIntroDialog type="MEMBER" targetId="member-2" targetName="Ada Lovelace" onClose={onClose} />);

    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Why would you like an intro?'), { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  it('shows the received message and sends ask-submitted after a successful send', async () => {
    createIntroRequest.mockResolvedValue({ uid: 'req-1' });
    render(<RequestIntroDialog type="TEAM" targetId="team-9" targetName="Acme" onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Why would you like an intro?'), {
      target: { value: 'We want to talk about events.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('status')).toHaveTextContent(INTRO_REQUEST_RECEIVED_MESSAGE);
    expect(createIntroRequest).toHaveBeenCalledWith({
      type: 'TEAM',
      targetId: 'team-9',
      text: 'We want to talk about events.',
    });
    expect(onAskSubmitted).toHaveBeenCalledWith('team');
  });

  it('shows the error and keeps the text', async () => {
    const { IntroRequestError } = jest.requireActual('@/services/intro-requests/intro-requests.service');
    createIntroRequest.mockRejectedValue(new IntroRequestError(404, 'Team not found'));
    render(<RequestIntroDialog type="MEMBER" targetId="member-2" targetName="Ada Lovelace" onClose={onClose} />);

    const field = screen.getByLabelText('Why would you like an intro?');
    fireEvent.change(field, { target: { value: 'Please introduce us.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Team not found');
    expect(field).toHaveValue('Please introduce us.');
    await waitFor(() => expect(onAskSubmitted).not.toHaveBeenCalled());
  });
});
