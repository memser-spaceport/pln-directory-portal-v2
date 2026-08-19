import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { PathActions } from '@/components/page/investors/WarmIntrosV2Workspace/PathActions';

const mockFeedbackUpsert = jest.fn();
const mockNoteUpsert = jest.fn();

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

jest.mock('@/components/page/investors/WarmIntrosV2Workspace/PathFeedbackModal', () => ({
  PathFeedbackModal: () => null,
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
    expect(mockNoteUpsert).toHaveBeenCalledWith({
      warmPathUid: 'p1',
      body: { connectorProfileUid: 'from1', note: null },
    });
  });
});
