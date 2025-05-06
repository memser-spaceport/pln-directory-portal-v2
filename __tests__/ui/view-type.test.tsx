import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ViewType from '@/components/ui/view-type';
import { VIEW_TYPE_OPTIONS } from '@/utils/constants';

// Mock next/image to render a simple img
jest.mock('next/image', () => (props: any) => <img {...props} />);
// Mock Tooltip to render its trigger directly
jest.mock('@/components/core/tooltip/tooltip', () => ({ Tooltip: ({ trigger }: any) => trigger }));

describe('ViewType', () => {
  const callback = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders grid and list buttons', () => {
    const { getAllByRole } = render(
      <ViewType view={VIEW_TYPE_OPTIONS.GRID} callback={callback} />
    );
    const buttons = getAllByRole('button');
    expect(buttons.length).toBe(2);
  });

  it('highlights grid as selected when view is GRID', () => {
    const { container } = render(
      <ViewType view={VIEW_TYPE_OPTIONS.GRID} callback={callback} />
    );
    const gridBtn = container.querySelector('.view-option-container__grid');
    expect(gridBtn).toHaveClass('selected');
    const listBtn = container.querySelector('.view-option-container__list');
    expect(listBtn).toHaveClass('not-selected');
  });

  it('highlights list as selected when view is LIST', () => {
    const { container } = render(
      <ViewType view={VIEW_TYPE_OPTIONS.LIST} callback={callback} />
    );
    const gridBtn = container.querySelector('.view-option-container__grid');
    expect(gridBtn).toHaveClass('not-selected');
    const listBtn = container.querySelector('.view-option-container__list');
    expect(listBtn).toHaveClass('selected');
  });

  it('renders correct grid icon for selected/deselected', () => {
    const { container, rerender } = render(
      <ViewType view={VIEW_TYPE_OPTIONS.GRID} callback={callback} />
    );
    let gridImg = container.querySelector('.view-option-container__grid img');
    expect(gridImg).toHaveAttribute('src', '/icons/grid-selected.svg');
    rerender(<ViewType view={VIEW_TYPE_OPTIONS.LIST} callback={callback} />);
    gridImg = container.querySelector('.view-option-container__grid img');
    expect(gridImg).toHaveAttribute('src', '/icons/grid-deselect.svg');
  });

  it('renders correct list icon for selected/deselected', () => {
    const { container, rerender } = render(
      <ViewType view={VIEW_TYPE_OPTIONS.LIST} callback={callback} />
    );
    let listImg = container.querySelector('.view-option-container__list img');
    expect(listImg).toHaveAttribute('src', '/icons/list-selected.svg');
    rerender(<ViewType view={VIEW_TYPE_OPTIONS.GRID} callback={callback} />);
    listImg = container.querySelector('.view-option-container__list img');
    expect(listImg).toHaveAttribute('src', '/icons/list-deselect.svg');
  });

  it('calls callback with GRID when grid button is clicked', () => {
    const { container } = render(
      <ViewType view={VIEW_TYPE_OPTIONS.LIST} callback={callback} />
    );
    const gridBtn = container.querySelector('.view-option-container__grid');
    fireEvent.click(gridBtn!);
    expect(callback).toHaveBeenCalledWith(VIEW_TYPE_OPTIONS.GRID);
  });

  it('calls callback with LIST when list button is clicked', () => {
    const { container } = render(
      <ViewType view={VIEW_TYPE_OPTIONS.GRID} callback={callback} />
    );
    const listBtn = container.querySelector('.view-option-container__list');
    fireEvent.click(listBtn!);
    expect(callback).toHaveBeenCalledWith(VIEW_TYPE_OPTIONS.LIST);
  });
}); 