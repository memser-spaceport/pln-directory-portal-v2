import fs from 'fs';
import path from 'path';

/**
 * LAB-3187: on a member page, "Request intro" moved to a second line below the
 * name, role and location row, so it looked offset.
 *
 * `.headerDetails` is a wrapping flex row with two children: the name block and
 * `.headerActions`. When the name block was wider than the free space, the
 * actions wrapped to the next line. From tablet width up the row must not wrap,
 * and the name block must shrink, so the button stays at the top right of the
 * card, on the same line as the member's name. On mobile the actions still go
 * below the name at full width.
 *
 * jsdom applies no stylesheet, so the test compares the SCSS rules.
 */

const read = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

const DIR = 'components/page/member-details/MemberDetailHeader';
const scss = read(`${DIR}/MemberDetailHeader.module.scss`);
const tsx = read(`${DIR}/MemberDetailHeader.tsx`);

/** Body of a top-level rule (a selector at column 0), with nested blocks. */
function topLevelBlock(source: string, selector: string): string {
  const start = source.search(new RegExp(`^\\${selector}\\s*\\{`, 'm'));
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

  it('the name block can shrink, so it does not push the actions to a new line', () => {
    const info = declarations(topLevelBlock(scss, '.headerInfo'));
    expect(info['min-width']).toBe('0');
    expect(info.flex).toBe('1 1 auto');
  });

  it('from tablet width up, the name block and the actions stay on one line', () => {
    const details = topLevelBlock(scss, '.headerDetails');
    expect(declarations(details)['flex-wrap']).toBe('wrap');
    expect(declarations(includeBlock(details, 'tablet-portrait'))['flex-wrap']).toBe('nowrap');
  });

  it('the actions stay at the top right', () => {
    const actions = declarations(topLevelBlock(scss, '.headerActions'));
    expect(actions['margin-left']).toBe('auto');
    expect(actions['align-items']).toBe('flex-start');
    expect(actions['flex-shrink']).toBe('0');
  });
});
