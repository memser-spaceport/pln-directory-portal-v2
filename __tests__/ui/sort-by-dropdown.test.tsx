import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SortByDropdown from '@/components/ui/sort-by-dropdown';
import { SORT_ICONS } from '@/utils/constants';

describe('SortByDropdown', () => {
  const baseProps = {
    selectedItem: SORT_ICONS[0].name,
    callback: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all sort options', () => {
    render(<SortByDropdown {...baseProps} />);
    SORT_ICONS.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('highlights the selected option', () => {
    render(<SortByDropdown {...baseProps} selectedItem={SORT_ICONS[1].name} />);
    const selectedBtn = screen.getByText(SORT_ICONS[1].label).closest('button');
    expect(selectedBtn).toHaveClass('dropdown__option__container__option__selected');
    // Others are not selected
    SORT_ICONS.filter(o => o.name !== SORT_ICONS[1].name).forEach(option => {
      const btn = screen.getByText(option.label).closest('button');
      expect(btn).not.toHaveClass('dropdown__option__container__option__selected');
    });
  });

  it('calls callback with correct type when an option is clicked', () => {
    render(<SortByDropdown {...baseProps} />);
    SORT_ICONS.forEach(option => {
      const btn = screen.getByText(option.label).closest('button');
      fireEvent.click(btn!);
      expect(baseProps.callback).toHaveBeenCalledWith(option.name);
    });
  });

  it('renders correct icon for selected and unselected options', () => {
    render(<SortByDropdown {...baseProps} selectedItem={SORT_ICONS[0].name} />);
    const selectedBtn = screen.getByText(SORT_ICONS[0].label).closest('button');
    const selectedIcon = selectedBtn?.querySelector('img');
    expect(selectedIcon).toHaveAttribute('src', SORT_ICONS[0].selectedIcon);

    const unselectedBtn = screen.getByText(SORT_ICONS[1].label).closest('button');
    const unselectedIcon = unselectedBtn?.querySelector('img');
    expect(unselectedIcon).toHaveAttribute('src', SORT_ICONS[1].deselectIcon);
  });

  it('handles edge case: selectedItem not in SORT_ICONS', () => {
    render(<SortByDropdown {...baseProps} selectedItem="not-a-real-option" />);
    SORT_ICONS.forEach(option => {
      const btn = screen.getByText(option.label).closest('button');
      expect(btn).not.toHaveClass('dropdown__option__container__option__selected');
    });
  });

  it('renders with empty selectedItem', () => {
    render(<SortByDropdown {...baseProps} selectedItem="" />);
    SORT_ICONS.forEach(option => {
      const btn = screen.getByText(option.label).closest('button');
      expect(btn).not.toHaveClass('dropdown__option__container__option__selected');
    });
  });
}); 