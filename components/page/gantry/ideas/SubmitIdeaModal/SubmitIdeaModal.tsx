'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useQueryStates } from 'nuqs';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { FormMultiSelect } from '@/components/form/FormMultiSelect';
import { IdeaFormFields } from '@/components/page/gantry/shared/IdeaFormFields';
import { useSubmitIdeaModalStore } from '@/services/gantry/store';
import { useCreateGantryItem } from '@/services/gantry/hooks/useCreateGantryItem';
import { useGantryAccess } from '@/services/rbac/hooks/useGantryAccess';
import { assignGantryItemObjectives } from '@/services/gantry/gantry.service';
import type { GantryItemType, GantryObjective, GantryStage } from '@/services/gantry/types';
import { getSubmitIdeaFormDefaults, SUBMIT_IDEA_MODAL_COPY } from '@/services/gantry/submitIdeaModal';
import { GANTRY_IMPACT_UI_ENABLED } from '@/utils/feature-flags';
import {
  useGantryDiscardDraftMutation,
  useGantryDraftQuery,
  useGantrySaveDraftMutation,
} from '@/services/gantry/hooks/useGantryDraft';
import { useGantryAnalytics } from '@/analytics/gantry.analytics';
import { gantryDashboardParsers } from '@/app/gantry/dashboard/searchParams';
import {
  submitIdeaSchema,
  hasRichTextContent,
  isSubmitIdeaDraftEmpty,
  type SubmitIdeaDraft,
  type SubmitIdeaFormData,
} from './helpers';
import { DraftSaveStatus } from './DraftSaveStatus';
import { DiscardDraftDialog } from '../DiscardDraftDialog';
import dealModalStyles from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import s from './SubmitIdeaModal.module.scss';

const SAVE_DEBOUNCE_MS = 500;

interface Props {
  readonly objectives?: GantryObjective[];
}

export function SubmitIdeaModal({ objectives = [] }: Props) {
  const [, setDashboardParams] = useQueryStates(gantryDashboardParsers, {
    history: 'push',
    shallow: true,
  });
  const analytics = useGantryAnalytics();
  const { open, variant, actions } = useSubmitIdeaModalStore();
  const copy = SUBMIT_IDEA_MODAL_COPY[variant];
  const { mutate, isPending } = useCreateGantryItem();
  const { canCurate, canTransition } = useGantryAccess();
  const canSetStageOnCreate = canCurate || canTransition;
  const objectiveOptions = objectives.map((o) => ({ label: `O${o.order} · ${o.title}`, value: o.uid }));

  const [showCreateObjective, setShowCreateObjective] = useState(false);
  const [newObjectiveTitle, setNewObjectiveTitle] = useState('');
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const { data: draftResult } = useGantryDraftQuery(variant);
  const saveDraftMutation = useGantrySaveDraftMutation(variant);
  const discardDraftMutation = useGantryDiscardDraftMutation(variant);

  const hasDraft = !!draftResult && !isSubmitIdeaDraftEmpty(draftResult.data);

  const saveStatus = saveDraftMutation.isPending ? 'saving' : saveDraftMutation.isSuccess ? 'saved' : 'idle';

  const methods = useForm<SubmitIdeaFormData>({
    resolver: yupResolver(submitIdeaSchema) as any,
    defaultValues: getSubmitIdeaFormDefaults(variant),
    mode: 'onChange',
    // Impact / reasoning are optional on create; context keeps the yup `.when` hooks inert.
    context: { impactRequired: false, reasoningRequired: false },
  });

  const {
    handleSubmit,
    reset,
    getValues,
    control,
    formState: { isValid },
  } = methods;

  const values = useWatch({ control });
  const skipSaveRef = useRef(true);

  // Restore draft when modal opens
  useEffect(() => {
    if (!open) {
      skipSaveRef.current = true;
      return;
    }
    skipSaveRef.current = true;
    if (draftResult && !isSubmitIdeaDraftEmpty(draftResult.data)) {
      const form = {
        ...draftResult.data.form,
        objectives: (draftResult.data.form.objectives ?? []).map((opt) => {
          const match = objectives.find((o) => o.uid === opt.value);
          return match ? { label: `O${match.order} · ${match.title}`, value: match.uid } : opt;
        }),
      };
      reset(form);
      setShowCreateObjective(draftResult.data.showCreateObjective ?? false);
      setNewObjectiveTitle(draftResult.data.newObjectiveTitle ?? '');
    } else {
      reset(getSubmitIdeaFormDefaults(variant));
      setShowCreateObjective(false);
      setNewObjectiveTitle('');
    }
    const id = window.setTimeout(() => {
      skipSaveRef.current = false;
    }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, variant]);

  // Autosave draft while modal is open. Impact fields are deliberately NOT persisted:
  // the drafts API's field mapping (ApiGantryDraftPayload) has no slots for them, so a
  // round-trip would silently drop them — and a rating-only draft must not count as content.
  const toDraft = useCallback((): SubmitIdeaDraft => {
    const { impact: _impact, impactReasoning: _impactReasoning, ...form } = getValues();
    return { form, showCreateObjective, newObjectiveTitle };
  }, [getValues, showCreateObjective, newObjectiveTitle]);

  useEffect(() => {
    if (!open || skipSaveRef.current) return;
    const id = window.setTimeout(() => {
      const draft = toDraft();
      if (isSubmitIdeaDraftEmpty(draft)) {
        discardDraftMutation.mutate();
      } else {
        saveDraftMutation.mutate(draft);
      }
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, values, showCreateObjective, newObjectiveTitle]);

  const onClose = () => {
    actions.closeModal();
  };

  const handleDiscardFromModal = () => {
    setDiscardDialogOpen(true);
  };

  const handleConfirmDiscard = () => {
    discardDraftMutation.mutate();
    setDiscardDialogOpen(false);
    reset(getSubmitIdeaFormDefaults(variant));
    setShowCreateObjective(false);
    setNewObjectiveTitle('');
    actions.closeModal();
  };

  const onSubmit = (data: SubmitIdeaFormData) => {
    const stageValue = data.stage?.value as GantryStage | undefined;
    const tags = data.tags?.map((o) => o.value) ?? [];
    const itemType = data.type?.value as GantryItemType | undefined;

    const reasoning = data.impactReasoning?.trim();
    mutate(
      {
        title: data.title.trim(),
        description: hasRichTextContent(data.description) ? data.description : '',
        externalTrackerUrl: null,
        tags,
        ...(itemType ? { type: itemType } : {}),
        ...(canSetStageOnCreate && stageValue ? { stage: stageValue } : {}),
        ...(GANTRY_IMPACT_UI_ENABLED && data.impact != null ? { authorImpact: data.impact } : {}),
        ...(GANTRY_IMPACT_UI_ENABLED && reasoning ? { authorImpactReasoning: reasoning } : {}),
      },
      {
        onSuccess: async (created) => {
          const pendingTitle = newObjectiveTitle.trim();
          const objectiveUids = data.objectives?.map((o) => o.value) ?? [];
          if (pendingTitle || objectiveUids.length > 0) {
            try {
              await assignGantryItemObjectives(created.uid, {
                objectiveUids,
                ...(pendingTitle ? { titles: [pendingTitle] } : {}),
              });
            } catch {
              // non-fatal
            }
          }
          analytics.onIdeaCreated(created.uid, tags, itemType, data.impact ?? undefined);
          discardDraftMutation.mutate();
          reset(getSubmitIdeaFormDefaults('idea'));
          setShowCreateObjective(false);
          setNewObjectiveTitle('');
          actions.closeModal();
          void setDashboardParams({ itemId: created.uid });
        },
      },
    );
  };

  return (
    <>
      <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false}>
        <div className={s.root}>
          <div className={dealModalStyles.header}>
            <div className={dealModalStyles.headerText}>
              <div className={s.titleRow}>
                <h2 className={dealModalStyles.title}>{copy.title}</h2>
                <DraftSaveStatus status={saveStatus} />
              </div>
              <p className={dealModalStyles.subtitle}>{copy.subtitle}</p>
            </div>
            <button type="button" className={dealModalStyles.closeButton} onClick={onClose} aria-label="Close">
              <CloseIcon width={20} height={20} color="#0a0c11" />
            </button>
          </div>

          <div className={dealModalStyles.content}>
            <FormProvider {...methods}>
              <IdeaFormFields
                canSetStageOnCreate={canSetStageOnCreate}
                showImpact={GANTRY_IMPACT_UI_ENABLED}
                showReasoning={!canCurate}
                impactRequired={false}
                requireReasoning={false}
              />
              {canCurate && (
                <div className={s.objectiveField}>
                  <FormMultiSelect
                    name="objectives"
                    label="Objectives"
                    placeholder="Select objectives..."
                    options={objectiveOptions}
                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                  />
                  {!showCreateObjective ? (
                    <button
                      type="button"
                      className={s.objectiveCreateBtn}
                      onClick={() => {
                        setShowCreateObjective(true);
                      }}
                    >
                      + New objective
                    </button>
                  ) : (
                    <div className={s.objectiveCreateForm}>
                      <input
                        className={s.objectiveCreateInput}
                        value={newObjectiveTitle}
                        onChange={(e) => setNewObjectiveTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setShowCreateObjective(false);
                            setNewObjectiveTitle('');
                          }
                        }}
                        placeholder="Objective title..."
                        maxLength={150}
                        autoFocus
                      />
                      <div className={s.objectiveCreateMeta}>
                        <span className={s.objectiveCharCount}>{newObjectiveTitle.length}/150</span>
                        <button
                          type="button"
                          className={s.objectiveCancelBtn}
                          onClick={() => {
                            setShowCreateObjective(false);
                            setNewObjectiveTitle('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </FormProvider>
          </div>

          <div className={dealModalStyles.footer}>
            {hasDraft && (
              <button type="button" className={s.discardDraftLink} onClick={handleDiscardFromModal}>
                Discard draft
              </button>
            )}
            {copy.footerNote ? (
              <>
                <p className={dealModalStyles.footerNote}>{copy.footerNote}</p>
                <div className={dealModalStyles.footerActions}>
                  <Button style="link" variant="secondary" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit(onSubmit)} disabled={!isValid || isPending}>
                    {isPending ? copy.submittingLabel : copy.submitLabel}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button style="border" variant="neutral" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit(onSubmit)} disabled={!isValid || isPending}>
                  {isPending ? copy.submittingLabel : copy.submitLabel}
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>

      <DiscardDraftDialog
        isOpen={discardDialogOpen}
        draftTitle={draftResult?.data.form.title ?? ''}
        onKeep={() => setDiscardDialogOpen(false)}
        onDiscard={handleConfirmDiscard}
      />
    </>
  );
}
