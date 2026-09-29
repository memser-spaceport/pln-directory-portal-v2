import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import {
  SpvRequestAccessModal,
  type SpvRequestAccessOutcome,
} from '@/components/page/spv-spotlight/SpvRequestAccessModal/SpvRequestAccessModal';

const setup = (
  outcome: SpvRequestAccessOutcome = { type: 'success' },
  prefill: { email: string; name: string } | null = null,
) => {
  const onSubmit = jest.fn(() => Promise.resolve(outcome));
  const onSignIn = jest.fn();
  const onClose = jest.fn();
  render(
    <SpvRequestAccessModal
      isOpen
      onClose={onClose}
      spotlightTitle="Netholabs SPV"
      prefill={prefill}
      onSubmit={onSubmit}
      onSignIn={onSignIn}
    />,
  );
  return { onSubmit, onSignIn, onClose, user: userEvent.setup() };
};

const fillForm = async (user: ReturnType<typeof userEvent.setup>, { email = 'new@fund.com', accredit = true } = {}) => {
  await user.type(screen.getByPlaceholderText('Enter your email'), email);
  await user.type(screen.getByPlaceholderText('Enter your full name'), 'Maya Chen');
  await user.type(screen.getByPlaceholderText('Enter your primary role'), 'Partner');
  await user.type(screen.getByPlaceholderText('e.g. Northfield Ventures'), '  Northfield  ');
  if (accredit) await user.click(screen.getByRole('checkbox'));
};

describe('SpvRequestAccessModal', () => {
  it('asks for the data room by the spotlight name', () => {
    setup();
    expect(screen.getByRole('heading', { name: 'Request access to the Netholabs SPV data room' })).toBeInTheDocument();
  });

  it('will not submit without the accreditation confirmation', async () => {
    const { onSubmit, user } = setup();
    await fillForm(user, { accredit: false });
    await user.click(screen.getByRole('button', { name: 'Request access' }));
    expect(await screen.findByText('You must confirm that you are an accredited investor')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a trimmed payload with accreditation set', async () => {
    const { onSubmit, user } = setup();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Request access' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'new@fund.com',
        name: 'Maya Chen',
        role: 'Partner',
        organization: 'Northfield',
        isAccreditedInvestor: true,
      }),
    );
  });

  it('turns a blocked email into a sign-in prompt, without saying why', async () => {
    const { onSignIn, user } = setup({ type: 'blocked' });
    await fillForm(user, { email: 'someone@fund.com' });
    await user.click(screen.getByRole('button', { name: 'Request access' }));

    expect(await screen.findByRole('heading', { name: "You've already requested access" })).toBeInTheDocument();
    expect(screen.queryByText(/reject|declin|not approved/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSignIn).toHaveBeenCalledWith('someone@fund.com');
  });

  it('lets a blocked requester go back and use a different email', async () => {
    const { user } = setup({ type: 'blocked' });
    await fillForm(user, { email: 'applied@example.com' });
    await user.click(screen.getByRole('button', { name: 'Request access' }));
    await user.click(await screen.findByRole('button', { name: 'Use a different email' }));
    expect(screen.getByRole('heading', { name: /Request access to the/ })).toBeInTheDocument();
  });

  it('shows a failure in the modal and keeps the form', async () => {
    const { user } = setup({ type: 'error', message: 'Something went wrong. Please try again.' });
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Request access' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(screen.getByPlaceholderText('Enter your email')).toHaveValue('new@fund.com');
  });

  it('locks email and name for a signed-in requester and drops the sign-up line', () => {
    setup({ type: 'success' }, { email: 'maya@northfield.vc', name: 'Maya Chen' });
    expect(screen.getByPlaceholderText('Enter your email')).toBeDisabled();
    expect(screen.getByPlaceholderText('Enter your email')).toHaveValue('maya@northfield.vc');
    expect(screen.getByPlaceholderText('Enter your full name')).toBeDisabled();
    expect(screen.queryByText(/creates a free PL Network account/)).not.toBeInTheDocument();
  });
});
