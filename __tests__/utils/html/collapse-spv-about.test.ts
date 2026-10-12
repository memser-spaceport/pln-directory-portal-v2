import { collapseSpvAbout } from '@/utils/html/collapseSpvAbout';

const ABOUT = [
  '<p>Netholabs is building foundation models of living organisms from longitudinal, multimodal data spanning neural activity, physiology, behavior and environment. The thesis is that living systems contain learning rules and priors that current AI has not recovered from scale alone. Netholabs turns those signals into proprietary training data for frontier models today, while using the same data to train cross-species models of organisms. As those models become more predictive and individualized, they create a path toward new AI architectures, in-silico biology, and ultimately deeply individualized models of humans.</p>',
  '<p><strong>Traction &amp; credibility</strong></p>',
  '<ul>',
  '<li>Signed commercial agreements with a top-5 Asian frontier AI lab and a US biotech.</li>',
  '<li>In scoping discussions toward a paid agreement with a leading US AI lab.</li>',
  '<li>Qualified sales discussions with neurotech and BCI companies.</li>',
  '</ul>',
].join('');

describe('collapseSpvAbout', () => {
  it('keeps two sentences, the traction heading, and the first list item', () => {
    const collapsed = collapseSpvAbout(ABOUT);

    expect(collapsed.hasMore).toBe(true);
    expect(collapsed.html).toContain(
      'Netholabs is building foundation models of living organisms from longitudinal, multimodal data spanning neural activity, physiology, behavior and environment.',
    );
    expect(collapsed.html).toContain(
      'The thesis is that living systems contain learning rules and priors that current AI has not recovered from scale alone.',
    );
    expect(collapsed.html).not.toContain('proprietary training data');
    expect(collapsed.html).toContain('Traction &amp; credibility');
    expect(collapsed.html).toContain('Signed commercial agreements');
    expect(collapsed.html).not.toContain('In scoping discussions');
    expect(collapsed.html).not.toContain('Qualified sales discussions');
  });

  it('does not offer Show more when nothing is hidden', () => {
    const html = '<p>One sentence. Two sentences.</p><p>Traction &amp; credibility</p><ul><li>Only item.</li></ul>';
    expect(collapseSpvAbout(html).hasMore).toBe(false);
  });
});
