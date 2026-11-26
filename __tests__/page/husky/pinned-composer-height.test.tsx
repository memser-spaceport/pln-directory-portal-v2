import { render } from '@testing-library/react';
import { readFileSync } from 'fs';
import path from 'path';

import { usePinnedComposerHeight } from '@/components/page/husky/hooks/usePinnedComposerHeight';

/**
 * LAB-3457: with the chat composer lifted above the phone bottom bar, the floating corner (agent corner and feedback
 * button, 72px from the bottom) would cover its Send. The composer publishes its height; the corner sits above it.
 */
const height = () => document.documentElement.style.getPropertyValue('--pinned-composer-height');

function Pinned({ show }: { show: boolean }) {
  const ref = usePinnedComposerHeight();
  return <div>{show && <div ref={ref} data-pinned-composer="" />}</div>;
}

describe('the pinned chat composer and the floating corner', () => {
  let spy: jest.SpyInstance;
  beforeEach(() => {
    spy = jest.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(74);
  });
  afterEach(() => spy.mockRestore());

  it('publishes the composer height when it mounts (also later, when a new chat becomes a thread) and clears it', () => {
    const { rerender } = render(<Pinned show={false} />);
    expect(height()).toBe('');
    rerender(<Pinned show />);
    expect(height()).toBe('74px');
    rerender(<Pinned show={false} />);
    expect(height()).toBe('');
  });

  it.each([
    ['agent corner', 'components/core/labos-agent/LabosAgentCorner/LabosAgentCorner.module.scss', '.corner'],
    ['feedback button', 'components/page/ai-apps/components/FeedbackFabButton/FeedbackFabButton.module.scss', '.wrap'],
  ])('the %s sits above the pinned composer below 960px', (_name, file, selector) => {
    const scss = readFileSync(path.join(process.cwd(), file), 'utf8');
    const start = scss.indexOf(`:global(body:has([data-pinned-composer])) ${selector} {`);
    expect(start).toBeGreaterThanOrEqual(0);
    const rule = scss.slice(start, scss.indexOf('\n}', start)).replace(/\s+/g, ' ');
    expect(rule).toContain(
      'bottom: calc( max(var(--mobile-bottom-nav-offset, 0px), env(safe-area-inset-bottom, 0px)) + var(--pinned-composer-height, 0px) + 16px );',
    );
  });

  it('both chats mark their pinned composer', () => {
    for (const file of ['components/page/husky/Chat/Chat.tsx', 'components/page/husky/AgentChat/AgentChat.tsx']) {
      const src = readFileSync(path.join(process.cwd(), file), 'utf8');
      expect(src).toMatch(/ref=\{composerWrapperRef\} data-state=\{state\} data-pinned-composer=""/);
    }
  });
});
