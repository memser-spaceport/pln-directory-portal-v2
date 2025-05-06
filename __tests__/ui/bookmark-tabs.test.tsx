import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookmarkTabs from '@/components/ui/bookmark-tabs';

describe('BookmarkTabs', () => {
  const tabItems = [
    { key: 'tab1', displayText: 'Tab 1', image: '/img1.png' },
    { key: 'tab2', displayText: 'Tab 2' },
    { key: 'tab3', displayText: 'Tab 3', image: '/img3.png' },
  ];
  const onTabSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all tab items', () => {
    render(<BookmarkTabs tabItems={tabItems} activeTab="tab2" onTabSelect={onTabSelect} />);
    tabItems.forEach(tab => {
      expect(screen.getByText(tab.displayText)).toBeInTheDocument();
    });
  });

  it('highlights the active tab', () => {
    render(<BookmarkTabs tabItems={tabItems} activeTab="tab3" onTabSelect={onTabSelect} />);
    const active = screen.getByText('Tab 3');
    expect(active).toHaveClass('bookmark-tabs__item--active');
    // Others are not active
    expect(screen.getByText('Tab 1')).not.toHaveClass('bookmark-tabs__item--active');
    expect(screen.getByText('Tab 2')).not.toHaveClass('bookmark-tabs__item--active');
  });

  it('calls onTabSelect when a tab is clicked', () => {
    render(<BookmarkTabs tabItems={tabItems} activeTab="tab1" onTabSelect={onTabSelect} />);
    const tab2 = screen.getByText('Tab 2');
    fireEvent.click(tab2);
    expect(onTabSelect).toHaveBeenCalledWith('tab2');
  });

  it('renders image if provided', () => {
    render(<BookmarkTabs tabItems={tabItems} activeTab="tab1" onTabSelect={onTabSelect} />);
    const img1 = screen.getByAltText('Tab 1');
    expect(img1).toHaveAttribute('src', '/img1.png');
    const img3 = screen.getByAltText('Tab 3');
    expect(img3).toHaveAttribute('src', '/img3.png');
  });

  it('does not render image if not provided', () => {
    render(<BookmarkTabs tabItems={tabItems} activeTab="tab1" onTabSelect={onTabSelect} />);
    // Tab 2 has no image
    expect(screen.queryByAltText('Tab 2')).not.toBeInTheDocument();
  });

  it('handles edge case: activeTab not in tabItems', () => {
    render(<BookmarkTabs tabItems={tabItems} activeTab="not-a-tab" onTabSelect={onTabSelect} />);
    tabItems.forEach(tab => {
      expect(screen.getByText(tab.displayText)).not.toHaveClass('bookmark-tabs__item--active');
    });
  });

  it('renders with empty tabItems', () => {
    render(<BookmarkTabs tabItems={[]} activeTab="tab1" onTabSelect={onTabSelect} />);
    // No tabs should be present
    expect(screen.queryByText('Tab 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Tab 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Tab 3')).not.toBeInTheDocument();
  });
}); 