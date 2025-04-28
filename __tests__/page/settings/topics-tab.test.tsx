import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import TopicsTab from '../../../components/page/settings/intro-rules/topics-tab';

const topics = [
  { id: '1', name: 'Protocol Labs' },
  { id: '2', name: 'Filecoin' },
  { id: '3', name: 'IPFS' },
];

describe('TopicsTab', () => {
  beforeEach(() => {
    // Remove any event listeners between tests
    document.body.innerHTML = '';
  });

  it('renders all topics', () => {
    render(<TopicsTab topics={topics} />);
    expect(screen.getByText('Protocol Labs')).toBeInTheDocument();
    expect(screen.getByText('Filecoin')).toBeInTheDocument();
    expect(screen.getByText('IPFS')).toBeInTheDocument();
  });

  it('renders the search input and add button', () => {
    const { container } = render(<TopicsTab topics={topics} />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    const addBtn = container.querySelector('.topics__add-btn');
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).toHaveTextContent('Add Topic');
  });

  it('filters topics by search', () => {
    render(<TopicsTab topics={topics} />);
    const input = screen.getByPlaceholderText('Search');
    fireEvent.change(input, { target: { value: 'file' } });
    expect(screen.getByText('Filecoin')).toBeInTheDocument();
    expect(screen.queryByText('Protocol Labs')).not.toBeInTheDocument();
    expect(screen.queryByText('IPFS')).not.toBeInTheDocument();
  });

  it('dispatches add-edit-topic-modal event when "Add Topic" is clicked', () => {
    const eventListener = jest.fn();
    document.addEventListener('add-edit-topic-modal', eventListener);

    const { container } = render(<TopicsTab topics={topics} />);
    const addBtn = container.querySelector('.topics__add-btn');
    fireEvent.click(addBtn!);
    expect(eventListener).toHaveBeenCalled();
    const event = eventListener.mock.calls[0][0];
    expect(event.detail.mode).toBe('add');
  });

  it('dispatches add-edit-topic-modal event with topic when "Edit" is clicked', () => {
    const eventListener = jest.fn();
    document.addEventListener('add-edit-topic-modal', eventListener);

    render(<TopicsTab topics={topics} />);
    // Click the first edit button
    const editBtns = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editBtns[0]);
    expect(eventListener).toHaveBeenCalled();
    const event = eventListener.mock.calls[0][0];
    expect(event.detail.mode).toBe('edit');
    expect(event.detail.topic).toBeDefined();
    expect(event.detail.topic.name).toBe('Protocol Labs');
  });

  it('renders correctly with no topics', () => {
    const { container } = render(<TopicsTab topics={[]} />);
    const addBtn = container.querySelector('.topics__add-btn');
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).toHaveTextContent('Add Topic');
    // No topic items
    expect(screen.queryByText('Protocol Labs')).not.toBeInTheDocument();
    expect(screen.queryByText('Filecoin')).not.toBeInTheDocument();
    expect(screen.queryByText('IPFS')).not.toBeInTheDocument();
  });
});
