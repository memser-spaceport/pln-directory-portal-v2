import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import SelectedFocusAreas from '@/components/core/selected-focus-area';
import { IFocusArea } from '@/types/shared.types';

// Mock FocusAreaDisplay to isolate SelectedFocusAreas tests
jest.mock('@/components/core/focus-area-display', () => ({
  __esModule: true,
  default: ({ rawData, selectedItems }: any) => (
    <div data-testid="mock-focus-area-display">
      {`rawData:${rawData.length},selectedItems:${selectedItems.length}`}
    </div>
  ),
}));

describe('SelectedFocusAreas', () => {
  const baseFocusAreas: any = [
    { uid: '1', title: 'Area 1', children: [] },
    { uid: '2', title: 'Area 2', children: [] },
  ];

  it('renders the section title', () => {
    render(
      <SelectedFocusAreas focusAreas={baseFocusAreas} selectedFocusAreas={[]} />
    );
    expect(screen.getByText('Focus Area')).toBeInTheDocument();
  });

  it('renders FocusAreaDisplay with correct props when nothing is selected', () => {
    render(
      <SelectedFocusAreas focusAreas={baseFocusAreas} selectedFocusAreas={[]} />
    );
    const display = screen.getByTestId('mock-focus-area-display');
    expect(display).toHaveTextContent('rawData:2,selectedItems:0');
  });

  it('renders FocusAreaDisplay with correct props when some are selected', () => {
    render(
      <SelectedFocusAreas focusAreas={baseFocusAreas} selectedFocusAreas={[baseFocusAreas[0]]} />
    );
    const display = screen.getByTestId('mock-focus-area-display');
    expect(display).toHaveTextContent('rawData:2,selectedItems:1');
  });

  it('renders FocusAreaDisplay with empty focusAreas', () => {
    render(
      <SelectedFocusAreas focusAreas={[]} selectedFocusAreas={[]} />
    );
    const display = screen.getByTestId('mock-focus-area-display');
    expect(display).toHaveTextContent('rawData:0,selectedItems:0');
  });

  it('matches snapshot for regression safety', () => {
    const { asFragment } = render(
      <SelectedFocusAreas focusAreas={baseFocusAreas} selectedFocusAreas={[baseFocusAreas[1]]} />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  // Edge case: selectedFocusAreas contains an item not in focusAreas
  it('handles selectedFocusAreas not present in focusAreas', () => {
    const rogue = { uid: '999', title: 'Rogue', children: [] };
    render(
      <SelectedFocusAreas focusAreas={baseFocusAreas} selectedFocusAreas={[rogue]} />
    );
    const display = screen.getByTestId('mock-focus-area-display');
    expect(display).toHaveTextContent('rawData:2,selectedItems:1');
  });
}); 