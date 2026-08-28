import * as yup from 'yup';

import { socialFieldSchema } from '@/utils/profile/socialFieldSchema';
import { validateSocialField } from '@/utils/profile/validateSocialField';

/** The shared shape used by both the member and the team contact forms. */
const form = yup.object({
  github: socialFieldSchema('github'),
  telegram: socialFieldSchema('telegram'),
  bluesky: socialFieldSchema('bluesky'),
  website: socialFieldSchema('website'),
});

async function errorFor(field: string, value: unknown) {
  try {
    await form.validateAt(field, { [field]: value });
    return null;
  } catch (error) {
    return (error as yup.ValidationError).message;
  }
}

describe('socialFieldSchema', () => {
  it('accepts a value the underlying validator accepts', async () => {
    await expect(errorFor('github', 'protocol')).resolves.toBeNull();
    await expect(errorFor('telegram', '@protocol')).resolves.toBeNull();
    await expect(errorFor('bluesky', 'https://bsky.app/profile/protocol.ai')).resolves.toBeNull();
    await expect(errorFor('website', 'https://protocol.ai')).resolves.toBeNull();
  });

  it('surfaces the validator message verbatim, so yup and the form never disagree', async () => {
    const expected = validateSocialField('github', '@protocol');

    expect(expected).toEqual(expect.any(String));
    await expect(errorFor('github', '@protocol')).resolves.toBe(expected);
  });

  it('reports the field it was built for', async () => {
    await expect(errorFor('telegram', 'protocol')).resolves.toBe(validateSocialField('telegram', 'protocol'));
    await expect(errorFor('bluesky', 'https://example.com/x')).resolves.toBe(
      validateSocialField('bluesky', 'https://example.com/x'),
    );
  });

  it("treats empty and null as valid — requiredness is the form's call, not the shape's", async () => {
    await expect(errorFor('github', '')).resolves.toBeNull();
    await expect(errorFor('github', null)).resolves.toBeNull();
    await expect(errorFor('telegram', '   ')).resolves.toBeNull();
  });

  it('composes with .required() so a form can demand the field without redefining the shape', async () => {
    const required = socialFieldSchema('linkedin').required('LinkedIn is required');

    await expect(required.validate('johndoe')).resolves.toBe('johndoe');
    await expect(required.validate('')).rejects.toThrow('LinkedIn is required');
  });

  it('validates the whole object, not just one field at a time', async () => {
    await expect(
      form.validate({ github: '@bad', telegram: 'bad', bluesky: '', website: '' }, { abortEarly: false }),
    ).rejects.toMatchObject({ errors: expect.arrayContaining([expect.any(String), expect.any(String)]) });
  });
});
