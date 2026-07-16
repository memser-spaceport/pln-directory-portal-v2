import { submitIdeaSchema, editIdeaSchema } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';

const baseValues = {
  title: 'Dedupe member records',
  description: '',
  stage: null,
  tags: [],
  type: null,
  objectives: [],
};

const validate = (
  values: Record<string, unknown>,
  context: { impactRequired: boolean; reasoningRequired: boolean },
): Promise<unknown> => submitIdeaSchema.validate(values, { context, abortEarly: false });

describe('submitIdeaSchema — impact validation via resolver context', () => {
  const memberCtx = { impactRequired: true, reasoningRequired: true };
  const curatorCtx = { impactRequired: true, reasoningRequired: false };
  const flagOffCtx = { impactRequired: false, reasoningRequired: false };

  it('member: rejects without a rating and without reasoning', async () => {
    await expect(validate({ ...baseValues, impact: null, impactReasoning: '' }, memberCtx)).rejects.toMatchObject({
      errors: expect.arrayContaining(['Rate the impact on company goals', 'Explain how this moves company goals']),
    });
  });

  it('member: whitespace-only reasoning does not pass', async () => {
    await expect(validate({ ...baseValues, impact: 4, impactReasoning: '   ' }, memberCtx)).rejects.toMatchObject({
      errors: ['Explain how this moves company goals'],
    });
  });

  it('member: rating + reasoning passes', async () => {
    await expect(
      validate({ ...baseValues, impact: 4, impactReasoning: 'Unblocks onboarding for every new team' }, memberCtx),
    ).resolves.toBeTruthy();
  });

  it('curator: rating required, reasoning optional', async () => {
    await expect(validate({ ...baseValues, impact: null, impactReasoning: '' }, curatorCtx)).rejects.toMatchObject({
      errors: ['Rate the impact on company goals'],
    });
    await expect(validate({ ...baseValues, impact: 3, impactReasoning: '' }, curatorCtx)).resolves.toBeTruthy();
  });

  it('flag off: neither field is required — legacy create unchanged', async () => {
    await expect(validate({ ...baseValues, impact: null, impactReasoning: '' }, flagOffCtx)).resolves.toBeTruthy();
  });

  it('reasoning respects the plain-text max length', async () => {
    await expect(
      validate({ ...baseValues, impact: 4, impactReasoning: 'x'.repeat(1001) }, memberCtx),
    ).rejects.toMatchObject({ errors: ['Max 1000 characters'] });
  });
});

describe('editIdeaSchema — impact optional on edit (legacy items stay editable)', () => {
  it('passes with no rating when context does not require it', async () => {
    await expect(
      editIdeaSchema.validate(
        { title: 'Legacy item', description: '', tags: [], type: null, impact: null, impactReasoning: '' },
        { context: { impactRequired: false, reasoningRequired: false } },
      ),
    ).resolves.toBeTruthy();
  });
});
