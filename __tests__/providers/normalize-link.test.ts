/**
 * normalizeLink turns a notification's link into the path it is compared with, so a notification is marked read
 * when the member is on its page.
 */
import { normalizeLink } from '@/providers/PushNotificationsProvider/utils/normalizeLink';

describe('normalizeLink', () => {
  it('keeps only the path of an absolute link, and only `news` of its query', () => {
    expect(normalizeLink('https://os.pl.xyz/members/m-1?utm_source=email#about')).toBe('/members/m-1');
    expect(normalizeLink('https://os.pl.xyz/?news=n-1&utm_source=email')).toBe('/?news=n-1');
  });

  it('adds the leading slash a relative link lacks', () => {
    expect(normalizeLink('teams/t-1')).toBe('/teams/t-1');
  });

  // LAB-3255: the homepage moved from /home to the site root. Links sent before that, and links the backend still
  // builds, say /home; they must still match the homepage, or their notifications never clear there.
  it('reads the old /home as the homepage', () => {
    expect(normalizeLink('/home')).toBe('/');
    expect(normalizeLink('/home?news=n-1#comments')).toBe('/?news=n-1');
    expect(normalizeLink('https://os.pl.xyz/home?news=n-1')).toBe('/?news=n-1');
  });

  it('leaves paths that only start with /home alone', () => {
    expect(normalizeLink('/home/anything')).toBe('/home/anything');
    expect(normalizeLink('/homepage')).toBe('/homepage');
  });
});
