import { toSocialFieldInputValue } from '@/utils/profile/toSocialFieldInputValue';
import { validateSocialField } from '@/utils/profile/validateSocialField';

describe('toSocialFieldInputValue', () => {
  it('adds the @ back for fields whose handle form requires one', () => {
    expect(toSocialFieldInputValue('twitter', 'protocollabs')).toBe('@protocollabs');
    expect(toSocialFieldInputValue('telegram', 'username')).toBe('@username');
    expect(toSocialFieldInputValue('bluesky', 'protocol.ai')).toBe('@protocol.ai');
  });

  it('does not double up an @ that is already there', () => {
    expect(toSocialFieldInputValue('bluesky', '@protocol.ai')).toBe('@protocol.ai');
  });

  it('leaves fields whose handle form has no @ alone', () => {
    expect(toSocialFieldInputValue('linkedin', 'johndoe')).toBe('johndoe');
    expect(toSocialFieldInputValue('github', 'username')).toBe('username');
    expect(toSocialFieldInputValue('crunchbase', 'protocol-labs')).toBe('protocol-labs');
    expect(toSocialFieldInputValue('website', 'https://protocol.ai')).toBe('https://protocol.ai');
  });

  it('leaves a stored URL alone', () => {
    expect(toSocialFieldInputValue('bluesky', 'https://bsky.app/profile/protocol.ai')).toBe(
      'https://bsky.app/profile/protocol.ai',
    );
  });

  it('passes empty and nullish values through, so an untouched field still submits as null', () => {
    expect(toSocialFieldInputValue('bluesky', null)).toBeNull();
    expect(toSocialFieldInputValue('bluesky', undefined)).toBeUndefined();
    expect(toSocialFieldInputValue('bluesky', '')).toBe('');
    expect(toSocialFieldInputValue('bluesky', '   ')).toBe('   ');
  });
});

/**
 * The guard against the regression this helper exists to prevent: a profile saved before the rule
 * existed holds a bare handle, and re-opening the form must not flag a field nobody touched.
 */
describe('stored values round-trip through the form', () => {
  const stored: [Parameters<typeof validateSocialField>[0], string][] = [
    ['website', 'https://protocol.ai'],
    ['blog', 'blog.protocol.ai/posts/hello'],
    ['linkedin', 'johndoe'],
    ['github', 'username'],
    ['crunchbase', 'protocol-labs'],
    ['twitter', 'protocollabs'],
    ['telegram', 'username'],
    ['bluesky', 'protocol.ai'],
  ];

  it.each(stored)('%s: %s validates once seeded into the form', (field, value) => {
    expect(validateSocialField(field, toSocialFieldInputValue(field, value))).toBeUndefined();
  });
});
