import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';

import { eventResponse } from '@/components/page/events/EventDrawer/EventDrawer.fixtures';
import { EventSummary } from '@/components/page/events/EventDrawer/EventSummary';
import { toEventDetail } from '@/services/events/event-drawer.mappers';
import type { EventDetailResponse } from '@/services/events/event-drawer.types';
import { defaultEventFormValues } from '@/services/events/event-form';
import { toPreviewEvent } from '@/services/events/event-form-view';
import type { EventFormValues } from '@/services/events/event-submission.types';

/*
 * LAB-3278 QA fixes in the event summary, which the drawer, Preview and the edit page's read-only view all draw:
 * the social handles (LAB-3451) and the venue's instruction (LAB-3454).
 */

const values = (over: Partial<EventFormValues> = {}): EventFormValues => ({
  ...defaultEventFormValues('Europe/Lisbon'),
  name: 'Lisbon Meetup',
  startDay: '2030-01-28',
  startTime: '09:00',
  endDay: '2030-01-28',
  endTime: '18:00',
  ...over,
});

const stored = (details: Partial<NonNullable<EventDetailResponse['details']>>, over: Partial<EventDetailResponse> = {}) => {
  const base = eventResponse(over);
  return toEventDetail({ ...base, details: { ...base.details!, ...details } });
};

describe('LAB-3451: the social handles', () => {
  const handles = [
    { platform: 'twitter', handle: '@plabs' },
    { platform: 'email', handle: 'team@pl.xyz' },
  ];

  function expectSocials() {
    const row = screen.getByTestId('event-socials');
    expect(within(row).getByText('Social')).toBeInTheDocument();
    const x = within(row).getByRole('link', { name: 'x.com/plabs' });
    expect(x).toHaveAttribute('href', 'https://x.com/plabs');
    expect(x).toHaveAttribute('target', '_blank');
    expect(x).toHaveAttribute('rel', 'noopener noreferrer');
    const mail = within(row).getByRole('link', { name: 'team@pl.xyz' });
    expect(mail).toHaveAttribute('href', 'mailto:team@pl.xyz');
    expect(mail).not.toHaveAttribute('target');
    expect(within(row).getByText('Email:')).toBeInTheDocument();
  }

  it('Preview draws the handles from the form', () => {
    render(<EventSummary event={toPreviewEvent(values({ socialHandles: handles }))} />);
    expectSocials();
  });

  it('the drawer draws the same handles from details.contactInfos', () => {
    render(<EventSummary event={stored({ contactInfos: { twitter: ['@plabs'], email: ['team@pl.xyz'] } })} />);
    expectSocials();
  });

  it('shows no row when the event has no handles, or only unsafe ones', () => {
    const { unmount } = render(<EventSummary event={toPreviewEvent(values())} />);
    expect(screen.queryByTestId('event-socials')).not.toBeInTheDocument();
    unmount();
    render(<EventSummary event={stored({ contactInfos: { website: ['javascript:alert(1)'], email: ['javascript:alert(1)'] } })} />);
    expect(screen.queryByTestId('event-socials')).not.toBeInTheDocument();
  });
});

describe('LAB-3454: the instruction under the venue', () => {
  const place = { city: 'Lisbon', state: null, country: 'Portugal', latitude: 1, longitude: 2, locationUrl: null };
  const venue = { address: 'Avenida da Liberdade 10', latitude: 1, longitude: 2 };

  function expectInstruction() {
    const row = screen.getByTestId('event-place');
    expect(within(row).getByText('Avenida da Liberdade 10')).toBeInTheDocument();
    expect(within(row).getByTestId('event-place-instruction')).toHaveTextContent('8th floor, ask at the desk');
    expect(within(row).getByTestId('event-place-instruction')).toHaveClass('factSub');
  }

  it('Preview draws the form instruction under a found venue', () => {
    render(
      <EventSummary
        event={toPreviewEvent(values({ venue: venue.address, place, instruction: ' 8th floor, ask at the desk ' }))}
      />,
    );
    expectInstruction();
  });

  it('the drawer draws details.locationInstructions under the venue', () => {
    render(<EventSummary event={stored({ locationInstructions: '8th floor, ask at the desk' }, { venue })} />);
    expectInstruction();
  });

  it('shows no instruction without a venue, for an online event, or when it is empty', () => {
    const cases = [
      toPreviewEvent(values({ venue: 'My garage', place: null, instruction: '8th floor' })),
      toPreviewEvent(values({ format: 'VIRTUAL', venue: venue.address, place, instruction: '8th floor' })),
      toPreviewEvent(values({ venue: venue.address, place, instruction: '  ' })),
      stored({ locationInstructions: '8th floor' }, { venue: null }),
      stored({ locationInstructions: '8th floor', format: 'VIRTUAL' }, { venue }),
    ];
    for (const event of cases) {
      const { unmount } = render(<EventSummary event={event} />);
      expect(screen.queryByTestId('event-place-instruction')).not.toBeInTheDocument();
      unmount();
    }
  });
});
