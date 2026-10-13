import { validatePublicPath } from '@/services/ai-apps/utils/validatePublicPath';

describe('validatePublicPath', () => {
  it.each(['/api/*', '/webhooks/stripe', '/api/v1.0/*', '/api/**'])('accepts %p', (pattern) => {
    expect(validatePublicPath(pattern)).toBeNull();
  });

  it.each(['/', '/*', '*', '/**', '/*/health', ''])('rejects the whole-app pattern %p', (pattern) => {
    expect(validatePublicPath(pattern)).not.toBeNull();
  });

  it.each(['api/*', '/api//x', '/api/../x', '/api/./x', '/api?x=1', '/api#x', '/a b', '/a%20b', '/a\\b'])(
    'rejects the malformed pattern %p',
    (pattern) => {
      expect(validatePublicPath(pattern)).not.toBeNull();
    },
  );

  it('rejects patterns longer than 200 characters', () => {
    expect(validatePublicPath(`/${'a'.repeat(200)}`)).not.toBeNull();
    expect(validatePublicPath(`/${'a'.repeat(199)}`)).toBeNull();
  });
});
