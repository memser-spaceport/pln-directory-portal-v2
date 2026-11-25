/** @jest-environment node */
import path from 'path';
import * as sass from 'sass';

/*
 * LAB-3418: jsdom applies no stylesheet, so these read the compiled rules: the When switch and its badge, the year
 * control, and the toolbar that stays put from tab to tab, phones included.
 */

const root = process.cwd();
const page = sass.compile(path.join(root, 'components/page/events/all-events/AllEventsPage.module.scss'), {
  loadPaths: [root],
}).css;

const escape = (selector: string) => selector.replace(/\./g, '\\.');
/** The body of the rule whose whole selector is `selector`, outside media queries. */
const rule = (selector: string) => new RegExp(`(?:^|\\n)${escape(selector)} \\{([^}]*)\\}`).exec(page)?.[1] ?? '';
/** The same, on phones. */
const phone = (selector: string) =>
  new RegExp(`@media \\(max-width: 639px\\) \\{\\s*${escape(selector)} \\{([^}]*)\\}`).exec(page)?.[1] ?? '';

it('the badge is the design system’s: full round, 12/16 500, 6px off its label', () => {
  expect(rule('.scopeCount')).toContain('margin-left: 6px;');
  expect(rule('.scopeCount')).toContain('padding: 1px 6px;');
  expect(rule('.scopeCount')).toContain('border-radius: 999px;');
  expect(rule('.scopeCount')).toContain('background: var(--background-neutral-subtle, #f1f5f9);');
  expect(rule('.scopeCount')).toMatch(/font-size: 12px;\s*line-height: 16px;\s*font-weight: 500;/);
  expect(rule('.scopeCount')).toContain('color: var(--foreground-neutral-secondary, #455468);');
});

it('Past holds the room of a three-digit badge before its count comes', () => {
  expect(rule('.scopeSlot')).toContain('min-width: 41px;');
});

it('the toolbar’s start is as tall as the switch, and wide enough for a year beside it, on every tab', () => {
  expect(rule('.toolbarStart')).toContain('min-height: 34px;');
  expect(rule('.toolbarStart')).toContain('min-width: 384px;');
});

it('on phones the switch fills the whole row in equal halves, and no label wraps', () => {
  expect(phone('.toolbarStart')).toContain('flex: 1 1 100%;');
  expect(phone('.whenSwitch')).toContain('flex: 1 1 100%;');
  expect(phone('.scopeBtn.scopeBtn')).toContain('flex: 1 1 0;');
  expect(rule('.viewBtn')).toContain('white-space: nowrap;');
});

it('on phones the year goes under the switch, on the row Embed is on, so the bar keeps its height', () => {
  expect(phone('.toolbarStart')).toContain('flex-wrap: wrap;');
  expect(phone('.toolbarStart')).toContain('min-height: 74px;'); // The switch, 8px and a 32px control.
  expect(phone('.toolbarStart')).toContain('min-width: 0;');
  expect(phone('.toolbarActions')).toMatch(/position: absolute;\s*right: 0;\s*bottom: 0;/);
  // Embed is placed in the bar, which doesn't take the sticky offset with it.
  expect(phone('.toolbar')).toMatch(/position: relative;\s*top: auto;/);
});

it('the year is dressed as the Filters button, with a focus ring', () => {
  const year = '.yearPicker.yearPicker';
  expect(rule(year)).toContain('height: 32px;');
  expect(rule(year)).toContain('border-color: var(--border-neutral-muted, rgba(27, 56, 96, 0.24));');
  expect(rule(year)).toContain('color: var(--foreground-neutral-primary, #0a0c11);');
  expect(rule(`${year} svg`)).toContain('color: var(--foreground-neutral-secondary, #455468);');
  expect(rule(`${year}:focus-visible`)).toContain('outline: 2px solid var(--foreground-brand-primary, #1b4dff);');
});
