import { getVisibleSocialHandles, hidePreferences } from '@/utils/member.utils';
import { IMember, IMemberPreferences } from '@/types/members.types';

describe('getVisibleSocialHandles function', () => {
  it('should return all handles', () => {
    const member = {
      email: 'some.user@gmail.com',
      githubHandle: 'https://github.com/some-user',
      discordHandle: 'some-user-discord',
      twitter: 'some-user-twitter',
      linkedinHandle: 'https://www.linkedin.com/in/some-user/',
      telegramHandle: 'some-user-tg',
      officeHours: 'https://woozy-homicide.info',
      preferences: {
        showEmail: true,
        showGithub: true,
        showDiscord: true,
        showTwitter: true,
        showLinkedin: true,
        showTelegram: true,
        showGithubHandle: true,
      },
    };

    const expectedResult = ['email', 'github', 'discord', 'twitter', 'linkedin', 'telegram', 'officeHours'];

    const handles = getVisibleSocialHandles(member);
    expect(handles).toEqual(expectedResult);
  });

  it('should return everything besides email', () => {
    const member = {
      email: 'some.user@gmail.com',
      githubHandle: 'https://github.com/some-user',
      discordHandle: 'some-user-discord',
      twitter: 'some-user-twitter',
      linkedinHandle: 'https://www.linkedin.com/in/some-user/',
      telegramHandle: 'some-user-tg',
      officeHours: 'https://woozy-homicide.info',
      preferences: {
        showEmail: false,
        showGithub: true,
        showDiscord: true,
        showTwitter: true,
        showLinkedin: true,
        showTelegram: true,
        showGithubHandle: true,
      },
    };

    const expectedResult = ['github', 'discord', 'twitter', 'linkedin', 'telegram', 'officeHours'];

    const handles = getVisibleSocialHandles(member);
    expect(handles).toEqual(expectedResult);
  });

  it('should return nothing when all preferences are false', () => {
    const member = {
      email: 'some.user@gmail.com',
      githubHandle: 'https://github.com/some-user',
      discordHandle: 'some-user-discord',
      twitter: 'some-user-twitter',
      linkedinHandle: 'https://www.linkedin.com/in/some-user/',
      telegramHandle: 'some-user-tg',
      preferences: {
        showEmail: false,
        showGithub: false,
        showDiscord: false,
        showTwitter: false,
        showLinkedin: false,
        showTelegram: false,
        showGithubHandle: false,
      },
    };

    const expectedResult: string[] = [];

    const handles = getVisibleSocialHandles(member);
    expect(handles).toEqual(expectedResult);
  });

  it('should return email, github and discord when others are null', () => {
    const member = {
      email: 'some.user@gmail.com',
      githubHandle: 'https://github.com/some-user',
      discordHandle: 'some-user-discord',
      twitter: null,
      linkedinHandle: null,
      telegramHandle: null,
      preferences: {
        showEmail: true,
        showGithub: true,
        showDiscord: true,
        showTwitter: true,
        showLinkedin: true,
        showTelegram: true,
        showGithubHandle: true,
      },
    };

    const expectedResult = ['email', 'github', 'discord'];

    const handles = getVisibleSocialHandles(member);
    expect(handles).toEqual(expectedResult);
  });

  it('should return nothing but officeHours when all preferences are false', () => {
    const member = {
      email: 'some.user@gmail.com',
      githubHandle: 'https://github.com/some-user',
      discordHandle: 'some-user-discord',
      twitter: 'some-user-twitter',
      linkedinHandle: 'https://www.linkedin.com/in/some-user/',
      telegramHandle: 'some-user-tg',
      officeHours: 'https://woozy-homicide.info',
      preferences: {
        showEmail: false,
        showGithub: false,
        showDiscord: false,
        showTwitter: false,
        showLinkedin: false,
        showTelegram: false,
        showGithubHandle: false,
      },
    };

    const expectedResult = ['officeHours'];

    const handles = getVisibleSocialHandles(member);
    expect(handles).toEqual(expectedResult);
  });

  it('should return nothing when all preferences are false as well as officeHours', () => {
    const member = {
      email: 'some.user@gmail.com',
      githubHandle: 'https://github.com/some-user',
      discordHandle: 'some-user-discord',
      twitter: 'some-user-twitter',
      linkedinHandle: 'https://www.linkedin.com/in/some-user/',
      telegramHandle: 'some-user-tg',
      officeHours: null,
      preferences: {
        showEmail: false,
        showGithub: false,
        showDiscord: false,
        showTwitter: false,
        showLinkedin: false,
        showTelegram: false,
        showGithubHandle: false,
      },
    };

    const expectedResult: string[] = [];

    const handles = getVisibleSocialHandles(member);
    expect(handles).toEqual(expectedResult);
  });

  it('should return all when there are no preferences', () => {
    const member = {
      email: 'some.user@gmail.com',
      githubHandle: 'https://github.com/some-user',
      discordHandle: 'some-user-discord',
      twitter: 'some-user-twitter',
      linkedinHandle: 'https://www.linkedin.com/in/some-user/',
      telegramHandle: 'some-user-tg',
      officeHours: 'some-office-hours',
    };

    const expectedResult: string[] = ['email', 'github', 'discord', 'twitter', 'linkedin', 'telegram', 'officeHours'];

    const handles = getVisibleSocialHandles(member);
    expect(handles).toEqual(expectedResult);
  });

  it('should return nothing if all nulls and no preferences', () => {
    const member = {
      email: null,
      githubHandle: null,
      discordHandle: null,
      twitter: null,
      linkedinHandle: null,
      telegramHandle: null,
      officeHours: null,
    };

    const expectedResult: string[] = [];

    const handles = getVisibleSocialHandles(member);
    expect(handles).toEqual(expectedResult);
  });
});

const shown: IMemberPreferences = {
  showEmail: true,
  showDiscord: true,
  showTwitter: true,
  showLinkedin: true,
  showTelegram: true,
  showGithubHandle: true,
  showGithubProjects: true,
  showBluesky: true,
};

function memberWithContacts(): IMember {
  return {
    email: 'ada@example.com',
    githubHandle: 'ada',
    discordHandle: 'ada-discord',
    telegramHandle: 'ada-tg',
    linkedinHandle: 'ada-li',
    twitter: 'ada-x',
    blueskyHandle: 'ada.bsky',
    repositories: [
      {
        name: 'repo',
        description: null,
        url: 'https://github.com/ada/repo',
        createdAt: '',
        updatedAt: '',
      },
    ],
  } as IMember;
}

describe('hidePreferences', () => {
  it('keeps every contact when each flag is true', () => {
    const member = memberWithContacts();

    hidePreferences(shown, member);

    expect(member.email).toBe('ada@example.com');
    expect(member.githubHandle).toBe('ada');
    expect(member.discordHandle).toBe('ada-discord');
    expect(member.telegramHandle).toBe('ada-tg');
    expect(member.linkedinHandle).toBe('ada-li');
    expect(member.twitter).toBe('ada-x');
    expect(member.blueskyHandle).toBe('ada.bsky');
    expect(member.repositories).toHaveLength(1);
  });

  it('keeps every contact when the flags were never saved', () => {
    const member = memberWithContacts();

    hidePreferences({} as IMemberPreferences, member);

    expect(member.email).toBe('ada@example.com');
    expect(member.githubHandle).toBe('ada');
    expect(member.discordHandle).toBe('ada-discord');
    expect(member.telegramHandle).toBe('ada-tg');
    expect(member.linkedinHandle).toBe('ada-li');
    expect(member.twitter).toBe('ada-x');
    expect(member.blueskyHandle).toBe('ada.bsky');
    expect(member.repositories).toHaveLength(1);
  });

  it('removes a contact only when its flag is false', () => {
    const member = memberWithContacts();

    hidePreferences(
      {
        ...shown,
        showEmail: false,
        showGithubProjects: false,
      },
      member,
    );

    expect(member.email).toBeUndefined();
    expect(member.repositories).toBeUndefined();
    expect(member.githubHandle).toBe('ada');
    expect(member.discordHandle).toBe('ada-discord');
    expect(member.telegramHandle).toBe('ada-tg');
    expect(member.linkedinHandle).toBe('ada-li');
    expect(member.twitter).toBe('ada-x');
    expect(member.blueskyHandle).toBe('ada.bsky');
  });
});
