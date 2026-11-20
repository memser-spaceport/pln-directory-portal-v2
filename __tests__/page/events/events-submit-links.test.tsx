import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { NO_PLANS, eventResponse } from '@/components/page/events/EventDrawer/EventDrawer.fixtures';
import { EventDrawerView, type EventDrawerViewProps } from '@/components/page/events/EventDrawer/EventDrawerView';
import { AllEventsHeader } from '@/components/page/events/all-events/AllEventsHeader';
import { toEventDetail } from '@/services/events/event-drawer.mappers';
import type { EventDetailResponse } from '@/services/events/event-drawer.types';

/* Where the All Events header and the event drawer lead: the submit form, My Submissions and the edit page. */

jest.mock('react-calendar', () => ({ __esModule: true, default: () => <div data-testid="calendar" /> }));

describe('All Events header', () => {
  it('opens the old portal in a new tab, with no "My Submissions", while events are not submitted in LabOS', () => {
    render(<AllEventsHeader submitHref="https://irl.test/auth/labos" eventsAppHref="https://events.test/calendar" />);
    const submit = screen.getByRole('link', { name: 'Submit an event' });
    expect(submit).toHaveAttribute('href', 'https://irl.test/auth/labos');
    expect(submit).toHaveAttribute('target', '_blank');
    expect(screen.queryByRole('link', { name: 'My Submissions' })).toBeNull();
  });

  it('opens the LabOS form in the same tab and shows a signed-in member "My Submissions"', () => {
    render(
      <AllEventsHeader
        submitHref="/events/submit"
        submitInApp
        mySubmissionsHref="/events/mine"
        eventsAppHref="https://events.test/calendar"
      />,
    );
    const submit = screen.getByRole('link', { name: 'Submit an event' });
    expect(submit).toHaveAttribute('href', '/events/submit');
    expect(submit).not.toHaveAttribute('target');
    expect(screen.getByRole('link', { name: 'My Submissions' })).toHaveAttribute('href', '/events/mine');
  });

  it('shows a signed-out visitor "Submit an event" and no "My Submissions"', () => {
    render(<AllEventsHeader submitHref="/events/submit" submitInApp eventsAppHref="https://events.test/calendar" />);
    expect(screen.getByRole('link', { name: 'Submit an event' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'My Submissions' })).toBeNull();
  });
});

function Drawer(props: Partial<EventDrawerViewProps> & { raw?: EventDetailResponse }) {
  const { raw = eventResponse(), ...rest } = props;
  return (
    <EventDrawerView
      status="ready"
      event={toEventDetail(raw)}
      canMarkGoing
      viewerUid="viewer-1"
      plans={NO_PLANS}
      member={{ teams: [], telegramHandle: null, officeHours: null }}
      attendees={{
        rows: [],
        isLoading: false,
        isError: false,
        hasNextPage: false,
        isFetchingNextPage: false,
        fetchNextPage: jest.fn(),
        search: '',
        onSearchChange: jest.fn(),
      }}
      saving={false}
      onClose={jest.fn()}
      onYes={jest.fn(async () => true)}
      onNotGoing={jest.fn(async () => true)}
      onSave={jest.fn(async () => true)}
      {...rest}
    />
  );
}

describe('event drawer', () => {
  it('shows "Edit" to the submitter and a directory admin, leading to the edit page', () => {
    render(<Drawer editHref="/events/edit/e1" />);
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/events/edit/e1');
  });

  it('shows no "Edit" to another member or a signed-out visitor', () => {
    render(<Drawer />);
    expect(screen.queryByRole('link', { name: 'Edit' })).toBeNull();
    expect(screen.queryByText(/^Status:/)).toBeNull();
  });

  it('shows the status of an event that is not approved, and no "I\'m going"', () => {
    render(<Drawer raw={eventResponse({ status: 'PENDING' })} editHref="/events/edit/e1" />);
    expect(screen.getByRole('status')).toHaveTextContent('Status: Submitted');
    expect(screen.queryByRole('button', { name: /going/i })).toBeNull();
  });

  it('shows no status line for an approved event, and keeps "I\'m going"', () => {
    render(<Drawer raw={eventResponse({ status: 'APPROVED' })} editHref="/events/edit/e1" />);
    expect(screen.queryByText(/^Status:/)).toBeNull();
    expect(screen.getByRole('button', { name: "Yes, I'm going" })).toBeInTheDocument();
  });
});
