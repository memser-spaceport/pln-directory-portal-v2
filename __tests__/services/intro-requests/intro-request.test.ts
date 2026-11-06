import { hasCurrentPortfolioRole, isCurrentTeamRole } from '@/services/intro-requests/intro-request-eligibility';
import { messageForIntroRequestFailure } from '@/services/intro-requests/intro-requests.service';

const now = new Date('2026-11-04T12:00:00.000Z');

describe('isCurrentTeamRole', () => {
  it('treats a role with no end date as current', () => {
    expect(isCurrentTeamRole(null, now)).toBe(true);
    expect(isCurrentTeamRole(undefined, now)).toBe(true);
  });

  it('treats an end date of today or later as current', () => {
    expect(isCurrentTeamRole('2026-11-04T12:00:00.000Z', now)).toBe(true);
    expect(isCurrentTeamRole('2026-12-01T00:00:00.000Z', now)).toBe(true);
  });

  it('treats an earlier end date as ended', () => {
    expect(isCurrentTeamRole('2026-11-04T11:59:59.000Z', now)).toBe(false);
  });
});

describe('hasCurrentPortfolioRole', () => {
  const memberUid = 'member-1';

  it('is true when the member has a current role on a portfolio team', () => {
    expect(
      hasCurrentPortfolioRole(
        [{ teamMemberRoles: [{ memberUid, endDate: null }] }],
        memberUid,
        now,
      ),
    ).toBe(true);
  });

  it('reads the member uid from the nested member', () => {
    expect(
      hasCurrentPortfolioRole(
        [{ teamMemberRoles: [{ member: { uid: memberUid }, endDate: null }] }],
        memberUid,
        now,
      ),
    ).toBe(true);
  });

  it('is false for an ended role, another member, or a bad payload', () => {
    expect(
      hasCurrentPortfolioRole(
        [{ teamMemberRoles: [{ memberUid, endDate: '2020-01-01T00:00:00.000Z' }] }],
        memberUid,
        now,
      ),
    ).toBe(false);
    expect(
      hasCurrentPortfolioRole(
        [{ teamMemberRoles: [{ memberUid: 'someone-else', endDate: null }] }],
        memberUid,
        now,
      ),
    ).toBe(false);
    expect(hasCurrentPortfolioRole({ teams: [] }, memberUid, now)).toBe(false);
    expect(hasCurrentPortfolioRole([], '', now)).toBe(false);
  });
});

describe('messageForIntroRequestFailure', () => {
  it('uses a string or a list of strings from the API', () => {
    expect(messageForIntroRequestFailure(400, { message: 'Text is too long' })).toBe('Text is too long');
    expect(messageForIntroRequestFailure(400, { message: ['Text is required', ''] })).toBe('Text is required');
  });

  it('uses a clear fallback when the body has no message', () => {
    expect(messageForIntroRequestFailure(403, {})).toBe('You cannot send an intro request.');
    expect(messageForIntroRequestFailure(404, null)).toBe('That member or team was not found.');
    expect(messageForIntroRequestFailure(500, {})).toBe('The request could not be sent. Try again.');
  });
});
