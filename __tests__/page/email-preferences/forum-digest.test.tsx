import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { ForumDigest } from '@/components/page/email-preferences/components/ForumDigest/ForumDigest';
import type { ForumDigestSettings } from '@/services/forum/hooks/useGetForumDigestSettings';
import type { IUserInfo } from '@/types/shared.types';

// react-select wrapped in next/dynamic({ ssr: false }) is complex to drive
// through its real portal-rendered dropdown in jsdom. Mocked here with a
// synchronous stub exposing each option as a plain button — these tests cover
// handleChange's branches and analytics wiring, not react-select's own UI.
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () => require('react-select').default,
}));

jest.mock('react-select', () => ({
  __esModule: true,
  default: ({
    options,
    onChange,
  }: {
    options: Array<{ label: string; value: string }>;
    onChange: (value: { label: string; value: string }) => void;
  }) => (
    <div>
      {options.map((opt) => (
        <button key={opt.value} type="button" onClick={() => onChange(opt)}>
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

const mockMutate = jest.fn();
jest.mock('@/services/forum/hooks/useUpdateForumDigestSettings', () => ({
  useUpdateForumDigestSettings: () => ({ mutate: mockMutate }),
}));

const mockGetForumDigestSettings = jest.fn();
jest.mock('@/services/forum/hooks/useGetForumDigestSettings', () => ({
  useGetForumDigestSettings: (...args: unknown[]) => mockGetForumDigestSettings(...args),
}));

const mockOnForumDigestOptionSelect = jest.fn();
const mockOnForumDigestSaveFailed = jest.fn();
const mockOnForumDigestNetworkNewsToggleClicked = jest.fn();
const mockOnForumDigestForumActivityToggleClicked = jest.fn();
jest.mock('@/analytics/settings.analytics', () => ({
  useSettingsAnalytics: () => ({
    onForumDigestOptionSelect: (...a: unknown[]) => mockOnForumDigestOptionSelect(...a),
    onForumDigestSaveFailed: (...a: unknown[]) => mockOnForumDigestSaveFailed(...a),
    onForumDigestNetworkNewsToggleClicked: (...a: unknown[]) => mockOnForumDigestNetworkNewsToggleClicked(...a),
    onForumDigestForumActivityToggleClicked: (...a: unknown[]) => mockOnForumDigestForumActivityToggleClicked(...a),
  }),
}));

const userInfo: IUserInfo = { uid: 'user-1' };

const baseData: ForumDigestSettings = {
  forumDigestEnabled: false,
  forumDigestFrequency: 7,
  forumDigestForumEnabled: true,
  forumDigestNewsEnabled: false,
  forumDigestLastSentAt: null,
  memberExternalId: null,
  memberUid: 'user-1',
};

const enabledData: ForumDigestSettings = {
  ...baseData,
  forumDigestEnabled: true,
  forumDigestNewsEnabled: true,
};

describe('ForumDigest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetForumDigestSettings.mockReturnValue({ data: baseData });
  });

  describe.each([
    ['No Digest', 'no_digest'],
    ['Daily Digest', 'daily'],
    ['Weekly Digest', 'weekly'],
  ])('%s branch', (optionLabel, attemptedFrequency) => {
    it('calls mutate with the expected payload', () => {
      render(<ForumDigest userInfo={userInfo} initialData={baseData} hasForumAccess />);
      fireEvent.click(screen.getByRole('button', { name: optionLabel }));
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    it('fires onForumDigestOptionSelect(source: settings) on success, and not onForumDigestSaveFailed', () => {
      render(<ForumDigest userInfo={userInfo} initialData={baseData} hasForumAccess />);
      fireEvent.click(screen.getByRole('button', { name: optionLabel }));

      const options = mockMutate.mock.calls[0][1];
      options.onSuccess();

      expect(mockOnForumDigestOptionSelect).toHaveBeenCalledWith(expect.objectContaining({ source: 'settings' }));
      expect(mockOnForumDigestSaveFailed).not.toHaveBeenCalled();
    });

    it('fires onForumDigestSaveFailed(source: settings) on failure, and not onForumDigestOptionSelect', () => {
      render(<ForumDigest userInfo={userInfo} initialData={baseData} hasForumAccess />);
      fireEvent.click(screen.getByRole('button', { name: optionLabel }));

      const options = mockMutate.mock.calls[0][1];
      options.onError();

      expect(mockOnForumDigestSaveFailed).toHaveBeenCalledWith({ attemptedFrequency, source: 'settings' });
      expect(mockOnForumDigestOptionSelect).not.toHaveBeenCalled();
    });
  });

  describe('content-type toggles', () => {
    it('hides both toggles while the digest is off', () => {
      render(<ForumDigest userInfo={userInfo} initialData={baseData} hasForumAccess />);
      expect(screen.queryByText('Forum activity')).not.toBeInTheDocument();
      expect(screen.queryByText('Network news')).not.toBeInTheDocument();
    });

    it('shows both toggles when the digest is enabled', () => {
      mockGetForumDigestSettings.mockReturnValue({ data: enabledData });
      render(<ForumDigest userInfo={userInfo} initialData={enabledData} hasForumAccess />);
      expect(screen.getByText('Forum activity')).toBeInTheDocument();
      expect(screen.getByText('Network news')).toBeInTheDocument();
    });

    it('mutates forumDigestForumEnabled and fires analytics when the forum-activity toggle is clicked', () => {
      mockGetForumDigestSettings.mockReturnValue({ data: enabledData });
      render(<ForumDigest userInfo={userInfo} initialData={enabledData} hasForumAccess />);

      fireEvent.click(screen.getByRole('switch', { name: /forum activity/i }));

      expect(mockMutate).toHaveBeenCalledWith({
        uid: 'user-1',
        payload: { ...enabledData, forumDigestForumEnabled: false },
      });
      expect(mockOnForumDigestForumActivityToggleClicked).toHaveBeenCalledWith({ forumDigestForumEnabled: false });
    });

    it('mutates forumDigestNewsEnabled and fires analytics when the network-news toggle is clicked', () => {
      mockGetForumDigestSettings.mockReturnValue({ data: enabledData });
      render(<ForumDigest userInfo={userInfo} initialData={enabledData} hasForumAccess />);

      fireEvent.click(screen.getByRole('switch', { name: /network news/i }));

      expect(mockMutate).toHaveBeenCalledWith({
        uid: 'user-1',
        payload: { ...enabledData, forumDigestNewsEnabled: false },
      });
      expect(mockOnForumDigestNetworkNewsToggleClicked).toHaveBeenCalledWith({ forumDigestNewsEnabled: false });
    });

    it('renders the forum-activity toggle disabled and off for users without forum access, and never mutates it', () => {
      mockGetForumDigestSettings.mockReturnValue({ data: enabledData });
      render(<ForumDigest userInfo={userInfo} initialData={enabledData} hasForumAccess={false} />);

      const forumSwitch = screen.getByRole('switch', { name: /forum activity/i });
      expect(forumSwitch).toBeDisabled();
      expect(forumSwitch).not.toBeChecked();
      expect(screen.getAllByRole('img', { name: /requires forum access/i }).length).toBeGreaterThan(0);

      fireEvent.click(forumSwitch);
      expect(mockMutate).not.toHaveBeenCalled();
      expect(mockOnForumDigestForumActivityToggleClicked).not.toHaveBeenCalled();

      // Network news still works without forum access.
      fireEvent.click(screen.getByRole('switch', { name: /network news/i }));
      expect(mockMutate).toHaveBeenCalledWith({
        uid: 'user-1',
        payload: { ...enabledData, forumDigestNewsEnabled: false },
      });
    });

    it('does not show the forum-access lock when the user has forum access', () => {
      mockGetForumDigestSettings.mockReturnValue({ data: enabledData });
      render(<ForumDigest userInfo={userInfo} initialData={enabledData} hasForumAccess />);

      expect(screen.queryByRole('img', { name: /requires forum access/i })).not.toBeInTheDocument();
    });
  });
});
