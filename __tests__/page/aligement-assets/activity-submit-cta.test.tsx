import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import ActivityTable from '@/components/page/aligement-assets/activities/sections/activity-table';
import ActivityDetailModal from '@/components/page/aligement-assets/activities/sections/activity-detail-modal';
import { Activity } from '@/components/page/aligement-assets/activities/types';
import { ACTIVITY_FORM_URL } from '@/constants/plaa';
import { openPlaaBotForActivity } from '@/components/core/plaa-bot/plaa-bot.utils';

const onActivitiesFormLinkClicked = jest.fn();
const onActivitiesModalLinkClicked = jest.fn();

jest.mock('@/analytics/alignment-assets.analytics', () => ({
  useAlignmentAssetsAnalytics: () => ({
    onActivitiesFormLinkClicked,
    onActivitiesModalLinkClicked,
    onActivitiesRowClicked: jest.fn(),
    onActivitiesModalClosed: jest.fn(),
  }),
}));

jest.mock('@/components/core/ToastContainer', () => ({
  toast: { success: jest.fn() },
}));

jest.mock('@/components/core/plaa-bot/plaa-bot.utils', () => ({
  openPlaaBotForActivity: jest.fn(),
}));

const openBot = openPlaaBotForActivity as jest.Mock;

const activity: Activity = {
  id: 'network-introduction',
  category: 'Programs',
  activity: 'Make a Network Introduction',
  networkValue: 'Connects people',
  points: '500',
  frequency: 'Repeatable',
  cta: 'submit',
  popupContent: { title: 'Make a Network Introduction', overview: 'Introduce two people.' },
};

describe('activity submit CTA', () => {
  let windowOpen: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    windowOpen = jest.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    windowOpen.mockRestore();
  });

  describe('activity table', () => {
    it('opens the bot and skips the form when the bot handles the activity', () => {
      openBot.mockReturnValue(true);
      render(<ActivityTable activities={[activity]} onRowClick={jest.fn()} />);

      fireEvent.click(screen.getAllByRole('button', { name: 'Submit' })[0]);

      expect(openBot).toHaveBeenCalledWith('network-introduction');
      expect(windowOpen).not.toHaveBeenCalled();
      expect(onActivitiesFormLinkClicked).toHaveBeenCalledWith(
        expect.objectContaining({ activityId: 'network-introduction' }),
        'plaa-bot',
      );
    });

    it('falls back to the form when the bot does not handle the activity', () => {
      openBot.mockReturnValue(false);
      render(<ActivityTable activities={[activity]} onRowClick={jest.fn()} />);

      fireEvent.click(screen.getAllByRole('button', { name: 'Submit' })[0]);

      expect(windowOpen).toHaveBeenCalledWith(ACTIVITY_FORM_URL, '_blank', 'noopener,noreferrer');
      expect(onActivitiesFormLinkClicked).toHaveBeenCalledWith(
        expect.objectContaining({ activityId: 'network-introduction' }),
        ACTIVITY_FORM_URL,
      );
    });

    it('never asks the bot for a confirm activity', () => {
      render(<ActivityTable activities={[{ ...activity, cta: 'confirm' }]} onRowClick={jest.fn()} />);

      fireEvent.click(screen.getAllByRole('button', { name: 'Confirm' })[0]);

      expect(openBot).not.toHaveBeenCalled();
      expect(windowOpen).not.toHaveBeenCalled();
    });
  });

  describe('activity detail modal', () => {
    it('opens the bot, closes the modal and skips the form when the bot handles the activity', () => {
      openBot.mockReturnValue(true);
      const onClose = jest.fn();
      render(<ActivityDetailModal isOpen activity={activity} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      expect(openBot).toHaveBeenCalledWith('network-introduction');
      expect(windowOpen).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
      expect(onActivitiesModalLinkClicked).toHaveBeenCalledWith(
        expect.objectContaining({ activityId: 'network-introduction' }),
        'Submit Activity Button',
        'plaa-bot',
      );
    });

    it('falls back to the form when the bot does not handle the activity', () => {
      openBot.mockReturnValue(false);
      const onClose = jest.fn();
      render(<ActivityDetailModal isOpen activity={activity} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: /submit/i }));

      expect(windowOpen).toHaveBeenCalledWith(ACTIVITY_FORM_URL, '_blank', 'noopener,noreferrer');
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
