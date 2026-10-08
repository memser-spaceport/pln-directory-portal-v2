import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const OVERVIEW = join(__dirname, '..', '..', '..', 'components/page/aligement-assets/overview');

function roles(file: string) {
  const source = readFileSync(join(OVERVIEW, file), 'utf8');
  const list = source.slice(source.indexOf('const ROLE_ITEMS = ['));
  const block = list.slice(0, list.indexOf('];'));
  return Array.from(
    block.matchAll(/role: '([^']+)',\s*description: '([^']+)'/g),
    (match) => `${match[1]}: ${match[2]}`,
  );
}

describe('Overview "Who It\'s For" roles', () => {
  it('lists the same roles and lines in the member view and the prospect view', () => {
    const member = roles('overview-topline.tsx');

    expect(member.length).toBeGreaterThan(0);
    expect(roles('prospective-visitor-overview.tsx')).toEqual(member);
  });
});
