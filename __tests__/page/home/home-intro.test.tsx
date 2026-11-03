/**
 * LAB-3089: /home had no h1, and no page said what the Protocol Labs network or the directory is. The h1 is for screen
 * readers and search engines only, so the top of /home keeps its design; the definition stays visible, at the foot of
 * the page, because text shown only to crawlers is hidden text.
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { HomeAbout, HomeIntro, HOME_DEFINITION, HOME_HEADING } from '@/components/page/home/HomeIntro';

describe('HomeIntro', () => {
  it('is the one h1, hidden from view but read by assistive technology', () => {
    const { container } = render(<HomeIntro />);

    const heading = screen.getByRole('heading', { level: 1, name: HOME_HEADING });
    expect(heading).toBeInTheDocument();
    expect(heading.className).toMatch(/srOnly/);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(screen.queryByText(HOME_DEFINITION)).not.toBeInTheDocument();
  });
});

describe('HomeAbout', () => {
  it('shows the definition, under its own h2', () => {
    render(<HomeAbout />);

    expect(screen.getByRole('region', { name: `About ${HOME_HEADING}` })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: `About ${HOME_HEADING}` })).toBeInTheDocument();
    expect(screen.getByText(HOME_DEFINITION)).toBeVisible();
  });

  it('keeps the definition between 40 and 60 words', () => {
    const words = HOME_DEFINITION.trim().split(/\s+/).length;
    expect(words).toBeGreaterThanOrEqual(40);
    expect(words).toBeLessThanOrEqual(60);
  });
});
