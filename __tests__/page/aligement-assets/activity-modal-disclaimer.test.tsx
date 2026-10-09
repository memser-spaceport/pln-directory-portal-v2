import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import ActivityDetailModal from '@/components/page/aligement-assets/activities/sections/activity-detail-modal';
import { activitiesData } from '@/components/page/aligement-assets/activities/data/activities.data';
import { toast } from '@/components/core/ToastContainer';

jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({ onActivitiesModalLinkClicked: jest.fn() }),
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: jest.fn() },
}));

function openModal(id: string) {
  const activity = activitiesData.activities.find((item) => item.id === id);
  if (!activity) throw new Error(`No activity with id ${id}`);
  render(<ActivityDetailModal isOpen onClose={jest.fn()} activity={activity} />);
  return activity;
}

describe('activity popup disclaimer and CTA', () => {
  let windowOpen: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    windowOpen = jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    windowOpen.mockRestore();
  });

  it('shows the disclaimer of Submit a Deal Debrief and opens the Deal Debrief app without an opener', () => {
    const activity = openModal('submit-deal-debrief');

    expect(screen.getByText(activity.popupContent.disclaimer as string)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    expect(windowOpen).toHaveBeenCalledWith(
      expect.stringMatching(/^\/pl-infra\/ai-apps\/[a-z0-9]+$/),
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('shows no disclaimer for Book Office Hours and confirms without navigation', () => {
    openModal('book-office-hours');

    expect(screen.queryByText(/Disclaimer:/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));

    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(windowOpen).not.toHaveBeenCalled();
  });

  it('gives every link in the two new activities an in-site path or a mailto address', () => {
    const urls = ['submit-deal-debrief', 'book-office-hours'].flatMap((id) => {
      const popup = activitiesData.activities.find((item) => item.id === id)?.popupContent;
      return [popup?.ctaLink, ...(popup?.links ?? []).map((link) => link.url)].filter(Boolean);
    });

    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url).toMatch(/^(\/[^/]|mailto:[^@\s]+@plrs\.xyz$)/);
  });
});
