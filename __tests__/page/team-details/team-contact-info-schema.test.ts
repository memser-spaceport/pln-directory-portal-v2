import { teamContactInfoSchema } from '@/components/page/team-details/TeamContactInfo/components/TeamContactInfoEdit/formSchema';
import { socialSchema } from '@/schema/team-forms';

const contactBase = {
  website: 'https://example.com',
  contactMethod: 'team@example.com',
  blog: '',
  twitter: '',
  linkedin: '',
  telegram: '',
  bluesky: '',
  crunchbase: '',
};

const socialBase = {
  contactMethod: 'team@example.com',
  website: 'https://example.com',
};

describe('teamContactInfoSchema jobReferEmail', () => {
  it('allows an empty value so the email can be cleared', async () => {
    await expect(teamContactInfoSchema.validate({ ...contactBase, jobReferEmail: '' })).resolves.toMatchObject({
      jobReferEmail: '',
    });
  });

  it('accepts a valid email', async () => {
    await expect(
      teamContactInfoSchema.validate({ ...contactBase, jobReferEmail: 'jobs@team.com' }),
    ).resolves.toMatchObject({ jobReferEmail: 'jobs@team.com' });
  });

  it('accepts a padded valid email', async () => {
    await expect(
      teamContactInfoSchema.validate({ ...contactBase, jobReferEmail: '  jobs@team.com  ' }),
    ).resolves.toMatchObject({ jobReferEmail: '  jobs@team.com  ' });
  });

  it('rejects an invalid email', async () => {
    await expect(teamContactInfoSchema.validate({ ...contactBase, jobReferEmail: 'not-an-email' })).rejects.toThrow(
      'Enter a valid email',
    );
  });
});

describe('socialSchema jobReferEmail', () => {
  it('allows omitting or clearing the field', () => {
    expect(socialSchema.safeParse(socialBase).success).toBe(true);
    expect(socialSchema.safeParse({ ...socialBase, jobReferEmail: '' }).success).toBe(true);
  });

  it('accepts a valid email', () => {
    expect(socialSchema.safeParse({ ...socialBase, jobReferEmail: 'jobs@team.com' }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = socialSchema.safeParse({ ...socialBase, jobReferEmail: 'not-an-email' });
    expect(result.success).toBe(false);
  });
});
