import { isSubmitIdeaDraftEmpty } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import { getSubmitIdeaDraftKey, getSubmitIdeaFormDefaults } from '@/services/gantry/submitIdeaModal';

describe('submit idea draft helpers', () => {
  it('uses variant-scoped storage keys', () => {
    expect(getSubmitIdeaDraftKey('idea')).toBe('form-draft:gantry:submit-idea:idea');
    expect(getSubmitIdeaDraftKey('roadmap')).toBe('form-draft:gantry:submit-idea:roadmap');
  });

  it('treats default form values as empty', () => {
    expect(
      isSubmitIdeaDraftEmpty({
        form: getSubmitIdeaFormDefaults('idea'),
        showCreateObjective: false,
        newObjectiveTitle: '',
      }),
    ).toBe(true);
  });

  it('detects non-empty title drafts', () => {
    expect(
      isSubmitIdeaDraftEmpty({
        form: { ...getSubmitIdeaFormDefaults('idea'), title: 'Need export' },
        showCreateObjective: false,
        newObjectiveTitle: '',
      }),
    ).toBe(false);
  });

  it('detects in-progress objective creation', () => {
    expect(
      isSubmitIdeaDraftEmpty({
        form: getSubmitIdeaFormDefaults('roadmap'),
        showCreateObjective: true,
        newObjectiveTitle: '',
      }),
    ).toBe(false);
  });
});
