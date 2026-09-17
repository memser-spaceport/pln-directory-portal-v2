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

const ask = (over: Partial<Parameters<typeof canReadApplicants>[0]>) =>
  canReadApplicants({ flagOn: true, isLoggedIn: true, userInfo: lead, teamId: 'team-1', ...over });

describe('canReadApplicants', () => {
  it('lets a lead of this team in', () => {
    expect(ask({})).toBe(true);
  });

  it('lets a Directory admin in, for any team', () => {
    expect(ask({ userInfo: admin })).toBe(true);
    expect(ask({ userInfo: admin, teamId: 'team-nobody-leads' })).toBe(true);
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
  it('refuses an empty team id, admin included', () => {
    expect(ask({ teamId: '' })).toBe(false);
    expect(ask({ teamId: '', userInfo: admin })).toBe(false);
  });

  it('does not throw on a malformed userInfo', () => {
    expect(ask({ userInfo: undefined })).toBe(false);
    expect(ask({ userInfo: {} as IUserInfo })).toBe(false);
  });
});
