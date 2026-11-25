import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

/* LAB-3247 (task 1.1): `/events/all` renders the native page only with both flags on; otherwise the iframe, as before. */

const flags = { page: false, drawer: true };
jest.mock('@/utils/events-page', () => ({
  get SHOW_EVENTS_PAGE_V2() {
    return flags.page;
  },
}));
jest.mock('@/utils/event-drawer', () => ({
  get SHOW_EVENT_DRAWER() {
    return flags.drawer;
  },
}));

const cookies = { userInfo: null as { uid: string } | null, authToken: '' };
jest.mock('@/utils/next-helpers', () => ({ getCookiesFromHeaders: async () => cookies }));
jest.mock('@/components/page/events/schedule-section', () => ({
  __esModule: true,
  default: () => <iframe title="events app" />,
}));

const loads = { events: jest.fn(), city: jest.fn() };
jest.mock('@/services/events/all-events.service', () => ({
  getAllEventsPageEvents: () => loads.events(),
  getMemberProfileCity: (...a: unknown[]) => loads.city(...a),
}));
jest.mock('@/components/page/events/all-events/AllEventsPage', () => ({
  AllEventsPage: (props: { memberCity: unknown; signedIn: boolean; serverNow: number }) => (
    <div
      data-testid="all-events"
      data-signed-in={String(props.signedIn)}
      data-city={String(props.memberCity)}
      data-server-now={String(props.serverNow)}
    />
  ),
}));

import Page from '@/app/events/all/page';

beforeEach(() => {
  loads.events.mockResolvedValue({ ok: true, items: [] });
  loads.city.mockResolvedValue('Lisbon');
  cookies.userInfo = null;
  cookies.authToken = '';
});

it('keeps the iframe with the flag off', async () => {
  flags.page = false;
  render(await Page());
  expect(screen.getByTitle('events app')).toBeInTheDocument();
  expect(screen.queryByTestId('all-events')).toBeNull();
  expect(loads.events).not.toHaveBeenCalled();
});

it('keeps the iframe when the drawer flag is off', async () => {
  flags.page = true;
  flags.drawer = false;
  render(await Page());
  expect(screen.getByTitle('events app')).toBeInTheDocument();
  flags.drawer = true;
});

it('renders the native page with the flag on, and asks for no member signed out', async () => {
  flags.page = true;
  render(await Page());
  expect(screen.getByTestId('all-events')).toHaveAttribute('data-signed-in', 'false');
  expect(document.querySelector('iframe')).toBeNull();
  expect(loads.city).not.toHaveBeenCalled();
});

it('reads a signed-in member’s city with their token', async () => {
  flags.page = true;
  cookies.userInfo = { uid: 'm1' };
  cookies.authToken = 'tok';
  render(await Page());
  expect(loads.city).toHaveBeenCalledWith('m1', 'tok');
  expect(screen.getByTestId('all-events')).toHaveAttribute('data-city', 'Lisbon');
});

it('hands the page the server’s clock, for the Live pills of the first render (LAB-3425)', async () => {
  flags.page = true;
  jest.useFakeTimers({ now: new Date('2030-12-01T10:00:00Z') });
  const page = await Page();
  jest.useRealTimers();
  render(page);
  expect(screen.getByTestId('all-events')).toHaveAttribute('data-server-now', String(Date.UTC(2030, 11, 1, 10)));
});
