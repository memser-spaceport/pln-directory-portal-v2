import { isProtocolLabsTeam } from '@/services/jobs/protocol-labs-team';
import type { IJobTeam } from '@/types/jobs.types';

const team = (over: Partial<IJobTeam>): IJobTeam =>
  ({
    uid: 't1',
    name: 'Acme',
    logoUrl: null,
    focusAreas: [],
    subFocusAreas: [],
    jobReferEmail: null,
    ...over,
  }) as IJobTeam;

/**
 * Which roles an unapproved account may apply to through the wizard rather than
 * on the employer's own site. Getting this wrong in the false direction sends an
 * applicant off a board that meant to keep them; in the true direction it hands
 * a stranger to a team that has not vetted them. Both matter, so both are here.
 */
describe('isProtocolLabsTeam', () => {
  it('matches the seeded uid', () => {
    expect(isProtocolLabsTeam(team({ uid: 'cldvnyxaf01ynu21k62uopjvg', name: 'Anything' }))).toBe(true);
  });

  /* The uid is environment-specific — dev, UAT and production seed their own
     teams — so the name is the net that catches a differently-seeded PL. */
  it('falls back to the name, case and whitespace insensitively', () => {
    expect(isProtocolLabsTeam(team({ uid: 'other', name: 'Protocol Labs' }))).toBe(true);
    expect(isProtocolLabsTeam(team({ uid: 'other', name: '  protocol labs  ' }))).toBe(true);
    expect(isProtocolLabsTeam(team({ uid: 'other', name: 'PROTOCOL LABS' }))).toBe(true);
  });

  it('does not match another team', () => {
    expect(isProtocolLabsTeam(team({ uid: 'other', name: 'Bluesky' }))).toBe(false);
    // Nearby, and deliberately not a match: this is one team, not a family.
    expect(isProtocolLabsTeam(team({ uid: 'other', name: 'Protocol Labs Capital' }))).toBe(false);
  });

  it('is false with nothing to test', () => {
    expect(isProtocolLabsTeam(null)).toBe(false);
    expect(isProtocolLabsTeam(undefined)).toBe(false);
  });
});
