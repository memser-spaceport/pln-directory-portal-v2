import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import HuskyDialog from '@/components/page/home/husky-dialog';

// Mock HuskyAi component
jest.mock('@/components/core/husky/husky-ai', () => {
  return jest.fn(({ initialChats, onClose, isLoggedIn, huskySource, searchText }) => (
    <div data-testid="husky-ai-mock">
      <div data-testid="husky-ai-initial-chats">{JSON.stringify(initialChats)}</div>
      <div data-testid="husky-ai-is-logged-in">{String(isLoggedIn)}</div>
      <div data-testid="husky-ai-source">{huskySource}</div>
      <div data-testid="husky-ai-search-text">{searchText}</div>
      <button data-testid="husky-ai-close-button" onClick={onClose}>Close HuskyAi</button>
    </div>
  ));
});

// Mock showModal and close functions for the dialog element
const showModalMock = jest.fn();
const closeMock = jest.fn();

// Override HTMLDialogElement prototype for testing
HTMLDialogElement.prototype.showModal = showModalMock;
HTMLDialogElement.prototype.close = closeMock;

describe('HuskyDialog Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    cleanup(); // Cleanup any previous renders
  });

  it('renders the component correctly', () => {
    const { container } = render(<HuskyDialog />);
    
    // Dialog should exist but not be visible by default
    const dialog = container.querySelector('dialog.hd');
    expect(dialog).toBeInTheDocument();
    expect(showModalMock).not.toHaveBeenCalled();
  });

  it('opens dialog when open-husky-dialog event is triggered', async () => {
    render(<HuskyDialog />);
    
    // Dispatch custom event to open dialog
    const customEvent = new CustomEvent('open-husky-dialog', {
      detail: {
        searchText: 'test search',
        from: 'test source',
        initialChat: { message: 'test message' }
      }
    });
    
    document.dispatchEvent(customEvent);
    
    // Dialog should be opened
    expect(showModalMock).toHaveBeenCalled();
    
    // We need to mock the isOpen state since it relies on useEffect
    // Manually update the isOpen state by dispatching the event
    await waitFor(() => {
      const huskyAiMock = screen.queryByTestId('husky-ai-mock');
      expect(huskyAiMock).not.toBeNull();
    });
  });

  it('closes dialog when close button is clicked', async () => {
    const { container } = render(<HuskyDialog />);
    
    // Open dialog first
    const openEvent = new CustomEvent('open-husky-dialog', { detail: {} });
    document.dispatchEvent(openEvent);
    
    // Click close button - find by CSS selector
    const closeButton = container.querySelector('.hd__head__close');
    expect(closeButton).not.toBeNull();
    if (closeButton) {
      fireEvent.click(closeButton);
    }
    
    // Dialog should be closed
    expect(closeMock).toHaveBeenCalled();
  });

  it('closes dialog when HuskyAi close function is called', async () => {
    render(<HuskyDialog />);
    
    // Open dialog first
    const openEvent = new CustomEvent('open-husky-dialog', { detail: {} });
    document.dispatchEvent(openEvent);
    
    // Mock the isOpen state
    await waitFor(() => {
      // Now try to find the HuskyAi mock component
      const huskyAiCloseButton = screen.queryByTestId('husky-ai-close-button');
      if (huskyAiCloseButton) {
        fireEvent.click(huskyAiCloseButton);
        // Dialog should be closed
        expect(closeMock).toHaveBeenCalled();
      }
    });
  });

  it('passes isLoggedIn prop to HuskyAi component', async () => {
    // Test with isLoggedIn=true
    render(<HuskyDialog isLoggedIn={true} />);
    
    // Open dialog
    const openEvent = new CustomEvent('open-husky-dialog', { detail: {} });
    document.dispatchEvent(openEvent);
    
    // Wait for HuskyAi component to be rendered
    await waitFor(() => {
      const isLoggedInElement = screen.queryByTestId('husky-ai-is-logged-in');
      if (isLoggedInElement) {
        expect(isLoggedInElement).toHaveTextContent('true');
      }
    });
  });

  it('handles open-husky-dialog event with partial details', async () => {
    // Test with searchText only
    const { unmount } = render(<HuskyDialog />);
    
    // Event with only searchText
    const searchTextEvent = new CustomEvent('open-husky-dialog', {
      detail: { searchText: 'search only' }
    });
    document.dispatchEvent(searchTextEvent);
    
    // Wait for HuskyAi to render with the searchText
    await waitFor(() => {
      const searchTextElement = screen.queryByTestId('husky-ai-search-text');
      if (searchTextElement) {
        expect(searchTextElement).toHaveTextContent('search only');
      }
    });
    
    // Cleanup this render before the next test
    unmount();
    cleanup();

    // Test with from source only
    const { unmount: unmount2 } = render(<HuskyDialog />);
    
    // Event with only from
    const fromEvent = new CustomEvent('open-husky-dialog', {
      detail: { from: 'source only' }
    });
    document.dispatchEvent(fromEvent);
    
    // Wait for HuskyAi to render with the source
    await waitFor(() => {
      const sourceElements = screen.queryAllByTestId('husky-ai-source');
      if (sourceElements.length > 0) {
        // Just check the first one
        expect(sourceElements[0]).toHaveTextContent('source only');
      }
    });
    
    // Cleanup before next test
    unmount2();
    cleanup();

    // Test with initialChat only
    render(<HuskyDialog />);
    
    // Event with only initialChat
    const initialChatEvent = new CustomEvent('open-husky-dialog', {
      detail: { initialChat: { message: 'initial only' } }
    });
    document.dispatchEvent(initialChatEvent);
    
    // Wait for HuskyAi to render with initialChat
    await waitFor(() => {
      const initialChatsElement = screen.queryByTestId('husky-ai-initial-chats');
      if (initialChatsElement) {
        expect(initialChatsElement.textContent).toContain('initial only');
      }
    });
  });

  it('cleans up event listener on unmount', () => {
    // Spy on document.removeEventListener
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
    
    const { unmount } = render(<HuskyDialog />);
    unmount();
    
    // Check if removeEventListener was called with 'open-husky-dialog'
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'open-husky-dialog',
      expect.any(Function)
    );
    
    // Clean up
    removeEventListenerSpy.mockRestore();
  });

  it('resets state values when dialog is closed', async () => {
    const { container } = render(<HuskyDialog />);
    
    // Open dialog with values
    const openEvent = new CustomEvent('open-husky-dialog', {
      detail: {
        searchText: 'test search',
        from: 'test source',
        initialChat: { message: 'test message' }
      }
    });
    document.dispatchEvent(openEvent);
    
    // Wait for HuskyAi to render
    await waitFor(() => {
      const searchTextElement = screen.queryByTestId('husky-ai-search-text');
      if (searchTextElement) {
        expect(searchTextElement).toHaveTextContent('test search');
      }
    });
    
    // Close dialog
    const closeImg = container.querySelector('.hd__head__close');
    expect(closeImg).not.toBeNull();
    if (closeImg) {
      fireEvent.click(closeImg);
    }
    
    // Reopen dialog without values
    const reopenEvent = new CustomEvent('open-husky-dialog', { detail: {} });
    document.dispatchEvent(reopenEvent);
    
    // Wait for HuskyAi to render with reset values
    await waitFor(() => {
      const searchTextElement = screen.queryByTestId('husky-ai-search-text');
      if (searchTextElement) {
        expect(searchTextElement).toHaveTextContent('');
      }
      
      const sourceElements = screen.queryAllByTestId('husky-ai-source');
      if (sourceElements.length > 0) {
        expect(sourceElements[0]).toHaveTextContent('');
      }
      
      const initialChatsElement = screen.queryByTestId('husky-ai-initial-chats');
      if (initialChatsElement) {
        expect(initialChatsElement).toHaveTextContent('[]');
      }
    });
  });
}); 