import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GiveCommunityKudosModal } from '@/components/page/aligement-assets/kudos-board/give-kudos-modal';

const mutateAsync = jest.fn().mockResolvedValue({});
jest.mock('@/hooks/use-kudos', () => ({
  useGiveCommunityKudos: () => ({ mutateAsync, isPending: false }),
}));
jest.mock('@/analytics/kudos.analytics', () => ({
  useKudosAnalytics: () => ({ onCommunityKudosSubmitted: jest.fn() }),
}));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const recipients = [
  { memberId: 'uid-a', name: 'Alice' },
  { memberId: 'uid-b', name: 'Bob' },
];

function renderModal(poolRemaining: number) {
  return render(
    <GiveCommunityKudosModal open onClose={jest.fn()} recipients={recipients} poolRemaining={poolRemaining} />,
  );
}

const sendBtn = () => screen.getByRole('button', { name: /send community kudos/i });

describe('GiveCommunityKudosModal — send button gating', () => {
  beforeEach(() => jest.clearAllMocks());

  test('is disabled on an empty form', () => {
    renderModal(100);
    expect(sendBtn()).toBeDisabled();
  });

  test('is disabled when the pool is 0, even though the form is otherwise fillable', () => {
    renderModal(0);
    expect(sendBtn()).toBeDisabled();
  });

  test('stays disabled while the message is shorter than the minimum (trimmed)', async () => {
    const user = userEvent.setup();
    renderModal(100);

    await user.selectOptions(screen.getByLabelText(/recipient/i), 'uid-a');
    await user.selectOptions(screen.getByLabelText(/points to give/i), '20');
    await user.type(screen.getByLabelText(/your message/i), 'too short   ');

    await waitFor(() => expect(sendBtn()).toBeDisabled());
  });

  test('enables once recipient, points and a long-enough message are set', async () => {
    const user = userEvent.setup();
    renderModal(100);

    await user.selectOptions(screen.getByLabelText(/recipient/i), 'uid-a');
    await user.selectOptions(screen.getByLabelText(/points to give/i), '20');
    await user.type(
      screen.getByLabelText(/your message/i),
      'Thanks for the thorough review and quick turnaround.',
    );

    await waitFor(() => expect(sendBtn()).toBeEnabled());
  });
});
