'use client';

import React, { useMemo } from 'react';

import s from './CreatePost.module.scss';
import { FormProvider, useForm } from 'react-hook-form';
import { FormSelect } from '@/components/form/FormSelect';
import { useForumCategories } from '@/services/forum/hooks/useForumCategories';
import { FormField } from '@/components/form/FormField';
import { FormEditor } from '@/components/form/FormEditor';
import { useCreatePost } from '@/services/forum/hooks/useCreatePost';
import { toast } from 'react-toastify';
import { createPostSchema } from '@/components/page/forum/CreatePost/helpers';
import { yupResolver } from '@hookform/resolvers/yup';
import { extractTextWithImages, replaceImagesWithMarkdown } from '@/utils/decode';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { useParams, useRouter } from 'next/navigation';
import { useEditPost } from '@/services/forum/hooks/useEditPost';
import useBlockNavigation from '@/hooks/useUnsavedChangesWarning';
import { UnsavedChangesPrompt } from '@/components/core/UnsavedChangesPrompt';

type Form = {
  topic: Record<string, string>;
  title: string;
  content: string;
};

export const CreatePost = ({ isEdit, initialData, pid }: { isEdit?: boolean; initialData?: Form; pid?: number }) => {
  const router = useRouter();
  const params = useParams();
  useMobileNavVisibility(true);

  const { data: topics } = useForumCategories();
  const topicsOptions = useMemo(() => {
    return (
      topics?.map((topic) => ({
        label: topic.name,
        value: topic.cid.toString(),
        description: topic.description,
      })) ?? []
    );
  }, [topics]);

  const methods = useForm<Form>({
    // @ts-ignore
    defaultValues: initialData
      ? {
          ...initialData,
          content: extractTextWithImages(initialData.content),
        }
      : {
          topic: null,
          title: '',
          content: '',
        },
    resolver: yupResolver(createPostSchema),
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = methods;

  const { mutateAsync: createPost } = useCreatePost();
  const { mutateAsync: editPost } = useEditPost();

  const onSubmit = async (data: any) => {
    try {
      const content = replaceImagesWithMarkdown(data.content);

      if (isEdit && pid) {
        const res = await editPost({
          pid,
          title: data.title,
          content,
        });

        if (res.status.code === 'ok') {
          toast.success('Post updated successfully');
          reset(data);
          setTimeout(() => {
            router.push(`/forum/categories/${params.categoryId}/${params.topicId}`);
          }, 500);
        }
      } else {
        const res = await createPost({
          cid: data.topic.value,
          title: data.title,
          content,
        });

        if (res.status.code === 'ok') {
          toast.success('Post created successfully');
          reset(data);
          setTimeout(() => {
            router.push('/forum?cid=1');
          }, 500);
        }
      }
    } catch (e) {
      // @ts-ignore
      toast.error(e.message);
    }
  };

  const { isAttemptingNavigation, proceedNavigation, cancelNavigation } = useBlockNavigation(isDirty);

  return (
    <>
      <div className={s.root}>
        <FormProvider {...methods}>
          <form className={s.modalContent} noValidate onSubmit={handleSubmit(onSubmit)}>
            <div className={s.headerWrapper}>
              <div className={s.logo}>{isEdit ? 'Edit Post' : 'Create Post'}</div>
              <div className={s.controls}>
                <button
                  type="button"
                  className={s.cancelBtn}
                  onClick={() => {
                    router.push('/forum?cid=1');
                  }}
                >
                  Cancel
                </button>
                <button className={s.submitBtn}>{isSubmitting ? 'Processing...' : isEdit ? 'Save' : 'Post'}</button>
              </div>
            </div>
            <div className={s.header}>
              <button
                type="button"
                className={s.cancelBtn}
                onClick={() => {
                  router.push('/forum?cid=1');
                }}
              >
                Cancel
              </button>
              <button className={s.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>

            <div className={s.content}>
              <FormSelect name="topic" placeholder="Select topic" label="Select topic" options={topicsOptions} disabled={isEdit} />
              <FormField name="title" placeholder="Enter the title" label="Title" description="Enter a clear and specific topic title (max 255 characters)" />
              <FormEditor name="content" placeholder="Write your post" label="Post" className={s.editor} />
            </div>
          </form>
        </FormProvider>
        <UnsavedChangesPrompt show={isAttemptingNavigation} onConfirm={proceedNavigation} onCancel={cancelNavigation} />
      </div>
    </>
  );
};
