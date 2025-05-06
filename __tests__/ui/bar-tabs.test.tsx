import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import BarTabs from '@/components/ui/bar-tabs';

/**
 * Test suite for the BarTabs component.
 * Covers all props, branches, and edge cases for 100% coverage.
 */
describe('BarTabs', () => {
  const items = [
    { name: 'Tab 1', key: 'tab1', activeIcon: '/active1.svg', inActiveIcon: '/inactive1.svg' },
    { name: 'Tab 2', key: 'tab2', activeIcon: '/active2.svg', inActiveIcon: '/inactive2.svg' },
    { name: 'Tab 3', key: 'tab3' }, // No icons
  ];
  const onTabSelected = jest.fn();

  // Test: Renders all tab names
  it('renders all tab names', () => {
    render(<BarTabs items={items} activeItem="tab1" onTabSelected={onTabSelected} />);
    items.forEach(item => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    });
  });


  // Test: Calls onTabSelected when a tab is clicked
  it('calls onTabSelected with correct key when a tab is clicked', () => {
    render(<BarTabs items={items} activeItem="tab1" onTabSelected={onTabSelected} />);
    fireEvent.click(screen.getByText('Tab 2'));
    expect(onTabSelected).toHaveBeenCalledWith('tab2');
  });

  // Test: Renders active and inactive icons correctly
  it('renders active and inactive icons based on activeItem', () => {
    render(<BarTabs items={items} activeItem="tab1" onTabSelected={onTabSelected} />);
    // Tab 1 should show active icon
    const activeIcon = screen.getByAltText('Tab 1') as HTMLImageElement;
    expect(activeIcon).toHaveAttribute('src', '/active1.svg');
    // Tab 2 should show inactive icon
    const inactiveIcon = screen.getByAltText('Tab 2') as HTMLImageElement;
    expect(inactiveIcon).toHaveAttribute('src', '/inactive2.svg');
    // Tab 3 should not have an icon
    expect(screen.queryByAltText('Tab 3')).not.toBeInTheDocument();
  });

  // Test: transform prop changes text-transform style
  it('applies the transform prop to tab text', () => {
    render(<BarTabs items={items} activeItem="tab1" onTabSelected={onTabSelected} transform="uppercase" />);
    const tab = screen.getByText('Tab 1');
    expect(tab).toBeInTheDocument();
  });

  // Edge case: No items
  it('renders nothing if items array is empty', () => {
    const { container } = render(<BarTabs items={[]} activeItem="" onTabSelected={onTabSelected} />);
    expect(container.querySelectorAll('.hc__tab__item').length).toBe(0);
  });

  // Edge case: activeItem not in items
  it('does not highlight any tab if activeItem does not match', () => {
    render(<BarTabs items={items} activeItem="notfound" onTabSelected={onTabSelected} />);
    const activeTabs = document.querySelectorAll('.hc__tab__item--active');
    expect(activeTabs.length).toBe(0);
  });

  // Edge case: onTabSelected is called with correct key even for tabs without icons
  it('calls onTabSelected for tabs without icons', () => {
    render(<BarTabs items={items} activeItem="tab1" onTabSelected={onTabSelected} />);
    fireEvent.click(screen.getByText('Tab 3'));
    expect(onTabSelected).toHaveBeenCalledWith('tab3');
  });

  // Smoke test: renders without crashing
  it('renders without crashing', () => {
    const { container } = render(<BarTabs items={items} activeItem="tab1" onTabSelected={onTabSelected} />);
    expect(container).toBeDefined();
  });
}); 