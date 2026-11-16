import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * The flywheel's backdrop used to be baked into the image, which meant it had to
 * be kept in sync with --color-brand by hand: when the token moved, the artwork
 * stayed a shade behind and met the hero on a visible seam, with nothing to
 * catch it.
 *
 * The artwork is now transparent where that backdrop was, and the colour comes
 * from CSS. These tests fail if either half of that is undone.
 */

const ASSET = join(process.cwd(), 'public/images/alignment-assets/flywheel-v2.webp');
const HOME = join(process.cwd(), 'components/page/aligement-assets/home/plaa-home.tsx');

/** Reads the alpha_is_used flag out of a lossless WebP (VP8L) header. */
function losslessWebpUsesAlpha(bytes: Buffer): boolean {
  expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
  expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');

  const fourCC = bytes.subarray(12, 16).toString('ascii');
  expect(fourCC).toBe('VP8L');

  // VP8L: 1 signature byte, then 14b width-1, 14b height-1, 1b alpha_is_used, 3b version.
  expect(bytes[20]).toBe(0x2f);
  const header = bytes.readUInt32LE(21);
  return ((header >> 28) & 1) === 1;
}

describe('flywheel artwork', () => {
  it('ships with transparency rather than a baked-in backdrop', () => {
    expect(losslessWebpUsesAlpha(readFileSync(ASSET))).toBe(true);
  });

  it('takes its backdrop from the brand token, not a hardcoded colour', () => {
    const source = readFileSync(HOME, 'utf8');
    const rule = source.match(/\.ph-flywheel \{[^}]*\}/);

    expect(rule).not.toBeNull();
    expect(rule![0]).toContain('background: var(--color-brand)');
    // A literal hex here would drift from the hero again.
    expect(rule![0]).not.toMatch(/background:[^;]*#[0-9a-f]{3,8}/i);
  });
});
