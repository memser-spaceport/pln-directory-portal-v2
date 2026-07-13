import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import {
  buildCorrection,
  correctionSummary,
  WarmPathDetail,
} from '@/components/page/investors/WarmPathDetail/WarmPathDetail';
import type { PathCorrection, PathfinderPath } from '@/services/investors/types';

const mockMutateAsync = jest.fn();
const mockTrackCorrectionSubmitted = jest.fn();
const mockPaths = jest.fn<PathfinderPath[], []>();

jest.mock('@/services/investors/hooks/useGetPathsForTarget', () => ({
  useGetPathsForTarget: () => ({
    data: { target_investor_id: 'inv-1', total: mockPaths().length, paths: mockPaths() },
    isLoading: false,
  }),
}));

jest.mock('@/services/investors/hooks/useSubmitCorrection', () => ({
  useSubmitCorrection: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
}));

jest.mock('@/analytics/investors.analytics', () => ({
  useInvestorsAnalytics: () => ({
    trackPathsViewed: jest.fn(),
    trackPathExpanded: jest.fn(),
    trackCorrectionSubmitted: mockTrackCorrectionSubmitted,
  }),
}));

function path(overrides: Partial<PathfinderPath>): PathfinderPath {
  return {
    id: 1,
    target_investor_id: 'inv-1',
    connector_type: 'F',
    hops: 1,
    caliber: 'A',
    proximity_code: 'F+1A',
    score: 0.8,
    caliber_confidence: 0.9,
    hop_chain: { nodes: [], edges: [], explanation: '' },
    rank: 1,
    corrections: [],
    ...overrides,
  };
}

function correction(overrides: Partial<PathCorrection>): PathCorrection {
  return {
    id: 1,
    field: 'caliber',
    old_value: 'B',
    new_value: 'A',
    note: null,
    actor_email: 'admin@pl.network',
    created_at: '2026-06-12T10:00:00.000Z',
    ...overrides,
  };
}

describe('buildCorrection', () => {
  const p = path({ id: 190, caliber: 'B', connector_type: 'VC' });

  it('always targets the given path (subject_type path, subject_id = path id)', () => {
    for (const reason of ['caliber_too_high', 'caliber_too_low', 'wrong_connector', 'path_invalid', 'other'] as const) {
      const c = buildCorrection(p, reason, 'note', 'JB');
      expect(c.subject_type).toBe('path');
      expect(c.subject_id).toBe('190');
    }
  });

  it('maps caliber reasons to field caliber with old/new values', () => {
    expect(buildCorrection(p, 'caliber_too_low', 'n', '')).toEqual({
      subject_type: 'path',
      subject_id: '190',
      field: 'caliber',
      old_value: 'B',
      new_value: 'A',
      note: 'n',
    });
    expect(buildCorrection(p, 'caliber_too_high', 'n', '')).toMatchObject({ field: 'caliber', new_value: 'B' });
  });

  it('maps wrong_connector to field connector_type carrying the chosen connector', () => {
    expect(buildCorrection(p, 'wrong_connector', '', 'JB')).toEqual({
      subject_type: 'path',
      subject_id: '190',
      field: 'connector_type',
      old_value: 'VC',
      new_value: 'JB',
      note: '',
    });
  });

  it('maps path_invalid to field valid true->false', () => {
    expect(buildCorrection(p, 'path_invalid', '', '')).toMatchObject({
      field: 'valid',
      old_value: true,
      new_value: false,
    });
  });

  it('maps other to a bare note correction', () => {
    expect(buildCorrection(p, 'other', 'free text', '')).toEqual({
      subject_type: 'path',
      subject_id: '190',
      field: 'note',
      note: 'free text',
    });
  });
});

describe('WarmPathDetail per-path corrections', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMutateAsync.mockResolvedValue(true);
    mockPaths.mockReturnValue([path({ id: 10, rank: 1 }), path({ id: 20, rank: 2, caliber: 'B' })]);
  });

  it('renders a correction affordance per path, not one per investor', () => {
    render(<WarmPathDetail investorId="inv-1" canEdit />);
    fireEvent.click(screen.getByText(/Show .* more/));
    expect(screen.getAllByRole('button', { name: 'Suggest a correction' })).toHaveLength(2);
  });

  it('submits the correction against the clicked path, not the best path', async () => {
    render(<WarmPathDetail investorId="inv-1" canEdit />);
    fireEvent.click(screen.getByText(/Show .* more/));
    fireEvent.click(screen.getAllByRole('button', { name: 'Suggest a correction' })[1]);
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ subject_type: 'path', subject_id: '20' }));
    expect(mockTrackCorrectionSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({ investorId: 'inv-1', pathId: 20 }),
    );
  });

  it('requires a replacement connector before submitting wrong_connector', async () => {
    render(<WarmPathDetail investorId="inv-1" canEdit />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Suggest a correction' })[0]);
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'wrong_connector' } });

    expect(screen.getByText('Submit')).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Correct connector'), { target: { value: 'JB' } });
    expect(screen.getByText('Submit')).toBeEnabled();
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ subject_id: '10', field: 'connector_type', old_value: 'F', new_value: 'JB' }),
    );
  });

  it('hides correction affordances without edit permission', () => {
    render(<WarmPathDetail investorId="inv-1" canEdit={false} />);
    expect(screen.queryByRole('button', { name: 'Suggest a correction' })).not.toBeInTheDocument();
  });
});

describe('pending corrections display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPaths.mockReturnValue([
      path({
        id: 10,
        corrections: [
          correction({ id: 1 }),
          correction({ id: 2, field: 'valid', old_value: true, new_value: false, note: 'left the firm' }),
        ],
      }),
    ]);
  });

  it('shows already-submitted corrections with summary, note and actor', () => {
    render(<WarmPathDetail investorId="inv-1" canEdit />);
    expect(screen.getAllByText('Pending correction')).toHaveLength(2);
    expect(screen.getByText('Caliber B → A')).toBeInTheDocument();
    expect(screen.getByText('Marked invalid')).toBeInTheDocument();
    expect(screen.getByText('“left the firm”')).toBeInTheDocument();
    expect(screen.getAllByText(/admin@pl\.network/)).toHaveLength(2);
  });

  it('shows pending corrections to viewers without edit permission', () => {
    render(<WarmPathDetail investorId="inv-1" canEdit={false} />);
    expect(screen.getAllByText('Pending correction')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Suggest a correction' })).not.toBeInTheDocument();
  });

  it('summarizes connector corrections with human labels', () => {
    expect(correctionSummary(correction({ field: 'connector_type', old_value: 'F', new_value: 'JB' }))).toBe(
      'Connector Portfolio founder → JB rolodex',
    );
    expect(correctionSummary(correction({ field: 'note', note: 'x' }))).toBe('Note');
  });
});

describe('WarmPathDetail path warmth and attribution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows Path warmth % on proximity badge and attribution bullets', () => {
    mockPaths.mockReturnValue([
      path({
        id: 10,
        rank: 1,
        score: 0.72,
        hop_chain: {
          nodes: [],
          edges: [],
          explanation: 'Filecoin ecosystem investor.',
          attribution_lines: [
            { source: 'Affinity', text: 'Brad Holden last emailed ~4 months ago (tie 0.10)' },
            { source: 'LinkedIn', text: 'Lacey and Dan worked at Eniac Ventures (2021–2022)' },
          ],
        },
      }),
    ]);
    render(<WarmPathDetail investorId="inv-1" canEdit={false} />);
    expect(screen.getByText('72%')).toBeInTheDocument();
    expect(screen.getByText('Best path')).toBeInTheDocument();
    expect(screen.getByText('How strong this intro route is')).toBeInTheDocument();
    expect(screen.getByText('Filecoin ecosystem investor.')).toBeInTheDocument();
    expect(
      screen.getByText('Affinity: Brad Holden last emailed ~4 months ago (tie 0.10)'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('LinkedIn: Lacey and Dan worked at Eniac Ventures (2021–2022)'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'About path warmth' })).not.toBeInTheDocument();
  });

  it('falls back to explanation when attribution_lines are absent', () => {
    mockPaths.mockReturnValue([
      path({
        id: 10,
        hop_chain: {
          nodes: [],
          edges: [],
          explanation: 'Legacy blob with Best connector: Brad Holden.',
        },
      }),
    ]);
    render(<WarmPathDetail investorId="inv-1" canEdit={false} />);
    expect(screen.getByText('Legacy blob with Best connector: Brad Holden.')).toBeInTheDocument();
  });
});

describe('WarmPathDetail contact details toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hides contact channels behind a toggle and reveals them on click', () => {
    mockPaths.mockReturnValue([
      path({
        id: 10,
        rank: 1,
        hop_chain: {
          nodes: [],
          edges: [],
          explanation: '',
          routeNodes: [{ label: 'Alice', variant: 'member' }],
        },
        contact: {
          name: 'Alicia Mer',
          member_uid: 'alicia-mer',
          email: 'alicia@modularglobe.xyz',
          linkedin_url: 'https://www.linkedin.com/in/alicia-mer',
        },
      }),
    ]);
    render(<WarmPathDetail investorId="inv-1" canEdit />);

    expect(screen.queryByText('alicia@modularglobe.xyz')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Contact details/i }));
    expect(screen.getByText('alicia@modularglobe.xyz')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/alicia-mer',
    );
    fireEvent.click(screen.getByRole('button', { name: /Contact details/i }));
    expect(screen.queryByText('alicia@modularglobe.xyz')).not.toBeInTheDocument();
  });

  it('does not render the toggle when the route chain is empty', () => {
    mockPaths.mockReturnValue([path({ id: 11, rank: 1, contact: { name: 'No Channels' } })]);
    render(<WarmPathDetail investorId="inv-1" canEdit />);
    expect(screen.queryByRole('button', { name: /Contact details/i })).not.toBeInTheDocument();
  });
});
