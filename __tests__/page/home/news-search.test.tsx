import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';

import { NewsSearch } from '@/components/page/home/TeamNews/components/NewsSearch/NewsSearch';

describe('NewsSearch', () => {
  it('renders the search icon button when closed, and calls onOpen on click', () => {
    const onOpen = jest.fn();
    render(
      <NewsSearch
        open={false}
        value=""
        onOpen={onOpen}
        onChange={jest.fn()}
        onBlur={jest.fn()}
        fieldRef={createRef<HTMLDivElement>()}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Search news' });
    expect(btn).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search news, teams…')).not.toBeInTheDocument();

    fireEvent.click(btn);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('renders the SearchInput when open, forwarding value and placeholder', () => {
    render(
      <NewsSearch
        open={true}
        value="acme"
        onOpen={jest.fn()}
        onChange={jest.fn()}
        onBlur={jest.fn()}
        fieldRef={createRef<HTMLDivElement>()}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Search news' })).not.toBeInTheDocument();
    const input = screen.getByPlaceholderText('Search news, teams…');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('acme');
  });

  it('forwards typed input via onChange (debounced)', () => {
    jest.useFakeTimers();
    const onChange = jest.fn();
    render(
      <NewsSearch
        open={true}
        value=""
        onOpen={jest.fn()}
        onChange={onChange}
        onBlur={jest.fn()}
        fieldRef={createRef<HTMLDivElement>()}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText('Search news, teams…'), { target: { value: 'lattice' } });
    jest.advanceTimersByTime(700);
    expect(onChange).toHaveBeenCalledWith('lattice');
    jest.useRealTimers();
  });

  it('calls onBlur when focus leaves the field container', () => {
    const onBlur = jest.fn();
    render(
      <NewsSearch
        open={true}
        value=""
        onOpen={jest.fn()}
        onChange={jest.fn()}
        onBlur={onBlur}
        fieldRef={createRef<HTMLDivElement>()}
      />,
    );
    fireEvent.blur(screen.getByPlaceholderText('Search news, teams…'));
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
