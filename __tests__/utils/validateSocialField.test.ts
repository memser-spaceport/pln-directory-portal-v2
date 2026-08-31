import { validateSocialField } from '@/utils/profile/validateSocialField';

const ok = (field: Parameters<typeof validateSocialField>[0], value: string) =>
  expect(validateSocialField(field, value)).toBeUndefined();
const fails = (field: Parameters<typeof validateSocialField>[0], value: string) =>
  expect(validateSocialField(field, value)).toEqual(expect.any(String));

describe("validateSocialField — emptiness is the form's concern", () => {
  it('accepts empty values for every field', () => {
    (['website', 'blog', 'linkedin', 'github', 'crunchbase', 'twitter', 'telegram', 'bluesky'] as const).forEach(
      (field) => {
        ok(field, '');
        ok(field, '   ');
        expect(validateSocialField(field, null)).toBeUndefined();
        expect(validateSocialField(field, undefined)).toBeUndefined();
      },
    );
  });
});

describe('validateSocialField — website / blog require a URL', () => {
  it.each(['website', 'blog'] as const)('%s accepts URLs with or without a scheme', (field) => {
    ok(field, 'https://protocol.ai');
    ok(field, 'http://protocol.ai');
    ok(field, 'protocol.ai');
    ok(field, 'blog.protocol.ai/posts/hello');
    ok(field, 'https://protocol.ai:8080/path?q=1');
  });

  it.each(['website', 'blog'] as const)('%s rejects anything that is not a URL', (field) => {
    fails(field, 'asdf');
    fails(field, 'hello world');
    fails(field, 'https://asdf');
    fails(field, '@protocollabs');
  });
});

describe('validateSocialField — linkedin / github / crunchbase take a handle or a provider URL', () => {
  it('accepts a bare handle', () => {
    ok('linkedin', 'johndoe');
    ok('github', 'username');
    ok('crunchbase', 'protocol-labs');
  });

  it('accepts the provider URL, with or without scheme and www', () => {
    ok('linkedin', 'https://www.linkedin.com/in/johndoe');
    ok('linkedin', 'linkedin.com/company/protocol-labs');
    ok('github', 'https://github.com/username');
    ok('crunchbase', 'https://www.crunchbase.com/organization/protocol-labs');
    ok('crunchbase', 'crunchbase.com/organization/protocol-labs');
  });

  it('rejects a URL belonging to some other site', () => {
    fails('linkedin', 'https://example.com/in/johndoe');
    fails('github', 'https://gitlab.com/username');
    fails('crunchbase', 'https://example.com/organization/protocol-labs');
  });

  it('rejects a provider URL missing the handle', () => {
    fails('github', 'https://github.com/');
    fails('linkedin', 'https://linkedin.com/johndoe');
  });

  it('rejects spaces and a leading @', () => {
    fails('linkedin', 'john doe');
    fails('github', '@username');
    fails('crunchbase', '@protocol-labs');
  });
});

describe('validateSocialField — twitter / telegram / bluesky take an @handle or a provider URL', () => {
  it('accepts an @handle', () => {
    ok('twitter', '@protocollabs');
    ok('telegram', '@username');
    ok('bluesky', '@protocol.ai');
    ok('bluesky', '@team.bsky.social');
  });

  it('rejects a handle missing its @', () => {
    fails('twitter', 'protocollabs');
    fails('telegram', 'username');
    fails('bluesky', 'protocol.ai');
    fails('bluesky', 'team.bsky.social');
  });

  it('accepts the provider URL', () => {
    ok('twitter', 'https://twitter.com/protocollabs');
    ok('twitter', 'https://x.com/protocollabs');
    ok('telegram', 'https://t.me/username');
    ok('bluesky', 'https://bsky.app/profile/protocol.ai');
    ok('bluesky', 'bsky.app/profile/@protocol.ai');
  });

  it('rejects a URL belonging to some other site', () => {
    fails('twitter', 'https://example.com/protocollabs');
    fails('telegram', 'https://telegram.me/username');
    fails('bluesky', 'https://example.com/profile/protocol.ai');
  });

  it('rejects a provider domain smuggled into another host', () => {
    fails('twitter', 'https://evil.com/twitter.com/protocollabs');
    fails('bluesky', 'https://evil.com/bsky.app/profile/protocol.ai');
  });

  it('rejects spaces and a lone @', () => {
    fails('twitter', 'protocol labs');
    fails('telegram', '@');
  });
});
