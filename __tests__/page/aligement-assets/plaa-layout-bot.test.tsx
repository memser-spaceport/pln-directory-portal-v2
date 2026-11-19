import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import PlaaLayoutWrapper from '@/components/page/aligement-assets/plaa-layout-wrapper';
import ActivityTable from '@/components/page/aligement-assets/activities/sections/activity-table';
import { Activity } from '@/components/page/aligement-assets/activities/types';
import { resolvePlaaBotActivityId } from '@/components/core/plaa-bot/plaa-bot.utils';

let mockPathname = '/alignment-asset/overview';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({
    onMobileNavMenuClicked: jest.fn(),
    onMobileNavMenuClosed: jest.fn(),
    onNavMenuClicked: jest.fn(),
    onActivitiesFormLinkClicked: jest.fn(),
    onActivitiesRowClicked: jest.fn(),
  }),
}));

jest.mock('@/services/rbac/hooks/usePlaaAccess', () => ({
  usePlaaAccess: () => ({ canView: false, isLoading: false, isError: false }),
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: jest.fn() },
}));

jest.mock('@/components/core/plaa-bot/constants', () => ({
  ...jest.requireActual('@/components/core/plaa-bot/constants'),
  isPlaaBotEnabled: true,
  PLAA_BOT_WEBHOOK_URL: 'https://bot.example.com/webhook',
}));

const init = jest.fn();
const open = jest.fn().mockResolvedValue(undefined);

function stubWidgetScript() {
  const originalCreateElement = document.createElement.bind(document);

  return jest
    .spyOn(document, 'createElement')
    .mockImplementation((tagName: string, options?: ElementCreationOptions) => {
      const element = originalCreateElement(tagName, options);

      if (tagName === 'script') {
        queueMicrotask(() => {
          window.PLAABot = { init, open };
          element.dispatchEvent(new Event('load'));
        });
      }

      return element;
    });
}

const mappedActivity: Activity = {
  id: 'host-x-space',
  category: 'Programs',
  activity: 'Host an X Space',
  networkValue: 'Shares knowledge',
  points: '500',
  frequency: 'Repeatable',
  cta: 'submit',
  popupContent: { title: 'Host an X Space', overview: 'Host a space.' },
};

beforeAll(() => {
  window.scrollTo = jest.fn();
});

beforeEach(() => {
  jest.clearAllMocks();
  document.body.innerHTML = '';
  delete window.PLAABot;
  stubWidgetScript();
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('loads the bot with its launcher on a PLAA page other than activities', async () => {
  mockPathname = '/alignment-asset/leaderboard';

  render(<PlaaLayoutWrapper>page</PlaaLayoutWrapper>);

  await waitFor(() => expect(init).toHaveBeenCalledTimes(1));
  expect(init).toHaveBeenCalledWith(expect.objectContaining({ launcher: true }));
});

test('initialises the bot once while the member moves between PLAA pages', async () => {
  mockPathname = '/alignment-asset/overview';
  const { rerender } = render(<PlaaLayoutWrapper>page</PlaaLayoutWrapper>);
  await waitFor(() => expect(init).toHaveBeenCalledTimes(1));

  mockPathname = '/alignment-asset/kudos';
  rerender(<PlaaLayoutWrapper>other page</PlaaLayoutWrapper>);

  await waitFor(() => expect(init).toHaveBeenCalledTimes(1));
});

test('opens the bot for a mapped activity when the member submits it on the activities page', async () => {
  mockPathname = '/alignment-asset/activities';
  const windowOpen = jest.spyOn(window, 'open').mockImplementation(() => null);

  render(
    <PlaaLayoutWrapper>
      <ActivityTable activities={[mappedActivity]} onRowClick={jest.fn()} />
    </PlaaLayoutWrapper>,
  );
  await waitFor(() => expect(init).toHaveBeenCalled());

  fireEvent.click(screen.getAllByRole('button', { name: /submit/i })[0]);

  expect(open).toHaveBeenCalledWith({ activityId: resolvePlaaBotActivityId(mappedActivity.id) });
  expect(windowOpen).not.toHaveBeenCalled();
});
