/**
 * @jest-environment node
 */
import path from 'path';
import * as sass from 'sass';

const root = path.join(__dirname, '../..');

function ruleBody(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) {
    throw new Error(`missing rule: ${selector}`);
  }
  return match[1];
}

describe('globals.scss scrollbar gutter', () => {
  const css = sass.compile(path.join(root, 'app/globals.scss'), {
    loadPaths: [root, path.join(root, 'styles')],
  }).css;

  it('does not reserve a gutter on html and body', () => {
    const body = ruleBody(css, 'html,\nbody');
    expect(body).not.toMatch(/scrollbar-gutter/);
    expect(body).toMatch(/overflow-x:\s*hidden/);
    expect(body).toMatch(/min-height:\s*100dvh/);
    expect(body).toMatch(/height:\s*100dvh/);
  });

  it('keeps a stable gutter while a drawer locks scroll', () => {
    expect(ruleBody(css, 'html.drawer-scroll-lock')).toMatch(/scrollbar-gutter:\s*stable/);
  });
});
