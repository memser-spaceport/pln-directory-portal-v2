'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FormProvider, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import 'md-editor-rt/lib/style.css';
import dynamic from 'next/dynamic';
import { FormField } from '@/components/form/FormField';
import { FormSelect } from '@/components/form/FormSelect';

const MdEditor = dynamic(() => import('md-editor-rt').then((mod) => mod.MdEditor), { ssr: false });
import { UnsavedChangesPrompt } from '@/components/core/UnsavedChangesPrompt';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import useBlockNavigation from '@/hooks/useUnsavedChangesWarning';
import { useMember } from '@/services/members/hooks/useMember';
import { useCreateArticleMutation } from '@/services/articles/hooks/useCreateArticleMutation';
import { useUpdateArticleMutation } from '@/services/articles/hooks/useUpdateArticleMutation';
import { ARTICLE_CATEGORIES } from '@/services/articles/constants';
import { IArticle } from '@/types/articles.types';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { AuthorAutocomplete } from './AuthorAutocomplete';
import { createArticleSchema, CreateArticleForm, articleToFormValues } from './helpers';
import s from './CreateArticle.module.scss';

interface CreateArticleProps {
  article?: IArticle;
  isEditMode?: boolean;
}

export default function CreateArticle({ article, isEditMode }: CreateArticleProps) {
  const router = useRouter();
  const { userInfo } = getCookiesFromClient();
  const createMutation = useCreateArticleMutation();
  const updateMutation = useUpdateArticleMutation();
  const { mutateAsync, isPending } = isEditMode ? updateMutation : createMutation;

  useMobileNavVisibility(true);

  const categoryOptions = useMemo(() => ARTICLE_CATEGORIES.map((c) => ({ label: c, value: c })), []);

  const defaultValues = useMemo(
    () =>
      isEditMode && article
        ? articleToFormValues(article)
        : {
            category: null,
            title: '',
            summary: '',
            readingTime: null,
            content: '',
            author: null,
            officeHours: '',
          },
    [isEditMode, article],
  );

  const methods = useForm<CreateArticleForm>({
    // @ts-ignore
    defaultValues,
    // @ts-ignore
    resolver: yupResolver(createArticleSchema),
  });

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, isDirty, errors },
  } = methods;

  const contentValue = watch('content');
  const author: CreateArticleForm['author'] = watch('author');
  const selectedMemberUid = author?.type === 'member' ? author.value : undefined;
  const { data: selectedMemberData } = useMember(selectedMemberUid);
  const memberOfficeHours = selectedMemberData?.memberInfo?.officeHours || null;

  const { isAttemptingNavigation, proceedNavigation, cancelNavigation } = useBlockNavigation(isDirty);

  const handleCancel = () => {
    if (isEditMode && article) {
      router.push(`/founder-guides/${article.slugURL}`);
    } else {
      router.push('/founder-guides');
    }
  };

  const onSubmit = async (data: any) => {
    const author = data.author as CreateArticleForm['author'];
    const payload = {
      title: data.title,
      summary: data.summary || undefined,
      category: data.category?.value,
      readingTime: data.readingTime || undefined,
      content: data.content,
      authorMemberUid: author?.type === 'member' ? author.value : undefined,
      authorTeamUid: author?.type === 'team' ? author.value : undefined,
      officeHours: author?.type === 'member' ? memberOfficeHours || undefined : data.officeHours || undefined,
      status: 'PUBLISHED' as const,
    };

    const result =
      isEditMode && article
        ? await mutateAsync({ uid: article.uid, ...payload } as any)
        : await mutateAsync(payload as any);

    if (result) {
      reset(data);
      const redirectUrl =
        isEditMode && article ? `/founder-guides/${result.slugURL || article.slugURL}` : '/founder-guides';
      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    }
  };

  return (
    <>
      <div className={s.mobileSubheader}>
        <button type="button" className={s.mobileCancel} onClick={handleCancel}>
          Cancel
        </button>
        <button
          type="submit"
          form="create-article-form"
          className={s.mobileSubmit}
          disabled={isSubmitting || isPending}
        >
          {isSubmitting || isPending
            ? isEditMode
              ? 'Saving...'
              : 'Publishing...'
            : isEditMode
              ? 'Save Changes'
              : 'Publish Guide'}
        </button>
      </div>
      <div className={s.root}>
        <FormProvider {...methods}>
          <form id="create-article-form" className={s.form} noValidate onSubmit={handleSubmit(onSubmit)}>
            <div className={s.heading}>
              <div className={s.headingText}>
                <h1 className={s.title}>{isEditMode ? 'Edit Guide' : 'Create New Guide'}</h1>
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
                description="Max. 100 characters."
              />

              <FormField name="readingTime" placeholder="e.g. 5" label="Number of Minutes to Read the Guide" />

              <div>
                <label className={s.editorLabel}>Content</label>
                <MdEditor
                  modelValue={contentValue || ''}
                  onChange={(val: string) => setValue('content', val, { shouldValidate: true, shouldDirty: true })}
                  language={'en-US'}
                  toolbarsExclude={['catalog', 'github', 'save', 'htmlPreview']}
                />
                {errors.content && <span className={s.editorError}>{errors.content.message as string}</span>}
              </div>
            </div>

            <div className={s.section}>
              <div className={s.sectionDivider}>AUTHOR</div>

              <AuthorAutocomplete />

              {author?.type === 'member' && memberOfficeHours && (
                <div className={s.officeHours}>
                  <div className={s.officeHoursLabelRow}>
                    <span className={s.officeHoursLabel}>Office Hours</span>
                    <span className={s.officeHoursPrefilled}>(Prefilled)</span>
                  </div>
                  <a href={memberOfficeHours} target="_blank" rel="noopener noreferrer" className={s.officeHoursInput}>
                    <span className={s.officeHoursValue}>{memberOfficeHours}</span>
                  </a>
                </div>
              )}

              {author?.type === 'member' && !memberOfficeHours && (
                <div className={s.officeHours}>
                  <span className={s.officeHoursLabel}>Office Hours</span>
                  <span className={s.officeHoursHint}>
                    No Office Hours set.{' '}
                    <Link href={`/members/${author.value}`} className={s.profileLink}>
                      Update your profile
                    </Link>{' '}
                    to add one.
                  </span>
                </div>
              )}

              {author?.type === 'team' && (
                <FormField
                  name="officeHours"
                  placeholder="Enter Office Hours link"
                  label="Office Hours"
                  description="Drop your calendar link here so others can get in touch with you at a time that is convenient."
                />
              )}
            </div>

            <div className={s.buttons}>
              <button type="button" className={s.cancelBtn} onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className={s.submitBtn} disabled={isSubmitting || isPending}>
                {isSubmitting || isPending
                  ? isEditMode
                    ? 'Saving...'
                    : 'Publishing...'
                  : isEditMode
                    ? 'Save Changes'
                    : 'Publish Guide'}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
      <UnsavedChangesPrompt show={isAttemptingNavigation} onConfirm={proceedNavigation} onCancel={cancelNavigation} />
    </>
  );
}
