import {
  isJobAspirantMember,
  shouldPlaceCvAfterProfileDetails,
  shouldPlaceCvInDefaultPosition,
  shouldShowInvestorProfile,
} from '@/components/page/member-details/job-aspirant-profile';

const JOB_ASPIRANT_POLICY = { code: 'job_aspirant' };

describe('isJobAspirantMember', () => {
  it('is true when the member carries the Job Aspirant policy', () => {
    expect(isJobAspirantMember({ rbac: { policies: [JOB_ASPIRANT_POLICY] } })).toBe(true);
    expect(isJobAspirantMember({ rbac: { policies: [{ code: 'member' }] } })).toBe(false);
  });

  it('is true from Job Board sign-up with no team', () => {
    expect(isJobAspirantMember({ signUpSource: 'job-board' })).toBe(true);
    expect(isJobAspirantMember({ signUpSource: 'job-board', mainTeam: { name: 'Acme' } })).toBe(false);
  });
});

describe('shouldShowInvestorProfile', () => {
  it('hides Investor Details for Job Aspirants unless they opted in', () => {
    expect(shouldShowInvestorProfile({ isOwner: true, isAdmin: false, isInvestor: null, isJobAspirant: true })).toBe(
      false,
    );
    expect(
      shouldShowInvestorProfile({ isOwner: true, isAdmin: false, isInvestor: undefined, isJobAspirant: true }),
    ).toBe(false);
    expect(shouldShowInvestorProfile({ isOwner: true, isAdmin: false, isInvestor: false, isJobAspirant: true })).toBe(
      false,
    );
    expect(shouldShowInvestorProfile({ isOwner: true, isAdmin: false, isInvestor: true, isJobAspirant: true })).toBe(
      true,
    );
  });

  it('keeps the unset prompt for other members', () => {
    expect(shouldShowInvestorProfile({ isOwner: true, isAdmin: false, isInvestor: null, isJobAspirant: false })).toBe(
      true,
    );
    expect(shouldShowInvestorProfile({ isOwner: true, isAdmin: false, isInvestor: false, isJobAspirant: false })).toBe(
      false,
    );
  });

  it('is hidden from readers who are not the owner or an admin', () => {
    expect(shouldShowInvestorProfile({ isOwner: false, isAdmin: false, isInvestor: true, isJobAspirant: false })).toBe(
      false,
    );
  });
});

describe('CV placement', () => {
  it('sits under Profile Details for Job Aspirants', () => {
    expect(shouldPlaceCvAfterProfileDetails({ showCvSection: true, isJobAspirant: true, isOwner: true })).toBe(true);
    expect(shouldPlaceCvAfterProfileDetails({ showCvSection: false, isJobAspirant: true, isOwner: true })).toBe(false);
  });

  it('sits under Profile Details when reading someone else’s CV', () => {
    expect(shouldPlaceCvAfterProfileDetails({ showCvSection: true, isJobAspirant: false, isOwner: false })).toBe(true);
  });

  it('leaves a non-aspirant owner’s CV in the default slot', () => {
    expect(shouldPlaceCvAfterProfileDetails({ showCvSection: true, isJobAspirant: false, isOwner: true })).toBe(false);
    expect(shouldPlaceCvInDefaultPosition({ showCvSection: true, isJobAspirant: false, isOwner: true })).toBe(true);
    expect(shouldPlaceCvInDefaultPosition({ showCvSection: true, isJobAspirant: true, isOwner: true })).toBe(false);
    expect(shouldPlaceCvInDefaultPosition({ showCvSection: true, isJobAspirant: false, isOwner: false })).toBe(false);
  });
});
