import { render, screen, fireEvent } from '@testing-library/react';
import RadioButton from '../../components/form/radio-button';
import '@testing-library/jest-dom';

const options = [
  { label: 'Option A', value: 'A' },
  { label: 'Option B', value: 'B' },
  { label: 'Option C', value: 'C' },
];

describe('RadioButton', () => {
  const baseProps = {
    name: 'test-radio',
    options,
    selectedValue: 'B',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<RadioButton {...baseProps} />);
    expect(screen.getByLabelText('Option A')).toBeInTheDocument();
    expect(screen.getByLabelText('Option B')).toBeInTheDocument();
    expect(screen.getByLabelText('Option C')).toBeInTheDocument();
  });

  it('renders the correct number of radio buttons', () => {
    render(<RadioButton {...baseProps} />);
    expect(screen.getAllByRole('radio')).toHaveLength(options.length);
  });

  it('each radio button has the correct label and value', () => {
    render(<RadioButton {...baseProps} />);
    options.forEach(opt => {
      const radio = screen.getByLabelText(opt.label);
      expect(radio).toHaveAttribute('value', opt.value);
    });
  });

  it('the radio button matching selectedValue is checked', () => {
    render(<RadioButton {...baseProps} />);
    expect(screen.getByLabelText('Option B')).toBeChecked();
    expect(screen.getByLabelText('Option A')).not.toBeChecked();
    expect(screen.getByLabelText('Option C')).not.toBeChecked();
  });

  it('calls onChange with the correct value when a radio is clicked', () => {
    render(<RadioButton {...baseProps} />);
    fireEvent.click(screen.getByLabelText('Option C'));
    expect(baseProps.onChange).toHaveBeenCalledWith('C');
  });

  it('all radio buttons have the same name attribute', () => {
    render(<RadioButton {...baseProps} />);
    const radios = screen.getAllByRole('radio');
    radios.forEach(radio => {
      expect(radio).toHaveAttribute('name', baseProps.name);
    });
  });

  it('handles empty options array gracefully', () => {
    render(<RadioButton {...baseProps} options={[]} />);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('handles missing selectedValue (none checked)', () => {
    render(<RadioButton {...baseProps} selectedValue={''} />);
    options.forEach(opt => {
      expect(screen.getByLabelText(opt.label)).not.toBeChecked();
    });
  });
});