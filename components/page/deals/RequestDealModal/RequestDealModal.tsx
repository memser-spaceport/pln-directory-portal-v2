'use client';

import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { FormField } from '@/components/form/FormField';
import { FormEditor } from '@/components/form/FormEditor/FormEditor';
import { useRequestDealModalStore } from '@/services/deals/store';
import { useRequestDeal } from '@/services/deals/hooks/useRequestDeal';
import { useDealsAnalytics } from '@/analytics/deals.analytics';
import { requestDealSchema, RequestDealFormData } from './helpers';

import s from './RequestDealModal.module.scss';

export function RequestDealModal() {
  const { open, actions } = useRequestDealModalStore();
  const { mutate, isPending } = useRequestDeal();
  const { trackRequestModalOpened, trackRequestModalClosed } = useDealsAnalytics();

  useEffect(() => {
    if (open) {
      trackRequestModalOpened();
    }
  }, [open, trackRequestModalOpened]);

  const methods = useForm<RequestDealFormData>({
    resolver: yupResolver(requestDealSchema) as any,
    defaultValues: {
      dealName: '',
      reason: '',
    },
    mode: 'onChange',
  });

  const {
    handleSubmit,
    reset,
    formState: { isValid },
  } = methods;

  const onClose = () => {
    trackRequestModalClosed();
    reset();
    actions.closeModal();
  };

  const onSubmit = (data: RequestDealFormData) => {
    mutate(
      { dealName: data.dealName, reason: data.reason },
      {
        onSuccess: () => {
          reset();
          actions.showSuccess();
        },
      },
    );
  };

  return (
    <Modal isOpen={open} onClose={onClose}>
      <div className={s.root}>
        <div className={s.header}>
          <div className={s.headerText}>
            <h2 className={s.title}>Request a Deal</h2>
            <p className={s.subtitle}>
              {"Tell us what deals your team needs. We'll prioritize sourcing based on founder demand."}
            </p>
          </div>
          <button type="button" className={s.closeButton} onClick={onClose}>
            <CloseIcon width={20} height={20} color="#0a0c11" />
          </button>
        </div>

        <div className={s.content}>
          <FormProvider {...methods}>
            <div className={s.form}>
              <FormField
                name="dealName"
                label="What deal are you looking for?"
                placeholder="e.g. Vercel credits, Stripe discount, AI tools, analytics tools"
                isRequired
              />

              <FormEditor
                name="reason"
                label="Why would this be useful?"
                placeholder="Describe how your team (or others) would benefit"
                description="Max. 600 characters."
                maxLength={600}
                showCharCount
                isRequired
                simplified
              />
            </div>
          </FormProvider>
        </div>

        <div className={s.footer}>
          <Button style="border" variant="neutral" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={!isValid || isPending}>
            {isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
