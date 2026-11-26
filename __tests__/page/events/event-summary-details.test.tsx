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
 * the social handles (LAB-3451).
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
