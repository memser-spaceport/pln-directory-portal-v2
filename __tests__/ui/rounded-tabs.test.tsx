import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import RoundedTabs from '@/components/ui/rounded-tabs';

// Helper: default props
const baseProps = {
  items: ['Tab1', 'Tab2', 'Tab3'],
  activeItem: 'Tab2',
  onTabSelected: jest.fn(),
};

describe('RoundedTabs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all tab items', () => {
    render(<RoundedTabs {...baseProps} />);
    baseProps.items.forEach(tab => {
      expect(screen.getByText(tab)).toBeInTheDocument();
    });
  });

  it('highlights the active tab', () => {
    render(<RoundedTabs {...baseProps} activeItem="Tab3" />);
    const active = screen.getByText('Tab3');
    expect(active).toHaveClass('hc__tab__item--active');
    // Others are not active
    expect(screen.getByText('Tab1')).not.toHaveClass('hc__tab__item--active');
    expect(screen.getByText('Tab2')).not.toHaveClass('hc__tab__item--active');
  });

  it('calls onTabSelected when a tab is clicked', () => {
    render(<RoundedTabs {...baseProps} />);
    const tab = screen.getByText('Tab1');
    fireEvent.click(tab);
    expect(baseProps.onTabSelected).toHaveBeenCalledWith('Tab1');
  });

  it('does not highlight any tab if activeItem is not in items', () => {
    render(<RoundedTabs {...baseProps} activeItem="NonExistent" />);
    baseProps.items.forEach(tab => {
      expect(screen.getByText(tab)).not.toHaveClass('hc__tab__item--active');
    });
  });

  it('renders nothing if items is empty', () => {
    render(<RoundedTabs items={[]} activeItem="" onTabSelected={jest.fn()} />);
    // Should not throw, and no tab should be present
    expect(screen.queryByText('Tab1')).not.toBeInTheDocument();
  });

  it('handles single tab', () => {
    render(<RoundedTabs items={["OnlyTab"]} activeItem="OnlyTab" onTabSelected={baseProps.onTabSelected} />);
    expect(screen.getByText('OnlyTab')).toBeInTheDocument();
    expect(screen.getByText('OnlyTab')).toHaveClass('hc__tab__item--active');
  });

  it('handles case sensitivity in activeItem', () => {
    render(<RoundedTabs items={["TabA"]} activeItem="taba" onTabSelected={baseProps.onTabSelected} />);
    // Should not highlight if case does not match
    expect(screen.getByText('TabA')).not.toHaveClass('hc__tab__item--active');
  });

  it('handles onTabSelected for all tabs', () => {
    render(<RoundedTabs {...baseProps} />);
    baseProps.items.forEach(tab => {
      fireEvent.click(screen.getByText(tab));
      expect(baseProps.onTabSelected).toHaveBeenCalledWith(tab);
    });
  });
}); 