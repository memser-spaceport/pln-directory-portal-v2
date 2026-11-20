import React from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

import type { MyEventResponse } from '@/services/events/event-submission.types';

/* My Submissions (`/events/mine`): the rows and their buttons by status, month headings, search, the Upcoming / Past
   switch, the empty, loading, error and signed-out states, and delete. */

const list = {
  data: undefined as MyEventResponse[] | undefined,
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
};
const useMyEvents = jest.fn(() => list);
const mutateAsync = jest.fn();
const deletion = { isPending: false };
jest.mock('@/services/events/hooks/useEventSubmission', () => ({
  useMyEvents: () => useMyEvents(),
  useDeleteEvent: () => ({ mutateAsync, isPending: deletion.isPending }),
}));

const analytics = { onEventsMySubmissionsOpened: jest.fn(), onEventsEventDeleted: jest.fn() };
jest.mock('@/analytics/events.analytics', () => ({ useEventsAnalytics: () => analytics }));

const toast = { success: jest.fn(), error: jest.fn() };
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: (text: string) => toast.success(text), error: (text: string) => toast.error(text) },
}));

const goToLogin = jest.fn();
jest.mock('@/components/core/login/utils/loginRedirect', () => ({ useLoginRedirect: () => goToLogin }));

const router = { push: jest.fn(), back: jest.fn(), replace: jest.fn() };
jest.mock('next/navigation', () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams(),
}));

import { MySubmissionsPage } from '@/components/page/events/my-submissions/MySubmissionsPage';

const NOW = new Date('2026-11-19T12:00:00Z');

function anEvent(overrides: Partial<MyEventResponse> & { uid: string }): MyEventResponse {
  return {
    name: `Event ${overrides.uid}`,
    startDate: '2026-12-03T14:00:00.000Z',
    endDate: '2026-12-03T17:00:00.000Z',
    status: 'DRAFT',
    timezone: 'UTC',
    allDay: false,
    updatedAt: '2026-11-10T09:30:00.000Z',
    createdAt: '2026-11-01T08:00:00.000Z',
    ...overrides,
  };
}

function renderPage(props: { signedIn?: boolean; isAdmin?: boolean } = {}) {
  return render(<MySubmissionsPage signedIn={props.signedIn ?? true} isAdmin={props.isAdmin ?? false} />);
}

/** The row (list item) that holds the event's name. */
function row(name: string): HTMLElement {
  const item = screen.getByRole('heading', { name, level: 3 }).closest('li');
  if (!item) throw new Error(`no row for ${name}`);
  return item;
}

function names(): string[] {
  return screen.queryAllByRole('heading', { level: 3 }).map((h) => h.textContent ?? '');
}

function search(text: string, pressEnter = true) {
  const input = screen.getByRole('textbox', { name: 'Search by event name' });
  fireEvent.change(input, { target: { value: text } });
  if (pressEnter) fireEvent.submit(input);
}

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(NOW);
  jest.clearAllMocks();
  list.data = [];
  list.isLoading = false;
  list.isError = false;
  deletion.isPending = false;
  mutateAsync.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.useRealTimers();
});

describe('header', () => {
  it('shows the title, a back control to All Events and "Submit an event"', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'My Submissions', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Submit an event' })).toHaveAttribute('href', '/events/submit');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(router.push).toHaveBeenCalledWith('/events/all');
  });

  it('reports the page opened once for a signed-in member', () => {
    const { rerender } = renderPage();
    rerender(<MySubmissionsPage signedIn isAdmin={false} />);
    expect(analytics.onEventsMySubmissionsOpened).toHaveBeenCalledTimes(1);
  });
});

describe('rows by status', () => {
  it('shows a draft as "Draft" with "Modify" and "Delete"', () => {
    list.data = [anEvent({ uid: 'd1', name: 'Draft Day', status: 'DRAFT' })];
    renderPage();
    const item = within(row('Draft Day'));
    expect(item.getByText('Draft')).toBeInTheDocument();
    expect(item.getByRole('link', { name: 'Modify Draft Day' })).toHaveAttribute('href', '/events/edit/d1');
    expect(item.getByRole('button', { name: 'Delete Draft Day' })).toBeInTheDocument();
    expect(item.queryByRole('link', { name: /View/ })).toBeNull();
  });

  it('shows a pending event as "Submitted" with "Modify" and "Delete"', () => {
    list.data = [anEvent({ uid: 'p1', name: 'Pending Day', status: 'PENDING' })];
    renderPage();
    const item = within(row('Pending Day'));
    expect(item.getByText('Submitted')).toBeInTheDocument();
    expect(item.getByRole('link', { name: 'Modify Pending Day' })).toHaveAttribute('href', '/events/edit/p1');
    expect(item.getByRole('button', { name: 'Delete Pending Day' })).toBeInTheDocument();
  });

  it('shows an approved event as "Approved" with "Modify" and no "Delete" for a member', () => {
    list.data = [anEvent({ uid: 'a1', name: 'Approved Day', status: 'APPROVED' })];
    renderPage();
    const item = within(row('Approved Day'));
    expect(item.getByText('Approved')).toBeInTheDocument();
    expect(item.getByRole('link', { name: 'Modify Approved Day' })).toHaveAttribute('href', '/events/edit/a1');
    expect(item.queryByRole('button', { name: /Delete/ })).toBeNull();
  });

  it('gives a directory admin "Delete" on an approved event', () => {
    list.data = [anEvent({ uid: 'a1', name: 'Approved Day', status: 'APPROVED' })];
    renderPage({ isAdmin: true });
    expect(within(row('Approved Day')).getByRole('button', { name: 'Delete Approved Day' })).toBeInTheDocument();
  });

  it('shows a rejected event as "Rejected" with "View" and "Delete"', () => {
    list.data = [anEvent({ uid: 'r1', name: 'Rejected Day', status: 'REJECTED' })];
    renderPage();
    const item = within(row('Rejected Day'));
    expect(item.getByText('Rejected')).toBeInTheDocument();
    expect(item.getByRole('link', { name: 'View Rejected Day' })).toHaveAttribute('href', '/events/edit/r1');
    expect(item.getByRole('button', { name: 'Delete Rejected Day' })).toBeInTheDocument();
    expect(item.queryByRole('link', { name: /Modify/ })).toBeNull();
  });
});

describe('month headings', () => {
  it('puts "DEC 2026" above "JAN 2027", and the earliest start first inside a month', () => {
    list.data = [
      anEvent({ uid: 'j', name: 'January', startDate: '2027-01-12T10:00:00Z', endDate: '2027-01-12T12:00:00Z' }),
      anEvent({ uid: 'd2', name: 'Late December', startDate: '2026-12-20T10:00:00Z', endDate: '2026-12-20T12:00:00Z' }),
      anEvent({
        uid: 'd1',
        name: 'Early December',
        startDate: '2026-12-03T10:00:00Z',
        endDate: '2026-12-03T12:00:00Z',
      }),
    ];
    renderPage();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['DEC 2026', 'JAN 2027']);
    expect(names()).toEqual(['Early December', 'Late December', 'January']);
  });

  it('takes the month from the event’s own time zone', () => {
    list.data = [
      anEvent({
        uid: 'tz',
        name: 'New Year in Auckland',
        startDate: '2026-12-31T20:00:00Z',
        endDate: '2026-12-31T22:00:00Z',
        timezone: 'Pacific/Auckland',
      }),
    ];
    renderPage();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('JAN 2027');
  });
});

describe('search', () => {
  beforeEach(() => {
    list.data = [anEvent({ uid: 'l', name: 'Lisbon Meetup' }), anEvent({ uid: 'h', name: 'Denver Hack Day' })];
  });

  it('applies on Enter, not while typing', () => {
    renderPage();
    search('lisbon', false);
    expect(names()).toEqual(['Lisbon Meetup', 'Denver Hack Day']);
    fireEvent.submit(screen.getByRole('textbox', { name: 'Search by event name' }));
    expect(names()).toEqual(['Lisbon Meetup']);
  });

  it('ignores case', () => {
    renderPage();
    search('DENVER hack');
    expect(names()).toEqual(['Denver Hack Day']);
  });

  it('can be cleared', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
    search('lisbon');
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByRole('textbox', { name: 'Search by event name' })).toHaveValue('');
    expect(names()).toEqual(['Lisbon Meetup', 'Denver Hack Day']);
  });

  it('says "No Events currently available" when nothing matches', () => {
    renderPage();
    search('berlin');
    expect(screen.getByText('No Events currently available')).toBeInTheDocument();
    expect(names()).toEqual([]);
  });
});

describe('the Upcoming / Past switch', () => {
  beforeEach(() => {
    list.data = [
      anEvent({ uid: 'u', name: 'Next Month' }),
      anEvent({ uid: 'p', name: 'Last Month', startDate: '2026-10-10T10:00:00Z', endDate: '2026-10-10T12:00:00Z' }),
      // Started before now and ends after it: not over yet.
      anEvent({ uid: 'n', name: 'Running Now', startDate: '2026-11-18T10:00:00Z', endDate: '2026-11-19T13:00:00Z' }),
    ];
  });

  it('starts on "Upcoming": events whose end is not in the past', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Upcoming' })).toHaveAttribute('aria-pressed', 'true');
    expect(names()).toEqual(['Running Now', 'Next Month']);
  });

  it('shows past events on "Past"', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Past' }));
    expect(screen.getByRole('button', { name: 'Past' })).toHaveAttribute('aria-pressed', 'true');
    expect(names()).toEqual(['Last Month']);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('OCT 2026');
  });

  it('clears the search when it changes', () => {
    renderPage();
    search('next');
    expect(names()).toEqual(['Next Month']);
    fireEvent.click(screen.getByRole('button', { name: 'Past' }));
    expect(screen.getByRole('textbox', { name: 'Search by event name' })).toHaveValue('');
    expect(names()).toEqual(['Last Month']);
  });

  it('keeps an all-day event upcoming until the end of its last day in its time zone', () => {
    list.data = [
      anEvent({
        uid: 'ad',
        name: 'All Day Today',
        startDate: '2026-11-19T00:00:00Z',
        endDate: '2026-11-19T00:00:00Z',
        allDay: true,
      }),
    ];
    renderPage();
    expect(names()).toEqual(['All Day Today']);
  });

  it('says "No Events currently available" on an empty "Past"', () => {
    list.data = [anEvent({ uid: 'u', name: 'Next Month' })];
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Past' }));
    expect(screen.getByText('No Events currently available')).toBeInTheDocument();
  });
});

describe('dates and "Last Modified"', () => {
  it('shows the date and time range in the event’s time zone', () => {
    list.data = [
      anEvent({
        uid: 't',
        name: 'Timed',
        startDate: '2026-12-03T23:00:00Z',
        endDate: '2026-12-04T02:00:00Z',
        timezone: 'America/New_York',
      }),
    ];
    renderPage();
    expect(within(row('Timed')).getByText('3rd Dec 2026, 18:00 - 3rd Dec 2026, 21:00 (UTC -5:00)')).toBeInTheDocument();
  });

  it('shows an all-day event as a date range with no time and no UTC offset', () => {
    list.data = [
      anEvent({
        uid: 'c',
        name: 'Conference',
        startDate: '2026-12-03T00:00:00Z',
        endDate: '2026-12-05T00:00:00Z',
        allDay: true,
      }),
    ];
    renderPage();
    const item = row('Conference');
    expect(within(item).getByText('3rd Dec 2026 - 5th Dec 2026')).toBeInTheDocument();
    expect(item.textContent).not.toMatch(/UTC/);
    expect(item.querySelector('p')?.textContent).not.toMatch(/\d{1,2}:\d{2}/);
  });

  it('shows "Last Modified" with the date and time of the last change', () => {
    list.data = [anEvent({ uid: 'm', name: 'Changed', updatedAt: '2026-11-10T09:30:00.000Z' })];
    renderPage();
    const d = new Date('2026-11-10T09:30:00.000Z');
    const two = (n: number) => String(n).padStart(2, '0');
    const expected = `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()}, ${two(d.getHours())}:${two(d.getMinutes())}`;
    expect(within(row('Changed')).getByText(`Last Modified: ${expected}`)).toBeInTheDocument();
  });

  it('falls back to the creation time, and hides the line when both are missing', () => {
    list.data = [
      anEvent({ uid: 'c', name: 'Created Only', updatedAt: null }),
      anEvent({ uid: 'n', name: 'No Times', updatedAt: null, createdAt: null }),
    ];
    renderPage();
    expect(within(row('Created Only')).getByText(/^Last Modified: 01\/11\/2026, \d{2}:\d{2}$/)).toBeInTheDocument();
    expect(within(row('No Times')).queryByText(/Last Modified/)).toBeNull();
  });
});

describe('states', () => {
  it('says "No Events currently available" for a member with no events', () => {
    renderPage();
    expect(screen.getByText('No Events currently available')).toBeInTheDocument();
  });

  it('shows a labelled loading state until the list answers', () => {
    list.data = undefined;
    list.isLoading = true;
    renderPage();
    expect(screen.getByRole('status', { name: 'Loading your events' })).toBeInTheDocument();
    expect(screen.queryByText('No Events currently available')).toBeNull();
  });

  it('says the events couldn’t load and refetches on "Try again"', () => {
    list.data = undefined;
    list.isError = true;
    renderPage();
    expect(screen.getByRole('alert')).toHaveTextContent('Your events couldn’t load.'.replace('’', "'"));
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(list.refetch).toHaveBeenCalledTimes(1);
  });

  it('asks a signed-out visitor to sign in, returns to the page, and does not ask for the list', () => {
    renderPage({ signedIn: false });
    expect(screen.getByRole('heading', { name: 'My Submissions', level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Sign in to see the events you submitted.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(goToLogin).toHaveBeenCalledWith({ returnTo: '/events/mine' });
    expect(useMyEvents).not.toHaveBeenCalled();
    expect(analytics.onEventsMySubmissionsOpened).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox', { name: 'Search by event name' })).toBeNull();
  });
});

describe('delete', () => {
  beforeEach(() => {
    list.data = [anEvent({ uid: 'd1', name: 'Draft Day' })];
  });

  function openDialog() {
    fireEvent.click(screen.getByRole('button', { name: 'Delete Draft Day' }));
    return within(screen.getByRole('dialog', { name: 'Are you sure you want to delete?' }));
  }

  it('asks before deleting', () => {
    renderPage();
    const dialog = openDialog();
    expect(dialog.getByText('Clicking delete will remove the event from the list.')).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(dialog.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('deletes on confirm: the mutation gets the uid, the toast shows and analytics is sent', async () => {
    renderPage();
    const dialog = openDialog();
    await act(async () => {
      fireEvent.click(dialog.getByRole('button', { name: 'Delete' }));
    });
    expect(mutateAsync).toHaveBeenCalledWith('d1');
    expect(toast.success).toHaveBeenCalledWith('Event deleted successfully');
    expect(toast.error).not.toHaveBeenCalled();
    expect(analytics.onEventsEventDeleted).toHaveBeenCalledWith({ eventUid: 'd1', from: 'my-submissions' });
  });

  it('changes nothing on "Cancel"', () => {
    renderPage();
    const dialog = openDialog();
    fireEvent.click(dialog.getByRole('button', { name: 'Cancel' }));
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(mutateAsync).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(names()).toEqual(['Draft Day']);
  });

  it('says "Something went wrong please try again." when the delete fails, and keeps the row', async () => {
    mutateAsync.mockRejectedValue(new Error('500'));
    renderPage();
    const dialog = openDialog();
    await act(async () => {
      fireEvent.click(dialog.getByRole('button', { name: 'Delete' }));
    });
    expect(toast.error).toHaveBeenCalledWith('Something went wrong please try again.');
    expect(toast.success).not.toHaveBeenCalled();
    expect(analytics.onEventsEventDeleted).not.toHaveBeenCalled();
    expect(names()).toEqual(['Draft Day']);
  });

  it('turns the dialog’s buttons off while the delete runs', () => {
    deletion.isPending = true;
    renderPage();
    const dialog = openDialog();
    expect(dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(dialog.getByRole('button', { name: 'Delete' })).toBeDisabled();
  });
});
