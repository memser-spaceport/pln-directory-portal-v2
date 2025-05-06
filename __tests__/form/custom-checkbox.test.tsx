import { render, screen, fireEvent } from '@testing-library/react';
import CustomCheckbox from '@/components/form/custom-checkbox';
import '@testing-library/jest-dom';

describe('CustomCheckbox', () => {
  it('renders unchecked checkbox by default', () => {
    render(
      <CustomCheckbox
        name="test"
        value="value"
        onSelect={jest.fn()}
        initialValue={false}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('unchecked');
    expect(button).not.toHaveClass('checked');
  });

  it('renders checked checkbox if initialValue is true', () => {
    render(
      <CustomCheckbox
        name="test"
        value="value"
        onSelect={jest.fn()}
        initialValue={true}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('checked');
    expect(screen.getByAltText('checkbox')).toBeInTheDocument();
  });

  it('calls onSelect and toggles checked state when clicked', () => {
    const onSelectMock = jest.fn();
    
    render(
      <CustomCheckbox
        name="test"
        value="value"
        onSelect={onSelectMock}
        initialValue={false}
      />
    );

    const button = screen.getByRole('button');

    fireEvent.click(button);

    expect(onSelectMock).toHaveBeenCalledTimes(1);
    expect(button).toHaveClass('checked');
    expect(screen.getByAltText('checkbox')).toBeInTheDocument();
  });

  it('does not toggle or call onSelect when disabled', () => {
    const onSelectMock = jest.fn();
    
    render(
      <CustomCheckbox
        name="test"
        value="value"
        onSelect={onSelectMock}
        initialValue={false}
        disabled
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(onSelectMock).not.toHaveBeenCalled();
    expect(button).toHaveClass('unchecked--disable');
  });

  it('renders HiddenField when checked', () => {
    render(
      <CustomCheckbox
        name="test"
        value="value"
        onSelect={jest.fn()}
        initialValue={true}
      />
    );

    expect(screen.getByDisplayValue('value')).toBeInTheDocument();
  });

  it('renders HiddenField when disabled', () => {
    render(
      <CustomCheckbox
        name="test"
        value="value"
        onSelect={jest.fn()}
        initialValue={false}
        disabled
      />
    );

    expect(screen.getByDisplayValue('value')).toBeInTheDocument();
  });
});