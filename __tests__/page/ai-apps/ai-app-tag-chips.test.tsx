import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

/**
 * The rendered row. The CUT is tested in `fit-first-row` — jsdom gives every
 * element `offsetTop: 0`, so everything "fits" here and the component always
 * takes its all-fit branch. What that leaves worth asserting is the rest of the
 * contract: labels resolved, the shared `Tag` used, nothing drawn for an
 * untagged app.
 */

jest.mock('@/services/ai-apps/hooks/useAiAppTags', () => ({
  useAiAppTags: () => ({ getLabel: (code: string) => ({ agents: 'AI Agents & Automation' })[code] ?? code }),
}));

jest.mock('@/components/core/tooltip/tooltip', () => ({
  Tooltip: ({ trigger, content }: { trigger: React.ReactNode; content: React.ReactNode }) => (
    <span data-testid="tooltip" data-content={typeof content === 'string' ? content : undefined}>
      {trigger}
    </span>
  ),
}));

import { AiAppTagChips } from '@/components/page/ai-apps/components/AiAppTagChips/AiAppTagChips';

describe('AiAppTagChips', () => {
  it('renders nothing for an untagged app', () => {
    const { container } = render(<AiAppTagChips tags={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('resolves tag codes to their labels', () => {
    render(<AiAppTagChips tags={['agents']} />);

    expect(screen.getByText('AI Agents & Automation')).toBeInTheDocument();
  });

  /* Falling back to the code is what keeps a newly added tag visible instead of
     blank while the label catalogue is still loading. */
  it('falls back to the code it cannot resolve', () => {
    render(<AiAppTagChips tags={['brand-new']} />);

    expect(screen.getByText('brand-new')).toBeInTheDocument();
  });

  /**
   * Every tag is rendered for the measure pass — the cut is applied after it.
   * With jsdom's zeroed geometry that branch is the one under test here, and it
   * documents why a `+n` assertion cannot live in this file.
   */
  it('lays out every tag for measurement', () => {
    render(<AiAppTagChips tags={['a', 'b', 'c', 'd', 'e']} />);

    expect(document.querySelectorAll('[data-tag-chip]')).toHaveLength(5);
  });
});
