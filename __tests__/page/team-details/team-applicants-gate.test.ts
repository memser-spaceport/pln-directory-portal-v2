import { canReadApplicants } from '@/components/page/team-details/TeamApplicants/canReadApplicants';
import type { IUserInfo } from '@/types/shared.types';

/**
 * The rule the page redirects on and the count line renders on.
 *
 * It is tested as a rule rather than through the page, because the page is an
 * async server component whose refusal is a thrown `redirect()` — which tests
 * the framework more than the decision. Both callers ask this function, so
 * pinning it pins both.
 */

const lead = { uid: 'u1', leadingTeams: ['team-1'] } as IUserInfo;
const otherLead = { uid: 'u2', leadingTeams: ['team-9'] } as IUserInfo;
const member = { uid: 'u3', leadingTeams: [] } as unknown as IUserInfo;
const admin = {
  uid: 'u4',
  leadingTeams: [],
  rbac: { effectivePermissions: [{ code: 'directory.admin.full' }] },
} as unknown as IUserInfo;

/* Protocol Labs' production uid, as `protocol-labs-team.ts` carries it. Written
   out here rather than imported: if that constant is ever edited, these cases
   should fail loudly instead of following it. */
const PL_UID = 'cldvnyxaf01ynu21k62uopjvg';

const team = (over: Partial<{ uid: string; name: string }> = {}) => ({ uid: 'team-1', name: 'Acme', ...over });

const ask = (over: Partial<Parameters<typeof canReadApplicants>[0]>) =>
  canReadApplicants({ flagOn: true, isLoggedIn: true, userInfo: lead, team: team(), ...over });

describe('canReadApplicants', () => {
  it('lets a lead of this team in', () => {
    expect(ask({})).toBe(true);
  });

  it('lets a Directory admin in, for any team', () => {
    expect(ask({ userInfo: admin })).toBe(true);
    expect(ask({ userInfo: admin, team: team({ uid: 'team-nobody-leads' }) })).toBe(true);
  });

  it('keeps out a lead of a DIFFERENT team', () => {
    expect(ask({ userInfo: otherLead })).toBe(false);
  });

  it('keeps out an ordinary member of the team', () => {
    expect(ask({ userInfo: member })).toBe(false);
  });

  it('keeps out a signed-out visitor', () => {
    expect(ask({ isLoggedIn: false, userInfo: null })).toBe(false);
  });

  /* `isLoggedIn` comes off a parsed header and is `''` when absent, not
     `false`. A caller passing it through unchanged is the common case, so the
     coercion has to live here rather than in each of them. */
  it("treats the header's empty string as signed out", () => {
    expect(ask({ isLoggedIn: '' })).toBe(false);
  });

  it('is off entirely when the flag is off, even for an admin', () => {
    expect(ask({ flagOn: false })).toBe(false);
    expect(ask({ flagOn: false, userInfo: admin })).toBe(false);
  });

  /* An admin passes on permissions alone, so without an explicit check they
     would clear the gate for a team id that is not a team at all. */
  it('refuses an empty team uid, admin included', () => {
    expect(ask({ team: team({ uid: '' }) })).toBe(false);
    expect(ask({ team: team({ uid: '' }), userInfo: admin })).toBe(false);
  });

  it('refuses when there is no team at all', () => {
    expect(ask({ team: null })).toBe(false);
    expect(ask({ team: undefined })).toBe(false);
    expect(ask({ team: null, userInfo: admin })).toBe(false);
  });

  /**
   * Protocol Labs is out, and it is the TEAM that is out rather than the viewer.
   *
   * PL hiring lives in PL's own ATS, so this surface would be a second inbox
   * nobody empties — as true for a Directory admin looking at PL as for PL's own
   * lead.
   */
  describe('Protocol Labs', () => {
    const plLead = { uid: 'u9', leadingTeams: [PL_UID] } as IUserInfo;

    it('keeps out the team’s own lead', () => {
      expect(ask({ userInfo: plLead, team: team({ uid: PL_UID, name: 'Protocol Labs' }) })).toBe(false);
    });

    it('keeps out a Directory admin too', () => {
      expect(ask({ userInfo: admin, team: team({ uid: PL_UID, name: 'Protocol Labs' }) })).toBe(false);
    });

    /**
     * The case that matters most, and the one no local run would catch.
     *
     * Dev, UAT and production each seed their own teams, so outside production
     * the uid does NOT match and the name is the only thing that identifies PL.
     * Drop the fallback and this surface quietly appears on PL in every
     * environment we actually click around in.
     */
    it('keeps out a PL team whose uid does not match, on the name alone', () => {
      const leadOfSeeded = { uid: 'u9', leadingTeams: ['pl-uat-seed'] } as IUserInfo;

      expect(ask({ userInfo: leadOfSeeded, team: team({ uid: 'pl-uat-seed', name: 'Protocol Labs' }) })).toBe(false);
      expect(ask({ userInfo: leadOfSeeded, team: team({ uid: 'pl-uat-seed', name: '  protocol labs  ' }) })).toBe(
        false,
      );
    });

    /**
     * ...and no wider than that. The helper matches the whole trimmed name, so a
     * team that merely CONTAINS those words is an ordinary team — pinned here
     * because a future `includes` would look like a harmless loosening and would
     * take the Hiring surface away from every team named after PL.
     */
    it('lets a team whose name merely contains "protocol labs" through', () => {
      expect(ask({ team: team({ name: 'Protocol Labs Alumni' }) })).toBe(true);
    });
  });

  it('does not throw on a malformed userInfo', () => {
    expect(ask({ userInfo: undefined })).toBe(false);
    expect(ask({ userInfo: {} as IUserInfo })).toBe(false);
  });
});
