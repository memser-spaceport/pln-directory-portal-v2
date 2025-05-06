import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dropdown from '../../components/form/dropdown';

describe('Dropdown', () => {
  const OPTIONS = [
    { id: 1, name: 'Option 1', count: 5 },
    { id: 2, name: 'Option 2', count: 0 },
    { id: 3, name: 'Another', count: 2 },
  ];
  const baseProps = {
    options: OPTIONS,
    selectedOption: null,
    onItemSelect: jest.fn(),
    uniqueKey: 'id',
    displayKey: 'name',
    id: 'dropdown-test',
    placeholder: 'Select...',
    label: 'Test Label',
    count: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with label and placeholder', () => {
    render(<Dropdown {...baseProps} />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('shows options when dropdown is clicked', () => {
    render(<Dropdown {...baseProps} />);
    fireEvent.click(screen.getByText('Select...'));
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2 0')).toBeInTheDocument();
    expect(screen.getByText('Another')).toBeInTheDocument();
  });

  it('calls onItemSelect when an option is clicked', () => {
    const onItemSelect = jest.fn();
    render(<Dropdown {...baseProps} onItemSelect={onItemSelect} />);
    fireEvent.click(screen.getByText('Select...'));
    fireEvent.click(screen.getByText('Option 1'));
    expect(onItemSelect).toHaveBeenCalledWith(OPTIONS[0]);
  });

  it('shows count if provided', () => {
    render(<Dropdown {...baseProps} count={10} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('shows option count in option item', () => {
    render(<Dropdown {...baseProps} />);
    fireEvent.click(screen.getByText('Select...'));
    expect(screen.getByText('(5)')).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('shows arrow image if arrowImgUrl is provided', () => {
    render(<Dropdown {...baseProps} arrowImgUrl="arrow.png" />);
    expect(screen.getByAltText('arrow down')).toBeInTheDocument();
  });

  it('toggles options when arrow is clicked', () => {
    render(<Dropdown {...baseProps} arrowImgUrl="arrow.png" />);
    const arrow = screen.getByAltText('arrow down');
    fireEvent.click(arrow);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    fireEvent.click(arrow);
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('shows "No results found" when options are empty', () => {
    render(<Dropdown {...baseProps} options={[]} />);
    fireEvent.click(screen.getByText('Select...'));
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('closes options when clicking outside', () => {
    render(<Dropdown {...baseProps} />);
    fireEvent.click(screen.getByText('Select...'));
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    act(() => {
      fireEvent.mouseDown(document.body);
    });
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('renders with unusual characters in label and placeholder', () => {
    render(
      <Dropdown
        {...baseProps}
        label="!@#$%^&*()_+"
        placeholder={'<>?"{}|'}
      />
    );
    expect(screen.getByText('!@#$%^&*()_+')).toBeInTheDocument();
    expect(screen.getByText('<>?"{}|')).toBeInTheDocument();
  });

  it('renders with isMandatory and error style when no selection', () => {
    render(<Dropdown {...baseProps} isMandatory />);
    fireEvent.click(screen.getByText('Select...'));
    const searchDiv = screen.getByText('Select...').closest('.select__search');
    expect(searchDiv?.className).toMatch(/select__search--error/);
  });

  it('calls onDropdownClicked when container is clicked', () => {
    const onDropdownClicked = jest.fn();
    render(<Dropdown {...baseProps} onDropdownClicked={onDropdownClicked} />);
    fireEvent.click(screen.getByText('Select...'));
    expect(onDropdownClicked).toHaveBeenCalled();
  });

  it('renders with selectedOption', () => {
    render(<Dropdown {...baseProps} selectedOption={OPTIONS[1]} />);
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('does not render label when label is empty', () => {
    render(<Dropdown {...baseProps} label="" />);
    expect(screen.queryByText('Test Label')).not.toBeInTheDocument();
  });

  it('does not render count span when count is undefined', () => {
    render(<Dropdown {...baseProps} count={undefined} />);
    fireEvent.click(screen.getByText('Select...'));
    expect(document.querySelector('.select__count')).toBeNull();
  });

  it('does not render option count span when option.count is falsy (0)', () => {
    render(<Dropdown {...baseProps} />);
    fireEvent.click(screen.getByText('Select...'));
    const option2 = screen.getByText('Option 2 0');
    expect(option2.querySelector('.select__options__item__count')).toBeNull();
  });
}); 