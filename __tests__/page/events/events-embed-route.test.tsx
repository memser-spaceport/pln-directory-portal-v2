import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

/*
 * LAB-3352: `/events/embed` renders the All Events page in embed mode, signed out, behind the native-page flag.
 * LAB-3392: `details=labos` in its address sends events to LabOS instead of the embed's drawer.
 */

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
  AllEventsPage: (props: {
    embed?: boolean;
    detailsOnLabOs?: boolean;
    signedIn: boolean;
    viewerUid: string | null;
    result: unknown;
    serverNow: number;
  }) => (
    <div
      data-testid="all-events"
      data-embed={String(props.embed)}
      data-details-on-labos={String(props.detailsOnLabOs)}
      data-signed-in={String(props.signedIn)}
      data-viewer={String(props.viewerUid)}
      data-server-now={String(props.serverNow)}
      data-ok={String((props.result as { ok: boolean }).ok)}
    />
  ),
}));

import EventsEmbedRoute, { metadata } from '@/app/events/embed/page';

const route = (query: Record<string, string> = {}) => EventsEmbedRoute({ searchParams: Promise.resolve(query) });

beforeEach(() => {
  flags.page = true;
  loads.events.mockReset().mockResolvedValue({ ok: true, items: [] });
});

it('renders the page in embed mode, signed out, with the events', async () => {
  render(await route({ view: 'calendar' }));
  const page = screen.getByTestId('all-events');
  expect(page).toHaveAttribute('data-embed', 'true');
  expect(page).toHaveAttribute('data-details-on-labos', 'false');
  expect(page).toHaveAttribute('data-signed-in', 'false');
  expect(page).toHaveAttribute('data-viewer', 'null');
  expect(page).toHaveAttribute('data-ok', 'true');
});

it('is not found while the native page is off', async () => {
  flags.page = false;
  await expect(route()).rejects.toThrow('NEXT_NOT_FOUND');
  expect(loads.events).not.toHaveBeenCalled();
});

it('sends events to LabOS only for `details=labos` (LAB-3392)', async () => {
  const { unmount } = render(await route({ details: 'labos' }));
  expect(screen.getByTestId('all-events')).toHaveAttribute('data-details-on-labos', 'true');
  unmount();
  render(await route({ details: 'embed' }));
  expect(screen.getByTestId('all-events')).toHaveAttribute('data-details-on-labos', 'false');
});

it('stays out of search results: `/events/all` is the page to index', () => {
  expect(metadata.robots).toEqual({ index: false, follow: true });
});

it('hands the page the server’s clock, for the Live pills of the first render (LAB-3425)', async () => {
  jest.useFakeTimers({ now: new Date('2030-12-01T10:00:00Z') });
  const page = await route();
  jest.useRealTimers();
  render(page);
  expect(screen.getByTestId('all-events')).toHaveAttribute('data-server-now', String(Date.UTC(2030, 11, 1, 10)));
});
