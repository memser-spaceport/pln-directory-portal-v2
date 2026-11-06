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

  it('piles up to four of its own island’s logos', () => {
    for (const card of buildFocusAreaCards(teams)) {
      const onIsland = teams.filter((t) => t.island === card.id);
      expect(card.logos).toEqual(onIsland.slice(0, FOCUS_LOGO_PILE).map((t) => ({ name: t.name, logo: t.logo })));
    }
  });
});

// LAB-3162: the card counted the island's portfolio teams (199 for Digital Human Rights) while its Teams link opened 360.
describe('the team count (what the Teams door lists)', () => {
  const teamCounts = {
    'Digital Human Rights': 360,
    'Economies & Governance': 104,
    'AI & Robotics': 110,
    Neurotech: 31,
  };

  it('shows the Teams list’s total for the directory title, not the island’s portfolio teams', () => {
    const cards = buildFocusAreaCards(teams, null, teamCounts);

    expect(cards.map((c) => [c.id, c.count])).toEqual([
      ['digital-human-rights', 360],
      ['economies--governance', 104],
      ['ai--robotics', 110],
      ['neurotech', 31],
    ]);
    const dhr = cards[0];
    expect(dhr.count).not.toBe(teams.filter((t) => t.island === dhr.id).length);
  });

  it('shows no number when the counts could not be loaded, or lack the area', () => {
    expect(buildFocusAreaCards(teams).map((c) => c.count)).toEqual([null, null, null, null]);
    expect(buildFocusAreaCards(teams, null, null).map((c) => c.count)).toEqual([null, null, null, null]);
    expect(buildFocusAreaCards(teams, null, { Neurotech: 31 }).map((c) => c.count)).toEqual([null, null, null, 31]);
  });

  it('keeps an honest zero', () => {
    expect(buildFocusAreaCards([], null, { ...teamCounts, Neurotech: 0 })[3].count).toBe(0);
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
