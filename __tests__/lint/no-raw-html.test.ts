/**
 * @jest-environment node
 */
import { execFileSync } from 'child_process';
import path from 'path';

/**
 * The lint guard behind "one render path": a raw HTML render or a direct
 * sanitizer/parser import in production code is an error. Runs the real ESLint
 * CLI against the repo config (ESLint 9 loads its flat config through dynamic
 * import, which Jest's module VM cannot do in-process).
 */
const ROOT = path.resolve(__dirname, '../..');
const ESLINT = path.join(ROOT, 'node_modules/.bin/eslint');

type LintMessage = { ruleId: string | null; severity: number };

function lint(code: string, filePath = 'components/x/Fixture.tsx'): LintMessage[] {
  let out: string;
  try {
    out = execFileSync(ESLINT, ['--stdin', '--stdin-filename', filePath, '--format', 'json'], {
      cwd: ROOT,
      input: code,
      encoding: 'utf8',
    });
  } catch (error) {
    // ESLint exits 1 when it reports errors; the JSON is still on stdout.
    out = (error as { stdout: string }).stdout;
  }
  return JSON.parse(out)[0].messages;
}

const errorsFrom = (messages: LintMessage[], rule: string) =>
  messages.filter((m) => m.ruleId === rule && m.severity === 2);

jest.setTimeout(60_000);

it('fails a raw HTML render in a component', () => {
  const messages = lint(
    'export const X = ({ html }: { html: string }) => <div dangerouslySetInnerHTML={{ __html: html }} />;\n',
  );
  expect(errorsFrom(messages, 'react/no-danger')).toHaveLength(1);
});

it.each(['isomorphic-dompurify', 'dompurify', 'html-react-parser'])('fails a direct import of %s', (name) => {
  const messages = lint(`import x from '${name}';\n\nexport const y = x;\n`);
  expect(errorsFrom(messages, 'no-restricted-imports')).toHaveLength(1);
});

it('allows the sanitizer module its own import', () => {
  const messages = lint("import x from 'isomorphic-dompurify';\n\nexport const y = x;\n", 'utils/html/fixture.ts');
  expect(errorsFrom(messages, 'no-restricted-imports')).toHaveLength(0);
});
