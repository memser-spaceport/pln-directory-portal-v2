import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import SingleSelectWithImage from '../../components/form/single-select-with-image';
import '@testing-library/jest-dom';

describe('SingleSelectWithImage Component', () => {
  const mockOptions = [
    { id: 1, name: 'Option 1', icon: 'icon1.png' },
    { id: 2, name: 'Option 2', icon: 'icon2.png' },
  ];

  const mockOnItemSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with default props', () => {
    const { getByPlaceholderText } = render(
      <SingleSelectWithImage
        options={mockOptions}
        selectedOption={null}
        onItemSelect={mockOnItemSelect}
        uniqueKey="id"
        displayKey="name"
        defaultIcon="default.png"
        id="single-select"
      />
    );
    expect(getByPlaceholderText('Select')).toBeInTheDocument();
  });

  test('displays label when provided', () => {
    const { getByText } = render(
      <SingleSelectWithImage
        options={mockOptions}
        selectedOption={null}
        onItemSelect={mockOnItemSelect}
        uniqueKey="id"
        displayKey="name"
        defaultIcon="default.png"
        label="Select an option"
        id="single-select"
      />
    );
    expect(getByText('Select an option')).toBeInTheDocument();
  });

  test('shows options when input is clicked', () => {
    const { getByPlaceholderText, getByText } = render(
      <SingleSelectWithImage
        options={mockOptions}
        selectedOption={null}
        onItemSelect={mockOnItemSelect}
        uniqueKey="id"
        displayKey="name"
        defaultIcon="default.png"
        id="single-select"
      />
    );
    fireEvent.click(getByPlaceholderText('Select'));
    expect(getByText('Option 1')).toBeInTheDocument();
    expect(getByText('Option 2')).toBeInTheDocument();
  });

  test('selects an option when clicked', () => {
    const { getByPlaceholderText, getByText } = render(
      <SingleSelectWithImage
        options={mockOptions}
        selectedOption={null}
        onItemSelect={mockOnItemSelect}
        uniqueKey="id"
        displayKey="name"
        defaultIcon="default.png"
        id="single-select"
      />
    );
    fireEvent.click(getByPlaceholderText('Select'));
    fireEvent.click(getByText('Option 1'));
    expect(mockOnItemSelect).toHaveBeenCalledWith(mockOptions[0]);
  });

  test('shows no results message when filtered options are empty', () => {
    const { getByPlaceholderText, getByText } = render(
      <SingleSelectWithImage
        options={[]}
        selectedOption={null}
        onItemSelect={mockOnItemSelect}
        uniqueKey="id"
        displayKey="name"
        defaultIcon="default.png"
        id="single-select"
      />
    );
    fireEvent.click(getByPlaceholderText('Select'));
    expect(getByText('No results found')).toBeInTheDocument();
  });

  test('renders selected option correctly', () => {
    const { getByPlaceholderText } = render(
      <SingleSelectWithImage
        options={mockOptions}
        selectedOption={mockOptions[0]}
        onItemSelect={mockOnItemSelect}
        uniqueKey="id"
        displayKey="name"
        defaultIcon="default.png"
        id="single-select"
      />
    );
    expect(getByPlaceholderText('Select').value).toBe('Option 1');
  });
});
