import { buildMemberUpdatePayload } from '@/utils/member/buildMemberUpdatePayload';

/**
 * Characterization test for the payload extraction. The expected objects below are transcribed
 * from the four `formatPayload` implementations as they were BEFORE the refactor, so any drift
 * introduced by sharing one builder shows up here as a failure.
 */

const memberInfo = {
  uid: 'm-1',
  imageUid: 'img-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  plnStartDate: '2020-01-01T00:00:00.000Z',
  location: { city: 'London', region: 'England', country: 'UK' },
  teamOrProjectURL: 'https://example.com',
  linkedinHandler: 'ada',
  discordHandler: 'ada#0001',
  twitterHandler: 'ada_t',
  githubHandler: 'ada_gh',
  telegramHandler: 'ada_tg',
  officeHours: 'https://cal.com/ada',
  moreDetails: 'some notes',
  openToWork: true,
  plnFriend: false,
  teamMemberRoles: [{ teamUid: 't1', role: 'Engineer', mainTeam: true }],
  projectContributions: [{ uid: 'c1', projectName: 'dropped by omit', projectUid: 'p1', role: 'Dev' }],
  skills: [{ id: 's1', name: 'Rust' }],
  bio: 'Original bio',
};

// Exactly what every pre-refactor formatPayload produced for the fields it carried through.
const CARRIED_THROUGH = {
  imageUid: 'img-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  plnStartDate: '2020-01-01T00:00:00.000Z',
  city: 'London',
  region: 'England',
  country: 'UK',
  teamOrProjectURL: 'https://example.com',
  linkedinHandler: 'ada',
  discordHandler: 'ada#0001',
  twitterHandler: 'ada_t',
  githubHandler: 'ada_gh',
  telegramHandler: 'ada_tg',
  officeHours: 'https://cal.com/ada',
  moreDetails: 'some notes',
  openToWork: true,
  plnFriend: false,
  teamAndRoles: [{ teamUid: 't1', role: 'Engineer', mainTeam: true }],
  projectContributions: [{ uid: 'c1', projectUid: 'p1', role: 'Dev' }],
  skills: [{ title: 'Rust', uid: 's1' }],
  bio: 'Original bio',
};

/** What actually reaches the API — `JSON.stringify` drops `undefined` values. */
const onTheWire = (payload: object) => JSON.parse(JSON.stringify(payload));

describe('buildMemberUpdatePayload', () => {
  it('carries every member field through unchanged', () => {
    expect(buildMemberUpdatePayload(memberInfo)).toEqual(CARRIED_THROUGH);
  });

  it('strips projectName from contributions and remaps skills to title/uid', () => {
    const payload = buildMemberUpdatePayload(memberInfo);

    expect(payload.projectContributions?.[0]).not.toHaveProperty('projectName');
    expect(payload.skills).toEqual([{ title: 'Rust', uid: 's1' }]);
  });

  it('tolerates a member with no location, contributions or skills', () => {
    const payload = buildMemberUpdatePayload({ name: 'Bare' });

    expect(payload).toMatchObject({ name: 'Bare', city: '', region: '', country: '' });
    expect(payload.projectContributions).toBeUndefined();
    expect(payload.skills).toBeUndefined();
  });

  it('drops a field from the request when an override is undefined', () => {
    const payload = buildMemberUpdatePayload(memberInfo, { bio: undefined });

    expect(onTheWire(payload)).not.toHaveProperty('bio');
  });
});

describe('per-form payloads match their pre-refactor output', () => {
  it('EditTeamForm — overrides teamAndRoles only', () => {
    const teams = [{ teamUid: 't2', role: 'Lead', teamTitle: 'Team Two', mainTeam: true }];

    expect(buildMemberUpdatePayload(memberInfo, { teamAndRoles: teams })).toEqual({
      ...CARRIED_THROUGH,
      teamAndRoles: teams,
    });
  });

  it('EditContributionsForm — overrides projectContributions only', () => {
    const projectContributions = [{ projectUid: 'p2', role: 'Maintainer', currentProject: true }];

    expect(buildMemberUpdatePayload(memberInfo, { projectContributions })).toEqual({
      ...CARRIED_THROUGH,
      projectContributions,
    });
  });

  it('EditProfileForm — overrides profile fields and omits bio', () => {
    const updatedTeamAndRoles = [{ teamUid: 't1', role: 'Engineer', mainTeam: false }];
    const skills = [{ title: 'Go', uid: 's2' }];

    const payload = buildMemberUpdatePayload(memberInfo, {
      name: 'Ada L.',
      city: 'Berlin',
      region: 'Berlin',
      country: 'Germany',
      openToWork: false,
      teamAndRoles: updatedTeamAndRoles,
      skills,
      bio: undefined,
    });

    // bio is updated separately via updateMemberParams, so it must not ride along on the PUT
    const { bio, ...carriedThroughWithoutBio } = CARRIED_THROUGH;

    expect(onTheWire(payload)).toEqual({
      ...carriedThroughWithoutBio,
      name: 'Ada L.',
      city: 'Berlin',
      region: 'Berlin',
      country: 'Germany',
      openToWork: false,
      teamAndRoles: updatedTeamAndRoles,
      skills,
    });
  });

  it('OnboardingWizard — overrides name, email, blank location, telegram and officeHours', () => {
    const payload = buildMemberUpdatePayload(memberInfo, {
      name: 'Ada Onboard',
      email: 'new@example.com',
      city: '',
      region: '',
      country: '',
      telegramHandler: 'tg_new',
      officeHours: 'https://cal.com/new',
    });

    expect(payload).toEqual({
      ...CARRIED_THROUGH,
      name: 'Ada Onboard',
      email: 'new@example.com',
      city: '',
      region: '',
      country: '',
      telegramHandler: 'tg_new',
      officeHours: 'https://cal.com/new',
    });
  });
});
