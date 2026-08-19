import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import { UpvoteButton } from '@/components/page/home/TeamNews/components/NewsCard/components/UpvoteButton';

describe('UpvoteButton', () => {
  it('shows the count even at 0 (fixed-width digits keep the row from shifting)', () => {
    render(<UpvoteButton count={0} voted={false} onToggle={jest.fn()} />);
    const btn = screen.getByRole('button', { name: 'Like (0)' });
    expect(btn).toHaveTextContent('0');
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

  describe('when the viewer cannot like this item', () => {
    const REASON = 'You can’t like your own post';

    it('still shows the count — it is information, not just the state of an action', () => {
      render(<UpvoteButton count={4} voted={false} onToggle={jest.fn()} disabledReason={REASON} />);

      expect(screen.getByRole('button', { name: `Like (4) — ${REASON}` })).toHaveTextContent('4');
    });

    it('says WHY in the tooltip and the accessible name, not just by being dead', () => {
      render(<UpvoteButton count={4} voted={false} onToggle={jest.fn()} disabledReason={REASON} />);

      const btn = screen.getByRole('button', { name: `Like (4) — ${REASON}` });
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute('title', `Like (4) — ${REASON}`);
    });

    it('does not fire onToggle when clicked', () => {
      const onToggle = jest.fn();
      render(<UpvoteButton count={4} voted={false} onToggle={onToggle} disabledReason={REASON} />);

      fireEvent.click(screen.getByRole('button', { name: `Like (4) — ${REASON}` }));

      expect(onToggle).not.toHaveBeenCalled();
    });
  });
});
