import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');
const source = readFileSync(join(ROOT, 'components/page/aligement-assets/home/plaa-home.tsx'), 'utf8');
const localImages = Array.from(source.matchAll(/src="(\/images\/[^"]+)"/g), (match) => match[1]);

describe('PLAA home page images', () => {
  it('uses at least one local image', () => {
    expect(localImages.length).toBeGreaterThan(0);
  });

  it.each(localImages)('%s exists in public/', (src) => {
    expect(existsSync(join(ROOT, 'public', src))).toBe(true);
  });

  it.each(localImages)('%s is under 1 MB', (src) => {
    expect(statSync(join(ROOT, 'public', src)).size).toBeLessThan(1024 * 1024);
  });
});

describe('PLAA home flywheel image', () => {
  const flywheel = source.match(/<Image\s+src="\/images\/alignment-assets\/flywheel-[^"]+"[^>]*\/>/);

  it('is rendered with next/image', () => {
    expect(flywheel).not.toBeNull();
  });

  it('goes through the image optimizer', () => {
    expect(flywheel![0]).not.toMatch(/\bunoptimized\b/);
  });

  it('tells the browser its display size', () => {
    expect(flywheel![0]).toMatch(/\bsizes="[^"]+"/);
  });
});
