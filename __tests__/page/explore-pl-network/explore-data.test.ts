import { ISLANDS, MAP_STATES, PORTFOLIO } from '@/components/page/explore-pl-network/data/islands';
import { TEAM_INFO } from '@/components/page/explore-pl-network/data/teamInfo';
import { directoryUrl, displayNameOf } from '@/components/page/explore-pl-network/data/directoryUrl';
import { EXPLORE_PORTFOLIO_TEAM_COUNT } from '@/services/explore-pl-network/constants';

describe('Explore PL Network static data', () => {
  it('has the portfolio the SPV tile advertises', () => {
    expect(PORTFOLIO).toHaveLength(EXPLORE_PORTFOLIO_TEAM_COUNT);
  });

  it('puts every logo on a known island', () => {
    const islands = new Set(ISLANDS.map((i) => i.id));
    expect(PORTFOLIO.filter((l) => !islands.has(l.island))).toEqual([]);
  });

  it('only places logos that exist, on every map state', () => {
    for (const [key, flat] of Object.entries(MAP_STATES)) {
      expect(flat.length % 3).toBe(0);
      for (let i = 0; i < flat.length; i += 3) {
        if (!PORTFOLIO[flat[i]]) throw new Error(`MAP_STATES['${key}'] points at missing logo index ${flat[i]}`);
      }
    }
  });

  it('has a state for every year on the strip and every category', () => {
    for (let year = 2014; year <= 2026; year++) expect(MAP_STATES[String(year)]).toBeDefined();
    for (const island of ISLANDS) expect(MAP_STATES[`2026:${island.id}`]).toBeDefined();
  });
});

describe('directoryUrl', () => {
  const matched = PORTFOLIO.find((l) => TEAM_INFO[l.id]?.uid)!;
  const unmatched = PORTFOLIO.find((l) => !TEAM_INFO[l.id]?.uid)!;

  it('links a matched logo to its directory profile, relative to this environment', () => {
    expect(directoryUrl(matched)).toBe(`/teams/${TEAM_INFO[matched.id]!.uid}`);
  });

  it('falls back to a directory search by name', () => {
    expect(directoryUrl(unmatched)).toBe(`/teams?searchBy=${encodeURIComponent(unmatched.name)}`);
  });

  it("prefers the directory's name over marketing's caps", () => {
    expect(displayNameOf(matched)).toBe(TEAM_INFO[matched.id]!.displayName);
    expect(displayNameOf(unmatched)).toBe(unmatched.name);
  });
});
