import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SpvRequestReceivedModal } from '@/components/page/spv-spotlight/SpvRequestReceivedModal/SpvRequestReceivedModal';

const renderModal = (props: { isLoggedIn: boolean; profileComplete: boolean }) =>
  render(
    <SpvRequestReceivedModal
      isOpen
      email="maya@northfield.vc"
      onClose={jest.fn()}
      onSetUpProfile={jest.fn()}
      {...props}
    />,
  );

describe('SpvRequestReceivedModal', () => {
  it('names the email the approval goes to', () => {
    renderModal({ isLoggedIn: true, profileComplete: false });
    expect(screen.getByText(/We'll email maya@northfield\.vc if our team approves your request/)).toBeInTheDocument();
  });

  it('asks a signed-in viewer without a complete profile to set one up', () => {
    renderModal({ isLoggedIn: true, profileComplete: false });
    expect(screen.getByRole('button', { name: 'Set up investor profile' })).toBeInTheDocument();
  });

  it('agrees with the hero stepper once the profile is complete', () => {
    renderModal({ isLoggedIn: true, profileComplete: true });
    expect(screen.getByRole('button', { name: 'Edit investor profile' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Set up investor profile' })).not.toBeInTheDocument();
  });

  it('sends a signed-out requester to sign in first, whatever the profile says', () => {
    renderModal({ isLoggedIn: false, profileComplete: true });
    expect(screen.getByRole('button', { name: 'Sign in to set up investor profile' })).toBeInTheDocument();
  });
});
