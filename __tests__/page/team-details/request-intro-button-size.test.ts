import fs from 'fs';
import path from 'path';

/**
 * LAB-3187: "Request an intro" shares one row with Follow, Edit, and Delete.
 * The button keeps the xs box (padding 6px 10px, 34px). Follow stays 32px.
 * The row centres them. Edit and Delete sit in a 34px box. The Follow caption
 * is gone, so it no longer pushes the button down.
 *
 * jsdom applies no stylesheet, so the test compares the SCSS rules.
 */

const read = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), 'utf8');

/** Declarations of a top-level rule (a selector at column 0), without nested blocks. */
function topLevelRule(scss: string, selector: string): Record<string, string> {
  const start = scss.search(new RegExp(`^\\${selector}\\s*\\{`, 'm'));
  if (start < 0) return {};
  let depth = 0;
  let body = '';
  for (let i = scss.indexOf('{', start); i < scss.length; i++) {
    const ch = scss[i];
    if (ch === '{') {
      depth++;
      if (depth === 1) continue;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) break;
    }
    if (depth === 1) body += ch;
  }
  const decls: Record<string, string> = {};
  body
    .split(';')
    .map((d) => d.trim())
    .filter((d) => /^[a-z-]+\s*:/.test(d))
    .forEach((d) => {
      const [prop, ...rest] = d.split(':');
      decls[prop.trim()] = rest.join(':').trim();
    });
  return decls;
}

describe('Request an intro and Follow on a team page', () => {
  const scss = read('components/page/team-details/TeamDetails/TeamDetails.module.scss');
  const tsx = read('components/page/team-details/TeamDetails/TeamDetails.tsx');
  const intro = topLevelRule(scss, '.introButton');
  const actions = topLevelRule(scss, '.actions');

  it('keeps the xs box instead of the Follow height', () => {
    expect(intro.height).toBeUndefined();
    expect(intro.padding).toBeUndefined();
    expect(intro['flex-shrink']).toBe('0');
  });

  it('centres the row on the button', () => {
    expect(actions['align-items']).toBe('center');
    expect(actions.display).toBe('flex');
  });

  it('puts Follow and the button in the actions row', () => {
    expect(tsx).toMatch(/className=\{s\.desktopContact\}/);
    expect(topLevelRule(scss, '.desktopContact').display).toBe('contents');
  });

  it('gives Edit and Delete a 34px box from 640px', () => {
    expect(scss).toMatch(/\.textAction[\s\S]*min-height:\s*34px/);
  });

  it('does not show a caption under Follow', () => {
    expect(tsx).not.toMatch(/Get updates/);
    expect(scss).not.toMatch(/\.followCaption/);
  });
});
