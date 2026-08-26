import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// The Places autocomplete is a network control; the card's contract with it is
// "hand me a resolved place", which this stubs to one button.
const resolvedPlace = {
  city: 'Berlin',
  continent: 'Europe',
  country: 'Germany',
  latitude: 52.52,
  longitude: 13.4,
  metroArea: null,
  placeId: 'place-1',
  region: 'Berlin',
  regionAbbreviation: 'BE',
};

const mockLocationSelect = jest.fn();
jest.mock('@/components/ui/LocationSelect', () => ({
  LocationSelect: (props: { onSelect: (p: unknown) => void; defaultInputValue?: string }) => {
    mockLocationSelect(props);
    return (
      <button type="button" onClick={() => props.onSelect(resolvedPlace)}>
        pick-place
      </button>
    );
  },
}));

import {
  ExperienceImportReview,
  formatParsedDates,
} from '@/components/page/member-details/ExperienceDetails/components/ExperienceImport';
import type {
  ImportSelection,
  ParsedProfile,
} from '@/components/page/member-details/ExperienceDetails/components/ExperienceImport';

const parsed: ParsedProfile = {
  importUid: 'import-1',
  role: 'Senior Protocol Engineer',
  location: 'Berlin, Germany',
  skills: ['Rust', 'libp2p'],
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
    {
      key: 'p2',
      title: 'Protocol Engineer',
      company: 'Meridian Labs',
      description: '',
      startDate: '2018-09',
      endDate: '2021-02',
      isCurrent: false,
      location: 'Remote',
    },
  ],
};

const renderReview = (
  over: Partial<React.ComponentProps<typeof ExperienceImportReview>> = {},
  onSubmit: (s: ImportSelection) => void | Promise<void> = jest.fn(),
) =>
  render(
    <ExperienceImportReview
      parsed={parsed}
      currentRole=""
      hasLocation={false}
      currentSkills={[]}
      formatDates={formatParsedDates}
      onClose={jest.fn()}
      onSubmit={onSubmit}
      {...over}
    />,
  );

const save = () => fireEvent.click(screen.getByRole('button', { name: /^save$/i }));

describe('ExperienceImportReview', () => {
  beforeEach(() => jest.clearAllMocks());

  it('counts what the document held, not what is ticked', () => {
    renderReview();

    expect(screen.getByText('Experience (2 found)')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('checkbox')[0]);

    // Unticking a row is an edit, not a fact about the file.
    expect(screen.getByText('Experience (2 found)')).toBeInTheDocument();
  });

  it('pre-unticks a row already on the profile and says why, without hiding it', () => {
    renderReview({
      currentExperiences: [{ title: 'Senior Protocol Engineer', company: 'Lattice Compute', startDate: '2021-03' }],
    });

    expect(screen.getByText(/already on your profile/i)).toBeInTheDocument();

    const boxes = screen.getAllByRole('checkbox');
    expect(boxes[0]).not.toBeChecked();
    expect(boxes[1]).toBeChecked();
    // Shown, not filtered — the count still reports what the document held.
    expect(screen.getByText('Experience (2 found)')).toBeInTheDocument();
  });

  it('matches duplicates ignoring the end date — a job that ended is the same job', () => {
    renderReview({
      currentExperiences: [
        // Same role/company/start, different end: this is the "newer CV" case.
        { title: 'senior protocol engineer', company: '  Lattice Compute ', startDate: '2021-03' },
      ],
    });

    expect(screen.getAllByRole('checkbox')[0]).not.toBeChecked();
  });

  it('offers only the skills the profile does not already have', () => {
    renderReview({ currentSkills: ['rust'] });

    expect(screen.getByText('Skills (1 found)')).toBeInTheDocument();
    expect(screen.getByText('libp2p')).toBeInTheDocument();
    expect(screen.queryByText('Rust')).not.toBeInTheDocument();
  });

  it('asks for role and location only when the profile lacks them', () => {
    const { unmount } = renderReview({ currentRole: 'Protocol Lead', hasLocation: true });
    expect(screen.queryByText('Current role')).not.toBeInTheDocument();
    expect(screen.queryByText('Location')).not.toBeInTheDocument();
    unmount();

    renderReview();
    expect(screen.getByText('Current role')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
  });

  it('seeds the place picker with what the document said', () => {
    renderReview();
    expect(mockLocationSelect).toHaveBeenCalledWith(expect.objectContaining({ defaultInputValue: 'Berlin, Germany' }));
    expect(screen.getByText(/your CV says Berlin, Germany/i)).toBeInTheDocument();
  });

  it('sends a resolved place, never the string off the document', async () => {
    const onSubmit = jest.fn();
    renderReview({}, onSubmit);

    fireEvent.click(screen.getByRole('button', { name: 'pick-place' }));
    save();

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].location).toEqual(resolvedPlace);
  });

  it('leaves location null when nothing was picked', async () => {
    const onSubmit = jest.fn();
    renderReview({}, onSubmit);

    save();

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].location).toBeNull();
  });

  it('strips its own row state out of the selection', async () => {
    const onSubmit = jest.fn();
    renderReview({}, onSubmit);

    save();

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const [entry] = onSubmit.mock.calls[0][0].experiences;
    // `include` and `duplicate` are this card's bookkeeping and belong to nobody
    // else. Both used to leak: the original stripped only `include`.
    expect(entry).not.toHaveProperty('include');
    expect(entry).not.toHaveProperty('duplicate');
    // `key` survives on purpose — an `ImportSelection` is still a UI proposal.
    // It is dropped one layer up, where the proposal becomes a wire payload.
    expect(entry).toHaveProperty('key');
    expect(entry.title).toBe('Senior Protocol Engineer');
  });

  it('sends no role when the card never asked for one', async () => {
    const onSubmit = jest.fn();
    renderReview({ currentRole: 'Protocol Lead' }, onSubmit);

    save();

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    // '' means "leave it alone" — not an echo of what is already stored.
    expect(onSubmit.mock.calls[0][0].role).toBe('');
  });

  it('blocks Save on a missing start date, and only complains after the first press', async () => {
    const onSubmit = jest.fn();
    const noDate: ParsedProfile = {
      ...parsed,
      experiences: [{ ...parsed.experiences[0], startDate: '' }],
    };
    renderReview({ parsed: noDate }, onSubmit);

    expect(screen.getByText(/no dates in the document/i)).toBeInTheDocument();
    expect(screen.queryByText(/start date is required/i)).not.toBeInTheDocument();

    save();

    await waitFor(() => expect(screen.getByText(/start date is required/i)).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('closes instead of posting when there is nothing to save', async () => {
    const onSubmit = jest.fn();
    const onClose = jest.fn();
    renderReview(
      { currentRole: 'Protocol Lead', hasLocation: true, currentSkills: ['Rust', 'libp2p'], onClose },
      onSubmit,
    );

    // Untick everything the card offered.
    screen.getAllByRole('checkbox').forEach((box) => fireEvent.click(box));
    save();

    // The press still means something — it just means "close", not "post nothing".
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the card and the selection when Save fails', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('500'));
    renderReview({}, onSubmit);

    save();

    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn’t save that just now/i);
    // Still here, still ticked — a second press is one press.
    expect(screen.getByText('Experience (2 found)')).toBeInTheDocument();
    screen.getAllByRole('checkbox').forEach((box) => expect(box).toBeChecked());
  });
});
