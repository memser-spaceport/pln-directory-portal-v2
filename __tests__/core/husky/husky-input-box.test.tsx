import { render, screen, fireEvent } from '@testing-library/react';
import HuskyInputBox from '../../../components/core/husky/husky-input-box';
import { useHuskyAnalytics } from '../../../analytics/husky.analytics';

// Mock the analytics hook
jest.mock('../../../analytics/husky.analytics', () => ({
  useHuskyAnalytics: jest.fn(),
}));

describe('HuskyInputBox', () => {
  const mockOnHuskyInput = jest.fn();
  const mockOnSourceSelected = jest.fn();
  const mockTrackSourceChange = jest.fn();

  beforeEach(() => {
    (useHuskyAnalytics as jest.Mock).mockReturnValue({ trackSourceChange: mockTrackSourceChange });
    render(
      <HuskyInputBox
        onHuskyInput={mockOnHuskyInput}
        onSourceSelected={mockOnSourceSelected}
        isAnswerLoading={false}
        selectedSource="none"
      />
    );
  });

  // Test rendering of the component
  it('renders correctly', () => {
    expect(screen.getByTestId('husky-input-box')).not.toBeNull();
    expect(screen.getByTestId('husky-input-textbox')).not.toBeNull();
  });

  it('submits input text on Enter key press', () => {
    const input = screen.getByTestId('husky-input-textbox');
    fireEvent.input(input, { target: { innerText: 'Test query' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockOnHuskyInput).toHaveBeenCalledWith('Test query');
    expect(input.innerText).toBe('');
  });

    // Test source selection
    it('calls onSourceSelected when a source is clicked', () => {
        const sourceMenu = screen.getByTestId('husky-input-source-menu');
        fireEvent.click(sourceMenu);
        const sourceButton = screen.getByTestId('input-source-1');
        fireEvent.click(sourceButton);
        
        expect(mockTrackSourceChange).toHaveBeenCalledWith('twitter');
        expect(mockOnSourceSelected).toHaveBeenCalledWith('twitter');
      });


/*  



 

  // Test mobile device detection
  it('detects mobile device correctly', () => {
    // Mock navigator.userAgent for mobile
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      configurable: true,
    });

    // Re-render the component
    render(
      <HuskyInputBox
        onHuskyInput={mockOnHuskyInput}
        onSourceSelected={mockOnSourceSelected}
        isAnswerLoading={false}
        selectedSource="twitter"
      />
    );

    const input = screen.getByTestId('husky-input-textbox');
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(mockOnHuskyInput).not.toHaveBeenCalled(); // Should not submit on mobile Enter
  }); */

  // Additional tests can be added here for edge cases
});

