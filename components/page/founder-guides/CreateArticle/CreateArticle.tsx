'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormField } from '@/components/form/FormField';
import { FormTextArea } from '@/components/form/FormTextArea';
import { FormSelect } from '@/components/form/FormSelect';
import { FormEditor } from '@/components/form/FormEditor';
import { UnsavedChangesPrompt } from '@/components/core/UnsavedChangesPrompt';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import useBlockNavigation from '@/hooks/useUnsavedChangesWarning';
import { useCreateArticleMutation } from '@/services/articles/hooks/useCreateArticleMutation';
import { ARTICLE_CATEGORIES } from '@/services/articles/constants';
import { AuthorAutocomplete } from './AuthorAutocomplete';
import { createArticleSchema, CreateArticleForm } from './helpers';
import s from './CreateArticle.module.scss';

export default function CreateArticle() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateArticleMutation();

  useMobileNavVisibility(true);

  const categoryOptions = useMemo(() => ARTICLE_CATEGORIES.map((c) => ({ label: c, value: c })), []);

  const methods = useForm<CreateArticleForm>({
    // @ts-ignore
    defaultValues: {
      category: null,
      title: '',
      summary: '',
      readingTime: null,
      content: '',
      author: null,
      officeHoursUrl: '',
    },
    // @ts-ignore
    resolver: yupResolver(createArticleSchema),
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = methods;

  const { isAttemptingNavigation, proceedNavigation, cancelNavigation } = useBlockNavigation(isDirty);

  const handleCancel = () => {
    router.push('/founder-guides');
  };

  const onSubmit = async (data: any) => {
    const author = data.author as CreateArticleForm['author'];
    const result = await mutateAsync({
      title: data.title,
      summary: data.summary || undefined,
      category: data.category?.value,
      readingTime: data.readingTime || undefined,
      content: data.content,
      authorMemberUid: author?.type === 'member' ? author.value : undefined,
      authorTeamUid: author?.type === 'team' ? author.value : undefined,
      officeHoursUrl: data.officeHoursUrl || undefined,
      status: 'PUBLISHED',
    });

    if (result) {
      reset(data);
      setTimeout(() => {
        router.push('/founder-guides');
      }, 500);
    }
  };

  return (
    <>
      <div className={s.root}>
        <FormProvider {...methods}>
          <form className={s.form} noValidate onSubmit={handleSubmit(onSubmit)}>
            <div className={s.heading}>
              <div className={s.headingText}>
                <h1 className={s.title}>Create New Guide</h1>
                <p className={s.subtitle}>Structured, expert-driven guides for startup founders.</p>
              </div>
            </div>

            <div className={s.section}>
              <div className={s.sectionDivider}>CONTENT</div>

              <FormSelect name="category" placeholder="Select category" label="Category" options={categoryOptions} />

              <FormField
                name="title"
                placeholder="Enter the title (e.g. Token vesting schedules, SAFE vs equity, hiring first engineer)"
                label="Guide Title"
              />

              <FormField
                name="summary"
                placeholder="A short overview of what this guide helps with"
                label="Summary"
                max={100}
              />

              <FormField name="readingTime" placeholder="e.g. 5" label="Reading Time (minutes)" />

              <FormTextArea
                name="content"
                placeholder="Write the guide content. Focus on clear, practical advice founders can apply."
                label="Content"
                showCharCount
                rows={16}
              />
            </div>

            <div className={s.section}>
              <div className={s.sectionDivider}>AUTHOR</div>

              <AuthorAutocomplete />

              <FormField
                name="officeHoursUrl"
                placeholder="Enter Office Hours link"
                label="Office Hours"
                description="Drop your calendar link here so others can get in touch with you at a time that is convenient."
              />
            </div>

            <div className={s.buttons}>
              <button type="button" className={s.cancelBtn} onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className={s.submitBtn} disabled={isSubmitting || isPending}>
                {isSubmitting || isPending ? 'Publishing...' : 'Publish Guide'}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
      <UnsavedChangesPrompt show={isAttemptingNavigation} onConfirm={proceedNavigation} onCancel={cancelNavigation} />
    </>
  );
}
