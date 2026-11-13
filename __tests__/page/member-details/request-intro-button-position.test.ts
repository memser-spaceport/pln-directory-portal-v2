import fs from 'fs';
import path from 'path';

/**
 * LAB-3187: on a member page, "Request intro" moved to a second line below the
 * name, role and location row, so it looked offset.
 *
 * `.headerDetails` was a wrapping flex row with two children: the name block and
 * `.headerActions`. When the name block was wider than the free space, the
 * actions wrapped to the next line. From 640px up `.headerDetails` is now a
 * grid: the name and the actions share the first row (actions at the top
 * right). The role and location row sits below the name in the first column
 * only, so it ends before the actions and wraps there instead of running under
 * them. Below 640px the actions still go below the name at full width.
 *
 * jsdom applies no stylesheet, so the test compares the SCSS rules.
 */

const read = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

const DIR = 'components/page/member-details/MemberDetailHeader';
const scss = read(`${DIR}/MemberDetailHeader.module.scss`);
const tsx = read(`${DIR}/MemberDetailHeader.tsx`);

/** Body of the first rule for a selector (at the start of a line), with nested blocks. */
function topLevelBlock(source: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const start = source.search(new RegExp(`^\\s*${escaped}\\s*\\{`, 'm'));
  if (start < 0) return '';
  let depth = 0;
  let body = '';
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') {
      depth++;
      if (depth === 1) continue;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
    body += ch;
  }
  return body;
}

/** Declarations at the first level of a block, without nested blocks. */
function declarations(body: string): Record<string, string> {
  let depth = 0;
  let flat = '';
  for (const ch of body) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (depth === 0) flat += ch;
  }
  const decls: Record<string, string> = {};
  flat
    .split(';')
    .map((d) => d.trim())
    .filter((d) => /^[a-z-]+\s*:/.test(d))
    .forEach((d) => {
      const [prop, ...rest] = d.split(':');
      decls[prop.trim()] = rest.join(':').trim();
    });
  return decls;
}

/** Body of `@include media.<mixin> { ... }` inside a block. */
function includeBlock(body: string, mixin: string): string {
  const start = body.search(new RegExp(`@include\\s+media\\.${mixin}\\s*\\{`));
  if (start < 0) return '';
  let depth = 0;
  let inner = '';
  for (let i = body.indexOf('{', start); i < body.length; i++) {
    const ch = body[i];
    if (ch === '{') {
      depth++;
      if (depth === 1) continue;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
    inner += ch;
  }
  return inner;
}

describe('Request intro position on a member page', () => {
  it('the name block has its own class', () => {
    expect(tsx).toMatch(/<div className=\{s\.headerInfo\}>/);
  });

  it('from 640px, the header details are a two-column grid', () => {
    const details = topLevelBlock(scss, '.headerDetails');
    const wide = declarations(includeBlock(details, 'tablet-portrait'));
    expect(wide.display).toBe('grid');
    expect(wide['grid-template-columns']).toBe('minmax(0, 1fr) auto');
  });

  it('from 640px, the name and the actions share the first row', () => {
    const info = includeBlock(topLevelBlock(scss, '.headerInfo'), 'tablet-portrait');
    expect(declarations(info).display).toBe('contents');
    expect(declarations(topLevelBlock(info, '> .specificsHdr'))['grid-row']).toBe('1');
    expect(declarations(topLevelBlock(info, '> .specificsHdr'))['grid-column']).toBe('1');

    const actions = declarations(includeBlock(topLevelBlock(scss, '.headerActions'), 'tablet-portrait'));
    expect(actions['grid-row']).toBe('1');
    expect(actions['grid-column']).toBe('2');
  });

  it('from 640px, the facts row spans the full width, under the actions', () => {
    const info = includeBlock(topLevelBlock(scss, '.headerInfo'), 'tablet-portrait');
    const row = declarations(topLevelBlock(info, '> .roleAndLocation'));
    expect(row['grid-row']).toBe('2');
    expect(row['grid-column']).toBe('1 / -1');
  });

  it('shows Request an intro only when the member has no office hours', () => {
    expect(tsx).toMatch(/showRequestIntro = isLoggedIn && !isOwner && !variant && !member\.officeHours/);
  });

  it('the role and location row wraps, and a wrapped line hides the divider it starts with', () => {
    const list = declarations(topLevelBlock(scss, '.metaList'));
    expect(list['flex-wrap']).toBe('wrap');

    // Each item draws its divider in its left padding; the list is pulled left by
    // that padding and the row clips it, so the item at a line start loses it.
    const item = topLevelBlock(scss, '.metaItem');
    const padding = declarations(item)['padding-left'];
    expect(list['margin-left']).toBe(`-${padding}`);
    expect(declarations(topLevelBlock(scss, '.roleAndLocation'))['overflow-x']).toBe('clip');
    expect(item).toMatch(/&::before\s*\{/);

    expect(tsx).not.toMatch(/s\.divider/);
    expect(tsx.match(/s\.metaItem/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it('the actions stay at the top right and share the button centre', () => {
    const actions = declarations(topLevelBlock(scss, '.headerActions'));
    expect(actions['margin-left']).toBe('auto');
    expect(actions['align-items']).toBe('center');
    expect(actions['flex-shrink']).toBe('0');
  });

  it('Edit sits in a 34px box on the button centre', () => {
    expect(tsx).toMatch(/className=\{s\.editCell\}/);
    const cell = declarations(topLevelBlock(scss, '.editCell'));
    expect(cell.display).toBe('inline-flex');
    expect(cell['align-items']).toBe('center');
    expect(cell['min-height']).toBe('34px');
  });

  it('the city has no extra right padding', () => {
    const location = declarations(topLevelBlock(scss, '.location'));
    expect(location['padding-right']).toBeUndefined();
  });
});
