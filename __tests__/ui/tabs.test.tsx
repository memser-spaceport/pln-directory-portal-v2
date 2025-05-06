import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import Tabs from '@/components/ui/tabs';

describe('Tabs', () => {
  const tabs = [
    { name: 'Tab1', count: 0 },
    { name: 'Tab2', count: 5 },
    { name: 'Tab3', count: 2 },
  ];
  const onTabClick = jest.fn();

  // Test: Renders all tab names
  it('renders all tab names', () => {
    render(<Tabs tabs={tabs} activeTab="Tab1" onTabClick={onTabClick} />);
    expect(screen.getByText('Tab1')).toBeInTheDocument();
    expect(screen.getByText('Tab2')).toBeInTheDocument();
    expect(screen.getByText('Tab3')).toBeInTheDocument();
  });

  // Test: Highlights the active tab
  it('highlights the active tab', () => {
    render(<Tabs tabs={tabs} activeTab="Tab2" onTabClick={onTabClick} />);
    const tab = screen.getByText('Tab2').closest('.tabs__tab');
    expect(tab).toHaveClass('tabs__tab--active');
  });

  // Test: Calls onTabClick when a tab is clicked
  it('calls onTabClick when a tab is clicked', () => {
    render(<Tabs tabs={tabs} activeTab="Tab1" onTabClick={onTabClick} />);
    const tab = screen.getByText('Tab2').closest('.tabs__tab');
    tab && fireEvent.click(tab);
    expect(onTabClick).toHaveBeenCalledWith('Tab2');
  });

  // Test: Renders tab counts when count > 0
  it('renders tab counts when count > 0', () => {
    render(<Tabs tabs={tabs} activeTab="Tab1" onTabClick={onTabClick} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  // Test: Does not render tab count when count is 0
  it('does not render tab count when count is 0', () => {
    render(<Tabs tabs={tabs} activeTab="Tab1" onTabClick={onTabClick} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  // Test: Renders error style for tab with errorInfo
  it('renders error style for tab with errorInfo', () => {
    render(<Tabs tabs={tabs} activeTab="Tab2" errorInfo={{ Tab2: true }} onTabClick={onTabClick} />);
    const tab = screen.getByText('Tab2').closest('.tabs__tab');
    expect(tab).toHaveClass('tabs__tab--error');
    const text = screen.getByText('Tab2');
    expect(text).toHaveClass('tabs__tab__text--error');
  });

  // Test: Renders error style for active tab with errorInfo
  it('renders error style for active tab with errorInfo', () => {
    render(<Tabs tabs={tabs} activeTab="Tab2" errorInfo={{ Tab2: true }} onTabClick={onTabClick} />);
    const tab = screen.getByText('Tab2').closest('.tabs__tab');
    expect(tab).toHaveClass('tabs__tab--error');
    const text = screen.getByText('Tab2');
    expect(text).toHaveClass('tabs__tab__text--error');
  });

  // Test: Renders active count style for active tab
  it('renders active count style for active tab', () => {
    render(<Tabs tabs={tabs} activeTab="Tab2" onTabClick={onTabClick} />);
    const count = screen.getByText('5').closest('.tabs__tab__count');
    expect(count).toHaveClass('tabs__tab__count--active');
  });

  // Test: Handles empty tabs array
  it('renders nothing if tabs is empty', () => {
    render(<Tabs tabs={[]} activeTab="" onTabClick={onTabClick} />);
    expect(screen.queryByText('Tab1')).not.toBeInTheDocument();
    expect(screen.queryByText('Tab2')).not.toBeInTheDocument();
    expect(screen.queryByText('Tab3')).not.toBeInTheDocument();
  });

  // Test: Handles missing errorInfo
  it('renders without errorInfo', () => {
    render(<Tabs tabs={tabs} activeTab="Tab1" onTabClick={onTabClick} />);
    const tab = screen.getByText('Tab1').closest('.tabs__tab');
    expect(tab).not.toHaveClass('tabs__tab--error');
  });
}); 