'use client';

// Prototype-local Create Item modal — the production SubmitIdeaModal chrome (reused scss +
// IdeaFormFields) plus the two mutually-exclusive goal versions and the dev autosave draft flow
// ported from the gantry-saved-draft-item prototype ("Saving… / Saved" badge, "Resume draft",
// discard confirm). The author never rates — they either map objectives or write their reasoning;
// the impact score comes only from the community's boosts.

import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { ItemFormFields } from './ItemFormFields';
import { CheckIcon, CloseIcon } from '@/components/icons';
import type { SubmitIdeaFormData } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import { hasRichTextContent } from '@/components/page/gantry/ideas/SubmitIdeaModal/helpers';
import type { Option } from '@/components/form/FormSelect/types';
import type { GantryItemType, GantryStage } from '@/services/gantry/types';
import submitIdea from '@/components/page/gantry/ideas/SubmitIdeaModal/SubmitIdeaModal.module.scss';
import dealModal from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import type { ImpactLevel, MockRoadmapItem } from '../mocks';
import { createImpactItem, mockImpactObjectives } from '../mocks';
import type { GoalMode } from './impact';
import { ImpactControl } from './ImpactControl';
import s from './CreateItemModal.module.scss';

const STAGE_VALUES: GantryStage[] = ['IDEA', 'BACKLOG', 'PLANNED', 'IN_PROGRESS', 'SHIPPED', 'DECLINED'];
const TYPE_VALUES: GantryItemType[] = ['Bug Report', 'Enhancement Request', 'New Feature Request'];

const objectiveOptions: Option[] = mockImpactObjectives.map((o) => ({
  label: `O${o.order} - ${o.title}`,
  value: o.uid,
}));

const emptyForm: SubmitIdeaFormData = {
  title: '',
  description: '',
  stage: { label: 'Submitted', value: 'IDEA' },
  tags: [],
  type: null,
  objectives: [],
};

/** The autosaved draft: the form plus the author's reasoning (empty in the objectives version). */
export interface GantryDraft {
  form: SubmitIdeaFormData;
  authorReasoning: string;
  rating: ImpactLevel | null;
  updatedAtLabel: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

let createdSeq = 0;

function buildItem(form: SubmitIdeaFormData, authorReasoning: string, rating: ImpactLevel): MockRoadmapItem {
  createdSeq += 1;
  const stage = STAGE_VALUES.includes(form.stage?.value as GantryStage) ? (form.stage!.value as GantryStage) : 'IDEA';
  const type = TYPE_VALUES.includes(form.type?.value as GantryItemType) ? (form.type!.value as GantryItemType) : null;
  const selected = new Set((form.objectives ?? []).map((o) => o.value));

  return createImpactItem({
    uid: `created-${createdSeq}`,
    title: form.title.trim() || 'Untitled Gantry request',
    description: form.description,
    stage,
    tags: form.tags?.map((t) => t.value) ?? [],
    type,
    objectives: mockImpactObjectives
      .filter((o) => selected.has(o.uid))
      .map((o) => ({ uid: o.uid, order: o.order, title: o.title })),
    authorClaimNote: authorReasoning,
    authorRating: rating,
  });
}

function hasDraftContent(form: SubmitIdeaFormData, authorReasoning: string, rating: ImpactLevel | null): boolean {
  return (
    !!form.title.trim() ||
    hasRichTextContent(form.description) ||
    !!form.tags?.length ||
    !!form.type ||
    !!form.objectives?.length ||
    !!authorReasoning.trim() ||
    rating !== null
  );
}

interface Props {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onPublish: (item: MockRoadmapItem) => void;
  readonly draft: GantryDraft | null;
  readonly onDraftChange: (draft: GantryDraft | null) => void;
  /** Objectives version maps to objectives; reasoning version captures the author's free text. */
  readonly goalMode: GoalMode;
}

export function CreateItemModal({ isOpen, onClose, onPublish, draft, onDraftChange, goalMode }: Props) {
  const methods = useForm<SubmitIdeaFormData>({ defaultValues: draft?.form ?? emptyForm, mode: 'onChange' });
  const [authorReasoning, setAuthorReasoning] = useState<string>(draft?.authorReasoning ?? '');
  const [rating, setRating] = useState<ImpactLevel | null>(draft?.rating ?? null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

  const { reset, getValues } = methods;

  // Opening the modal resumes the draft (or a blank form).
  useEffect(() => {
    if (!isOpen) return;
    reset(draft?.form ?? emptyForm);
    setAuthorReasoning(draft?.authorReasoning ?? '');
    setRating(draft?.rating ?? null);
    setSaveStatus(draft ? 'saved' : 'idle');
    // Only re-init when the modal opens — not on every draft autosave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reset]);

  const watchedTitle = useWatch({ control: methods.control, name: 'title' }) ?? '';
  const watchedDescription = useWatch({ control: methods.control, name: 'description' }) ?? '';
  const watchedStage = useWatch({ control: methods.control, name: 'stage' });
  const watchedTags = useWatch({ control: methods.control, name: 'tags' });
  const watchedType = useWatch({ control: methods.control, name: 'type' });
  const watchedObjectives = useWatch({ control: methods.control, name: 'objectives' });

  const fingerprint = useMemo(
    () =>
      [
        watchedTitle,
        watchedDescription,
        watchedStage?.value ?? '',
        watchedTags?.map((t) => t.value).join(',') ?? '',
        watchedType?.value ?? '',
        watchedObjectives?.map((o) => o.value).join(',') ?? '',
        authorReasoning,
        rating ?? '',
      ].join('|'),
    [
      watchedTitle,
      watchedDescription,
      watchedStage,
      watchedTags,
      watchedType,
      watchedObjectives,
      authorReasoning,
      rating,
    ],
  );

  // Dev behavior: anything typed autosaves as the (single) draft after a short debounce.
  useEffect(() => {
    if (!isOpen) return;

    const form = getValues();
    if (!hasDraftContent(form, authorReasoning, rating)) {
      const statusTimer = window.setTimeout(() => setSaveStatus('idle'), 0);
      const clearTimer = window.setTimeout(() => onDraftChange(null), 450);
      return () => {
        window.clearTimeout(statusTimer);
        window.clearTimeout(clearTimer);
      };
    }

    const statusTimer = window.setTimeout(() => setSaveStatus('saving'), 0);
    const saveTimer = window.setTimeout(() => {
      onDraftChange({ form: getValues(), authorReasoning, rating, updatedAtLabel: 'just now' });
      setSaveStatus('saved');
    }, 650);

    return () => {
      window.clearTimeout(statusTimer);
      window.clearTimeout(saveTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint, isOpen, getValues]);

  // Title + the goal for this version + the author's own impact rating (their first boost).
  const goalOk = goalMode === 'objectives' ? (watchedObjectives?.length ?? 0) > 0 : authorReasoning.trim().length > 0;
  const canCreate = watchedTitle.trim().length > 0 && goalOk && rating !== null;
  const hasLiveContent = hasDraftContent(getValues(), authorReasoning, rating);

  const saveBadge =
    saveStatus === 'saving' ? (
      <Badge variant="default" className={s.statusBadge}>
        Saving…
      </Badge>
    ) : saveStatus === 'saved' && hasLiveContent ? (
      <Badge variant="success" className={clsx(s.statusBadge, s.statusSaved)}>
        <CheckIcon className={s.savedIcon} aria-hidden />
        Saved
      </Badge>
    ) : null;

  const publish = (form: SubmitIdeaFormData) => {
    // Keep the two states exclusive: the reasoning version never carries objectives, and vice versa.
    const reasoning = goalMode === 'reasoning' ? authorReasoning : '';
    const cleanForm = goalMode === 'reasoning' ? { ...form, objectives: [] } : form;
    const goalMissing = goalMode === 'objectives' ? !(form.objectives?.length ?? 0) : !reasoning.trim();
    if (!form.title.trim() || goalMissing || !rating) return;
    onPublish(buildItem(cleanForm, reasoning, rating));
    onDraftChange(null);
    reset(emptyForm);
    setAuthorReasoning('');
    setRating(null);
    onClose();
  };

  const confirmDiscard = () => {
    onDraftChange(null);
    reset(emptyForm);
    setAuthorReasoning('');
    setRating(null);
    setConfirmDiscardOpen(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} closeOnBackdropClick={false}>
        <div className={clsx(submitIdea.root, s.formModal)}>
          <div className={clsx(dealModal.header, s.formPad)}>
            <div className={dealModal.headerText}>
              <div className={s.modalTitleRow}>
                <h2 className={dealModal.title}>Create item</h2>
                {saveBadge}
              </div>
              <p className={dealModal.subtitle}>Add an item to the board and choose the stage it should start in.</p>
            </div>
            <button type="button" className={dealModal.closeButton} onClick={onClose} aria-label="Close">
              <CloseIcon width={20} height={20} color="#0a0c11" />
            </button>
          </div>

          <div className={dealModal.content}>
            <FormProvider {...methods}>
              {/* The goal + rating slot in right after the Description (before Tags/Type) — it's the
                  substantive "why + importance", not trailing metadata. Grouped so the rating reads
                  as "how important is THIS goal". It seeds the community score as the author's boost. */}
              <ItemFormFields>
                {goalMode === 'reasoning' ? (
                  <div className={s.impactField}>
                    <label className={s.impactLabel} htmlFor="author-reasoning">
                      Reasoning<span className={s.required}>*</span>
                    </label>
                    <textarea
                      id="author-reasoning"
                      className={s.rationale}
                      value={authorReasoning}
                      onChange={(e) => setAuthorReasoning(e.target.value)}
                      placeholder="What goal does this serve, and why does it matter?"
                      rows={3}
                      maxLength={500}
                    />
                    <span className={s.rationaleCount}>{authorReasoning.length} / 500</span>
                    <span className={s.subLabel}>
                      How important is it for this goal?<span className={s.required}>*</span>
                    </span>
                    <ImpactControl value={rating} onChange={setRating} label="Impact to goals" />
                  </div>
                ) : (
                  <>
                    <div className={submitIdea.objectiveField}>
                      <FormMultiSelect
                        name="objectives"
                        label="Objectives *"
                        placeholder="Select the objectives this contributes to..."
                        options={objectiveOptions}
                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                      />
                    </div>
                    <div className={s.impactField}>
                      <span className={s.impactLabel}>
                        How important is this for these objectives?<span className={s.required}>*</span>
                      </span>
                      <ImpactControl value={rating} onChange={setRating} label="Impact to goals" />
                    </div>
                  </>
                )}
              </ItemFormFields>
            </FormProvider>
          </div>

          <div className={clsx(dealModal.footer, s.formPad)}>
            <Button
              style="link"
              variant="error"
              onClick={() => setConfirmDiscardOpen(true)}
              disabled={!draft && !hasLiveContent}
            >
              Discard draft
            </Button>
            <div className={dealModal.footerActions}>
              <Button style="border" variant="neutral" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={methods.handleSubmit(publish)} disabled={!canCreate}>
                Create Item
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={confirmDiscardOpen} onClose={() => setConfirmDiscardOpen(false)} className={s.confirmContainer}>
        <div className={s.confirmRoot}>
          <h3 className={s.confirmTitle}>Discard draft?</h3>
          <p className={s.confirmText}>
            You&apos;ll lose &ldquo;{getValues().title.trim() || 'Untitled Gantry request'}&rdquo;. This can&apos;t be
            undone.
          </p>
          <div className={s.confirmActions}>
            <Button style="border" variant="neutral" onClick={() => setConfirmDiscardOpen(false)}>
              Keep draft
            </Button>
            <Button variant="error" onClick={confirmDiscard}>
              Discard draft
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
