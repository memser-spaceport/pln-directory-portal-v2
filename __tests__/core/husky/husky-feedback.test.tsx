import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HuskyFeedback from '@/components/core/husky/husky-feedback';
import { saveFeedback } from '@/services/husky.service';
import { getUserCredentialsInfo } from '@/utils/fetch-wrapper';
import '@testing-library/jest-dom';
// Mocking necessary services
jest.mock('@/services/husky.service');
jest.mock('@/utils/fetch-wrapper');

describe('HuskyFeedback Component', () => {
  const mockOnClose = jest.fn();
  const mockSetLoadingStatus = jest.fn();
  const mockForceUserLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders feedback form', () => {
    render(<HuskyFeedback onClose={mockOnClose} question="Test Question" answer="Test Answer" setLoadingStatus={mockSetLoadingStatus} forceUserLogin={mockForceUserLogin} />);
    expect(screen.getByText(/How useful was this response?/i)).not.toBeNull();
  });

  test('handles rating button click', () => {
    render(<HuskyFeedback onClose={mockOnClose} question="Test Question" answer="Test Answer" setLoadingStatus={mockSetLoadingStatus} forceUserLogin={mockForceUserLogin} />);
    const ratingButton = screen.getByTestId('rating-button-1');
    fireEvent.click(ratingButton);
    expect(ratingButton).toHaveClass('selected');
  });


  test('calls forceUserLogin when login is required', async () => {
    (getUserCredentialsInfo as jest.Mock).mockResolvedValue({ isLoginRequired: true, newAuthToken: 'token', newUserInfo: null });

    render(<HuskyFeedback onClose={mockOnClose} question="Test Question" answer="Test Answer" setLoadingStatus={mockSetLoadingStatus} forceUserLogin={mockForceUserLogin} />);
    
    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => expect(mockForceUserLogin).toHaveBeenCalled());
  });

  // Additional tests for edge cases can be added here
});

