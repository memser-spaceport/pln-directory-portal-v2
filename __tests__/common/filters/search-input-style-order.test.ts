/**
 * LAB-3182: in the production build the CSS chunk of the shared filter SearchInput loads before the
 * chunk of the DebouncedInput it wraps. Both styled the same root element with one class each, so the
 * DebouncedInput rules won on order: the input took the 360px min-width (960px and up) and the grey
 * background, and stuck out of the Members and Teams filter cards.
 *
 * The chunk order is not under the component's control, so this test checks the rule that makes the
 * order not matter: for each property that both modules set on the root element, the SearchInput rule
 * has a higher specificity than every DebouncedInput rule (also the rules inside @media).
 */
import fs from 'fs';
import path from 'path';
import * as sass from 'sass';

const root = path.resolve(__dirname, '../../..');

const SEARCH_INPUT = 'components/common/filters/SearchInput/SearchInput.module.scss';
const DEBOUNCED_INPUT = 'components/core/application-search/components/DebouncedInput/DebouncedInput.module.scss';

type Rule = { selector: string; props: string[] };

function compile(relPath: string): string {
  // Jest's jsdom environment loads the browser build of sass, which has no file system access,
  // so the files are read here and the `@/` imports are resolved by a custom importer.
  return sass.compileString(fs.readFileSync(path.join(root, relPath), 'utf8'), {
    importer: {
      canonicalize(url: string) {
        const rel = url.replace(/^@\//, '').replace(/^file:\/\/\//, '');
        return new URL(`file:///${rel.endsWith('.scss') ? rel : `${rel}.scss`}`);
      },
      load(canonicalUrl: URL) {
        const rel = canonicalUrl.pathname.slice(1);
        const partial = path.join(path.dirname(rel), `_${path.basename(rel)}`);
        const file = fs.existsSync(path.join(root, rel)) ? rel : partial;
        return { contents: fs.readFileSync(path.join(root, file), 'utf8'), syntax: 'scss' };
      },
    },
  }).css;
}

function rules(css: string): Rule[] {
  // Drop @media wrappers: a rule inside one competes with the same specificity as outside.
  const flat = css.replace(/@media[^{]*\{((?:[^{}]*\{[^}]*\})*)\s*\}/g, '$1');
  return Array.from(flat.matchAll(/([^{}]+)\{([^}]*)\}/g)).flatMap(([, selectors, body]) => {
    const props = body
      .split(';')
      .map((d) => d.split(':')[0].trim())
      .filter(Boolean);
    return selectors.split(',').map((selector) => ({ selector: selector.trim(), props }));
  });
}

// Selectors that target the root element itself: `.root`, `.root.root`, `.root:hover`, not `.root > input`.
const onRoot = (rule: Rule) => /^(\.root)+(:[\w-]+)?$/.test(rule.selector);

const classCount = (selector: string) => (selector.match(/[.:][\w-]+/g) ?? []).length;

describe('SearchInput root styles win over DebouncedInput in any CSS load order (LAB-3182)', () => {
  const searchRules = rules(compile(SEARCH_INPUT)).filter(onRoot);
  const debouncedRules = rules(compile(DEBOUNCED_INPUT)).filter(onRoot);

  it('finds the root rules of both modules', () => {
    expect(searchRules.length).toBeGreaterThan(0);
    expect(debouncedRules.some((r) => r.props.includes('min-width'))).toBe(true);
  });

  it.each(['min-width', 'width', 'background', 'border'])('%s of SearchInput has the higher specificity', (prop) => {
    const search = searchRules.filter((r) => r.props.includes(prop) && !r.selector.includes(':'));
    const debounced = debouncedRules.filter((r) => r.props.includes(prop) && !r.selector.includes(':'));

    expect(search.length).toBeGreaterThan(0);
    const weakestSearch = Math.min(...search.map((r) => classCount(r.selector)));
    const strongestDebounced = Math.max(0, ...debounced.map((r) => classCount(r.selector)));
    expect(weakestSearch).toBeGreaterThan(strongestDebounced);
  });
});
