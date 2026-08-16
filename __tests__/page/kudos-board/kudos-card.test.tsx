import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { KudosCard } from '@/components/page/aligement-assets/kudos-board/kudos-card';
import type { ICommunityKudos, IUserSummary } from '@/components/page/aligement-assets/kudos-board/data/kudos-board.types';
import type { CommunityKudosLimits } from '@/schema/kudos-forms';

const mutateAsync = jest.fn().mockResolvedValue({});
jest.mock('@/hooks/use-kudos', () => ({
  useUpdateCommunityKudos: () => ({ mutateAsync, isPending: false }),
}));
jest.mock('@/analytics/kudos.analytics', () => ({
  useKudosAnalytics: () => ({ onEditKudosOpened: jest.fn(), onCommunityKudosUpdated: jest.fn() }),
}));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const mockCurrentUser = jest.fn();
jest.mock('@/services/auth/store', () => ({
  useCurrentUserStore: (selector: (s: { currentUser: unknown }) => unknown) =>
    selector({ currentUser: mockCurrentUser() }),
}));

jest.mock('@/utils/plaa-round.utils', () => ({ getCurrentRoundNumber: () => 18 }));

const LIMITS: CommunityKudosLimits = { pointsMin: 10, pointsMax: 100, pointsStep: 10, messageMin: 25, messageMax: 500 };

const giver: IUserSummary = { memberId: 'uid-giver-1', name: 'Ada Chen' };
const recipient: IUserSummary = { memberId: 'uid-recipient-1', name: 'Lena Okafor' };
const otherRecipient: IUserSummary = { memberId: 'uid-recipient-2', name: 'Jonas Hale' };

function makeKudos(overrides: Partial<ICommunityKudos> = {}): ICommunityKudos {
  return {
    id: 'kudos-1',
    giver,
    recipient,
    roundId: '18',
    points: 60,
    message: 'Ran the retro that finally got the two teams talking about the shared schema.',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

const recipients = [recipient, otherRecipient];

function renderCard(kudosOverrides: Partial<ICommunityKudos> = {}, poolRemaining = 40) {
  return render(
    <KudosCard kudos={makeKudos(kudosOverrides)} recipients={recipients} poolRemaining={poolRemaining} limits={LIMITS} />,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCurrentUser.mockReturnValue({ uid: 'uid-giver-1' });
});

describe('KudosCard — view mode', () => {
  test('renders points, giver, recipient and message', () => {
    renderCard();
    expect(screen.getByText('+60 pts')).toBeInTheDocument();
    expect(screen.getByText('Ada Chen')).toBeInTheDocument();
    expect(screen.getByText('@Lena Okafor')).toBeInTheDocument();
    expect(screen.getByText(/ran the retro/i)).toBeInTheDocument();
  });

  test('shows an Edit action for the giver on the current round', () => {
    renderCard({ roundId: '18' });
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/finalized/i)).not.toBeInTheDocument();
  });

  test('shows a lock icon instead of Edit once the round has concluded', () => {
    renderCard({ roundId: '17' });
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/finalized/i)).toBeInTheDocument();
  });

  test('shows neither Edit nor a lock icon on another member’s kudos', () => {
    mockCurrentUser.mockReturnValue({ uid: 'someone-else' });
    renderCard({ roundId: '18' });
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/finalized/i)).not.toBeInTheDocument();

    mockCurrentUser.mockReturnValue({ uid: 'someone-else' });
    renderCard({ roundId: '17' });
    expect(screen.queryByLabelText(/finalized/i)).not.toBeInTheDocument();
  });

  test('shows no Edit action while limits have not loaded yet, even for the giver on the current round', () => {
    render(<KudosCard kudos={makeKudos({ roundId: '18' })} recipients={recipients} poolRemaining={40} />);
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });
});

describe('KudosCard — editing', () => {
  test('opening Edit pre-fills the form with the current recipient, message and points', async () => {
    const user = userEvent.setup();
    renderCard({ roundId: '18' });

    await user.click(screen.getByRole('button', { name: /edit/i }));

    expect(screen.getByLabelText(/recipient/i)).toHaveValue('uid-recipient-1');
    expect(screen.getByLabelText(/message/i)).toHaveValue(
      'Ran the retro that finally got the two teams talking about the shared schema.',
    );
    expect(screen.getByLabelText(/points awarded/i)).toHaveValue('60');
  });

  test('Cancel discards changes and returns to view mode without saving', async () => {
    const user = userEvent.setup();
    renderCard({ roundId: '18' });

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.clear(screen.getByLabelText(/message/i));
    await user.type(screen.getByLabelText(/message/i), 'A message that is definitely long enough to pass.');
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(screen.getByText(/ran the retro/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  test('Save changes submits the updated fields for this kudos id', async () => {
    const user = userEvent.setup();
    renderCard({ roundId: '18' }, 40);

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.selectOptions(screen.getByLabelText(/recipient/i), 'uid-recipient-2');
    await user.clear(screen.getByLabelText(/message/i));
    await user.type(screen.getByLabelText(/message/i), 'A brand new message that is long enough to be valid.');
    await user.selectOptions(screen.getByLabelText(/points awarded/i), '20');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(mutateAsync).toHaveBeenCalledWith({
        id: 'kudos-1',
        input: {
          recipientId: 'uid-recipient-2',
          points: 20,
          message: 'A brand new message that is long enough to be valid.',
        },
      }),
    );
  });

  test('the points picker includes this kudos’ own points even when the pool alone would not cover it', async () => {
    const user = userEvent.setup();
    // poolRemaining=0 would normally offer no options, but the kudos' own 60
    // points should still be selectable since editing doesn't newly spend them.
    renderCard({ roundId: '18', points: 60 }, 0);

    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByRole('option', { name: '60 pts' })).toBeInTheDocument();
  });

  test('Save changes is disabled while the message is too short', async () => {
    const user = userEvent.setup();
    renderCard({ roundId: '18' });

    await user.click(screen.getByRole('button', { name: /edit/i }));
    await user.clear(screen.getByLabelText(/message/i));
    await user.type(screen.getByLabelText(/message/i), 'too short');

    await waitFor(() => expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled());
  });
});
