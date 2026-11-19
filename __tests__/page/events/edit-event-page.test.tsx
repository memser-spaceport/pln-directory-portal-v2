import React, { useImperativeHandle } from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { eventResponse } from '@/components/page/events/EventDrawer/EventDrawer.fixtures';
import type { EventFormHandle, EventFormProps } from '@/components/page/events/event-form/EventForm';
import type { EventEditResponse } from '@/services/events/event-form-view';
import { EventRequestError } from '@/services/events/event-submission.service';
import type { EventFormValues, EventStatus } from '@/services/events/event-submission.types';

/* `/events/edit/<uid>`: who may open it, the read-only view with the status, the save flow and Delete Event. */

const push = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

const goToLogin = jest.fn();
jest.mock('@/components/core/login/utils/loginRedirect', () => ({ useLoginRedirect: () => goToLogin }));

const toast = { success: jest.fn(), error: jest.fn() };
jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: (text: string) => toast.success(text), error: (text: string) => toast.error(text) },
}));

const analytics = { onEventsEventEdited: jest.fn(), onEventsEventDeleted: jest.fn() };
jest.mock('@/analytics/events.analytics', () => ({ useEventsAnalytics: () => analytics }));

const eventQuery = {
  data: null as EventEditResponse | null | undefined,
  isLoading: false,
  isError: false,
  refetch: jest.fn(async () => undefined),
};
const mine = { data: [] as { uid: string }[] | undefined, isLoading: false, isError: false };
const update = { mutateAsync: jest.fn() };
const remove = { mutateAsync: jest.fn(), isPending: false };
const queried: { uid: string; mineEnabled: boolean } = { uid: '', mineEnabled: false };
jest.mock('@/services/events/hooks/useEventSubmission', () => ({
  useEventForEdit: (uid: string) => {
    queried.uid = uid;
    return eventQuery;
  },
  useMyEvents: (enabled: boolean) => {
    queried.mineEnabled = enabled;
    return mine;
  },
  useUpdateEvent: () => update,
  useDeleteEvent: () => remove,
}));

// The form itself has its own tests. This stand-in takes the page's initial values, lets a test change them, and
// can fail its checks the way the real form does: nothing is sent and `onInvalid` is told.
let edited: Partial<EventFormValues> = {};
let checksFail = false;
const initial: { values: EventFormValues | null; variant: string } = { values: null, variant: '' };
const resets: EventFormValues[] = [];
jest.mock('@/components/page/events/event-form/EventForm', () => ({
  EventForm: function FakeEventForm({ ref, onSend, onInvalid, renderActions, initialValues, variant }: EventFormProps) {
    initial.values = initialValues;
    initial.variant = variant;
    useImperativeHandle(
      ref,
      (): EventFormHandle => ({
        run: async (mode) => {
          if (checksFail) return onInvalid?.();
          await onSend({ ...initialValues, ...edited }, mode);
        },
        getValues: () => ({ ...initialValues, ...edited }),
        reset: (values) => {
          resets.push(values);
        },
      }),
    );
    return <div data-testid="event-form">{renderActions({ busy: false })}</div>;
  },
}));

import { EditEventPage } from '@/components/page/events/event-edit/EditEventPage';

const stored = (status: EventStatus | undefined, over: Partial<EventEditResponse> = {}): EventEditResponse => ({
  ...eventResponse({ uid: 'e1', name: 'Lisbon Meetup' }),
  status,
  timezone: 'Europe/Lisbon',
  hostName: 'Protocol Labs',
  tags: ['Workshop'],
  ...over,
});

const open = (props: { isAdmin?: boolean; signedIn?: boolean } = {}) =>
  render(<EditEventPage eventUid="e1" signedIn={props.signedIn ?? true} isAdmin={props.isAdmin ?? false} />);
const press = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
const button = (name: string) => screen.queryByRole('button', { name });

beforeEach(() => {
  jest.clearAllMocks();
  eventQuery.data = stored('PENDING');
  eventQuery.isLoading = false;
  eventQuery.isError = false;
  mine.data = [{ uid: 'e1' }];
  mine.isLoading = false;
  mine.isError = false;
  remove.isPending = false;
  edited = {};
  checksFail = false;
  initial.values = null;
  resets.length = 0;
});

describe('who may open the page', () => {
  it('shows the submitter their event read-only, with its status and "Edit"', () => {
    open();
    expect(screen.getByRole('heading', { name: 'Lisbon Meetup' })).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(button('Edit')).toBeInTheDocument();
    expect(screen.queryByTestId('event-form')).toBeNull();
    expect(screen.getByRole('link', { name: 'Back to my events' })).toHaveAttribute('href', '/events/mine');
  });

  it('shows a directory admin another member’s approved event, without reading their own list', () => {
    eventQuery.data = stored('APPROVED');
    mine.data = [];
    open({ isAdmin: true });
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(button('Edit')).toBeInTheDocument();
    expect(queried.mineEnabled).toBe(false);
  });

  it('tells another member that an approved event is no longer available', () => {
    eventQuery.data = stored('APPROVED');
    mine.data = [{ uid: 'other' }];
    open();
    expect(screen.getByText('Oops! This event is no longer available.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to my events' })).toHaveAttribute('href', '/events/mine');
    expect(button('Edit')).toBeNull();
  });

  it('tells the same for an event read with no status that is not the member’s own', () => {
    eventQuery.data = stored(undefined);
    mine.data = [];
    open();
    expect(screen.getByText('Oops! This event is no longer available.')).toBeInTheDocument();
  });

  it('tells the same for an unknown event', () => {
    eventQuery.data = null;
    open();
    expect(screen.getByText('Oops! This event is no longer available.')).toBeInTheDocument();
  });

  it('keeps a rejected event read-only for its submitter: "Rejected", no "Edit", and "Delete Event"', () => {
    eventQuery.data = stored('REJECTED');
    open();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
    expect(button('Edit')).toBeNull();
    expect(button('Delete Event')).toBeInTheDocument();
  });

  it('asks a signed-out visitor to sign in and loads nothing', () => {
    open({ signedIn: false });
    expect(queried.uid).toBe('');
    press('Sign in');
    expect(goToLogin).toHaveBeenCalled();
  });

  it('offers "Try again" when the event cannot load', () => {
    eventQuery.data = undefined;
    eventQuery.isError = true;
    open();
    press('Try again');
    expect(eventQuery.refetch).toHaveBeenCalled();
  });
});

describe('the form by status', () => {
  it('fills the edit form from the event and offers a draft "Save as draft" and "Submit"', () => {
    eventQuery.data = stored('DRAFT', {
      websiteUrl: 'https://example.com',
      contactInfos: { twitter: ['https://x.com/pl'] },
    });
    open();
    press('Edit');
    expect(initial.variant).toBe('edit');
    expect(initial.values).toMatchObject({
      name: 'Lisbon Meetup',
      timezone: 'Europe/Lisbon',
      hostName: 'Protocol Labs',
      tags: ['Workshop'],
      websiteUrl: 'https://example.com',
      socialHandles: [{ platform: 'twitter', handle: 'https://x.com/pl' }],
    });
    expect(button('Save as draft')).toBeInTheDocument();
    expect(button('Submit')).toBeInTheDocument();
    expect(button('Save Changes')).toBeNull();
  });

  it.each(['PENDING', 'APPROVED'] as const)('offers a %s event "Save Changes" only', (status) => {
    eventQuery.data = stored(status);
    open();
    press('Edit');
    expect(button('Save Changes')).toBeInTheDocument();
    expect(button('Save as draft')).toBeNull();
    expect(button('Submit')).toBeNull();
  });
});

describe('saving', () => {
  it('saves a draft as a draft and returns to the read-only view', async () => {
    eventQuery.data = stored('DRAFT');
    update.mutateAsync.mockResolvedValue({ uid: 'e1', status: 'DRAFT' });
    open();
    press('Edit');
    press('Save as draft');
    await waitFor(() => expect(screen.queryByTestId('event-form')).toBeNull());
    const { uid, body } = update.mutateAsync.mock.calls[0][0];
    expect(uid).toBe('e1');
    expect(body).not.toHaveProperty('submit');
    expect(toast.success).toHaveBeenCalledWith('Event Updated Successfully');
    expect(analytics.onEventsEventEdited).toHaveBeenCalledWith({ eventUid: 'e1', action: 'draft-saved' });
    expect(eventQuery.refetch).toHaveBeenCalled();
  });

  it('submits a draft with `submit` and says "Event Submitted Successfully"', async () => {
    eventQuery.data = stored('DRAFT');
    update.mutateAsync.mockResolvedValue({ uid: 'e1', status: 'APPROVED' });
    open();
    press('Edit');
    press('Submit');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Event Submitted Successfully'));
    expect(update.mutateAsync.mock.calls[0][0].body.submit).toBe(true);
    expect(analytics.onEventsEventEdited).toHaveBeenCalledWith({ eventUid: 'e1', action: 'submitted' });
  });

  it('saves an approved event without asking for a new status', async () => {
    eventQuery.data = stored('APPROVED');
    edited = { startDay: '2031-02-01', endDay: '2031-02-02' };
    update.mutateAsync.mockResolvedValue({ uid: 'e1', status: 'APPROVED' });
    open();
    press('Edit');
    press('Save Changes');
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Event Updated Successfully'));
    const { body } = update.mutateAsync.mock.calls[0][0];
    expect(body).not.toHaveProperty('submit');
    expect(body).not.toHaveProperty('status');
    expect(body.startDate.startsWith('2031-02-01')).toBe(true);
    expect(analytics.onEventsEventEdited).toHaveBeenCalledWith({ eventUid: 'e1', action: 'updated' });
  });

  it('keeps the form unlocked and sends nothing when a check fails', async () => {
    eventQuery.data = stored('DRAFT');
    checksFail = true;
    open();
    press('Edit');
    press('Submit');
    expect(screen.getByTestId('event-form')).toBeInTheDocument();
    expect(update.mutateAsync).not.toHaveBeenCalled();
  });

  it('says "Failed to update event. Please try again." and keeps the form when the request fails', async () => {
    update.mutateAsync.mockRejectedValue(new EventRequestError(500, 'boom'));
    open();
    press('Edit');
    press('Save Changes');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to update event. Please try again.'));
    expect(screen.getByTestId('event-form')).toBeInTheDocument();
  });

  it('clears the fields only: the event stays, so the next save updates it', async () => {
    update.mutateAsync.mockResolvedValue({ uid: 'e1', status: 'PENDING' });
    open();
    press('Edit');
    press('Clear form');
    press('Confirm');
    expect(resets).toHaveLength(1);
    expect(toast.success).toHaveBeenCalledWith('Form has been cleared successfully');
    press('Save Changes');
    await waitFor(() => expect(update.mutateAsync).toHaveBeenCalled());
    expect(update.mutateAsync.mock.calls[0][0].uid).toBe('e1');
  });
});

describe('Delete Event', () => {
  it('asks first; confirm deletes, says so and opens My Submissions', async () => {
    remove.mutateAsync.mockResolvedValue(undefined);
    open();
    press('Delete Event');
    expect(screen.getByText('Are you sure you want to delete?')).toBeInTheDocument();
    expect(screen.getByText('Clicking delete will remove the event from the list.')).toBeInTheDocument();
    press('Delete');
    await waitFor(() => expect(push).toHaveBeenCalledWith('/events/mine'));
    expect(remove.mutateAsync).toHaveBeenCalledWith('e1');
    expect(toast.success).toHaveBeenCalledWith('Event deleted successfully');
    expect(analytics.onEventsEventDeleted).toHaveBeenCalledWith({ eventUid: 'e1', from: 'edit-page' });
  });

  it('changes nothing on "Cancel"', () => {
    open();
    press('Delete Event');
    press('Cancel');
    expect(remove.mutateAsync).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('says "Something went wrong please try again." when the delete fails', async () => {
    remove.mutateAsync.mockRejectedValue(new EventRequestError(500, 'boom'));
    open();
    press('Delete Event');
    press('Delete');
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong please try again.'));
    expect(push).not.toHaveBeenCalled();
  });

  it('is hidden for the submitter of an approved event', () => {
    eventQuery.data = stored('APPROVED');
    open();
    expect(button('Delete Event')).toBeNull();
    press('Edit');
    expect(button('Delete Event')).toBeNull();
  });

  it('is offered to a directory admin on an approved event', () => {
    eventQuery.data = stored('APPROVED');
    open({ isAdmin: true });
    expect(button('Delete Event')).toBeInTheDocument();
  });
});
