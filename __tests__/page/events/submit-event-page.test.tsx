import React, { useImperativeHandle } from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import type { EventFormHandle, EventFormProps } from '@/components/page/events/event-form/EventForm';
import { defaultEventFormValues } from '@/services/events/event-form';
import { EventRequestError } from '@/services/events/event-submission.service';
import type { EventFormValues } from '@/services/events/event-submission.types';

/* `/events/submit`: both variants, the send flow with every outcome, Clear form and Preview. */

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const goToLogin = jest.fn();
jest.mock('@/components/core/login/utils/loginRedirect', () => ({ useLoginRedirect: () => goToLogin }));

const toast = { success: jest.fn(), error: jest.fn() };
jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: (text: string) => toast.success(text), error: (text: string) => toast.error(text) },
}));

const analytics = {
  onEventsSubmitFormOpened: jest.fn(),
  onEventsSubmitFormSubmitted: jest.fn(),
  onEventsSubmitFormFailed: jest.fn(),
};
jest.mock('@/analytics/events.analytics', () => ({ useEventsAnalytics: () => analytics }));

const mutateAsync = jest.fn();
jest.mock('@/services/events/hooks/useEventSubmission', () => ({ useSubmitEvent: () => ({ mutateAsync }) }));

const uploadEventLogo = jest.fn();
jest.mock('@/services/events/event-submission.service', () => ({
  ...jest.requireActual('@/services/events/event-submission.service'),
  uploadEventLogo: (file: File) => uploadEventLogo(file),
}));

// The form itself has its own tests. This stand-in holds the values a test gives it and runs like the real one:
// one send at a time, `busy` while it runs.
let typed: EventFormValues;
const resets: EventFormValues[] = [];
jest.mock('@/components/page/events/event-form/EventForm', () => ({
  EventForm: function FakeEventForm({ ref, onSend, renderActions, signedIn }: EventFormProps) {
    const [busy, setBusy] = React.useState(false);
    const running = React.useRef(false);
    useImperativeHandle(
      ref,
      (): EventFormHandle => ({
        run: async (mode) => {
          if (running.current) return;
          running.current = true;
          setBusy(true);
          try {
            await onSend(typed, mode);
          } finally {
            running.current = false;
            setBusy(false);
          }
        },
        getValues: () => typed,
        reset: (values) => {
          resets.push(values);
        },
      }),
    );
    return (
      <div data-testid="event-form" data-signed-in={String(signedIn)}>
        {renderActions({ busy })}
      </div>
    );
  },
}));

import { SubmitEventPage } from '@/components/page/events/event-submit/SubmitEventPage';

const values = (over: Partial<EventFormValues> = {}): EventFormValues => ({
  ...defaultEventFormValues('Europe/Lisbon'),
  name: 'Lisbon Meetup',
  startDay: '2030-01-28',
  startTime: '09:00',
  endDay: '2030-01-28',
  endTime: '18:00',
  hostName: 'Protocol Labs',
  ...over,
});

const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }));

beforeEach(() => {
  jest.clearAllMocks();
  resets.length = 0;
  typed = values();
});

describe('variants', () => {
  it('shows a member "Save as draft" and "Submit Event", and no sign-in line', () => {
    render(<SubmitEventPage signedIn />);
    expect(screen.getByRole('heading', { name: 'Submit Event' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save as draft' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit Event' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign in' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Back to events' })).toHaveAttribute('href', '/events/all');
    expect(analytics.onEventsSubmitFormOpened).toHaveBeenCalledTimes(1);
  });

  it('shows a signed-out visitor "Sign in" and "Submit Event" only', () => {
    render(<SubmitEventPage signedIn={false} />);
    expect(screen.queryByRole('button', { name: 'Save as draft' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Submit Event' })).toBeInTheDocument();
    press('Sign in');
    expect(goToLogin).toHaveBeenCalled();
  });
});

describe('send flow', () => {
  it('sends one request, says "Event Created Successfully" and opens the edit page', async () => {
    mutateAsync.mockResolvedValue({ uid: 'e 1', status: 'APPROVED' });
    render(<SubmitEventPage signedIn />);
    press('Submit Event');
    await waitFor(() => expect(push).toHaveBeenCalledWith('/events/edit/e%201'));
    expect(mutateAsync).toHaveBeenCalledTimes(1);
    const { body, withAuth } = mutateAsync.mock.calls[0][0];
    expect(withAuth).toBe(true);
    expect(body).toMatchObject({ name: 'Lisbon Meetup', startDate: '2030-01-28T09:00:00.000Z', logoUid: null });
    expect(body).not.toHaveProperty('draft');
    expect(body).not.toHaveProperty('contactEmail');
    expect(toast.success).toHaveBeenCalledWith('Event Created Successfully');
    expect(analytics.onEventsSubmitFormSubmitted).toHaveBeenCalledWith({ result: 'approved', signedIn: true });
  });

  it('reports a held submission as submitted', async () => {
    mutateAsync.mockResolvedValue({ uid: 'e2', status: 'PENDING' });
    render(<SubmitEventPage signedIn />);
    press('Submit Event');
    await waitFor(() => expect(push).toHaveBeenCalledWith('/events/edit/e2'));
    expect(analytics.onEventsSubmitFormSubmitted).toHaveBeenCalledWith({ result: 'submitted', signedIn: true });
  });

  it('saves a draft, says "Draft Event Created Successfully" and opens the edit page', async () => {
    mutateAsync.mockResolvedValue({ uid: 'e3', status: 'DRAFT' });
    render(<SubmitEventPage signedIn />);
    press('Save as draft');
    await waitFor(() => expect(push).toHaveBeenCalledWith('/events/edit/e3'));
    expect(mutateAsync.mock.calls[0][0].body.draft).toBe(true);
    expect(toast.success).toHaveBeenCalledWith('Draft Event Created Successfully');
    expect(analytics.onEventsSubmitFormSubmitted).toHaveBeenCalledWith({ result: 'draft', signedIn: true });
  });

  it('uploads the logo when the form is sent and sends its id', async () => {
    const file = new File(['x'], 'logo.png', { type: 'image/png' });
    typed = values({ logo: { kind: 'file', file, previewUrl: 'blob:x' } });
    uploadEventLogo.mockResolvedValue('img-1');
    mutateAsync.mockResolvedValue({ uid: 'e4', status: 'APPROVED' });
    render(<SubmitEventPage signedIn />);
    expect(uploadEventLogo).not.toHaveBeenCalled();
    press('Submit Event');
    await waitFor(() => expect(mutateAsync).toHaveBeenCalled());
    expect(uploadEventLogo).toHaveBeenCalledWith(file);
    expect(mutateAsync.mock.calls[0][0].body.logoUid).toBe('img-1');
  });

  it('shows a signed-out visitor that the event was received, with "Submit another event"', async () => {
    typed = values({ contactEmail: ' ann@example.com ' });
    mutateAsync.mockResolvedValue({ uid: 'e5', status: 'PENDING' });
    render(<SubmitEventPage signedIn={false} />);
    press('Submit Event');
    expect(await screen.findByText('We received your event')).toBeInTheDocument();
    expect(screen.getByText(/waits for approval/)).toBeInTheDocument();
    expect(screen.queryByTestId('event-form')).toBeNull();
    const { body, withAuth } = mutateAsync.mock.calls[0][0];
    expect(withAuth).toBe(false);
    expect(body.contactEmail).toBe('ann@example.com');
    expect(push).not.toHaveBeenCalled();
    expect(analytics.onEventsSubmitFormSubmitted).toHaveBeenCalledWith({ result: 'submitted', signedIn: false });
    press('Submit another event');
    expect(screen.getByTestId('event-form')).toBeInTheDocument();
  });

  it('keeps the form and says "Something went wrong please try again." when the request fails', async () => {
    mutateAsync.mockRejectedValue(new EventRequestError(500, 'boom'));
    render(<SubmitEventPage signedIn />);
    press('Submit Event');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong please try again.'));
    expect(screen.getByTestId('event-form')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(analytics.onEventsSubmitFormFailed).toHaveBeenCalledWith({ status: 500 });
  });

  it('keeps the form and sends nothing when the logo upload fails', async () => {
    typed = values({ logo: { kind: 'file', file: new File(['x'], 'l.png'), previewUrl: 'blob:x' } });
    uploadEventLogo.mockRejectedValue(new EventRequestError(500, 'upload'));
    render(<SubmitEventPage signedIn />);
    press('Submit Event');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong please try again.'));
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('says to try again later for too many submissions', async () => {
    typed = values({ contactEmail: 'ann@example.com' });
    mutateAsync.mockRejectedValue(new EventRequestError(429, 'Too Many Requests'));
    render(<SubmitEventPage signedIn={false} />);
    press('Submit Event');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Too many submissions. Please try again later.'));
    expect(screen.getByTestId('event-form')).toBeInTheDocument();
    expect(analytics.onEventsSubmitFormFailed).toHaveBeenCalledWith({ status: 429 });
  });

  it('sends one request for a double press and disables the buttons while it runs', async () => {
    let finish: (value: unknown) => void = () => {};
    mutateAsync.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<SubmitEventPage signedIn />);
    press('Submit Event');
    press('Submit Event');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Submit Event' })).toBeDisabled());
    expect(screen.getByRole('button', { name: 'Save as draft' })).toBeDisabled();
    await act(async () => {
      finish({ uid: 'e6', status: 'APPROVED' });
    });
    expect(mutateAsync).toHaveBeenCalledTimes(1);
  });
});

describe('Clear form and Preview', () => {
  it('asks before clearing; "Cancel" leaves the form as it is', () => {
    render(<SubmitEventPage signedIn />);
    press('Clear form');
    expect(screen.getByText('Are you sure you want to clear this form?')).toBeInTheDocument();
    expect(
      screen.getByText("Clicking confirm will remove all information you've entered in the event submission form"),
    ).toBeInTheDocument();
    press('Cancel');
    expect(resets).toHaveLength(0);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('resets every field on confirm, says so, and sends nothing', () => {
    render(<SubmitEventPage signedIn />);
    press('Clear form');
    press('Confirm');
    expect(resets).toHaveLength(1);
    expect(resets[0]).toMatchObject({ name: '', tags: ['Talks & Presentation'], hostName: '' });
    expect(toast.success).toHaveBeenCalledWith('Form has been cleared successfully');
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('previews a half-filled form and "Back" returns to it', async () => {
    typed = values({ hostName: '', tags: [] });
    render(<SubmitEventPage signedIn />);
    press('Preview');
    expect(await screen.findByRole('heading', { name: 'Lisbon Meetup' })).toBeInTheDocument();
    expect(screen.getByText('28th Jan 2030, 09:00 - 28th Jan 2030, 18:00 (UTC +0:00)')).toBeInTheDocument();
    press('Back');
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Lisbon Meetup' })).toBeNull());
    expect(screen.getByTestId('event-form')).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });
});
