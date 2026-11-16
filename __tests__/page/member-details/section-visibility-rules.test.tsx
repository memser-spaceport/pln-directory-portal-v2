import { getMember } from '@/services/members.service';
import { MEMBER_SECTION_VISIBILITY } from '@/components/page/member-details/constants/sectionVisibility';

const API_MEMBER = {
  uid: 'member-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  bio: '<p>Engine notes</p>',
  image: { uid: 'img', url: 'https://example.com/ada.png' },
  skills: [{ title: 'Mathematics' }],
  location: { city: 'London', country: 'UK' },
  githubHandler: 'ada',
  telegramHandler: 'ada',
  linkedinHandler: 'ada',
  twitterHandler: 'ada',
  discordHandler: 'ada',
  teamMemberRoles: [{ role: 'Analyst', mainTeam: true, team: { uid: 'team-1', name: 'Engines' } }],
  memberState: 'APPROVED',
  accessLevel: 'L4',
};

describe('what a logged-out visitor gets matches the Public badge', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => API_MEMBER });
  });

  async function fetchAsLoggedOutVisitor() {
    const result = await getMember('member-1', {}, false, undefined, true, true);

    if ('error' in result) {
      throw new Error('expected a member');
    }

    return result.data.formattedData;
  }

  it('keeps everything the Profile Details badge calls public', async () => {
    expect(MEMBER_SECTION_VISIBILITY.profile.level).toBe('public');

    const member = await fetchAsLoggedOutVisitor();

    expect(member).toMatchObject({ name: 'Ada Lovelace', bio: '<p>Engine notes</p>' });
    expect(member.profile).toBe('https://example.com/ada.png');
    expect(member.skills).toEqual([{ title: 'Mathematics' }]);
    expect(member.teams[0]).toMatchObject({ name: 'Engines', role: 'Analyst' });
  });

  it('drops the location the Profile Details badge calls members-only', async () => {
    const member = await fetchAsLoggedOutVisitor();

    expect(member.location).toBeNull();
  });
});
