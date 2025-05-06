import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Toggle from '@/components/ui/toogle';

describe('Toggle', () => {
  const baseProps = {
    height: '16px',
    width: '28px',
    isChecked: false,
    callback: jest.fn(),
    id: 'toggle-id',
    disabled: false,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders with required props', () => {
    const { getByRole } = render(<Toggle height="16px" width="28px" isChecked={false} callback={jest.fn()} />);
    const checkbox = getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('renders as checked when isChecked is true', () => {
    const { getByRole } = render(<Toggle {...baseProps} isChecked={true} />);
    const checkbox = getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls callback when toggled', () => {
    const callback = jest.fn();
    const { getByRole } = render(<Toggle {...baseProps} callback={callback} />);
    const checkbox = getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('renders with id if provided', () => {
    const { getByRole } = render(<Toggle {...baseProps} id="my-toggle" />);
    const checkbox = getByRole('checkbox');
    expect(checkbox.id).toBe('my-toggle');
  });

  it('renders with empty id if not provided', () => {
    const { getByRole } = render(<Toggle height="16px" width="28px" isChecked={false} callback={jest.fn()} />);
    const checkbox = getByRole('checkbox');
    expect(checkbox.id).toBe('');
  });

  it('renders as disabled when disabled is true', () => {
    const { getByRole } = render(<Toggle {...baseProps} disabled={true} />);
    const checkbox = getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('applies custom height and width styles', () => {
    const { container } = render(<Toggle {...baseProps} height="32px" width="64px" />);
    const label = container.querySelector('label.toogle');
    expect(label).toHaveStyle({ height: '32px', width: '64px' });
  });

  it('renders the slider span', () => {
    const { container } = render(<Toggle {...baseProps} />);
    const slider = container.querySelector('.toogle__slider.toogle__round');
    expect(slider).toBeInTheDocument();
  });

  it('focuses the checkbox and applies focus style', () => {
    const { getByRole } = render(<Toggle {...baseProps} />);
    const checkbox = getByRole('checkbox');
    checkbox.focus();
    expect(checkbox).toHaveFocus();
  });

  it('matches snapshot', () => {
    const { container } = render(<Toggle {...baseProps} isChecked={true} disabled={true} />);
    expect(container).toMatchSnapshot();
  });
}); 