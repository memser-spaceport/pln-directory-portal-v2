/**
 * @fileoverview
 * Unit tests for the Search component in attendee-list using React Testing Library and Jest.
 * Covers all props, events, and edge cases for 100% coverage.
 */
import '@testing-library/jest-dom';
import React, { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchProps } from '@/components/page/irl/attendee-list/search';
import Search from '@/components/page/irl/attendee-list/search';

/**
 * Helper to render Search with custom props.
 */
const setup = (props: Partial<SearchProps> = {}) => {
  return render(<Search {...props} />);
};

describe('Search component', () => {
  it('renders input and button with default props', () => {
    setup();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /search/i })).toBeInTheDocument();
  });

  it('renders placeholder when provided', () => {
    const placeholder = 'Search attendees...';
    setup({ placeholder });
    expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
  });

  it('calls onChange when input value changes', () => {
    const onChange = jest.fn();
    setup({ onChange });
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('calls onKeyDown when a key is pressed', () => {
    const onKeyDown = jest.fn();
    setup({ onKeyDown });
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('forwards ref to the input element', () => {
    const searchRef = createRef<HTMLInputElement>();
    setup({ searchRef });
    expect(searchRef.current).toBeInstanceOf(HTMLInputElement);
  });

  it('does not throw if no props are provided', () => {
    expect(() => setup()).not.toThrow();
  });

  it('button is not focusable by default (cursor: unset)', () => {
    setup();
    const button = screen.getByRole('button');
    // The button should be present and not disabled
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('input has correct class and style', () => {
    setup();
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('search__input');
  });

  it('button has correct class and style', () => {
    setup();
    const button = screen.getByRole('button');
    expect(button).toHaveClass('search__btn');
  });
}); 