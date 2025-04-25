import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tooltip from '@/components/page/teams/asks-popover';

// Create a custom render function that handles Radix UI's portals
const customRender = (ui: React.ReactNode) => {
  return render(
    <div id="test-root">
      {ui}
      <div id="radix-portal" />
    </div>
  );
};

// Mock Radix UI components to make them testable
jest.mock('@radix-ui/react-tooltip', () => {
  return {
    Provider: ({ children, ...props }: any) => <div data-testid="tooltip-provider" {...props}>{children}</div>,
    Root: ({ children, onOpenChange, ...props }: any) => (
      <div data-testid="tooltip-root" {...props}>
        {children}
        {typeof onOpenChange === 'function' && (
          <button 
            data-testid="trigger-open-change" 
            onClick={() => onOpenChange(true)}
          />
        )}
      </div>
    ),
    Trigger: ({ children, asChild, ...props }: any) => (
      <div data-testid="tooltip-trigger" {...props}>{children}</div>
    ),
    Portal: ({ children, ...props }: any) => (
      <div data-testid="tooltip-portal" {...props}>{children}</div>
    ),
    Content: ({ children, side, align, className, ...props }: any) => (
      <div data-testid="tooltip-content" className={className} {...props}>{children}</div>
    ),
  };
});

// Mock window.open
const mockOpen = jest.fn();
Object.defineProperty(window, 'open', {
  writable: true,
  value: mockOpen,
});

describe('Tooltip Component', () => {
  const defaultProps = {
    name: 'Test Name',
    description: 'Test Description',
    tags: ['Tag 1', 'Tag 2']
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with provided props', () => {
    customRender(<Tooltip {...defaultProps} />);
    
    // Use getByTestId instead of getByText since there are multiple elements with the same text
    const tooltipTrigger = screen.getByTestId('tooltip-trigger');
    expect(tooltipTrigger).toBeInTheDocument();
    expect(tooltipTrigger).toHaveTextContent('Test Name');
  });

  it('displays tooltip trigger with correct name', () => {
    customRender(<Tooltip {...defaultProps} />);
    
    // Check tooltip trigger content
    const tooltipTrigger = screen.getByTestId('tooltip-trigger');
    expect(tooltipTrigger).toBeInTheDocument();
    expect(tooltipTrigger).toHaveTextContent('Test Name');
  });

  it('renders tooltip content with correct structure', () => {
    customRender(<Tooltip {...defaultProps} />);

    // The content should be in the portal
    const tooltipContent = screen.getByTestId('tooltip-content');
    expect(tooltipContent).toBeInTheDocument();
    expect(tooltipContent).toHaveClass('asks__tooltip');

    // Check name in tooltip content using the container class
    const nameInTooltip = tooltipContent.querySelector('.asks__tooltip__cnt__name');
    expect(nameInTooltip).toBeInTheDocument();
    expect(nameInTooltip).toHaveTextContent('Test Name');

    // Check description in tooltip content
    const descriptionElement = tooltipContent.querySelector('.asks__tooltip__cnt__desc');
    expect(descriptionElement).toBeInTheDocument();
    expect(descriptionElement).toHaveTextContent('Test Description');
    
    // Check that tags are present
    expect(screen.getByText('Tag 1')).toBeInTheDocument();
    expect(screen.getByText('Tag 2')).toBeInTheDocument();
  });

  it('should call onOpenChange when button is clicked', () => {
    const onOpenChangeMock = jest.fn();
    customRender(<Tooltip {...defaultProps} onOpenChange={onOpenChangeMock} />);
    
    // Click the button that triggers onOpenChange
    const openChangeButton = screen.getByTestId('trigger-open-change');
    fireEvent.click(openChangeButton);
    
    // Verify onOpenChange was called with true
    expect(onOpenChangeMock).toHaveBeenCalledWith(true);
  });

  it('correctly renders HTML in the description', () => {
    const propsWithHtmlDesc = {
      ...defaultProps,
      description: 'Description with <a href="https://example.com">link</a>'
    };
    
    customRender(<Tooltip {...propsWithHtmlDesc} />);
    
    // Check that the HTML container is rendered
    const descContainer = screen.getByTestId('tooltip-content').querySelector('.asks__tooltip__cnt__desc');
    expect(descContainer).toBeInTheDocument();
    
    // Check the HTML content
    expect(descContainer?.innerHTML).toContain('<a href="https://example.com">link</a>');
  });

  it('opens link in a new tab when link in description is clicked', () => {
    const propsWithLink = {
      ...defaultProps,
      description: 'Description with <a href="https://example.com">link</a>'
    };
    
    customRender(<Tooltip {...propsWithLink} />);
    
    // Find the description container
    const descContainer = screen.getByTestId('tooltip-content').querySelector('.asks__tooltip__cnt__desc');
    expect(descContainer).toBeInTheDocument();
    
    // Create mock element and event for link click
    const mockLink = document.createElement('a');
    mockLink.href = 'https://example.com/'; // Browser normalizes URLs with trailing slash
    
    // Simulate click on description with link as closest('a')
    const mockEvent = {
      target: document.createElement('span'),
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    };
    
    // Set up the element to have a closest method that returns our mock link
    mockEvent.target.closest = jest.fn().mockReturnValue(mockLink);
    
    // Trigger the onClick handler
    if (descContainer) {
      fireEvent.click(descContainer, mockEvent);
    }
    
    // Verify window.open was called with the normalized URL
    expect(mockOpen).toHaveBeenCalledWith('https://example.com/', '_blank');
  });

  it('displays only first two tags if there are more than two tags', () => {
    const propsWithManyTags = {
      ...defaultProps,
      tags: ['Tag 1', 'Tag 2', 'Tag 3', 'Tag 4']
    };
    
    customRender(<Tooltip {...propsWithManyTags} />);
    
    // Check that only first two tags are rendered (wrapped in Fragment)
    expect(screen.getByText('Tag 1')).toBeInTheDocument();
    expect(screen.getByText('Tag 2')).toBeInTheDocument();
    
    // And a count indicator for remaining tags
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('handles empty tag array gracefully', () => {
    const propsWithNoTags = {
      ...defaultProps,
      tags: []
    };
    
    customRender(<Tooltip {...propsWithNoTags} />);
    
    // Check that name and description are still rendered using specific selectors
    const tooltipContent = screen.getByTestId('tooltip-content');
    const nameElement = tooltipContent.querySelector('.asks__tooltip__cnt__name');
    const descElement = tooltipContent.querySelector('.asks__tooltip__cnt__desc');
    
    expect(nameElement).toBeInTheDocument();
    expect(nameElement).toHaveTextContent('Test Name');
    expect(descElement).toBeInTheDocument();
    expect(descElement).toHaveTextContent('Test Description');
    
    // Check that no tags are rendered
    const tagsContainer = screen.getByTestId('tooltip-content').querySelector('.asks__tooltip__cnt__tags');
    expect(tagsContainer).toBeInTheDocument();
    expect(tagsContainer?.children.length).toBe(0);
  });
});
