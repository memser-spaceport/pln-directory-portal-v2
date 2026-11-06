import fs from 'fs';
import path from 'path';

/**
 * LAB-3186: on a team page, "Request intro" was taller than "Follow".
 *
 * Both are `size="xs"` buttons, but `TeamFollowButton` pins its box to
 * `height: 32px; padding: 0 10px`, while "Request intro" kept the xs padding
 * (6px + 20px line height + 2px border = 34px). The team page now gives
 * "Request intro" the same box as Follow.
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

describe('Request intro and Follow on a team page', () => {
  const follow = topLevelRule(
    read('components/page/team-details/TeamFollowButton/TeamFollowButton.module.scss'),
    '.followBtn',
  );
  const intro = topLevelRule(read('components/page/team-details/TeamDetails/TeamDetails.module.scss'), '.introButton');

  it('Follow has a fixed height and padding', () => {
    expect(follow.height).toBe('32px');
    expect(follow.padding).toBeDefined();
  });

  it('Request intro has the same height as Follow', () => {
    expect(intro.height).toBe(follow.height);
  });

  it('Request intro has the same padding as Follow', () => {
    expect(intro.padding).toBe(follow.padding);
  });
});
