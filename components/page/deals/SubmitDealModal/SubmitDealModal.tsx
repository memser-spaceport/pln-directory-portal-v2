'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { FormField } from '@/components/form/FormField';
import { FormEditor } from '@/components/form/FormEditor/FormEditor';
import { useSubmitDealModalStore } from '@/services/deals/store';
import { useSubmitDeal } from '@/services/deals/hooks/useSubmitDeal';
import { useDealsAnalytics } from '@/analytics/deals.analytics';
import { submitDealSchema, SubmitDealFormData } from './helpers';

import s from './SubmitDealModal.module.scss';

export function SubmitDealModal() {
  const { open, isPublicContext, actions } = useSubmitDealModalStore();
  const { mutate, isPending } = useSubmitDeal(isPublicContext);
  const { trackSubmitModalClosed } = useDealsAnalytics();

  const methods = useForm<SubmitDealFormData>({
    resolver: yupResolver(submitDealSchema(isPublicContext)) as any,
    defaultValues: {
      vendorName: '',
      shortDescription: '',
      fullDescription: '',
      redemptionInstructions: '',
      howToReachOutToYou: '',
    },
    mode: 'onChange',
  });

  const {
    handleSubmit,
    reset,
    formState: { isValid },
  } = methods;

  const onClose = () => {
    trackSubmitModalClosed();
    reset();
    actions.closeModal();
  };

  const onSubmit = (data: SubmitDealFormData) => {
    const payload: any = {
      shortDescription: data.shortDescription,
      fullDescription: data.fullDescription,
      redemptionInstructions: data.redemptionInstructions,
      howToReachOutToYou: data.howToReachOutToYou,
    };

    if (isPublicContext && data.vendorName) {
      payload.vendorName = data.vendorName;
    }

    mutate(payload, {
      onSuccess: () => {
        reset();
        actions.showSuccess();
      },
    });
  };

  return (
    <Modal isOpen={open} onClose={onClose} closeOnBackdropClick={false}>
      <div className={s.root}>
        <div className={s.header}>
          <div className={s.headerText}>
            <h2 className={s.title}>List your Product</h2>
            <p className={s.subtitle}>
              Suggest a deal for the Protocol Labs network. Our team will review it before publishing.
            </p>
          </div>
          <button type="button" className={s.closeButton} onClick={onClose}>
            <CloseIcon width={20} height={20} color="#0a0c11" />
          </button>
        </div>

        <div className={s.content}>
          <FormProvider {...methods}>
            <div className={s.form}>
              {isPublicContext && (
                <FormField
                  name="vendorName"
                  label="Vendor Name"
                  placeholder="e.g. Stripe, Vercel, AWS"
                  isRequired
                  max={100}
                />
              )}

              <FormField
                name="shortDescription"
                label="Short Description"
                placeholder="Enter short title describing the offer"
                isRequired
                max={100}
                description="Max. 100 characters."
              />

              <FormEditor
                name="fullDescription"
                label="Full Deal Description"
                placeholder={'Explain the full details of the deal.\nInclude eligibility, limits, and terms if known.'}
                description="Max. 600 characters."
                enableMentions={true}
                maxLength={600}
                showCharCount
                isRequired
                simplified
              />

              <FormEditor
                name="redemptionInstructions"
                label="Redemption instructions"
                placeholder={
                  'Explain how founders can redeem the deal.\nExample:\n1. Visit the signup link\n2. Create an account\n3. Enter the promo code during onboarding'
                }
                description="Max. 600 characters."
                enableMentions={true}
                maxLength={600}
                showCharCount
                isRequired
                minHeight={150}
                simplified
              />

              <FormField
                name="howToReachOutToYou"
                label="How to reach out to you"
                placeholder="Enter email, Telegram handle, etc."
                isRequired
                max={200}
                topDescription="In case our team has questions about this deal before publishing it."
                description="Max. 200 characters."
              />
            </div>
          </FormProvider>
        </div>

        <div className={s.footer}>
          <Button style="border" variant="neutral" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={!isValid || isPending}>
            {isPending ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
