import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import * as clientDynamics from '@/app/ClientDynamics';

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const activeLines = (source: string) =>
  source
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\{\/\*)/.test(line))
    .join('\n');

describe('Botpress webchat is deprecated', () => {
  it('is no longer exported for mounting', () => {
    expect('BotpressWebchat' in clientDynamics).toBe(false);
  });

  it('is not mounted by the alignment-asset layout', () => {
    expect(activeLines(read('app/alignment-asset/layout.tsx'))).not.toMatch(/BotpressWebchat/);
  });

  it('no longer loads its global styles', () => {
    expect(activeLines(read('styles/index.scss'))).not.toMatch(/botpress-webchat/);
  });
});
