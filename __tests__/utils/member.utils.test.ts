import { getVisibleSocialHandles } from '@/utils/member.utils';
import officeHours from '@/components/page/irl/add-edit-attendee/office-hours';

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

    const expectedResult: string[] = [ 'email', 'github', 'discord', 'twitter', 'linkedin', 'telegram', 'officeHours' ];

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

    const expectedResult: string[] = [  ];

    const handles = getVisibleSocialHandles(member);
    expect(handles).toEqual(expectedResult);
  });
});
