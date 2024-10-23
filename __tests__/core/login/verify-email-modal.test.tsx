import { render, screen, fireEvent } from '@testing-library/react';
import { VerifyEmailModal } from '../../../components/core/login/verify-email-modal';
import '@testing-library/jest-dom';
describe('VerifyEmailModal', () => {
  const mockHandleModalClose = jest.fn();
  const mockContent = {
    title: 'Verify Your Email',
    errorMessage: 'Invalid email address.',
    description: 'Please check your inbox for the verification link.',
  };

  beforeEach(() => {
    render(<VerifyEmailModal content={mockContent} handleModalClose={mockHandleModalClose} dialogRef={null} />);
  });

  test('renders modal with correct title and messages', () => {
    expect(screen.getByTestId('modal-title')).toHaveTextContent(mockContent.title);
    expect(screen.getByTestId('error-message')).toHaveTextContent(mockContent.errorMessage);
    expect(screen.getByTestId('description-text')).toHaveTextContent(mockContent.description);
  });

  test('calls handleModalClose when close button is clicked', () => {
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    expect(mockHandleModalClose).toHaveBeenCalledTimes(1);
  });

  test('displays error message when provided', () => {
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
  });


  test('renders modal with correct styles', () => {
    const modal = screen.getByTestId('verify-email-modal');
    expect(modal).toHaveClass('verifyEmail');
  });
});

