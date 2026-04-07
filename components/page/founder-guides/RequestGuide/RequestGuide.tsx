'use client';

import { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';

import { useFounderGuidesAnalytics } from '@/analytics/founder-guides.analytics';
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
  const {
    trackRequestGuidePageViewed,
    trackRequestGuideFormFieldEdited,
    trackRequestGuideSubmitted,
    trackRequestGuideCancelled,
  } = useFounderGuidesAnalytics();
  const pageViewedRef = useRef(false);
  const fieldEditedTrackedRef = useRef({ title: false, description: false });

  const methods = useForm<RequestGuideForm>({
    defaultValues,
    // eslint-disable-next-line
    resolver: yupResolver(requestGuideSchema) as any,
  });

  const {
    handleSubmit,
    formState: { dirtyFields },
  } = methods;

  useEffect(() => {
    if (pageViewedRef.current) return;
    pageViewedRef.current = true;
    trackRequestGuidePageViewed();
  }, [trackRequestGuidePageViewed]);

  useEffect(() => {
    if (dirtyFields.title && !fieldEditedTrackedRef.current.title) {
      fieldEditedTrackedRef.current.title = true;
      trackRequestGuideFormFieldEdited({ field: 'title' });
    }
    if (dirtyFields.description && !fieldEditedTrackedRef.current.description) {
      fieldEditedTrackedRef.current.description = true;
      trackRequestGuideFormFieldEdited({ field: 'description' });
    }
  }, [dirtyFields, trackRequestGuideFormFieldEdited]);

  const onSubmit = (data: RequestGuideForm) => {
    mutate(data, {
      onSuccess: (ok) => {
        if (ok) {
          trackRequestGuideSubmitted({
            titleLength: data.title.trim().length,
            descriptionLength: (data.description ?? '').trim().length,
          });
          setSuccessTopic(data.title);
        }
      },
    });
  };

  const handleCancel = () => {
    trackRequestGuideCancelled();
    router.push('/founder-guides');
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
            Tell us what topic you would like us to cover. We will review requests and prioritize based on demand.
          </p>
        </div>

        <FormProvider {...methods}>
          <form className={s.form} onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField
              name="title"
              label="Topic"
              placeholder="Enter the topic (e.g. Token vesting schedules, SAFE vs equity, hiring first engineer)"
              isRequired
              max={100}
              maxLength={100}
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
              <button type="button" className={s.cancelBtn} onClick={handleCancel} disabled={isPending}>
                Cancel
              </button>
              <button type="submit" className={s.submitBtn} disabled={isPending}>
                {isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>

      {successTopic !== null && <RequestGuideSuccessModal isOpen topic={successTopic} onClose={handleCloseSuccess} />}
    </div>
  );
}
