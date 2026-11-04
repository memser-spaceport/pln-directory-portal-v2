import { FOCUS_AREAS } from '@/components/page/explore-pl-network/data/content';
import { PORTFOLIO_FALLBACK, type PortfolioTeam } from '@/components/page/explore-pl-network/data/portfolio';
import {
  buildFocusAreaCards,
  FOCUS_AREA_DIRECTORY_TITLE,
  FOCUS_LOGO_PILE,
} from '@/components/page/home/HomeV2/utils/focusAreaCards';

const teams: PortfolioTeam[] = PORTFOLIO_FALLBACK.map((row) => ({ ...row, source: 'fallback' }));

describe('the focus-area cards', () => {
  it('maps each of marketing’s four areas to the directory’s own title', () => {
    expect(FOCUS_AREA_DIRECTORY_TITLE).toEqual({
      'digital-human-rights': 'Digital Human Rights',
      'economies--governance': 'Economies & Governance',
      'ai--robotics': 'AI & Robotics',
      neurotech: 'Neurotech',
    });
    expect(Object.keys(FOCUS_AREA_DIRECTORY_TITLE)).toEqual(FOCUS_AREAS.map((a) => a.id));
  });

  it('shows marketing’s name but links with the directory title ("Neurotech", not "Neurotechnology")', () => {
    const neuro = buildFocusAreaCards(teams).find((c) => c.id === 'neurotech')!;

    expect(neuro.name).toBe('Neurotechnology');
    expect(neuro.teamsHref).toBe('/teams?focusAreas=Neurotech');
    expect(neuro.projectsHref).toBe('/projects?focusAreas=Neurotech');
  });

  it('encodes titles with an ampersand', () => {
    const econ = buildFocusAreaCards(teams).find((c) => c.id === 'economies--governance')!;

    expect(econ.teamsHref).toBe('/teams?focusAreas=Economies%20%26%20Governance');
  });

  it('counts each card’s own island and piles up to four of its logos', () => {
    for (const card of buildFocusAreaCards(teams)) {
      const onIsland = teams.filter((t) => t.island === card.id);
      expect(card.count).toBe(onIsland.length);
      expect(card.count).toBeGreaterThan(0);
      expect(card.logos).toEqual(onIsland.slice(0, FOCUS_LOGO_PILE).map((t) => ({ name: t.name, logo: t.logo })));
    }
  });

  it('counts zero on an empty portfolio', () => {
    expect(buildFocusAreaCards([]).map((c) => c.count)).toEqual([0, 0, 0, 0]);
  });
});

describe('the Projects door (no door to an empty list)', () => {
  const counts = { 'Digital Human Rights': 42, 'Economies & Governance': 8, 'AI & Robotics': 2, Neurotech: 0 };

  it('drops it for an area with no projects and keeps it for the others', () => {
    const cards = buildFocusAreaCards(teams, counts);

    expect(cards.find((c) => c.id === 'neurotech')!.projectsHref).toBeNull();
    expect(cards.find((c) => c.id === 'ai--robotics')!.projectsHref).toBe('/projects?focusAreas=AI%20%26%20Robotics');
    expect(cards.every((c) => c.teamsHref.startsWith('/teams?focusAreas='))).toBe(true);
  });

  it('treats an area missing from the counts as empty', () => {
    const cards = buildFocusAreaCards(teams, { 'Digital Human Rights': 1 });

    expect(cards.filter((c) => c.projectsHref).map((c) => c.id)).toEqual(['digital-human-rights']);
  });

  it('keeps every Projects door when the counts could not be loaded', () => {
    expect(buildFocusAreaCards(teams, null).every((c) => c.projectsHref)).toBe(true);
    expect(buildFocusAreaCards(teams).every((c) => c.projectsHref)).toBe(true);
  });
});
