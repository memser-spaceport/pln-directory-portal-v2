import {
  MATCH_FLOOR,
  MOCK_ROLE_CRITERIA,
  MOCK_SUGGESTED,
  SUGGESTED_LIMIT,
  suggestionMatch,
  visibleSuggested,
  workedAtTeam,
} from '@/prototypes/entries/team-profile/suggestedMocks';

const TEAM = 'Protocol Labs';
const criteria = MOCK_ROLE_CRITERIA['pl-1'];
const people = MOCK_SUGGESTED['pl-1'];

describe('suggested candidates (LAB-2687)', () => {
  it('shows at most the top 5 matches for a role', () => {
    expect(SUGGESTED_LIMIT).toBe(5);
    const eligible = people.filter(
      (p) => !workedAtTeam(p, TEAM) && suggestionMatch(p, criteria).percent >= MATCH_FLOOR,
    );
    // The mock role has more eligible people than the cap, so the cap is visible in the prototype.
    expect(eligible.length).toBeGreaterThan(SUGGESTED_LIMIT);
    expect(visibleSuggested(people, criteria, TEAM)).toHaveLength(SUGGESTED_LIMIT);
  });

  it('orders the list best match first', () => {
    const percents = visibleSuggested(people, criteria, TEAM).map((p) => suggestionMatch(p, criteria).percent);
    expect(percents).toEqual([...percents].sort((a, b) => b - a));
  });

  it('leaves out anyone who worked at the team before, even a strong match', () => {
    const pastStaff = people.filter((p) => workedAtTeam(p, TEAM));
    expect(pastStaff.length).toBeGreaterThan(0);
    expect(pastStaff.some((p) => suggestionMatch(p, criteria).percent >= MATCH_FLOOR)).toBe(true);
    const shownIds = visibleSuggested(people, criteria, TEAM).map((p) => p.id);
    pastStaff.forEach((p) => expect(shownIds).not.toContain(p.id));
  });

  it('matches the team name without regard to case or spaces', () => {
    const kofi = people.find((p) => p.memberId === 'kofi-mensah')!;
    expect(workedAtTeam(kofi, ' protocol labs ')).toBe(true);
    expect(workedAtTeam(kofi, 'Saturn')).toBe(false);
  });

  it('never suggests anyone under the match floor', () => {
    visibleSuggested(people, criteria, TEAM).forEach((p) =>
      expect(suggestionMatch(p, criteria).percent).toBeGreaterThanOrEqual(MATCH_FLOOR),
    );
  });

  it('applies the floor to the criteria that are switched on', () => {
    const off = new Set(['rg', 'sr']);
    const shown = visibleSuggested(people, criteria, TEAM, off);
    expect(shown.length).toBeLessThanOrEqual(SUGGESTED_LIMIT);
    shown.forEach((p) => expect(suggestionMatch(p, criteria, off).percent).toBeGreaterThanOrEqual(MATCH_FLOOR));
  });
});

describe('suggested candidates mock data (LAB-2687)', () => {
  it('shows the expected top 5 for the first role', () => {
    expect(visibleSuggested(people, criteria, TEAM).map((p) => p.memberId)).toEqual([
      'ines-carvalho',
      'lena-hoffmann',
      'priya-raman',
      'daniel-okafor',
      'sam-whitaker',
    ]);
  });
});
