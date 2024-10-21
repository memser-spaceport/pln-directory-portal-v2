import React from 'react';
import { render, fireEvent, getByTestId , screen} from '@testing-library/react';
import MultiSelect from '../../components/form/multi-select';
import '@testing-library/jest-dom'; // Updated import statement

const mockOptions = [
  { id: 1, name: 'Option 1' },
  { id: 2, name: 'Option 2' },
  { id: 3, name: 'Option 3' },
];

const mockOnAdd = jest.fn();
const mockOnRemove = jest.fn((option) => {
  const index = mockOptions.findIndex((opt) => opt.id === option.id);
  if (index !== -1) {
    mockOptions.splice(index, 1);
  }
});

describe('MultiSelect Component', () => {
  it('renders without crashing', () => {
    const { getByText } = render(
      <MultiSelect
        options={mockOptions}
        selectedOptions={[]}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
        uniqueKey="id"
        displayKey="name"
        closeImgUrl='/icons/close.svg'
      />
    );
    expect(getByText('Select options...')).toBeInTheDocument();
  });

  it('displays selected options', () => {
    const { getByText } = render(
      <MultiSelect
        options={mockOptions}
        selectedOptions={[mockOptions[0]]}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
        uniqueKey="id"
        displayKey="name"
        closeImgUrl='/icons/close.svg'
      />
    );
    expect(getByText('Option 1')).toBeInTheDocument();
  });

  it('adds an option when clicked', () => {
    const { getByText } = render(
      <MultiSelect
        options={mockOptions}
        selectedOptions={[]}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
        uniqueKey="id"
        displayKey="name"
        closeImgUrl='/icons/close.svg'
      />
    );

    fireEvent.click(getByText('Select options...'));
    fireEvent.click(getByText('Option 1'));
    expect(mockOnAdd).toHaveBeenCalledWith(mockOptions[0]);
  });

  it('removes an option when the close icon is clicked', () => {
    // Ensure the component is rendered correctly
    const { getByTestId, getByText } = render(
      <MultiSelect
        options={mockOptions}
        selectedOptions={[mockOptions[0]]}
        displayKey='name'
        uniqueKey='id'
        onRemove={mockOnRemove}
        onAdd={mockOnAdd}
        closeImgUrl='/icons/close.svg'
      />
    );

    // Check if the selected options wrapper is present
    const selectedOptionsWrapper = getByTestId('form-msselected-options');
    expect(selectedOptionsWrapper).toBeInTheDocument(); // Ensure the element is in the document

    // Now you can safely click on it
    fireEvent.click(selectedOptionsWrapper);

    expect(getByTestId('form-ms-options-list')).toBeInTheDocument();

    // Ensure that "Option 1" is rendered before trying to click it
    expect(getByText('Option 1')).toBeInTheDocument(); // Add this line to check if the option is present

    // Simulate clicking the close icon for the first option
    // {{ edit_1 }} - Ensure you have the correct selector for the close icon
    const closeIcon = getByTestId('form-ms-close-icon-1'); // Adjust this selector as needed
    const itemToRemove = mockOptions[0]
    fireEvent.pointerDown(closeIcon);

    // Check if mockOnRemove was called with the correct argument
    expect(mockOnRemove).toHaveBeenCalledWith(itemToRemove); // Ensure this matches your expected call
  });

  it('hides options when clicking outside', () => {
    const { getByText, queryByText, getByTestId } = render(
      <MultiSelect
        options={mockOptions}
        selectedOptions={[]}
        onAdd={mockOnAdd}
        onRemove={mockOnRemove}
        uniqueKey="id"
        displayKey="name"
        closeImgUrl='/icons/close.svg'
      />
    );

    const selectedOptionsWrapper = getByTestId('form-msselected-options');
    expect(selectedOptionsWrapper).toBeInTheDocument(); // Ensure the element is in the document
    fireEvent.click(selectedOptionsWrapper);
    expect(getByText('Option 2')).toBeInTheDocument();

    // Simulate clicking outside
    fireEvent.click(selectedOptionsWrapper);
    expect(queryByText('Option 2')).not.toBeInTheDocument();
  });
});
