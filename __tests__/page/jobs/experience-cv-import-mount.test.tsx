import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * Does the importer appear where it is supposed to, and stay away where it
 * isn't?
 *
 * `ExperienceDetails` is shared with `/members/[id]`, which must not offer this
 * — so "off unless asked" is a contract, not a default. And the two on-states
 * are different controls in different places: the drop area lives in the empty
 * row, the "Update from CV" button lives in the header and only once there is
 * something to update.
 */

const mockExperiences = jest.fn();
jest.mock('@/services/members/hooks/useMemberExperience', () => ({
  useMemberExperience: () => mockExperiences(),
}));

jest.mock('@/services/access-control/hooks/useMemberContactsAccess', () => ({
  useMemberContactsAccess: () => ({ hasAccess: true }),
}));

jest.mock('@/hooks/useMobileNavVisibility', () => ({
  useMobileNavVisibility: jest.fn(),
}));

jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => mockAnalytics,
}));

const mockParse = jest.fn();
jest.mock('@/services/members/hooks/useParseCv', () => ({
  useParseCv: () => ({ parse: mockParse, abort: jest.fn(), isParsing: false, error: null }),
}));

const mockApply = jest.fn();
jest.mock('@/services/members/hooks/useApplyCvImport', () => ({
  useApplyCvImport: () => ({ mutateAsync: mockApply }),
}));

// The Places autocomplete is a network control; the review's contract with it is
// "hand me a resolved place".
jest.mock('@/components/ui/LocationSelect', () => ({
  LocationSelect: () => <div data-testid="location-select" />,
}));

const mockAnalytics = {
  onAddExperienceDetailsClicked: jest.fn(),
  onEditExperienceDetailsClicked: jest.fn(),
  onCvImportOpened: jest.fn(),
  onCvImportParseSucceeded: jest.fn(),
  onCvImportParseEmpty: jest.fn(),
  onCvImportParseFailed: jest.fn(),
  onCvImportSaved: jest.fn(),
  onCvImportSaveFailed: jest.fn(),
  onCvImportCancelled: jest.fn(),
};

// The manual editor drags in react-quill and the experience server action;
// nothing here opens it.
jest.mock('@/components/page/member-details/ExperienceDetails/components/EditExperienceForm', () => ({
  EditExperienceForm: () => null,
}));

import { ExperienceDetails } from '@/components/page/member-details/ExperienceDetails';
import type { IMember } from '@/types/members.types';

const member = {
  id: 'member-1',
  name: 'Polina Bublii',
  skills: [],
  location: null,
  teams: [],
  teamAndRoles: [],
  repositories: [],
} as unknown as IMember;

const userInfo = { uid: 'member-1', name: 'Polina Bublii', email: 'p@example.com' };

const entry = {
  uid: 'exp-1',
  memberId: 'member-1',
  title: 'Protocol Engineer',
  company: 'Lattice Compute',
  location: 'Berlin, Germany',
  startDate: '2021-03-01T00:00:00.000Z',
  endDate: '2024-01-01T00:00:00.000Z',
  isCurrent: false,
  isFlaggedByUser: false,
  description: '',
};

const renderSection = (opts: { enableCvImport?: boolean; entries?: unknown[] }) => {
  mockExperiences.mockReturnValue({ data: opts.entries ?? [], isLoading: false });
  return render(
    <ExperienceDetails member={member} userInfo={userInfo as never} isLoggedIn enableCvImport={opts.enableCvImport} />,
  );
};

describe('CV import inside the Experience section', () => {
  beforeEach(() => jest.clearAllMocks());

  it('offers nothing when the host has not asked for it — the member profile page case', () => {
    renderSection({ entries: [] });

    expect(screen.queryByRole('button', { name: /upload your cv/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /update from cv/i })).not.toBeInTheDocument();
    // The section's own empty sentence is still there — turning the importer off
    // must not take the empty state with it.
    expect(screen.getByText(/share your work history and skills/i)).toBeInTheDocument();
  });

  it('puts the door in the empty row, under the sentence that was already there', () => {
    renderSection({ enableCvImport: true, entries: [] });

    expect(screen.getByRole('button', { name: /upload your cv/i })).toBeInTheDocument();
    expect(screen.getByText(/share your work history and skills/i)).toBeInTheDocument();
    // Nothing to update yet.
    expect(screen.queryByRole('button', { name: /update from cv/i })).not.toBeInTheDocument();
  });

  it('moves the offer to the header once there is a history to refresh', () => {
    renderSection({ enableCvImport: true, entries: [entry] });

    expect(screen.getByRole('button', { name: /update from cv/i })).toBeInTheDocument();
    // The empty row is gone, and its pill with it — an import offer standing
    // over a history someone has already written is nagging.
    expect(screen.queryByRole('button', { name: /upload your cv/i })).not.toBeInTheDocument();
    expect(screen.getByText('Protocol Engineer')).toBeInTheDocument();
  });

  it('keeps Add reachable in both states', () => {
    const { unmount } = renderSection({ enableCvImport: true, entries: [] });
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    unmount();

    renderSection({ enableCvImport: true, entries: [entry] });
    expect(screen.getByRole('button', { name: /^add$/i })).toBeInTheDocument();
  });
});

describe('the whole way through: drop a file, review it, save it', () => {
  beforeEach(() => jest.clearAllMocks());

  const parsedProfile = {
    role: 'Senior Protocol Engineer',
    location: 'Berlin, Germany',
    skills: ['Rust'],
    experiences: [
      {
        key: 'p1',
        title: 'Senior Protocol Engineer',
        company: 'Lattice Compute',
        description: '',
        startDate: '2021-03',
        endDate: null,
        isCurrent: true,
        location: 'Berlin, Germany',
      },
    ],
  };

  const dropCv = () => {
    fireEvent.click(screen.getByRole('button', { name: /upload your cv/i }));
    const cv = new File(['x'], 'cv.pdf', { type: 'application/pdf' });
    Object.defineProperty(cv, 'size', { value: 1024 });
    const box = screen.getByText('Drag & drop your CV').closest('div')!.parentElement!;
    fireEvent.drop(box, { dataTransfer: { files: [cv] } });
  };

  it('posts a payload with no React keys on it, and reports the save', async () => {
    mockParse.mockResolvedValue(parsedProfile);
    mockApply.mockResolvedValue(undefined);
    renderSection({ enableCvImport: true, entries: [] });

    dropCv();

    // The review card took over the section.
    expect(await screen.findByText('Review your experience')).toBeInTheDocument();
    expect(mockAnalytics.onCvImportParseSucceeded).toHaveBeenCalledWith(
      expect.objectContaining({ experiences_found: 1, has_role: true }),
    );

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() => expect(mockApply).toHaveBeenCalledTimes(1));

    const payload = mockApply.mock.calls[0][0];
    // `key` is React bookkeeping. This is the boundary where it dies.
    expect(payload.experiences[0]).not.toHaveProperty('key');
    expect(payload.experiences[0].title).toBe('Senior Protocol Engineer');
    expect(payload.role).toBe('Senior Protocol Engineer');
    // Nothing was picked in the stubbed place control.
    expect(payload.location).toBeNull();

    expect(mockAnalytics.onCvImportSaved).toHaveBeenCalledWith(
      expect.objectContaining({ experiences_selected: 1, experiences_offered: 1, filled_role: true }),
    );
  });

  it('reports an empty read as empty, not as a failure', async () => {
    mockParse.mockResolvedValue({ ...parsedProfile, experiences: [] });
    renderSection({ enableCvImport: true, entries: [] });

    dropCv();

    expect(await screen.findByText(/couldn’t find any roles in that file/i)).toBeInTheDocument();
    expect(mockAnalytics.onCvImportParseEmpty).toHaveBeenCalledTimes(1);
    expect(mockAnalytics.onCvImportParseFailed).not.toHaveBeenCalled();
  });
});
