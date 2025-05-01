import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HuskyEmptyChat from '@/components/core/husky/husky-empty-chat';

jest.mock('@/services/discovery.service', () => ({
  getChatQuestions: () => Promise.resolve({
    data: [{
      question: 'Summary of discussions from the LabWeek Field Building sessions?'
    }]
  })
}));

describe('HuskyEmptyChat Component', () => {
  const mockOnPromptClicked = jest.fn();
  const setLimitReached = jest.fn();
  const checkIsLimitReached = jest.fn().mockReturnValue(false);

  beforeEach(() => {
    mockOnPromptClicked.mockClear();

    render(<HuskyEmptyChat
      isHidden={false}
      onPromptClicked={mockOnPromptClicked}
      checkIsLimitReached={checkIsLimitReached}
      setLimitReached={setLimitReached}
      limitReached={false} />);
  });

  test('renders correctly', () => {
    // Check if the input is present
    expect(screen.getByTestId('prompt-input')).toBeInTheDocument();
  });

  test('handles prompt submission', async () => {
    const input = screen.getByTestId('prompt-input');
    fireEvent.change(input, { target: { value: 'Hello, Husky!' } });
    fireEvent.click(screen.getByTestId('submit-button'));
    expect(mockOnPromptClicked).toHaveBeenCalledTimes(1);
  });

  // this is not rendered anywhere in the app
  test('handles exploration prompt render', async () => {
    const input = screen.getByTestId('prompt-input');
    fireEvent.focus(input);

    await waitFor(() => {
      const explorationPrompt = screen.getByTestId('prompt-0');
      expect(explorationPrompt).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('handles key down event for submission', async () => {
    const input = screen.getByTestId('prompt-input');
    fireEvent.change(input, { target: { value: 'Test Enter Key' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Check if the onPromptClicked function was called
    expect(mockOnPromptClicked).toHaveBeenCalledTimes(1);
  });
});

