import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { HistorySearch } from '@/components/page/husky/AppSidebar/components/HistorySearch';

describe('AI Search history search field', () => {
  it('shows a labelled search box with its placeholder and no clear button while empty', () => {
    render(<HistorySearch value="" onChange={jest.fn()} />);

    const input = screen.getByRole('searchbox', { name: 'Search chats' });
    expect(input).toHaveAttribute('placeholder', 'Search chats');
    expect(input).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('reports what the member types', () => {
    const onChange = jest.fn();
    render(<HistorySearch value="" onChange={onChange} />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search chats' }), { target: { value: 'storage' } });

    expect(onChange).toHaveBeenCalledWith('storage');
  });

  it('shows the current value and clears it with the clear button', () => {
    const onChange = jest.fn();
    render(<HistorySearch value="storage" onChange={onChange} />);

    expect(screen.getByRole('searchbox', { name: 'Search chats' })).toHaveValue('storage');
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(onChange).toHaveBeenCalledWith('');
  });
});
