import { readFileSync } from 'fs';
import { join } from 'path';

const ASSET = join(process.cwd(), 'public/images/alignment-assets/flywheel-v3.webp');
const HOME = join(process.cwd(), 'components/page/aligement-assets/home/plaa-home.tsx');

function losslessWebpUsesAlpha(bytes: Buffer): boolean {
  expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
  expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');
  expect(bytes.subarray(12, 16).toString('ascii')).toBe('VP8L');
  expect(bytes[20]).toBe(0x2f);
  const header = bytes.readUInt32LE(21);
  return ((header >> 28) & 1) === 1;
}

describe('flywheel artwork', () => {
  it('ships with transparency rather than a baked-in backdrop', () => {
    expect(losslessWebpUsesAlpha(readFileSync(ASSET))).toBe(true);
  });

  it('takes its backdrop from the brand token, not a hardcoded colour', () => {
    const rule = readFileSync(HOME, 'utf8').match(/\.ph-flywheel \{[^}]*\}/);

    expect(rule).not.toBeNull();
    expect(rule![0]).toContain('background: var(--color-brand)');
    expect(rule![0]).not.toMatch(/background:[^;]*#[0-9a-f]{3,8}/i);
  });
});
