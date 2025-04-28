import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import TagsTab from '../../../components/page/settings/intro-rules/tags-tab';

const tags = [
  { id: '1', name: 'Network' },
  { id: '2', name: 'Blockchain' },
  { id: '3', name: 'Web3' },
];

describe('TagsTab', () => {
  beforeEach(() => {
    // Remove any event listeners between tests
    document.body.innerHTML = '';
  });

  it('renders all tags', () => {
    render(<TagsTab tags={tags} />);
    expect(screen.getByText('Network')).toBeInTheDocument();
    expect(screen.getByText('Blockchain')).toBeInTheDocument();
    expect(screen.getByText('Web3')).toBeInTheDocument();
  });

  it('renders the search input and add button', () => {
    const { container } = render(<TagsTab tags={tags} />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    const addBtn = container.querySelector('.tags__add-btn');
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).toHaveTextContent('Add Tag');
  });

  it('filters tags by search', () => {
    render(<TagsTab tags={tags} />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'block' } });
    expect(screen.getByText('Blockchain')).toBeInTheDocument();
    expect(screen.queryByText('Network')).not.toBeInTheDocument();
    expect(screen.queryByText('Web3')).not.toBeInTheDocument();
  });

  it('dispatches add-edit-tag-modal event when "Add Tag" is clicked', () => {
    const eventListener = jest.fn();
    document.addEventListener('add-edit-tag-modal', eventListener);

    const { container } = render(<TagsTab tags={tags} />);
    const addBtn = container.querySelector('.tags__add-btn');
    fireEvent.click(addBtn!);
    expect(eventListener).toHaveBeenCalled();
    const event = eventListener.mock.calls[0][0];
    expect(event.detail.mode).toBe('add');
  });

  it('dispatches add-edit-tag-modal event with tag when "Edit" is clicked', () => {
    const eventListener = jest.fn();
    document.addEventListener('add-edit-tag-modal', eventListener);

    render(<TagsTab tags={tags} />);
    // Click the first edit button
    const editBtns = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editBtns[0]);
    expect(eventListener).toHaveBeenCalled();
    const event = eventListener.mock.calls[0][0];
    expect(event.detail.mode).toBe('edit');
    expect(event.detail.tag).toBeDefined();
    expect(event.detail.tag.name).toBe('Network');
  });

  it('renders correctly with no tags', () => {
    const { container } = render(<TagsTab tags={[]} />);
    const addBtn = container.querySelector('.tags__add-btn');
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).toHaveTextContent('Add Tag');
    // No tag items
    expect(screen.queryByText('Network')).not.toBeInTheDocument();
    expect(screen.queryByText('Blockchain')).not.toBeInTheDocument();
    expect(screen.queryByText('Web3')).not.toBeInTheDocument();
  });
});
