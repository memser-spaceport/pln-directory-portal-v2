'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import s from './CreatePost.module.scss';
import { FormProvider, useForm } from 'react-hook-form';
import { FormSelect } from '@/components/form/FormSelect';
import { useForumCategories } from '@/services/forum/hooks/useForumCategories';
import { FormField } from '@/components/form/FormField';
import { FormEditor } from '@/components/form/FormEditor';
import { useCreatePost } from '@/services/forum/hooks/useCreatePost';
import { toast } from '@/components/core/ToastContainer';
import { buildForumPrefillContent, createPostSchema } from '@/components/page/forum/CreatePost/helpers';
import { yupResolver } from '@hookform/resolvers/yup';
import { convertMarkdownImagesToHtml, replaceImagesWithMarkdown } from '@/utils/decode';
import { useMobileNavVisibility } from '@/hooks/useMobileNavVisibility';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEditPost } from '@/services/forum/hooks/useEditPost';
import useBlockNavigation from '@/hooks/useUnsavedChangesWarning';
import { UnsavedChangesPrompt } from '@/components/core/UnsavedChangesPrompt';
import { IUserInfo } from '@/types/shared.types';
import { useAllMembers } from '@/services/members/hooks/useAllMembers';
import { useForumAnalytics } from '@/analytics/forum.analytics';
import { useGetMemberPreferences } from '@/services/members/hooks/useGetMemberPreferences';
import { useUpdateMemberPreferences } from '@/services/members/hooks/useUpdateMemberPreferences';
import { useCreateTeamNewsDiscussionLink } from '@/services/team-news/hooks/useCreateTeamNewsDiscussionLink';
import { clsx } from 'clsx';
import { PostFormEditorLabel } from './components/PostFormEditorLabel';
import { isAdminUser } from '@/utils/user/isAdminUser';
import { useCurrentUserStore } from '@/services/auth/store';

export type CreatePostForm = {
  user: Record<string, string> | null;
  topic: Record<string, string>;
  title: string;
  content: string;
};

interface Props {
  isEdit?: boolean;
  initialData?: CreatePostForm;
  pid?: number;
}

export const CreatePost = (props: Props) => {
  const { isEdit, initialData, pid } = props;
  const { currentUser: userInfo } = useCurrentUserStore();
  const analytics = useForumAnalytics();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const fromCategory = searchParams.get('from');

  // Prefill support — used when arriving from external entry points (e.g. the
  // "Start a conversation" button on a news card). Reads `title`, `url`, `topic`
  // query params. Body is built safely here, not passed as raw HTML.
  const prefillTitle = !isEdit ? searchParams.get('title') ?? '' : '';
  const prefillUrl = !isEdit ? searchParams.get('url') ?? '' : '';
  const prefillTopicName = !isEdit ? searchParams.get('topic') ?? '' : '';
  // When present, the topic created from this form will be linked back to
  // the source news item so the home-page card can show "Join discussion ›".
  const prefillNewsItemUid = !isEdit ? searchParams.get('newsItemUid') ?? '' : '';
  const prefillContent = useMemo(
    () => buildForumPrefillContent(prefillTitle, prefillUrl),
    [prefillTitle, prefillUrl],
  );
  useMobileNavVisibility(true);
  const isAdmin = isAdminUser(userInfo);
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
          content: convertMarkdownImagesToHtml(initialData.content),
        }
      : {
          user: userInfo ? { label: userInfo.name, value: userInfo.uid } : null,
          topic: null,
          title: prefillTitle,
          content: prefillContent,
        },
    resolver: yupResolver(createPostSchema),
  });

  const {
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting, isDirty, isValid, dirtyFields },
  } = methods;

  // Resolve prefill topic (e.g. "General") to its option once forum categories load.
  // Runs only once per page entry; user edits afterward win.
  const prefillTopicAppliedRef = useRef(false);
  useEffect(() => {
    if (isEdit || prefillTopicAppliedRef.current) return;
    if (!prefillTopicName) return;
    if (!topicsOptions.length) return;
    const match = topicsOptions.find((opt) => opt.label.toLowerCase() === prefillTopicName.toLowerCase());
    if (match) {
      setValue('topic', { label: match.label, value: match.value });
    } else {
      // eslint-disable-next-line no-console
      console.warn(`[CreatePost] prefill topic "${prefillTopicName}" not found in forum categories`);
    }
    prefillTopicAppliedRef.current = true;
  }, [isEdit, prefillTopicName, topicsOptions, setValue]);

  const { mutateAsync: createPost } = useCreatePost();
  const { mutateAsync: editPost } = useEditPost();
  const { mutateAsync: linkNewsDiscussion } = useCreateTeamNewsDiscussionLink();
  const { data: memberPreferences } = useGetMemberPreferences(userInfo?.uid);
  const { mutate: updateMemberPreferences } = useUpdateMemberPreferences();

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
            router.push(
              `/forum/topics/${params.categoryId}/${params.topicId}${fromCategory ? `?from=${fromCategory}` : ''}`,
            );
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
          if (userInfo?.uid && memberPreferences?.memberPreferences?.showForumBanner) {
            updateMemberPreferences({
              uid: userInfo.uid,
              payload: { showForumBanner: false },
            });
          }
          // If this post originated from a news card, record the link back
          // to the news item so the card can render "Join discussion ›".
          // Awaited (not fire-and-forget) so we don't race the navigation:
          // without the link in the DB, the next /home render won't show the
          // join affordance until the next cache miss.
          if (prefillNewsItemUid) {
            const tid: number | undefined = res?.response?.tid;
            const slug: string | undefined = res?.response?.slug;
            if (typeof tid === 'number') {
              const forumTopicSlug = slug && slug.length > 0 ? slug : String(tid);
              const forumTopicUrl = `/forum/topics/${payload.cid}/${tid}`;
              try {
                await linkNewsDiscussion({
                  newsItemUid: prefillNewsItemUid,
                  payload: { forumTopicId: tid, forumTopicSlug, forumTopicUrl },
                });
              } catch (linkErr) {
                // Non-fatal: post was created; only the back-link failed.
                // The card will show Discuss until a future Discuss flow
                // succeeds at writing a link.
                // eslint-disable-next-line no-console
                console.warn('[CreatePost] failed to write news→forum link', linkErr);
              }
            }
          }
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

            {!isEdit && (
              <p className={s.subtitle}>Only verified founders and operators in the PL network can see Forum posts.</p>
            )}

            <div
              className={clsx(s.content)}
              style={{
                paddingBottom: keyboardHeight + 20,
              }}
            >
              {isAdmin && (
                <FormSelect
                  name="user"
                  placeholder="Select user"
                  label="Select post author"
                  options={membersOptions}
                  disabled={isEdit}
                />
              )}
              <FormSelect
                name="topic"
                placeholder="Select topic"
                label="Select topic"
                options={topicsOptions}
                disabled={isEdit}
              />
              <FormField name="title" placeholder="Enter the title" label="Title" max={255} />
              <FormEditor
                name="content"
                placeholder="Write your post here. Use @ to mention someone."
                label={<PostFormEditorLabel />}
                className={s.editor}
                classes={{
                  label: s.postLabel,
                }}
                onMentionInitiated={() =>
                  analytics.onMentionInitiated({ context: isEdit ? 'edit_post' : 'create_post' })
                }
                onMentionSearch={(query, resultsCount) =>
                  analytics.onMentionSearch({ query, resultsCount, context: isEdit ? 'edit_post' : 'create_post' })
                }
                onMentionSelected={(member, query) =>
                  analytics.onMentionSelected({
                    memberUid: member.uid,
                    memberName: member.name,
                    query,
                    context: isEdit ? 'edit_post' : 'create_post',
                  })
                }
              />
            </div>
          </form>
        </FormProvider>
        <UnsavedChangesPrompt show={isAttemptingNavigation} onConfirm={proceedNavigation} onCancel={cancelNavigation} />
      </div>
    </>
  );
};
