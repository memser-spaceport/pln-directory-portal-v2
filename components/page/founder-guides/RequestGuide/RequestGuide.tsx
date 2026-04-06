'use client';

import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';

import { FormField } from '@/components/form/FormField/FormField';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { useRequestGuideMutation } from '@/services/guide-requests/hooks/useRequestGuideMutation';
import RequestGuideSuccessModal from './RequestGuideSuccessModal/RequestGuideSuccessModal';
import { defaultValues, RequestGuideForm, requestGuideSchema } from './helpers';
import s from './RequestGuide.module.scss';

export default function RequestGuide() {
  const router = useRouter();
  const [successTopic, setSuccessTopic] = useState<string | null>(null);
  const { mutate, isPending } = useRequestGuideMutation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const methods = useForm<RequestGuideForm>({
    defaultValues,
    resolver: yupResolver(requestGuideSchema) as any,
  });

  const { handleSubmit } = methods;

  const onSubmit = (data: RequestGuideForm) => {
    mutate(data, {
      onSuccess: (ok) => {
        if (ok) {
          setSuccessTopic(data.topic);
        }
      },
    });
  };

  const handleCloseSuccess = () => {
    router.push('/founder-guides');
  };

  return (
    <div className={s.root}>
      <div className={s.page}>
        <div className={s.heading}>
          <h1 className={s.title}>Request a Guide</h1>
          <p className={s.subtitle}>
            Tell us what topic you would like us to cover. We will review requests and prioritize
            based on demand.
          </p>
        </div>

        <FormProvider {...methods}>
          <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField
              name="topic"
              label="Topic"
              placeholder="Enter the topic (e.g. Token vesting schedules, SAFE vs equity, hiring first engineer)"
              isRequired
              max={100}
              description="Max. 100 characters."
            />

            <FormTextArea
              name="description"
              label="What would you like this guide to help with?"
              placeholder="What are you trying to figure out? Share your questions or the situation you're facing — this helps us create a more useful guide."
              rows={8}
              maxLength={600}
              showCharCount
              description="Max 600 characters."
            />

            <div className={s.buttons}>
              <button
                type="button"
                className={s.cancelBtn}
                onClick={() => router.push('/founder-guides')}
                disabled={isPending}
              >
                Cancel
              </button>
              <button type="submit" className={s.submitBtn} disabled={isPending}>
                {isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>

      {successTopic !== null && (
        <RequestGuideSuccessModal isOpen topic={successTopic} onClose={handleCloseSuccess} />
      )}
    </div>
  );
}
