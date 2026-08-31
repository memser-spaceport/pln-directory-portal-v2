import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';

const WEBSITE_FALLBACK = '/icons/contact/website-contact-logo-v2.svg';

describe('getContactLogoByProvider', () => {
  it.each([
    ['linkedin', '/icons/contact/linkedIn-contact-logo-v2.svg'],
    ['discord', '/icons/contact/discord-contact-logo.svg'],
    ['email', '/icons/contact/email-contact-logo-v2.svg'],
    ['github', '/icons/contact/github-contact-logo.svg'],
    ['team', '/icons/contact/team-contact-logo.svg'],
    ['telegram', '/icons/contact/telegram-contact-logo.svg'],
    ['twitter', '/icons/contact/twitter-contact-logo.svg'],
    ['blog', '/icons/contact/blog-contact-logo.svg'],
    ['bluesky', '/icons/contact/Bluesky_logo.svg'],
    ['crunchbase', '/icons/contact/Crunchbase_logo.svg'],
  ])('maps %s to its own logo', (provider, expected) => {
    expect(getContactLogoByProvider(provider)).toBe(expected);
  });

  it('gives the newer bluesky and crunchbase providers their own icons rather than the fallback', () => {
    expect(getContactLogoByProvider('bluesky')).not.toBe(WEBSITE_FALLBACK);
    expect(getContactLogoByProvider('crunchbase')).not.toBe(WEBSITE_FALLBACK);
  });

  it('falls back to the website logo for website and anything unknown', () => {
    expect(getContactLogoByProvider('website')).toBe(WEBSITE_FALLBACK);
    expect(getContactLogoByProvider('mastodon')).toBe(WEBSITE_FALLBACK);
    expect(getContactLogoByProvider('')).toBe(WEBSITE_FALLBACK);
  });

  it('is case-sensitive — callers must pass the lowercase provider key', () => {
    expect(getContactLogoByProvider('LinkedIn')).toBe(WEBSITE_FALLBACK);
  });

  it('never returns an empty path, whatever it is handed', () => {
    ['github', 'bluesky', 'anything-at-all'].forEach((provider) => {
      expect(getContactLogoByProvider(provider)).toMatch(/^\/icons\/contact\/.+\.svg$/);
    });
  });
});
