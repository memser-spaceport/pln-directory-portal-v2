/**
 * @jest-environment node
 */
/**
 * LAB-3094: robots.txt has no non-standard `Host:` line, and the page lets people zoom.
 */
import robots from '@/app/robots';

describe('robots.txt', () => {
  const original = process.env.APPLICATION_BASE_URL;
  afterEach(() => {
    process.env.APPLICATION_BASE_URL = original;
  });

  it('names the sitemap and has no Host', () => {
    process.env.APPLICATION_BASE_URL = 'https://os.pl.xyz';
    const result = robots();
    expect(result.sitemap).toBe('https://os.pl.xyz/sitemap.xml');
    expect(result).not.toHaveProperty('host');
  });
});

describe('viewport', () => {
  it('is one tag, width=device-width, initial-scale=1, with no zoom limit', async () => {
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const source = readFileSync(join(process.cwd(), 'app/layout.tsx'), 'utf8');
    // No hand-written tag beside the one Next renders from the export.
    expect(source).not.toMatch(/<meta\s+name="viewport"/);
    const exported = source.match(/export const viewport: Viewport = (\{[^}]*\})/)?.[1] ?? '';
    expect(exported).toMatch(/width: 'device-width'/);
    expect(exported).toMatch(/initialScale: 1/);
    expect(exported).not.toMatch(/maximumScale|userScalable/);
  });
});
