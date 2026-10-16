import { ISLANDS, MAP_STATES } from '@/components/page/explore-pl-network/data/islands';
import { PORTFOLIO_FALLBACK, type PortfolioTeam } from '@/components/page/explore-pl-network/data/portfolio';
import { directoryUrl, displayNameOf } from '@/components/page/explore-pl-network/data/directoryUrl';
import { EXPLORE_PORTFOLIO_TEAM_COUNT } from '@/services/explore-pl-network/constants';

describe('Explore PL Network fallback data', () => {
  it('has the portfolio the SPV tile advertises', () => {
    expect(PORTFOLIO_FALLBACK).toHaveLength(EXPLORE_PORTFOLIO_TEAM_COUNT);
  });

  it("keeps marketing's row order, which MAP_STATES indexes", () => {
    // Generated from islands.ts PORTFOLIO; a reorder would move every tile.
    expect(PORTFOLIO_FALLBACK.map((r) => r.id)).toMatchSnapshot();
  });

  it('matches 259 rows to a directory uid', () => {
    expect(PORTFOLIO_FALLBACK.filter((r) => r.uid)).toHaveLength(259);
  });

  it('puts every row on a known island', () => {
    const islands = new Set<string>(ISLANDS.map((i) => i.id));
    expect(PORTFOLIO_FALLBACK.filter((r) => !islands.has(r.island))).toEqual([]);
  });

  it('only places rows that exist, on every map state', () => {
    for (const [key, flat] of Object.entries(MAP_STATES)) {
      expect(flat.length % 3).toBe(0);
      for (let i = 0; i < flat.length; i += 3) {
        if (flat[i] >= PORTFOLIO_FALLBACK.length)
          throw new Error(`MAP_STATES['${key}'] points at missing row ${flat[i]}`);
      }
    }
  });

  it('has a state for every year on the strip and every category', () => {
    for (let year = 2014; year <= 2026; year++) expect(MAP_STATES[String(year)]).toBeDefined();
    for (const island of ISLANDS) expect(MAP_STATES[`2026:${island.id}`]).toBeDefined();
  });
});

describe('directoryUrl', () => {
  const matched = PORTFOLIO_FALLBACK.find((r) => r.uid)!;
  const unmatched = PORTFOLIO_FALLBACK.find((r) => !r.uid)!;
  const team = (row: typeof matched, source: PortfolioTeam['source']): PortfolioTeam => ({ ...row, source });

  it('links a team the API returned to its directory profile, relative to this environment', () => {
    expect(directoryUrl(team(matched, 'db'))).toBe(`/teams/${matched.uid}`);
  });

  it('falls back to a directory search by name', () => {
    expect(directoryUrl(team(unmatched, 'fallback'))).toBe(`/teams?searchBy=${encodeURIComponent(unmatched.name)}`);
  });

  it('links a project entry to its directory project page', () => {
    const oso = PORTFOLIO_FALLBACK.find((r) => r.name === 'Open Source Observer')!;
    expect(directoryUrl(team(oso, 'fallback'))).toBe('/projects/clot4l6jm001lwi028b7jmwk8');
  });

  it('searches for a team with a uid the API did not return (e.g. inactive)', () => {
    expect(directoryUrl(team(matched, 'fallback'))).toBe(`/teams?searchBy=${encodeURIComponent(matched.name)}`);
  });

  it("shows the merged name: the directory's where matched, marketing's otherwise", () => {
    expect(displayNameOf(team(matched, 'db'))).toBe(matched.name);
    expect(displayNameOf(team(unmatched, 'fallback'))).toBe(unmatched.name);
  });
});
