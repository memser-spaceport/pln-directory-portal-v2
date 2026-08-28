import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { PathActions } from '@/components/page/investors/WarmIntrosV2Workspace/PathActions';

const mockFeedbackUpsert = jest.fn();
const mockNoteUpsert = jest.fn();
const mockAnalytics = {
  onWarmPathFeedbackOpened: jest.fn(),
  onWarmPathFeedbackSubmitted: jest.fn(),
  onWarmPathNoteOpened: jest.fn(),
  onWarmPathNoteSubmitted: jest.fn(),
  onWarmPathNoteCleared: jest.fn(),
};

jest.mock('@/services/investors/hooks/useWarmPathV2Feedback', () => ({
  useWarmPathV2Feedback: () => ({
    upsert: { mutate: mockFeedbackUpsert, isPending: false },
    clearRefer: { mutate: jest.fn(), isPending: false },
  }),
}));

jest.mock('@/services/investors/hooks/useWarmPathV2Note', () => ({
  useWarmPathV2Note: () => ({
    upsert: { mutate: mockNoteUpsert, isPending: false },
  }),
}));

jest.mock('@/analytics/mcp.analytics', () => ({
  useMcpAnalytics: () => mockAnalytics,
}));

jest.mock('@/components/page/investors/WarmIntrosV2Workspace/PathFeedbackModal', () => ({
  PathFeedbackModal: ({ open, onSubmit }: { open: boolean; onSubmit: (value: { note: string }) => void }) =>
    open ? (
      <div>
        <button type="button" onClick={() => onSubmit({ note: 'Wrong connector' })}>
          Send feedback
        </button>
      </div>
    ) : null,
}));

jest.mock('@/components/page/investors/WarmIntrosV2Workspace/PathNoteModal', () => ({
  PathNoteModal: ({
    open,
    onSubmit,
    onClear,
    initial,
  }: {
    open: boolean;
    onSubmit: (value: { note: string }) => void;
    onClear?: () => void;
    initial?: { note: string };
  }) =>
    open ? (
      <div>
        <button type="button" onClick={() => onSubmit({ note: 'Saved note' })}>
          Save note
        </button>
        {initial && onClear ? (
          <button type="button" onClick={onClear}>
            Clear note
          </button>
        ) : null}
      </div>
    ) : null,
}));

const context = {
  nodes: [{ profileUid: 'from1', name: 'Juan Benet' }],
  connectorName: 'Juan Benet',
};

function renderActions(overrides: Partial<ComponentProps<typeof PathActions>> = {}) {
  return render(
    <PathActions
      warmPathUid="p1"
      connectorProfileUid="from1"
      investorProfileUid="inv1"
      context={context}
      {...overrides}
    />,
  );
}

function callMutateSuccess(mock: jest.Mock) {
  const onSuccess = mock.mock.calls.at(-1)?.[1]?.onSuccess as (() => void) | undefined;
  onSuccess?.();
}

describe('PathActions notes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows Add note when the caller has none', () => {
    renderActions();
    expect(screen.getByRole('button', { name: 'Add note' })).toBeInTheDocument();
    expect(screen.queryByText('Waiting on a reply')).not.toBeInTheDocument();
  });

  it('shows Edit note and a preview of the caller own note', () => {
    renderActions({ myNote: { note: 'Waiting on a reply', updatedAt: '2026-08-19T00:00:00.000Z' } });
    expect(screen.getByRole('button', { name: 'Edit note' })).toBeInTheDocument();
    expect(screen.getByText('Waiting on a reply')).toBeInTheDocument();
  });

  it('lists other people’s notes for editors', () => {
    renderActions({
      canEdit: true,
      notes: [{ actorEmail: 'b@pl.com', note: 'Intro sent Tuesday', updatedAt: '2026-08-18T00:00:00.000Z' }],
    });
    fireEvent.click(screen.getByRole('button', { name: '1 note' }));
    expect(screen.getByText('b@pl.com')).toBeInTheDocument();
    expect(screen.getByText('Intro sent Tuesday')).toBeInTheDocument();
  });

  it('clears the note with note: null', () => {
    renderActions({ myNote: { note: 'Waiting on a reply', updatedAt: '2026-08-19T00:00:00.000Z' } });
    fireEvent.click(screen.getByRole('button', { name: 'Edit note' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear note' }));
    expect(mockNoteUpsert).toHaveBeenCalledWith(
      {
        warmPathUid: 'p1',
        body: { connectorProfileUid: 'from1', note: null },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
  });
});

describe('PathActions analytics', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('tracks feedback open and submit without note text', () => {
    renderActions();
    fireEvent.click(screen.getByRole('button', { name: 'Give feedback' }));
    expect(mockAnalytics.onWarmPathFeedbackOpened).toHaveBeenCalledWith({
      warmPathUid: 'p1',
      investorProfileUid: 'inv1',
      isEdit: false,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    expect(mockFeedbackUpsert).toHaveBeenCalledWith(
      {
        warmPathUid: 'p1',
        body: { connectorProfileUid: 'from1', note: 'Wrong connector' },
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(mockAnalytics.onWarmPathFeedbackSubmitted).not.toHaveBeenCalled();
    callMutateSuccess(mockFeedbackUpsert);
    expect(mockAnalytics.onWarmPathFeedbackSubmitted).toHaveBeenCalledWith({
      warmPathUid: 'p1',
      investorProfileUid: 'inv1',
      isEdit: false,
    });
    expect(JSON.stringify(mockAnalytics.onWarmPathFeedbackSubmitted.mock.calls)).not.toContain('Wrong connector');
  });

  it('tracks note open, submit, and clear without note text', () => {
    renderActions({ myNote: { note: 'Waiting on a reply', updatedAt: '2026-08-19T00:00:00.000Z' } });
    fireEvent.click(screen.getByRole('button', { name: 'Edit note' }));
    expect(mockAnalytics.onWarmPathNoteOpened).toHaveBeenCalledWith({
      warmPathUid: 'p1',
      investorProfileUid: 'inv1',
      isEdit: true,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));
    callMutateSuccess(mockNoteUpsert);
    expect(mockAnalytics.onWarmPathNoteSubmitted).toHaveBeenCalledWith({
      warmPathUid: 'p1',
      investorProfileUid: 'inv1',
      isEdit: true,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit note' }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear note' }));
    callMutateSuccess(mockNoteUpsert);
    expect(mockAnalytics.onWarmPathNoteCleared).toHaveBeenCalledWith({
      warmPathUid: 'p1',
      investorProfileUid: 'inv1',
    });
    expect(JSON.stringify(mockAnalytics.onWarmPathNoteCleared.mock.calls)).not.toContain('Waiting on a reply');
  });
});
