import { render, screen, fireEvent } from '@testing-library/react';
import ToggleReadonly from '../../components/form/toggle-readonly';
import '@testing-library/jest-dom';

describe('ToggleReadonly', () => {
  it('renders without crashing', () => {
    render(<ToggleReadonly />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders the input of type checkbox', () => {
    render(<ToggleReadonly />);
    const input = screen.getByRole('checkbox');
    expect(input).toHaveAttribute('type', 'checkbox');
  });

  it('renders the slider span', () => {
    render(<ToggleReadonly />);
    expect(document.querySelector('.slider')).toBeInTheDocument();
  });

  it('is unchecked by default', () => {
    render(<ToggleReadonly />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('is checked when checked prop is true', () => {
    render(<ToggleReadonly checked={true} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('input has readOnly attribute', () => {
    render(<ToggleReadonly />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('readOnly');
  });

  it('input and label have pointerEvents none', () => {
    render(<ToggleReadonly />);
    const input = screen.getByRole('checkbox');
    const label = input.closest('label');
    expect(input).toHaveStyle('pointer-events: none');
    expect(label).toHaveStyle('pointer-events: none');
  });

  it('label has class custom-toggle', () => {
    render(<ToggleReadonly />);
    const input = screen.getByRole('checkbox');
    const label = input.closest('label');
    expect(label).toHaveClass('custom-toggle');
  });

  it('span has class slider', () => {
    render(<ToggleReadonly />);
    expect(document.querySelector('.slider')).toBeInTheDocument();
  });

  it('input is visually hidden', () => {
    render(<ToggleReadonly />);
    const input = screen.getByRole('checkbox');
    expect(input).toHaveStyle('opacity: 0');
    expect(input).toHaveStyle('width: 0');
    expect(input).toHaveStyle('height: 0');
  });

  it('does not change state when clicked', () => {
    render(<ToggleReadonly />);
    const input = screen.getByRole('checkbox');
    expect(input).not.toBeChecked();
    fireEvent.click(input);
    expect(input).not.toBeChecked();
  });
});