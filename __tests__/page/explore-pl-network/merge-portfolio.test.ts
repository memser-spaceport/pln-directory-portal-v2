import { mergePortfolio } from '@/components/page/explore-pl-network/data/mergePortfolio';
import { PORTFOLIO_FALLBACK, type PortfolioRow } from '@/components/page/explore-pl-network/data/portfolio';
import type { PortfolioApiTeam } from '@/services/explore-pl-network/portfolio.service';

const matched: PortfolioRow = {
  id: 'logo-1',
  uid: 'uid-1',
  name: 'Agoric Systems',
  island: 'digital-human-rights',
  logo: 'https://blob/agoric.webp',
  startYear: 2014,
  endYear: null,
  oneLiner: 'File one-liner',
  stage: 'Series A',
  website: 'https://agoric.com',
};
const noUid: PortfolioRow = {
  id: 'logo-2',
  name: 'ANSA',
  island: 'neurotech',
  logo: 'https://blob/ansa.webp',
  startYear: 2020,
  endYear: 2025,
};
const fallback = [matched, noUid];

const apiTeam = (overrides: Partial<PortfolioApiTeam> = {}): PortfolioApiTeam => ({
  id: 'uid-1',
  teamUid: 'uid-1',
  name: 'Agoric',
  logoUrl: 'https://s3/agoric-colour.png',
  mapLogoUrl: 'https://s3/agoric-white.webp',
  island: 'digital-human-rights',
  startYear: 2015,
  endYear: 2024,
  oneLiner: 'DB one-liner',
  stage: 'Series B',
  website: 'https://agoric.xyz',
  ...overrides,
});

describe('mergePortfolio', () => {
  let warn: jest.SpyInstance;
  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => warn.mockRestore());

  it('lets DB values win for a matched team', () => {
    const [team] = mergePortfolio(fallback, [apiTeam()]);
    expect(team).toEqual({
      ...matched,
      name: 'Agoric',
      logo: 'https://s3/agoric-white.webp',
      startYear: 2015,
      endYear: 2024,
      oneLiner: 'DB one-liner',
      stage: 'Series B',
      website: 'https://agoric.xyz',
      source: 'db',
    });
    expect(warn).not.toHaveBeenCalled();
  });

  it('keeps the file value where the DB field is empty', () => {
    const [team] = mergePortfolio(fallback, [
      apiTeam({ name: '', oneLiner: null, stage: '  ', website: null, startYear: null, endYear: 2020 }),
    ]);
    expect(team).toMatchObject({
      name: matched.name,
      oneLiner: matched.oneLiner,
      stage: matched.stage,
      website: matched.website,
      startYear: matched.startYear,
      endYear: matched.endYear,
      source: 'db',
    });
  });

  it('takes a null end year from the DB along with its start year', () => {
    const [team] = mergePortfolio([{ ...matched, endYear: 2025 }], [apiTeam({ startYear: 2016, endYear: null })]);
    expect(team).toMatchObject({ startYear: 2016, endYear: null });
  });

  it('keeps the file logo when the DB has no white map logo', () => {
    const [team] = mergePortfolio(fallback, [apiTeam({ mapLogoUrl: null })]);
    expect(team.logo).toBe(matched.logo);
  });

  it.each([
    ['an unknown island', 'robotics'],
    ['a different island', 'neurotech'],
  ])('keeps the file island and warns on %s', (_, island) => {
    const [team] = mergePortfolio(fallback, [apiTeam({ island })]);
    expect(team.island).toBe('digital-human-rights');
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('uid-1'));
  });

  it('marks a row without a uid as fallback', () => {
    const [, team] = mergePortfolio(fallback, [apiTeam()]);
    expect(team).toEqual({ ...noUid, source: 'fallback' });
  });

  it('marks a uid the API did not return as fallback', () => {
    const [team] = mergePortfolio(fallback, [apiTeam({ id: 'uid-9', teamUid: 'uid-9' })]);
    expect(team).toEqual({ ...matched, source: 'fallback' });
  });

  it('ignores API teams with no fallback row', () => {
    const teams = mergePortfolio(fallback, [apiTeam(), apiTeam({ id: 'uid-9', teamUid: 'uid-9', island: null })]);
    expect(teams.map((t) => t.id)).toEqual(['logo-1', 'logo-2']);
  });

  it('returns the whole fallback, in order, for an empty API list', () => {
    const teams = mergePortfolio(PORTFOLIO_FALLBACK, []);
    expect(teams).toEqual(PORTFOLIO_FALLBACK.map((row) => ({ ...row, source: 'fallback' })));
  });
});
