import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { RequestIntroDialog } from '@/components/page/intro-request/RequestIntroDialog';
import { INTRO_REQUEST_RECEIVED_MESSAGE } from '@/services/intro-requests/intro-requests.service';

const FIELD_LABEL = 'What do you need help with?';
const HELP_TEXT =
  'Be specific. Say what you are looking for (advice, a partnership, business development or fundraising) and why now. This helps us find the right person and make a good intro.';
const SHORT_TEXT = 'Add a bit more detail so we can find the right person.';
const PLACEHOLDER =
  'For example: We are raising a seed round and want advice from someone who has raised from crypto funds.';

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
  const onSent = jest.fn();

  beforeEach(() => {
    createIntroRequest.mockReset();
    onAskSubmitted.mockReset();
    onClose.mockReset();
    onSent.mockReset();
  });

  it('limits the text to 3500 characters so the message fits in Telegram', () => {
    render(<RequestIntroDialog type="TEAM" targetId="team-1" targetName="Acme" onSent={onSent} onClose={onClose} />);

    const field = screen.getByLabelText(FIELD_LABEL);
    expect(field).toHaveAttribute('maxLength', '3500');
    expect(screen.getByText('0/3500')).toBeInTheDocument();

    fireEvent.change(field, { target: { value: 'a'.repeat(3500) } });
    expect(screen.getByText('3500/3500')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });

  it('keeps Send off until the text has 20 characters', () => {
    render(
      <RequestIntroDialog
        type="MEMBER"
        targetId="member-2"
        targetName="Ada Lovelace"
        onSent={onSent}
        onClose={onClose}
      />,
    );

    const field = screen.getByLabelText(FIELD_LABEL);
    expect(field).toHaveAttribute('placeholder', PLACEHOLDER);
    expect(field).toHaveAttribute('aria-describedby', 'request-intro-help');
    expect(screen.getByText(HELP_TEXT)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    fireEvent.change(field, { target: { value: '   ' } });
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.queryByText(SHORT_TEXT)).not.toBeInTheDocument();

    fireEvent.change(field, { target: { value: '1234567890123456789' } });
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(SHORT_TEXT);
    expect(field).toHaveAttribute('aria-describedby', 'request-intro-help request-intro-short');

    fireEvent.change(field, { target: { value: '12345678901234567890' } });
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    expect(screen.queryByText(SHORT_TEXT)).not.toBeInTheDocument();
  });

  it('shows the received message and sends ask-submitted after a successful send', async () => {
    createIntroRequest.mockResolvedValue({ uid: 'req-1' });
    render(<RequestIntroDialog type="TEAM" targetId="team-9" targetName="Acme" onSent={onSent} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(FIELD_LABEL), {
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
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it('shows the error and keeps the text', async () => {
    const { IntroRequestError } = jest.requireActual('@/services/intro-requests/intro-requests.service');
    createIntroRequest.mockRejectedValue(new IntroRequestError(404, 'Team not found'));
    render(
      <RequestIntroDialog
        type="MEMBER"
        targetId="member-2"
        targetName="Ada Lovelace"
        onSent={onSent}
        onClose={onClose}
      />,
    );

    const field = screen.getByLabelText(FIELD_LABEL);
    fireEvent.change(field, { target: { value: 'Please introduce us.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Team not found');
    expect(field).toHaveValue('Please introduce us.');
    await waitFor(() => expect(onAskSubmitted).not.toHaveBeenCalled());
    expect(onSent).not.toHaveBeenCalled();
  });
});
