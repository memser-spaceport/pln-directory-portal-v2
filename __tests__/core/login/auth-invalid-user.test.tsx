import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthInvalidUser from '@/components/core/login/auth-invalid-user';
import { useRouter } from 'next/navigation';
import { triggerLoader } from '@/utils/common.utils';
import { VerifyEmailModal } from '@/components/core/login/verify-email-modal';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/utils/common.utils', () => ({
  triggerLoader: jest.fn(),
}));

// Track the props passed to VerifyEmailModal
let capturedDialogRef: any = null;
let capturedHandleModalClose: any = null;

jest.mock('@/components/core/login/verify-email-modal', () => ({
  VerifyEmailModal: jest.fn().mockImplementation(({ dialogRef, content, handleModalClose }) => {
    // Capture the ref and handler for testing
    capturedDialogRef = dialogRef;
    capturedHandleModalClose = handleModalClose;
    
    return (
      <div data-testid="mock-verify-email-modal">
        <div data-testid="modal-title">{content.title}</div>
        <div data-testid="modal-error">{content.errorMessage}</div>
        <div data-testid="modal-description">{content.description}</div>
        <button data-testid="close-button" onClick={handleModalClose}>Close</button>
      </div>
    );
  }),
}));

describe('AuthInvalidUser Component', () => {
  const mockRouter = { refresh: jest.fn() };
  const mockShowModal = jest.fn();
  const mockClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Reset the captured values
    capturedDialogRef = null;
    capturedHandleModalClose = null;
  });

  test('renders without crashing', () => {
    render(<AuthInvalidUser />);
    expect(screen.getByTestId('mock-verify-email-modal')).toBeInTheDocument();
  });

  test('displays default content', () => {
    render(<AuthInvalidUser />);
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Email Verification');
    expect(screen.getByTestId('modal-error')).toHaveTextContent('Email not available');
    expect(screen.getByTestId('modal-description')).toHaveTextContent('Your email is either invalid or not available in our directory');
  });

  test('handles modal close and resets content', () => {
    jest.useFakeTimers();
    render(<AuthInvalidUser />);
    
    // Set up the mock dialog ref before dispatching any events
    if (capturedDialogRef) {
      capturedDialogRef.current = {
        showModal: mockShowModal,
        close: mockClose
      };
    }
    
    // First set different content to verify reset
    const event = new CustomEvent('auth-invalid-email', {
      detail: 'unexpected_error'
    });
    act(() => {
      document.dispatchEvent(event);
    });
    
    // Verify content was changed
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Something went wrong');
    
    // Close the modal
    fireEvent.click(screen.getByTestId('close-button'));
    
    // Verify triggerLoader and close were called
    expect(triggerLoader).toHaveBeenCalledWith(false);
    expect(mockClose).toHaveBeenCalled();
    
    // Fast-forward timer to trigger the setTimeout callback
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Verify content was reset
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Email Verification');
    expect(screen.getByTestId('modal-error')).toHaveTextContent('Email not available');
    
    jest.useRealTimers();
  });

  test('handles auth-invalid-email event with linked_to_another_user detail', () => {
    render(<AuthInvalidUser />);
    
    // Set up the mock dialog ref properly
    if (capturedDialogRef) {
      capturedDialogRef.current = {
        showModal: mockShowModal
      };
    }
    
    const event = new CustomEvent('auth-invalid-email', {
      detail: 'linked_to_another_user'
    });
    
    act(() => {
      document.dispatchEvent(event);
    });
    
    // Verify router.refresh was called
    expect(mockRouter.refresh).toHaveBeenCalled();
    
    // Verify showModal was called
    expect(mockShowModal).toHaveBeenCalled();
    
    // Verify content was updated correctly
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Email Verification');
    expect(screen.getByTestId('modal-error')).toHaveTextContent('Email already used. Connect social account for login');
    expect(screen.getByTestId('modal-description')).toHaveTextContent('The email you provided is already used or linked to another account');
  });

  test('handles auth-invalid-email event with unexpected_error detail', () => {
    render(<AuthInvalidUser />);
    
    // Set up the mock dialog ref properly
    if (capturedDialogRef) {
      capturedDialogRef.current = {
        showModal: mockShowModal
      };
    }
    
    const event = new CustomEvent('auth-invalid-email', {
      detail: 'unexpected_error'
    });
    
    act(() => {
      document.dispatchEvent(event);
    });
    
    // Verify router.refresh was called
    expect(mockRouter.refresh).toHaveBeenCalled();
    
    // Verify showModal was called
    expect(mockShowModal).toHaveBeenCalled();
    
    // Verify content was updated correctly
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Something went wrong');
    expect(screen.getByTestId('modal-error')).toHaveTextContent('We are unable to authenticate you at the moment');
    expect(screen.getByTestId('modal-description')).toHaveTextContent('');
  });

  test('handles auth-invalid-email event with no detail', () => {
    render(<AuthInvalidUser />);
    
    // Set up the mock dialog ref properly
    if (capturedDialogRef) {
      capturedDialogRef.current = {
        showModal: mockShowModal
      };
    }
    
    const event = new CustomEvent('auth-invalid-email');
    
    act(() => {
      document.dispatchEvent(event);
    });
    
    // Verify showModal was called even though no detail is present
    expect(mockShowModal).toHaveBeenCalled();
    
    // Content should remain default
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Email Verification');
    expect(screen.getByTestId('modal-error')).toHaveTextContent('Email not available');
  });

  test('removes event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(<AuthInvalidUser />);
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('auth-invalid-email', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });

  /* Test for commented code - uncomment if the feature is restored
  test('handles auth-invalid-email event with email-changed detail', () => {
    render(<AuthInvalidUser />);
    
    // Simulate the dialog ref behavior by attaching our mock
    capturedDialogRef.current = {
      showModal: mockShowModal
    };
    
    const event = new CustomEvent('auth-invalid-email', {
      detail: 'email-changed'
    });
    
    act(() => {
      document.dispatchEvent(event);
    });
    
    // Verify router.refresh was called
    expect(mockRouter.refresh).toHaveBeenCalled();
    
    // Verify showModal was called
    expect(mockShowModal).toHaveBeenCalled();
    
    // Verify content was updated correctly
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Email Changed recently');
    expect(screen.getByTestId('modal-error')).toHaveTextContent('Your email in our directory has been changed recently');
  });
  */
}); 