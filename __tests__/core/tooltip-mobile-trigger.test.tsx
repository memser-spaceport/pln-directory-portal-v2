/**
 * LAB-3089: the tooltip renders its trigger twice (one copy below 1024px, one above), so an h1 trigger put two h1s on
 * team and project pages. `mobileTrigger` replaces the mobile copy.
 */
import { render } from '@testing-library/react';
import { Tooltip } from '@/components/core/tooltip/tooltip';

describe('Tooltip mobileTrigger', () => {
  it('renders the trigger in both copies by default', () => {
    const { container } = render(<Tooltip asChild trigger={<h1>Name</h1>} content="Name" />);
    expect(container.querySelectorAll('h1')).toHaveLength(2);
  });

  it('uses mobileTrigger for the mobile copy, leaving one h1', () => {
    const { container } = render(
      <Tooltip
        asChild
        trigger={<h1>Name</h1>}
        mobileTrigger={
          <p role="heading" aria-level={1}>
            Name
          </p>
        }
        content="Name"
      />,
    );
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelectorAll('[role="heading"][aria-level="1"]')).toHaveLength(1);
  });
});
