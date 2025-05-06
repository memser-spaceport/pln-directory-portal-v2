import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { Tag } from '@/components/ui/tag';

describe('Tag', () => {
  const baseProps = {
    value: 'TestTag',
    keyValue: 'k1',
    from: 'test',
    tagsLength: 3,
  };

  // Test: Renders with value
  it('renders the tag with value', () => {
    render(<Tag {...baseProps} />);
    const button = screen.getByTestId('ui-tag-TestTag');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('TestTag');
  });

  // Test: Renders with different variants
  it('renders with primary variant', () => {
    render(<Tag {...baseProps} variant="primary" />);
    const button = screen.getByTestId('ui-tag-TestTag');
    expect(button.className).toMatch(/tag-primary/);
  });
  it('renders with secondary variant', () => {
    render(<Tag {...baseProps} variant="secondary" />);
    const button = screen.getByTestId('ui-tag-TestTag');
    expect(button.className).toMatch(/tag-secondary/);
  });
  it('renders with default variant', () => {
    render(<Tag {...baseProps} />);
    const button = screen.getByTestId('ui-tag-TestTag');
    expect(button.className).toMatch(/tag-default/);
  });

  // Test: Renders with selected and disabled
  it('renders as selected (secondary variant)', () => {
    render(<Tag {...baseProps} variant="secondary" selected />);
    const button = screen.getByTestId('ui-tag-TestTag');
    expect(button.className).toMatch(/tag--active/);
  });
  it('renders as disabled (secondary variant)', () => {
    render(<Tag {...baseProps} variant="secondary" disabled />);
    const button = screen.getByTestId('ui-tag-TestTag');
    expect(button.className).toMatch(/tag--inactive/);
    expect(button).toBeDisabled();
  });
  it('renders as disabled (default variant)', () => {
    render(<Tag {...baseProps} disabled />);
    const button = screen.getByTestId('ui-tag-TestTag');
    expect(button).toBeDisabled();
  });

  // Test: Renders with tagsLength < 3 (tag-md class)
  it('renders with tag-md class when tagsLength < 3', () => {
    render(<Tag {...baseProps} tagsLength={2} />);
    const button = screen.getByTestId('ui-tag-TestTag');
    expect(button.className).toMatch(/tag-md/);
  });

  // Test: Calls callback with correct args when clicked
  it('calls callback with correct args when clicked', () => {
    const callback = jest.fn();
    render(<Tag {...baseProps} callback={callback} selected from="fromValue" keyValue="keyVal" value="val" />);
    const button = screen.getByTestId('ui-tag-val');
    fireEvent.click(button);
    expect(callback).toHaveBeenCalledWith('keyVal', 'val', true, 'fromValue');
  });

  // Edge case: Renders with empty value
  it('renders with empty value', () => {
    render(<Tag value="" />);
    const button = screen.getByTestId('ui-tag-');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('');
  });

  // Test: Calls callback with all default optional props
  it('calls callback with default optional props', () => {
    const callback = jest.fn();
    render(<Tag value="val" callback={callback} />);
    const button = screen.getByTestId('ui-tag-val');
    fireEvent.click(button);
    expect(callback).toHaveBeenCalledWith('', 'val', false, '');
  });

  // Test: Calls callback with selected false and custom from/keyValue
  it('calls callback with selected false and custom from/keyValue', () => {
    const callback = jest.fn();
    render(<Tag value="val" callback={callback} selected={false} from="fromTest" keyValue="keyTest" />);
    const button = screen.getByTestId('ui-tag-val');
    fireEvent.click(button);
    expect(callback).toHaveBeenCalledWith('keyTest', 'val', false, 'fromTest');
  });

  // Covers the callback branch
  it('calls callback with correct args', () => {
    const callback = jest.fn();
    render(<Tag value="val" callback={callback} />);
    const button = screen.getByTestId('ui-tag-val');
    fireEvent.click(button);
    expect(callback).toHaveBeenCalled();
  });
}); 