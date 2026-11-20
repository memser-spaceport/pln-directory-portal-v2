import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

/* LAB-3352: `/events/embed` renders the All Events page in embed mode, signed out, behind the native-page flag. */

const flags = { page: true };
jest.mock('@/utils/events-page', () => ({
  get SHOW_EVENTS_PAGE_V2() {
    return flags.page;
  },
}));
const notFound = jest.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
jest.mock('next/navigation', () => ({ notFound: () => notFound() }));
const loads = { events: jest.fn() };
jest.mock('@/services/events/all-events.service', () => ({ getAllEventsPageEvents: () => loads.events() }));
jest.mock('@/components/page/events/all-events/AllEventsPage', () => ({
  AllEventsPage: (props: { embed?: boolean; signedIn: boolean; viewerUid: string | null; result: unknown }) => (
    <div
      data-testid="all-events"
      data-embed={String(props.embed)}
      data-signed-in={String(props.signedIn)}
      data-viewer={String(props.viewerUid)}
      data-ok={String((props.result as { ok: boolean }).ok)}
    />
  ),
}));

import EventsEmbedRoute, { metadata } from '@/app/events/embed/page';

beforeEach(() => {
  flags.page = true;
  loads.events.mockReset().mockResolvedValue({ ok: true, items: [] });
});

it('renders the page in embed mode, signed out, with the events', async () => {
  render(await EventsEmbedRoute());
  const page = screen.getByTestId('all-events');
  expect(page).toHaveAttribute('data-embed', 'true');
  expect(page).toHaveAttribute('data-signed-in', 'false');
  expect(page).toHaveAttribute('data-viewer', 'null');
  expect(page).toHaveAttribute('data-ok', 'true');
});

it('is not found while the native page is off', async () => {
  flags.page = false;
  await expect(EventsEmbedRoute()).rejects.toThrow('NEXT_NOT_FOUND');
  expect(loads.events).not.toHaveBeenCalled();
});

it('stays out of search results: `/events/all` is the page to index', () => {
  expect(metadata.robots).toEqual({ index: false, follow: true });
});
