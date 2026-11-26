import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { RequestIntroDialog } from '@/components/page/intro-request/RequestIntroDialog';
import { INTRO_REQUEST_RECEIVED_MESSAGE, IntroRequestError } from '@/services/intro-requests/intro-requests.service';

const FIELD_LABEL = 'What do you need help with?';
const HELP_TEXT =
  'Be specific. Say what you are looking for (advice, a partnership, business development or fundraising) and why now. This helps us find the right person and make a good intro.';
const SHORT_TEXT = 'Add a bit more detail so we can find the right person.';
const PLACEHOLDER =
  'For example: We are raising a seed round and want advice from someone who has raised from crypto funds.';

const createIntroRequest = jest.fn();
const onAskSubmitted = jest.fn();
const onSubmitFailed = jest.fn();
const onDialogClosed = jest.fn();

jest.mock('@/services/intro-requests/intro-requests.service', () => {
  const actual = jest.requireActual('@/services/intro-requests/intro-requests.service');
  return {
    ...actual,
    createIntroRequest: (...args: unknown[]) => createIntroRequest(...args),
  };
});

jest.mock('@/analytics/intro-requests.analytics', () => ({
  useIntroRequestAnalytics: () => ({ onAskSubmitted, onSubmitFailed, onDialogClosed }),
}));

describe('RequestIntroDialog', () => {
  const onClose = jest.fn();
  const onSent = jest.fn();

  beforeEach(() => {
    createIntroRequest.mockReset();
    onAskSubmitted.mockReset();
    onSubmitFailed.mockReset();
    onDialogClosed.mockReset();
    onClose.mockReset();
    onSent.mockReset();
  });

  it('limits the text to 3500 characters so the message fits in Telegram', () => {
    render(
      <RequestIntroDialog
        type="TEAM"
        targetId="team-1"
        targetName="Acme"
        entryPoint="team-header"
        onSent={onSent}
        onClose={onClose}
      />,
    );

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
        entryPoint="member-header"
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
    render(
      <RequestIntroDialog
        type="TEAM"
        targetId="team-9"
        targetName="Acme"
        entryPoint="team-header"
        onSent={onSent}
        onClose={onClose}
      />,
    );

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
    expect(onAskSubmitted).toHaveBeenCalledWith({
      targetType: 'team',
      entryPoint: 'team-header',
      source: 'modal',
      textLength: 'We want to talk about events.'.length,
    });
    expect(onSubmitFailed).not.toHaveBeenCalled();
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
        entryPoint="member-header"
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
    expect(onSubmitFailed).toHaveBeenCalledWith({
      targetType: 'member',
      entryPoint: 'member-header',
      source: 'modal',
      status: 404,
      textLength: 'Please introduce us.'.length,
    });
  });

  it('sends intro-request-submit-failed with status 403 and no message text', async () => {
    const { IntroRequestError } = jest.requireActual('@/services/intro-requests/intro-requests.service');
    createIntroRequest.mockRejectedValue(new IntroRequestError(403, 'You cannot send an intro request.'));
    render(
      <RequestIntroDialog
        type="TEAM"
        targetId="team-9"
        targetName="Acme"
        entryPoint="team-header"
        onSent={onSent}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByLabelText(FIELD_LABEL), { target: { value: '  We want to talk about events.  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('You cannot send an intro request.');
    expect(onSubmitFailed).toHaveBeenCalledTimes(1);
    const props = onSubmitFailed.mock.calls[0][0];
    expect(props).toEqual({
      targetType: 'team',
      entryPoint: 'team-header',
      source: 'modal',
      status: 403,
      textLength: 'We want to talk about events.'.length,
    });
    expect(JSON.stringify(props)).not.toContain('events');
    expect(onAskSubmitted).not.toHaveBeenCalled();
  });

  it('sends status 0 when the request fails with no HTTP status', async () => {
    createIntroRequest.mockRejectedValue(new Error('network'));
    render(
      <RequestIntroDialog
        type="TEAM"
        targetId="team-9"
        targetName="Acme"
        entryPoint="suggested-tab"
        onSent={onSent}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByLabelText(FIELD_LABEL), { target: { value: 'We want to talk about events.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await screen.findByRole('alert');
    expect(onSubmitFailed).toHaveBeenCalledWith(expect.objectContaining({ status: 0, entryPoint: 'suggested-tab' }));
  });

  it('sends intro-request-dialog-closed with hadText and textLength on Cancel', () => {
    render(
      <RequestIntroDialog
        type="TEAM"
        targetId="team-9"
        targetName="Acme"
        entryPoint="team-header"
        onSent={onSent}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByLabelText(FIELD_LABEL), { target: { value: ' Hello there ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onDialogClosed).toHaveBeenCalledWith({
      targetType: 'team',
      entryPoint: 'team-header',
      source: 'modal',
      hadText: true,
      textLength: 'Hello there'.length,
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sends intro-request-dialog-closed with hadText false on the X button', () => {
    render(
      <RequestIntroDialog
        type="MEMBER"
        targetId="member-2"
        targetName="Ada Lovelace"
        entryPoint="member-header"
        onSent={onSent}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onDialogClosed).toHaveBeenCalledWith({
      targetType: 'member',
      entryPoint: 'member-header',
      source: 'modal',
      hadText: false,
      textLength: 0,
    });
  });

  it('does not send intro-request-dialog-closed when the dialog closes after a send', async () => {
    createIntroRequest.mockResolvedValue({ uid: 'req-1' });
    render(
      <RequestIntroDialog
        type="TEAM"
        targetId="team-9"
        targetName="Acme"
        entryPoint="team-header"
        onSent={onSent}
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByLabelText(FIELD_LABEL), { target: { value: 'We want to talk about events.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByRole('status');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onDialogClosed).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('LAB-3457: a 409 DRAFT_CLOSED sent (the same text went from an agent card) shows the request as received', async () => {
    createIntroRequest.mockRejectedValue(new IntroRequestError(409, 'This draft is closed.', 'DRAFT_CLOSED', 'sent'));
    render(
      <RequestIntroDialog
        type="MEMBER"
        targetId="member-2"
        targetName="Ada Lovelace"
        entryPoint="member-header"
        onSent={onSent}
        onClose={onClose}
      />,
    );
    fireEvent.change(screen.getByLabelText(FIELD_LABEL), {
      target: { value: 'I lead fundraising at Acme and want advice on a seed round.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('status')).toHaveTextContent(INTRO_REQUEST_RECEIVED_MESSAGE);
    expect(onSent).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('This draft is closed.')).not.toBeInTheDocument();
    // Nothing new was sent, and nothing failed.
    expect(onAskSubmitted).not.toHaveBeenCalled();
    expect(onSubmitFailed).not.toHaveBeenCalled();
  });

  it('LAB-3457: any other 409 stays an error', async () => {
    createIntroRequest.mockRejectedValue(
      new IntroRequestError(409, 'This draft is closed.', 'DRAFT_CLOSED', 'cancelled'),
    );
    render(
      <RequestIntroDialog
        type="MEMBER"
        targetId="member-2"
        targetName="Ada Lovelace"
        entryPoint="member-header"
        onSent={onSent}
        onClose={onClose}
      />,
    );
    fireEvent.change(screen.getByLabelText(FIELD_LABEL), {
      target: { value: 'I lead fundraising at Acme and want advice on a seed round.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('This draft is closed.')).toBeInTheDocument();
    expect(onSent).not.toHaveBeenCalled();
  });
});
