import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import { SessionStatusBadge, humanizeStatus } from '@/components/page/agent-sessions/shared/sessionStatus';

describe('humanizeStatus', () => {
  it.each([
    ['waiting_for_input', 'Waiting for input'],
    ['cleanup_failed', 'Cleanup failed'],
    ['ready', 'Ready'],
  ])('turns %s into %s', (input, expected) => {
    expect(humanizeStatus(input)).toBe(expected);
  });

  it('leaves an empty status alone rather than returning an empty label', () => {
    expect(humanizeStatus('')).toBe('');
  });
});

describe('SessionStatusBadge', () => {
  it.each([
    ['waiting_for_input', 'Waiting for input'],
    ['pr_created', 'PR created'],
    ['in_progress', 'In progress'],
    ['deleted', 'Deleted'],
    ['ready', 'Ready'],
  ])('renders %s as "%s"', (status, label) => {
    render(<SessionStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  // The orchestrator introduced `waiting_for_input` with no warning and the UI
  // rendered it unstyled. The next unknown status must still read as English.
  it('humanizes a status it has never seen', () => {
    render(<SessionStatusBadge status="awaiting_review" />);
    expect(screen.getByText('Awaiting review')).toBeInTheDocument();
  });

  it('does not crash on an empty status', () => {
    const { container } = render(<SessionStatusBadge status="" />);
    expect(container.querySelector('span')).toBeInTheDocument();
  });

  // Labels deliberately diverge from the wire format, so the raw value has to stay
  // recoverable for anyone cross-checking against the orchestrator.
  it('keeps the raw API value in the title attribute', () => {
    render(<SessionStatusBadge status="waiting_for_input" />);
    expect(screen.getByTitle('waiting_for_input')).toBeInTheDocument();
  });

  it('marks the icon decorative so the label is the only announced text', () => {
    const { container } = render(<SessionStatusBadge status="running" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('animates a status where work is actively happening', () => {
    const { container } = render(<SessionStatusBadge status="running" />);
    expect(container.querySelector('svg')?.getAttribute('class')).toMatch(/spin/);
  });

  it('does not animate a settled status', () => {
    const { container } = render(<SessionStatusBadge status="failed" />);
    const className = container.querySelector('svg')?.getAttribute('class') ?? '';
    expect(className).not.toMatch(/spin/);
    expect(className).not.toMatch(/pulse/);
  });
});
