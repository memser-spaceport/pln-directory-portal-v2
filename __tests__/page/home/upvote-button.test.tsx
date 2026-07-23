import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { UpvoteButton } from '@/components/page/home/TeamNews/components/NewsCard/components/UpvoteButton';

describe('UpvoteButton', () => {
  it('hides the count when it is 0 (icon-only; title carries the label)', () => {
    render(<UpvoteButton count={0} voted={false} onToggle={jest.fn()} />);
    const btn = screen.getByRole('button', { name: 'Like (0)' });
    expect(btn).not.toHaveTextContent('0');
    expect(btn).toHaveAttribute('title', 'Like (0)');
  });

  it('shows the count when it is greater than 0', () => {
    render(<UpvoteButton count={7} voted={false} onToggle={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Like (7)' })).toHaveTextContent('7');
  });

  it('reflects voted state via aria-pressed and label', () => {
    render(<UpvoteButton count={7} voted onToggle={jest.fn()} />);
    const btn = screen.getByRole('button', { name: 'Remove like (7)' });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onToggle and does not propagate the click to a parent handler', () => {
    const onToggle = jest.fn();
    const onParentClick = jest.fn();
    render(
      <div onClick={onParentClick}>
        <UpvoteButton count={0} voted={false} onToggle={onToggle} />
      </div>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Like (0)' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onParentClick).not.toHaveBeenCalled();
  });
});
