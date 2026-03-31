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
import { useAllMembers } from '@/services/members/hooks/useAllMembers';
import { useGetArticles } from '@/services/articles/hooks/useGetArticles';
import { useCreateArticleMutation } from '@/services/articles/hooks/useCreateArticleMutation';
import { createArticleSchema, CreateArticleForm } from './helpers';
import s from './CreateArticle.module.scss';

export default function CreateArticle() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateArticleMutation();
  const { byCategory } = useGetArticles();
  const { data: allMembers } = useAllMembers();

  useMobileNavVisibility(true);

  const categoryOptions = useMemo(
    () => byCategory.map((c) => ({ label: c.category, value: c.category })),
    [byCategory],
  );

  // TODO: extend to include teams once a useAllTeams hook is available
  const authorOptions = useMemo(() => {
    return (
      allMembers?.data?.map((item: { name: string; uid: string }) => ({
        label: item.name,
        value: item.uid.toString(),
      })) ?? []
    );
  }, [allMembers]);

  const methods = useForm<CreateArticleForm>({
    // @ts-ignore
    defaultValues: {
      category: null,
      title: '',
      summary: '',
      content: '',
      author: null,
      officeHoursUrl: '',
    },
    // @ts-ignore
    resolver: yupResolver(createArticleSchema),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = methods;

  const { isAttemptingNavigation, proceedNavigation, cancelNavigation } = useBlockNavigation(isDirty);

  const handleCancel = () => {
    router.push('/founder-guides');
  };

  const onSubmit = async (data: any) => {
    const result = await mutateAsync({
      title: data.title,
      summary: data.summary || undefined,
      category: data.category!.value,
      content: data.content,
      authorMemberUid: data.author?.value,
      officeHoursUrl: data.officeHoursUrl || undefined,
      status: 'PUBLISHED',
    });

    if (result) {
      router.push('/founder-guides');
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
                <p className={s.subtitle}>
                  Structured, expert-driven guides for startup founders.
                  <br />
                  No noise — just the knowledge you need to build.
                </p>
              </div>
            </div>

            <div className={s.section}>
              <div className={s.sectionDivider}>CONTENT</div>

              <FormSelect
                name="category"
                placeholder="Select category"
                label="Category"
                options={categoryOptions}
                isRequired
              />

              <FormField
                name="title"
                placeholder="Enter the title (e.g. Token vesting schedules, SAFE vs equity, hiring first engineer)"
                label="Guide Title"
                max={255}
                isRequired
              />

              <FormTextArea
                name="summary"
                placeholder="A short overview of what this guide helps with"
                label="Summary"
                rows={3}
                maxLength={100}
                showCharCount
              />

              <FormEditor
                name="content"
                placeholder="Write the guide content. Focus on clear, practical advice founders can apply."
                label="Content"
                isRequired
                maxLength={600}
                showCharCount
              />
            </div>

            <div className={s.section}>
              <div className={s.sectionDivider}>AUTHOR</div>

              <FormSelect
                name="author"
                placeholder="Search by name"
                label="Select Member or Team"
                options={authorOptions}
                isRequired
              />

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
