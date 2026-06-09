'use client';

import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { IdeaFormFields } from '@/components/page/gantry/shared/IdeaFormFields';
import { useSubmitIdeaModalStore } from '@/services/gantry/store';
import { useCreateGantryItem } from '@/services/gantry/hooks/useCreateGantryItem';
import { useGantryAccess } from '@/services/rbac/hooks/useGantryAccess';
import type { GantryStage } from '@/services/gantry/types';
import {
  getSubmitIdeaFormDefaults,
  SUBMIT_IDEA_MODAL_COPY,
} from '@/services/gantry/submitIdeaModal';
import { useGantryAnalytics } from '@/analytics/gantry.analytics';
import { submitIdeaSchema, hasRichTextContent, type SubmitIdeaFormData } from './helpers';
import dealModalStyles from '@/components/page/deals/SubmitDealModal/SubmitDealModal.module.scss';
import s from './SubmitIdeaModal.module.scss';

export function SubmitIdeaModal() {
  const router = useRouter();
  const analytics = useGantryAnalytics();
  const { open, variant, actions } = useSubmitIdeaModalStore();
  const copy = SUBMIT_IDEA_MODAL_COPY[variant];
  const { mutate, isPending } = useCreateGantryItem();
  const { canCurate, canTransition } = useGantryAccess();
  const canSetStageOnCreate = canCurate || canTransition;

  const methods = useForm<SubmitIdeaFormData>({
    resolver: yupResolver(submitIdeaSchema) as any,
    defaultValues: getSubmitIdeaFormDefaults('idea'),
    mode: 'onChange',
  });

  const {
    handleSubmit,
    reset,
    formState: { isValid },
  } = methods;

  useEffect(() => {
    if (open) {
      reset(getSubmitIdeaFormDefaults(variant));
    }
  }, [open, variant, reset]);

  const onClose = () => {
    reset(getSubmitIdeaFormDefaults('idea'));
    actions.closeModal();
  };

  const onSubmit = (data: SubmitIdeaFormData) => {
    const stageValue = data.stage?.value as GantryStage | undefined;

    const tags = data.tags?.map((o) => o.value) ?? [];

    mutate(
      {
        title: data.title.trim(),
        description: hasRichTextContent(data.description) ? data.description : '',
        externalTrackerUrl: null,
        tags,
        ...(canSetStageOnCreate && stageValue ? { stage: stageValue } : {}),
      },
      {
        onSuccess: (created) => {
          analytics.onIdeaCreated(created.uid, tags);
          reset(getSubmitIdeaFormDefaults('idea'));
          actions.closeModal();
          router.push(`/gantry/${created.uid}`);
        },
      },
    );
  };

  return (
    <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false}>
      <div className={s.root}>
        <div className={dealModalStyles.header}>
          <div className={dealModalStyles.headerText}>
            <h2 className={dealModalStyles.title}>{copy.title}</h2>
            <p className={dealModalStyles.subtitle}>{copy.subtitle}</p>
          </div>
          <button type="button" className={dealModalStyles.closeButton} onClick={onClose} aria-label="Close">
            <CloseIcon width={20} height={20} color="#0a0c11" />
          </button>
        </div>

        <div className={dealModalStyles.content}>
          <FormProvider {...methods}>
            <IdeaFormFields canSetStageOnCreate={canSetStageOnCreate} />
          </FormProvider>
        </div>

        <div className={dealModalStyles.footer}>
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
  );
}
