import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { BoostButton } from '@/components/page/gantry/shared/BoostButton';

describe('BoostButton', () => {
  it('renders a working button when the viewer may boost', () => {
    const onToggle = jest.fn();
    render(<BoostButton count={4} hasPinned={false} readonly={false} onToggle={onToggle} />);

    const button = screen.getByRole('button', { name: 'Boost (4)' });
    button.click();
    expect(onToggle).toHaveBeenCalledWith(true, expect.anything());
  });

  it("renders a static count on the author's own item, with a reason that isn't 'frozen'", () => {
    render(<BoostButton count={4} hasPinned={false} readonly="author" onToggle={jest.fn()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByTitle("Boosts — you can't boost your own item")).toHaveTextContent('4');
  });

  it('keeps the frozen-stage wording distinct from the author wording', () => {
    render(<BoostButton count={7} hasPinned={false} readonly="frozen" onToggle={jest.fn()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByTitle('Boosts (frozen)')).toHaveTextContent('7');
  });

  it('offers unboost to an author who already self-boosted (readonly resolves to false)', () => {
    const onToggle = jest.fn();
    render(<BoostButton count={4} hasPinned readonly={false} onToggle={onToggle} />);

    screen.getByRole('button', { name: 'Remove boost (4)' }).click();
    expect(onToggle).toHaveBeenCalledWith(false, expect.anything());
  });
});
