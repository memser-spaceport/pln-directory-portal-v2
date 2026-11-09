import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GiveCommunityKudosModal } from '@/components/page/aligement-assets/kudos-board/give-kudos-modal';
import type { CommunityKudosLimits } from '@/schema/kudos-forms';

const mutateAsync = jest.fn().mockResolvedValue({});
jest.mock('@/hooks/use-kudos', () => ({
  useGiveCommunityKudos: () => ({ mutateAsync, isPending: false }),
}));
jest.mock('@/analytics/kudos.analytics', () => ({
  useKudosAnalytics: () => ({ onCommunityKudosSubmitted: jest.fn() }),
}));
jest.mock('@/components/core/ToastContainer', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const recipients = [
  { memberId: 'uid-a', name: 'Alice' },
  { memberId: 'uid-b', name: 'Bob' },
];

const LIMITS: CommunityKudosLimits = { pointsMin: 10, pointsMax: 100, pointsStep: 10, messageMin: 25, messageMax: 500 };

function renderModal(poolRemaining: number) {
  return render(
    <GiveCommunityKudosModal
      open
      onClose={jest.fn()}
      recipients={recipients}
      poolRemaining={poolRemaining}
      limits={LIMITS}
    />,
  );
}

function renderLoadingModal() {
  return render(
    <GiveCommunityKudosModal
      open
      onClose={jest.fn()}
      recipients={[]}
      poolRemaining={100}
      recipientsLoading
      limits={LIMITS}
    />,
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
    await user.type(screen.getByLabelText(/your message/i), 'Thanks for the thorough review and quick turnaround.');

    await waitFor(() => expect(sendBtn()).toBeEnabled());
  });
});

describe('GiveCommunityKudosModal — live form summary', () => {
  test('names the picked recipient', async () => {
    const user = userEvent.setup();
    renderModal(100);

    await user.selectOptions(screen.getByLabelText(/recipient/i), 'uid-b');

    expect(screen.getByText(/@Bob\b/)).toBeInTheDocument();
  });

  test('shows the pool left after the picked amount', async () => {
    const user = userEvent.setup();
    renderModal(100);

    await user.selectOptions(screen.getByLabelText(/points to give/i), '30');

    expect(screen.getByText(/\b70 pts\b/)).toBeInTheDocument();
  });

  test('counts the trimmed message length as the member types', async () => {
    const user = userEvent.setup();
    renderModal(100);

    await user.type(screen.getByLabelText(/your message/i), '  hello  ');

    expect(screen.getByText(new RegExp(`\\b5 / ${LIMITS.messageMax}\\b`))).toBeInTheDocument();
  });

  test('keeps working after the modal is closed and opened again', async () => {
    const user = userEvent.setup();
    const props = { onClose: jest.fn(), recipients, poolRemaining: 100, limits: LIMITS };
    const { rerender } = render(<GiveCommunityKudosModal open={false} {...props} />);
    rerender(<GiveCommunityKudosModal open {...props} />);

    await user.selectOptions(screen.getByLabelText(/recipient/i), 'uid-a');

    expect(screen.getByText(/@Alice\b/)).toBeInTheDocument();
  });
});

describe('GiveCommunityKudosModal — recipients still loading', () => {
  beforeEach(() => jest.clearAllMocks());

  test('says the list is loading instead of showing an empty picker', () => {
    renderLoadingModal();
    expect(screen.getByLabelText(/recipient/i)).toHaveDisplayValue(/loading/i);
  });

  test('disables the picker so nobody stares at an empty dropdown', () => {
    renderLoadingModal();
    expect(screen.getByLabelText(/recipient/i)).toBeDisabled();
  });

  test('keeps send disabled while there is nobody to send to', () => {
    renderLoadingModal();
    expect(sendBtn()).toBeDisabled();
  });

  test('shows the normal placeholder again once the list has arrived', () => {
    renderModal(100);
    const select = screen.getByLabelText(/recipient/i);
    expect(select).toBeEnabled();
    expect(select).toHaveDisplayValue(/select a network contributor/i);
    expect(screen.getByRole('option', { name: 'Alice' })).toBeInTheDocument();
  });
});
