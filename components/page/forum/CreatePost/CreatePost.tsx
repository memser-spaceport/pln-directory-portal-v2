'use client';

import React, { useEffect, useMemo, useState } from 'react';

import s from './CreatePost.module.scss';
import { FormProvider, useForm } from 'react-hook-form';
import { FormSelect } from '@/components/form/FormSelect';
import { useForumCategories } from '@/services/forum/hooks/useForumCategories';
import { FormField } from '@/components/form/FormField';
import { FormEditor } from '@/components/form/FormEditor';
import { useCreatePost } from '@/services/forum/hooks/useCreatePost';
import { toast } from '@/components/core/ToastContainer';
import { createPostSchema } from '@/components/page/forum/CreatePost/helpers';
import { yupResolver } from '@hookform/resolvers/yup';
import { extractTextWithImages, replaceImagesWithMarkdown } from '@/utils/decode';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEditPost } from '@/services/forum/hooks/useEditPost';
import useBlockNavigation from '@/hooks/useUnsavedChangesWarning';
import { UnsavedChangesPrompt } from '@/components/core/UnsavedChangesPrompt';
import { IUserInfo } from '@/types/shared.types';
import { ADMIN_ROLE } from '@/utils/constants';
import { useAllMembers } from '@/services/members/hooks/useAllMembers';
import { useForumAnalytics } from '@/analytics/forum.analytics';
import { clsx } from 'clsx';

export type CreatePostForm = {
  user: Record<string, string> | null;
  topic: Record<string, string>;
  title: string;
  content: string;
};

export const CreatePost = ({ isEdit, initialData, pid, userInfo }: { isEdit?: boolean; initialData?: CreatePostForm; pid?: number; userInfo?: IUserInfo }) => {
  const analytics = useForumAnalytics();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const fromCategory = searchParams.get('from');
  useMobileNavVisibility(true);
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));
  const { data: allMembers } = useAllMembers();
  const membersOptions = useMemo(() => {
    return (
      allMembers?.data?.map((item: { name: string; uid: string }) => ({
        label: item.name,
        value: item.uid.toString(),
      })) ?? []
    );
  }, [allMembers]);

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

  const methods = useForm<CreatePostForm>({
    // @ts-ignore
    defaultValues: initialData
      ? {
          ...initialData,
          content: extractTextWithImages(initialData.content),
        }
      : {
          user: userInfo ? { label: userInfo.name, value: userInfo.uid } : null,
          topic: null,
          title: '',
          content: '',
        },
    resolver: yupResolver(createPostSchema),
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty, isValid, dirtyFields },
  } = methods;

  const { mutateAsync: createPost } = useCreatePost();
  const { mutateAsync: editPost } = useEditPost();

  const handleCancel = () => {
    if (isEdit) {
      analytics.onEditPostCancel();
      router.push(`/forum/topics/${params.categoryId}/${params.topicId}${fromCategory ? `?from=${fromCategory}` : ''}`);
    } else {
      analytics.onCreatePostCancel();
      router.push('/forum?cid=0');
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const content = replaceImagesWithMarkdown(data.content);

      if (isEdit && pid) {
        const payload = {
          uid: isAdmin ? data.user?.value : null,
          pid,
          title: data.title?.trim() || '',
          content,
        };
        analytics.onEditPostSubmit(payload);
        const res = await editPost(payload);

        if (res.status.code === 'ok') {
          toast.success('Your post has been updated');
          reset(data);
          setTimeout(() => {
            router.push(`/forum/topics/${params.categoryId}/${params.topicId}${fromCategory ? `?from=${fromCategory}` : ''}`);
          }, 500);
        }
      } else {
        const payload = {
          uid: isAdmin ? data.user?.value : null,
          cid: data.topic.value,
          title: data.title?.trim(),
          content,
        };
        analytics.onCreatePostSubmit(payload);
        const res = await createPost(payload);

        if (res.status.code === 'ok') {
          toast.success('Post created successfully');
          reset(data);
          setTimeout(() => {
            router.push('/forum?cid=0');
          }, 500);
        }
      }
    } catch (e) {
      // @ts-ignore
      toast.error(e.message);
    }
  };

  const { isAttemptingNavigation, proceedNavigation, cancelNavigation } = useBlockNavigation(isDirty);

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;

      const bottomInset = window.innerHeight - viewport.height - viewport.offsetTop;
      setKeyboardHeight(bottomInset > 0 ? bottomInset : 0);
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    handleResize(); // initial check

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <div className={s.root}>
        <FormProvider {...methods}>
          <form className={s.modalContent} noValidate onSubmit={handleSubmit(onSubmit)}>
            <div className={s.headerWrapper}>
              <div className={s.logo}>{isEdit ? 'Edit Post' : 'Create Post'}</div>
              <div className={s.controls}>
                <button type="button" className={s.cancelBtn} onClick={handleCancel}>
                  Cancel
                </button>
                <button className={s.submitBtn} disabled={isSubmitting || !isDirty}>
                  {isSubmitting ? 'Processing...' : isEdit ? 'Save changes' : 'Post'}
                </button>
              </div>
            </div>
            <div className={s.header}>
              <button type="button" className={s.cancelBtn} onClick={handleCancel}>
                Cancel
              </button>
              <button className={s.submitBtn} disabled={isSubmitting || !isDirty}>
                {isSubmitting ? 'Processing...' : isEdit ? 'Save changes' : 'Post'}
              </button>
            </div>

            <div
              className={clsx(s.content)}
              style={{
                paddingBottom: keyboardHeight + 20,
              }}
            >
              {isAdmin && <FormSelect name="user" placeholder="Select user" label="Select post author" options={membersOptions} disabled={isEdit} />}
              <FormSelect name="topic" placeholder="Select topic" label="Select topic" options={topicsOptions} disabled={isEdit} />
              <FormField name="title" placeholder="Enter the title" label="Title" max={255} />
              <FormEditor name="content" placeholder="Write your post" label="Post" className={s.editor} />
            </div>
          </form>
        </FormProvider>
        <UnsavedChangesPrompt show={isAttemptingNavigation} onConfirm={proceedNavigation} onCancel={cancelNavigation} />
      </div>
    </>
  );
};
