import { submitIdeaSchema, editIdeaSchema } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';

const baseValues = {
  title: 'Dedupe member records',
  description: '',
  stage: null,
  tags: [],
  type: null,
  objectives: [],
};

const optionalCtx = { impactRequired: false, reasoningRequired: false };

const validate = (
  values: Record<string, unknown>,
  context: { impactRequired: boolean; reasoningRequired: boolean },
): Promise<unknown> => submitIdeaSchema.validate(values, { context, abortEarly: false });

describe('submitIdeaSchema — impact optional on create', () => {
  it('passes without a rating and without reasoning', async () => {
    await expect(validate({ ...baseValues, impact: null, impactReasoning: '' }, optionalCtx)).resolves.toBeTruthy();
  });

  it('passes with rating only (reasoning skipped)', async () => {
    await expect(validate({ ...baseValues, impact: 4, impactReasoning: '' }, optionalCtx)).resolves.toBeTruthy();
  });

  it('passes with rating + reasoning', async () => {
    await expect(
      validate({ ...baseValues, impact: 4, impactReasoning: 'Unblocks onboarding for every new team' }, optionalCtx),
    ).resolves.toBeTruthy();
  });

  it('reasoning respects the plain-text max length when provided', async () => {
    await expect(
      validate({ ...baseValues, impact: 4, impactReasoning: 'x'.repeat(1001) }, optionalCtx),
    ).rejects.toMatchObject({ errors: ['Max 1000 characters'] });
  });

  it('still enforces required when context asks for it (schema hooks)', async () => {
    await expect(
      validate({ ...baseValues, impact: null, impactReasoning: '' }, { impactRequired: true, reasoningRequired: true }),
    ).rejects.toMatchObject({
      errors: expect.arrayContaining(['Rate the impact to goals', 'Explain why this matters']),
    });
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
