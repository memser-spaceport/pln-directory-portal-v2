'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import { FormEditor } from '@/components/form/FormEditor/FormEditor';
import { useSubmitDealModalStore } from '@/services/deals/store';
import { useSubmitDeal } from '@/services/deals/hooks/useSubmitDeal';
import { useDealsAnalytics } from '@/analytics/deals.analytics';
import { DEAL_AUDIENCE_LABELS } from '@/services/deals/constants';
import { submitDealSchema, SubmitDealFormData } from './helpers';

import s from './SubmitDealModal.module.scss';

const AUDIENCE_OPTIONS = Object.entries(DEAL_AUDIENCE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function SubmitDealModal() {
  const { open, actions } = useSubmitDealModalStore();
  const { mutate, isPending } = useSubmitDeal();
  const { trackSubmitModalClosed } = useDealsAnalytics();

  const methods = useForm<SubmitDealFormData>({
    resolver: yupResolver(submitDealSchema) as any,
    defaultValues: {
      // vendorName: '',
      // category: '',
      // audience: null,
      shortDescription: '',
      fullDescription: '',
      redemptionInstructions: '',
      // websiteUrl: '',
      contact: '',
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
    mutate(
      {
        // vendorName: data.vendorName,
        // category: data.category,
        // audience: data.audience?.label || '',
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        redemptionInstructions: data.redemptionInstructions,
        // websiteUrl: data.websiteUrl,
        contact: data.contact,
      },
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
              {/*<FormField*/}
              {/*  name="vendorName"*/}
              {/*  label="Vendor Name"*/}
              {/*  placeholder="e.g. Stripe, Vercel, AWS"*/}
              {/*  isRequired*/}
              {/*  max={100}*/}
              {/*/>*/}

              {/*<FormField*/}
              {/*  name="category"*/}
              {/*  label="Category"*/}
              {/*  placeholder="e.g. Payments, Hosting & Infrastructure, Cloud"*/}
              {/*  isRequired*/}
              {/*/>*/}

              {/*<FormSelect*/}
              {/*  name="audience"*/}
              {/*  label="Audience"*/}
              {/*  placeholder="Select target audience"*/}
              {/*  options={AUDIENCE_OPTIONS}*/}
              {/*  isRequired*/}
              {/*/>*/}

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

              {/*<FormField name="websiteUrl" label="Website URL" placeholder="https://example.com" isRequired />*/}

              <FormField
                name="contact"
                label="How to reach out to you"
                placeholder="Enter email, Telegram handle, etc."
                isRequired
                max={200}
                description="In case our team has questions about this deal before publishing it."
                descriptionPosition="top"
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
