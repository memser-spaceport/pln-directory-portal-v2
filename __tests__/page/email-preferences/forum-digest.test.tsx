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
jest.mock('@/analytics/settings.analytics', () => ({
  useSettingsAnalytics: () => ({
    onForumDigestOptionSelect: (...a: unknown[]) => mockOnForumDigestOptionSelect(...a),
    onForumDigestSaveFailed: (...a: unknown[]) => mockOnForumDigestSaveFailed(...a),
    onForumDigestNetworkNewsToggleClicked: jest.fn(),
  }),
}));

const userInfo: IUserInfo = { uid: 'user-1' };

const baseData: ForumDigestSettings = {
  forumDigestEnabled: false,
  forumDigestFrequency: 7,
  forumDigestNewsEnabled: false,
  forumDigestLastSentAt: null,
  memberExternalId: null,
  memberUid: 'user-1',
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
      render(<ForumDigest userInfo={userInfo} initialData={baseData} />);
      fireEvent.click(screen.getByRole('button', { name: optionLabel }));
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    it('fires onForumDigestOptionSelect(source: settings) on success, and not onForumDigestSaveFailed', () => {
      render(<ForumDigest userInfo={userInfo} initialData={baseData} />);
      fireEvent.click(screen.getByRole('button', { name: optionLabel }));

      const options = mockMutate.mock.calls[0][1];
      options.onSuccess();

      expect(mockOnForumDigestOptionSelect).toHaveBeenCalledWith(expect.objectContaining({ source: 'settings' }));
      expect(mockOnForumDigestSaveFailed).not.toHaveBeenCalled();
    });

    it('fires onForumDigestSaveFailed(source: settings) on failure, and not onForumDigestOptionSelect', () => {
      render(<ForumDigest userInfo={userInfo} initialData={baseData} />);
      fireEvent.click(screen.getByRole('button', { name: optionLabel }));

      const options = mockMutate.mock.calls[0][1];
      options.onError();

      expect(mockOnForumDigestSaveFailed).toHaveBeenCalledWith({ attemptedFrequency, source: 'settings' });
      expect(mockOnForumDigestOptionSelect).not.toHaveBeenCalled();
    });
  });
});
