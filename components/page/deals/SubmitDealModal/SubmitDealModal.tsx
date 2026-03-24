'use client';

import dynamic from 'next/dynamic';
import { Controller, FormProvider, useForm, useFormContext } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { CloseIcon } from '@/components/icons';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';
import { useSubmitDealModalStore } from '@/services/deals/store';
import { useSubmitDeal } from '@/services/deals/hooks/useSubmitDeal';
import { DEAL_AUDIENCE_LABELS } from '@/services/deals/constants';
import { submitDealSchema, SubmitDealFormData } from './helpers';

import s from './SubmitDealModal.module.scss';

const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor/RichTextEditor'), { ssr: false });

const TOOLBAR_CONFIG = [
  ['bold', 'italic', 'strike'],
  ['mention', 'link'],
  [{ list: 'bullet' }, { list: 'ordered' }],
  ['code-block', 'image'],
];

const AUDIENCE_OPTIONS = Object.entries(DEAL_AUDIENCE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

function RichTextField({
  name,
  label,
  placeholder,
  helperText,
}: {
  name: 'fullDescription' | 'redemptionInstructions';
  label: string;
  placeholder: string;
  helperText: string;
}) {
  const { control } = useFormContext<SubmitDealFormData>();

  return (
    <div className={s.fieldGroup}>
      <div className={s.fieldLabel}>
        {label} <span className={s.required}>*</span>
      </div>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <RichTextEditor
            value={field.value || ''}
            onChange={field.onChange}
            placeholder={placeholder}
            toolbarConfig={TOOLBAR_CONFIG}
            enableMentions={false}
            errorMessage={fieldState.error?.message}
          />
        )}
      />
      <span className={s.helperText}>{helperText}</span>
    </div>
  );
}

export function SubmitDealModal() {
  const { open, actions } = useSubmitDealModalStore();
  const { mutate, isPending } = useSubmitDeal();

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
            <h2 className={s.title}>Submit a Deal</h2>
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

              <RichTextField
                name="fullDescription"
                label="Full Deal Description"
                placeholder="Explain the full details of the deal.&#10;Include eligibility, limits, and terms if known."
                helperText="Max 600 characters."
              />

              <RichTextField
                name="redemptionInstructions"
                label="Redemption instructions"
                placeholder="Explain how founders can redeem the deal."
                helperText="Max 600 characters."
              />

              {/*<FormField name="websiteUrl" label="Website URL" placeholder="https://example.com" isRequired />*/}

              <FormField
                name="contact"
                label="How to reach out to you"
                placeholder="Enter email, Telegram handle, etc."
                isRequired
                max={200}
                description="In case our team has questions about this deal before publishing it."
              />
            </div>
          </FormProvider>
        </div>

        <div className={s.footer}>
          <Button style="border" onClick={onClose}>
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
