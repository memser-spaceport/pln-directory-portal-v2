/**
 * LAB-3089: /home had no h1, and no page said what the Protocol Labs network or the directory is.
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { HomeIntro, HOME_DEFINITION, HOME_HEADING } from '@/components/page/home/HomeIntro';

describe('HomeIntro', () => {
  it('gives a signed-out visitor the h1 and a definition of the network', () => {
    const { container } = render(<HomeIntro showDefinition />);

    expect(screen.getByRole('heading', { level: 1, name: HOME_HEADING })).toBeInTheDocument();
    expect(screen.getByText(HOME_DEFINITION)).toBeInTheDocument();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });

  it('keeps the definition between 40 and 60 words', () => {
    const words = HOME_DEFINITION.trim().split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(40);
    expect(words).toBeLessThanOrEqual(60);
  });

  it('gives a signed-in member the h1 only', () => {
    const { container } = render(<HomeIntro showDefinition={false} />);

    expect(screen.getByRole('heading', { level: 1, name: HOME_HEADING })).toBeInTheDocument();
    expect(screen.queryByText(HOME_DEFINITION)).not.toBeInTheDocument();
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });
});
