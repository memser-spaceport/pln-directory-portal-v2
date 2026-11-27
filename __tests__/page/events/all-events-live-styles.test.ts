/** @jest-environment node */
import path from 'path';
import * as sass from 'sass';

/*
 * LAB-3425: jsdom applies no stylesheet, so these read the compiled rules: the List's width from 1200px, shared with its
 * loading skeleton, the date column's size, the tabs' labels on one line, and the pill in the flow of its line.
 */

const root = process.cwd();
const css = (rel: string) => sass.compile(path.join(root, rel), { loadPaths: [root] }).css;
const page = css('components/page/events/all-events/AllEventsPage.module.scss');
const calendar = css('components/page/events/all-events/calendar/Calendar.module.scss');

/** The bodies of the rules whose whole selector is `selector`, outside and inside media queries. */
const rules = (sheet: string, selector: string) =>
  Array.from(sheet.matchAll(new RegExp(`(?:^|\\n)\\s*\\${selector} \\{([^}]*)\\}`, 'g')), (m) => m[1]).join('\n');

const LIST_WIDTH = 'max-width: calc((100% - 48px) * 4 / 5 + 36px);';
const desktop = (sheet: string, selector: string) =>
  Array.from(
    sheet.matchAll(new RegExp(`@media \\(min-width: 1200px\\) \\{\\s*\\${selector} \\{([^}]*)\\}`, 'g')),
    (m) => m[1],
  ).join('\n');

it.each(['.timeline', '.skeletonDay'])('%s ends at the 4th city tile from 1200px, with no cap below', (selector) => {
  expect(desktop(page, selector)).toContain(LIST_WIDTH);
  expect(rules(page, selector).match(/max-width/g)).toHaveLength(1);
  // The formula stands on the city row's 5 columns and 12px gaps.
  expect(rules(page, '.cityRow')).toContain('grid-template-columns: repeat(5, minmax(0, 1fr));');
  expect(rules(page, '.cityRow')).toContain('gap: 12px;');
});

it('sets the date column at 14/20', () => {
  expect(rules(page, '.dayHeading')).toMatch(/font-size: 14px;\s*line-height: 20px;/);
});

it.each([
  ['List | Calendar | Map', page, '.viewSwitch', '.viewBtn', '--transparent-dark-6, rgba(14, 15, 17, 0.06)'],
  ['Week | Month', calendar, '.modes', '.mode', '--background-neutral-subtle, #f1f5f9'],
])('%s: a 34px track of 26px tabs whose labels stay on one line', (_name, sheet, track, tab, colour) => {
  expect(rules(sheet, track)).toContain('padding: 4px;');
  expect(rules(sheet, track)).toContain(colour);
  expect(rules(sheet, tab)).toContain('height: 26px;');
  expect(rules(sheet, tab)).toContain('white-space: nowrap;');
});

it.each([
  ['List | Calendar | Map', page, '.viewBtn', '.viewBtnActive'],
  ['Week | Month', calendar, '.mode', '.modeActive'],
])('%s: the active tab is white with a shadow, and focus shows', (_name, sheet, tab, active) => {
  expect(rules(sheet, active)).toContain('background: var(--background-base-white, #ffffff);');
  expect(rules(sheet, active)).toContain('box-shadow: var(--shadow-sm,');
  expect(rules(sheet, `${tab}:focus-visible`)).toContain(
    'outline: 2px solid var(--foreground-brand-primary, #1b4dff);',
  );
});

it('keeps the pill in the flow of its line, so the time wraps beside it', () => {
  expect(rules(page, '.livePill')).toContain('display: inline-block;');
});
