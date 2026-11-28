/**
 * Two design decisions for Past on All Events (LAB-3418) live in CSS, which jsdom never applies (the SCSS modules are
 * class-name stand-ins in Jest), so these read the stylesheet itself. Both were also checked in Chrome.
 */
import { readFileSync } from 'fs';
import path from 'path';

const scss = readFileSync(
  path.join(__dirname, '../../../components/page/events/all-events/AllEventsPage.module.scss'),
  'utf8',
);

/** The declarations of one top-level rule, e.g. `.livePill`. */
function rule(selector: string): string {
  const start = scss.indexOf(`\n${selector} {`);
  if (start < 0) throw new Error(`no ${selector}`);
  return scss.slice(start, scss.indexOf('\n}', start));
}

/** The colour a declaration paints: its token's fallback (the DS tokens are not loaded on the page). */
function painted(block: string, property: string): number[] {
  const line = block.split('\n').find((l) => l.trim().startsWith(`${property}:`));
  if (!line) throw new Error(`no ${property}`);
  const hex = line.match(/#([0-9a-f]{6})/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)).concat(1);
  const rgba = line.match(/rgba\(([^)]+)\)/);
  if (!rgba) throw new Error(`no colour in ${line}`);
  return rgba[1].split(',').map(Number);
}

const channel = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: number[]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const over = ([r, g, b, a]: number[], under: number[]) => [r, g, b].map((c, i) => a * c + (1 - a) * under[i]);
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe('All Events styles (LAB-3418 design decisions)', () => {
  it('P5: the Live pill’s text reads at 4.5:1 or more on its tint over a white card, in Polina’s green', () => {
    const pill = rule('.livePill');
    const text = painted(pill, 'color');
    const tint = over(painted(pill, 'background'), [255, 255, 255]);
    expect(contrast(text, tint)).toBeGreaterThanOrEqual(4.5);
    // The tint stays the success green's.
    expect(painted(pill, 'background')).toEqual([10, 153, 82, 0.08]);
  });

  it('P13: the city header leaves no gap before the list', () => {
    const header = rule('.cityHeader');
    expect(header).toMatch(/margin-top:\s*24px/);
    expect(header).not.toMatch(/margin(-bottom)?:\s*24px\s+0/);
    expect(header).not.toMatch(/margin-bottom/);
  });

  // jsdom paints nothing, so this reads the numbers; QA checks the menus over the sticky toolbar in a browser.
  it('the sticky toolbar stays under the site header, so the header’s menus open over it', () => {
    const zIndex = (block: string) => Number(block.match(/\n\s*z-index:\s*(\d+);/)?.[1]);
    const globals = readFileSync(path.join(__dirname, '../../../app/globals.scss'), 'utf8');
    const start = globals.indexOf('\n.layout__header {');
    const siteHeader = zIndex(globals.slice(start, globals.indexOf('\n}', start)));
    expect(siteHeader).toBe(5);
    expect(zIndex(rule('.toolbar'))).toBeLessThan(siteHeader);
  });

  it('the tablet filter bar scrolls under the sticky toolbar, not over it', () => {
    const zIndex = (block: string) => Number(block.match(/\n\s*z-index:\s*(\d+);/)?.[1]);
    const shared = readFileSync(
      path.join(__dirname, '../../../components/common/filters/MobileFilterWrapper/MobileFilterWrapper.module.scss'),
      'utf8',
    );
    const start = shared.indexOf('\n.root {');
    // The shared bar is as high as the toolbar, so this page must lower it.
    expect(zIndex(shared.slice(start, shared.indexOf('\n}', start)))).toBe(zIndex(rule('.toolbar')));
    const bar = rule('.mobileBar');
    const child = bar.slice(bar.indexOf('> div {'));
    expect(zIndex(child.slice(0, child.indexOf('}')))).toBeLessThan(zIndex(rule('.toolbar')));
  });
});
