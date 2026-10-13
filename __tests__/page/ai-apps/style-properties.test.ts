import { paintedStyleProperties } from '@/ai-apps-bridge/style-properties';

/**
 * The property list the renderers copy per node: the standard properties that
 * paint, never a CSS custom property (a theme of hundreds would be written
 * onto every node) and never one that only matters while the page moves.
 */
describe('paintedStyleProperties', () => {
  afterEach(() => document.documentElement.removeAttribute('style'));

  it('keeps standard painted properties and drops custom and motion-only ones', () => {
    const root = document.documentElement.style;
    root.setProperty('--brand', '#123');
    root.setProperty('color', 'red');
    root.setProperty('cursor', 'pointer');
    root.setProperty('transition', 'all 1s');
    const names = paintedStyleProperties();
    expect(names).toContain('color');
    expect(names).not.toContain('--brand');
    expect(names).not.toContain('cursor');
    expect(names).not.toContain('transition');
  });
});
