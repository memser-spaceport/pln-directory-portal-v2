import { readFileSync } from 'fs';
import path from 'path';

/**
 * LAB-3457: on phones the chat composer (today's AI search and AI agent chat share `Chat.module.scss`) sits above the
 * fixed bottom bar, and above the home indicator when the bar hides. jsdom applies no SCSS, so this reads the rules.
 */
const scss = readFileSync(path.join(process.cwd(), 'components/page/husky/Chat/Chat.module.scss'), 'utf8');
const rule = (selector: string) => {
  const start = scss.indexOf(`${selector} {`);
  expect(start).toBeGreaterThanOrEqual(0);
  return scss.slice(start, scss.indexOf('\n}', start));
};

describe('the chat composer clears the phone bottom bar', () => {
  it('the fixed composer sits at the bar offset, or the safe area when the bar hides', () => {
    expect(rule('.formWrapper')).toContain(
      'bottom: max(var(--mobile-bottom-nav-offset, 0px), env(safe-area-inset-bottom, 0px));',
    );
  });

  it('the chat leaves room for the composer and the bar under its last message', () => {
    expect(rule('.root')).toContain('padding: 26px 16px calc(90px + var(--mobile-bottom-nav-offset, 0px)) 16px;');
  });
});
