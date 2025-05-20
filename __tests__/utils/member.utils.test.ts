import { getVisibleSocialHandles } from '@/utils/member.utils';

describe("getVisibleSocialHandles function", () => {

  it("should return all handles", () => {
    const member = {
      email: 'some.user@gmail.com',
      githubHandler: 'https://github.com/some-user',
      discordHandler: 'some-user-discord',
      twitterHandler: 'some-user-twitter',
      linkedinHandler: 'https://www.linkedin.com/in/some-user/',
      telegramHandler: 'some-user-tg',
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

    const expectedResult = [ 'email', 'github', 'discord', 'twitter', 'linkedin', 'telegram' ];

    const handles = getVisibleSocialHandles(member);
    expect(handles).toEqual(expectedResult);
  })

  it("should return everything besides email", () => {
    const member = {
      email: 'some.user@gmail.com',
      githubHandler: 'https://github.com/some-user',
      discordHandler: 'some-user-discord',
      twitterHandler: 'some-user-twitter',
      linkedinHandler: 'https://www.linkedin.com/in/some-user/',
      telegramHandler: 'some-user-tg',
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

    const expectedResult = [ 'github', 'discord', 'twitter', 'linkedin', 'telegram' ];

    const handles = getVisibleSocialHandles(member);
    expect(handles).toEqual(expectedResult);
  })

  it("should return nothing when all preferences are false", () => {
    const member = {
      email: 'some.user@gmail.com',
      githubHandler: 'https://github.com/some-user',
      discordHandler: 'some-user-discord',
      twitterHandler: 'some-user-twitter',
      linkedinHandler: 'https://www.linkedin.com/in/some-user/',
      telegramHandler: 'some-user-tg',
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

    const expectedResult = [  ];

    const handles = getVisibleSocialHandles(member);
    expect(handles).toEqual(expectedResult);
  })

  it("should return email, github and discord when others are null", () => {
    const member = {
      email: 'some.user@gmail.com',
      githubHandler: 'https://github.com/some-user',
      discordHandler: 'some-user-discord',
      twitterHandler: null,
      linkedinHandler: null,
      telegramHandler: null,
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

    const expectedResult = [ 'email', 'github', 'discord' ];

    const handles = getVisibleSocialHandles(member);
    expect(handles).toEqual(expectedResult);
  })
})