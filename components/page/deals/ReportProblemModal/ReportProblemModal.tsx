'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { CloseIcon, WarningCircleIcon } from '@/components/icons';
import { useReportProblemModalStore } from '@/services/deals/store';
import { useReportDealIssue } from '@/services/deals/hooks/useReportDealIssue';
import { useDealsAnalytics } from '@/analytics/deals.analytics';

import s from './ReportProblemModal.module.scss';

const MAX_LENGTH = 600;

interface FormValues {
  description: string;
}

export function ReportProblemModal() {
  const { open, dealUid, actions } = useReportProblemModalStore();
  const { mutate, isPending } = useReportDealIssue(dealUid || '');
  const { trackReportProblemSubmitted } = useDealsAnalytics();

  const methods = useForm<FormValues>({ defaultValues: { description: '' } });
  const { handleSubmit, reset, watch } = methods;
  const isOverLimit = watch('description').length > MAX_LENGTH;

  const onClose = () => {
    reset();
    actions.closeModal();
  };

  const onSubmit = handleSubmit(({ description }) => {
    mutate(description.trim(), {
      onSuccess: () => {
        if (dealUid) {
          trackReportProblemSubmitted(dealUid);
        }
        onClose();
      },
    });
  });

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className={s.root}>
        <div className={s.content}>
          <div className={s.iconWrapper}>
            <WarningCircleIcon width={32} height={32} color="#1b4dff" />
          </div>
          <h2 className={s.title}>Report a problem</h2>
          <FormProvider {...methods}>
            <FormTextArea
              name="description"
              label="Describe the issue"
              placeholder="e.g. The redemption code is no longer valid, the link is broken, the offer terms have changed"
              maxLength={MAX_LENGTH}
              showCharCount
              rows={5}
            />
          </FormProvider>
        </div>
        <div className={s.footer}>
          <Button style="border" variant="neutral" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isPending || isOverLimit}>
            {isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
        <button type="button" className={s.closeButton} onClick={onClose}>
          <CloseIcon width={16} height={16} color="#0a0c11" />
        </button>
      </div>
    </Modal>
  );
}
