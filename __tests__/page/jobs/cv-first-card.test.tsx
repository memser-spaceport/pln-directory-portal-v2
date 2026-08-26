import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The drawer's "Start with your CV" card — the importer's *other* host.
 *
 * What this guards is the difference between the two hosts. The section's door
 * is a pill inside an empty row ("Upload your CV") that reveals the drop area;
 * this card IS the drop area, because the thing that got you here already says
 * what it is. A landing screen offering a button that reveals a button would be
 * the card not taking its own title at its word.
 */

const mockExperiences = jest.fn();
jest.mock('@/services/members/hooks/useMemberExperience', () => ({
  useMemberExperience: () => mockExperiences(),
}));

jest.mock('@/hooks/useMobileNavVisibility', () => ({
  useMobileNavVisibility: jest.fn(),
}));

jest.mock('@/analytics/members.analytics', () => ({
  useMemberAnalytics: () => mockAnalytics,
}));

const mockParse = jest.fn();
jest.mock('@/services/members/hooks/useParseCv', () => ({
  useParseCv: () => ({ parse: mockParse, abort: mockAbort, isParsing: false, error: null }),
}));

const mockApply = jest.fn();
jest.mock('@/services/members/hooks/useApplyCvImport', () => ({
  useApplyCvImport: () => ({ mutateAsync: mockApply }),
}));

jest.mock('@/components/ui/LocationSelect', () => ({
  LocationSelect: () => <div data-testid="location-select" />,
}));

const mockAbort = jest.fn();

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

import { CvFirstCard } from '@/components/page/jobs/JobProfileDrawer/CvFirstCard';
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

const parsed = {
  importUid: 'import-1',
  role: 'Protocol Engineer',
  location: 'Berlin, Germany',
  skills: ['Rust'],
  experiences: [
    {
      key: 'k1',
      title: 'Protocol Engineer',
      company: 'Lattice Compute',
      description: '',
      startDate: '2021-03',
      endDate: null,
      isCurrent: true,
      location: 'Berlin, Germany',
    },
  ],
};

const renderCard = (onHandOff = jest.fn()) => {
  mockExperiences.mockReturnValue({ data: [], isLoading: false });
  render(<CvFirstCard member={member} onHandOff={onHandOff} />);
  return onHandOff;
};

const pickFile = () => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['cv'], 'polina-cv.pdf', { type: 'application/pdf' });
  fireEvent.change(input, { target: { files: [file] } });
};

describe('the drawer’s "Start with your CV" card', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows the drop area straight away, with no door to open first', () => {
    renderCard();

    expect(screen.getByText('Start with your CV')).toBeInTheDocument();
    // The offer's own sentence — the one that names the work avoided.
    expect(screen.getByText(/so you don't have to type it all in/i)).toBeInTheDocument();
    // `direct` entry: the section's revealing pill must not be here.
    expect(screen.queryByRole('button', { name: /^upload your cv$/i })).not.toBeInTheDocument();
    expect(document.querySelector('input[type="file"]')).toBeInTheDocument();
  });

  /**
   * The promise the job board has to make and no other surface does: the file
   * could plausibly be forwarded to a hiring team here, so "we read it, we don't
   * send it" is the sentence someone is actually wondering about.
   */
  it('makes the drawer’s own privacy promise, not the generic one', () => {
    renderCard();

    expect(screen.getByText(/isn't sent with your applications/i)).toBeInTheDocument();
  });

  it('swaps itself for the review once a document is read', async () => {
    mockParse.mockResolvedValue(parsed);
    renderCard();

    pickFile();

    await waitFor(() => expect(screen.getByText(/Lattice Compute/)).toBeInTheDocument());
    // The offer is gone: one card, two states, never both at once.
    expect(screen.queryByText(/so you don't have to type it all in/i)).not.toBeInTheDocument();
    expect(mockAnalytics.onCvImportParseSucceeded).toHaveBeenCalledWith(
      expect.objectContaining({ experiences_found: 1, has_role: true }),
    );
  });

  /**
   * The dead end's second way out. The Add form lives inside the Experience
   * section two cards below and cannot be opened from here, so the card stands
   * down and lets the section — which has its own Add button — take over.
   */
  it('hands the importer back when a failed read sends someone to add it by hand', async () => {
    mockParse.mockRejectedValue(new Error('boom'));
    const onHandOff = renderCard();

    pickFile();

    const addManually = await screen.findByRole('button', { name: /add manually/i });
    fireEvent.click(addManually);

    expect(onHandOff).toHaveBeenCalled();
  });

  /**
   * The host drops this card when the profile stops being blank — but that is a
   * refetch away, and `mutateAsync` resolves before the new record lands. The
   * gap must not be spent back on the opening offer, telling someone who just
   * filled their profile in from a CV to start with their CV.
   */
  it('stands down after a save instead of returning to its offer', async () => {
    mockParse.mockResolvedValue(parsed);
    mockApply.mockResolvedValue({});
    renderCard();

    pickFile();
    await waitFor(() => expect(screen.getByText(/Lattice Compute/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mockApply).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText('Start with your CV')).not.toBeInTheDocument());
    expect(screen.queryByText(/so you don't have to type it all in/i)).not.toBeInTheDocument();
  });

  /** The mirror of the above: a save that fails keeps the selection on screen. */
  it('keeps the review up when the save is rejected', async () => {
    mockParse.mockResolvedValue(parsed);
    mockApply.mockRejectedValue(new Error('nope'));
    renderCard();

    pickFile();
    await waitFor(() => expect(screen.getByText(/Lattice Compute/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(mockAnalytics.onCvImportSaveFailed).toHaveBeenCalled());
    expect(screen.getByText(/Lattice Compute/)).toBeInTheDocument();
  });

  it('reports leaving the review, which no other event can tell you', async () => {
    mockParse.mockResolvedValue(parsed);
    renderCard();

    pickFile();
    await waitFor(() => expect(screen.getByText(/Lattice Compute/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockAnalytics.onCvImportCancelled).toHaveBeenCalledWith('review');
    // And it is back to being the offer.
    expect(screen.getByText(/so you don't have to type it all in/i)).toBeInTheDocument();
  });
});
