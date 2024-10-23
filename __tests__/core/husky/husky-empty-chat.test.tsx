import { render, screen, fireEvent } from '@testing-library/react';
import HuskyEmptyChat from '@/components/core/husky/husky-empty-chat';

describe('HuskyEmptyChat Component', () => {
  const mockOnPromptClicked = jest.fn();

  beforeEach(() => {
    render(<HuskyEmptyChat onPromptClicked={mockOnPromptClicked} />);
  });

  test('renders correctly', () => {
    // Check if the component renders the title
    expect(screen.getByText(/What is Husky?/i)).not.toBeNull();
    // Check if the input is present
    expect(screen.getByPlaceholderText(/Go ahead, ask anything../i)).not.toBeNull();
  });

  test('handles prompt submission with valid input', async () => {
    const input = screen.getByPlaceholderText(/Go ahead, ask anything../i);
    fireEvent.change(input, { target: { value: 'Hello, Husky!' } });
    fireEvent.click(screen.getByTestId('submit-button'));

    // Check if the onPromptClicked function was called with the correct argument
    expect(mockOnPromptClicked).toHaveBeenCalledWith('Hello, Husky!');
  });


  test('handles exploration prompt click', async () => {
    const explorationPrompt = screen.getByTestId('prompt-0');
    fireEvent.click(explorationPrompt);

    // Check if the onPromptClicked function was called with the correct argument
    expect(mockOnPromptClicked).toHaveBeenCalledWith('Summary of discussions from the LabWeek Field Building sessions?');
  });

  test('handles key down event for submission', async () => {
    const input = screen.getByPlaceholderText(/Go ahead, ask anything../i);
    fireEvent.change(input, { target: { value: 'Test Enter Key' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });

    // Check if the onPromptClicked function was called with the correct argument
    expect(mockOnPromptClicked).toHaveBeenCalledWith('Test Enter Key');
  });

});

