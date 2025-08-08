import React, { useCallback, useEffect, useRef, useState } from 'react';

import s from './CommentsInputDesktop.module.scss';
import { FormProvider, useForm } from 'react-hook-form';
import { FormEditor } from '@/components/form/FormEditor';
import { Checkbox } from '@base-ui-components/react/checkbox';
import { usePostComment } from '@/services/forum/hooks/usePostComment';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { extractTextWithImages, replaceImagesWithMarkdown } from '@/utils/decode';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { useGetMemberNotificationSettings } from '@/services/notifications/hooks/useGetMemberNotificationSettings';
import { useUpdateMemberNotificationSettings } from '@/services/notifications/hooks/useUpdateMemberNotificationSettings';
import { useClickAway } from 'react-use';
import { FormField } from '@/components/form/FormField';
import { useEditPost } from '@/services/forum/hooks/useEditPost';
import { clsx } from 'clsx';
import { useForumAnalytics } from '@/analytics/forum.analytics';
import { ADMIN_ROLE } from '@/utils/constants';

interface Props {
  tid: number;
  toPid: number;
  replyToName?: string;
  onCancel?: () => void;
  initialFocused?: boolean;
  isEdit?: boolean;
  isReply?: boolean;
  initialContent?: string;
  itemUid?: string;
}

const schema = yup.object().shape({
  comment: yup.string().required('Comment is required'),
  emailMe: yup.boolean(),
});

export const CommentsInputDesktop = ({ tid, toPid, itemUid, replyToName, onCancel, isReply, initialFocused, isEdit, initialContent }: Props) => {
  const analytics = useForumAnalytics();
  const ref = useRef<HTMLFormElement | null>(null);
  const { userInfo } = getCookiesFromClient();
  const { data: notificationSettings } = useGetMemberNotificationSettings(userInfo?.uid, 'POST_COMMENT', tid);
  const { mutateAsync: updateNotificationSettings } = useUpdateMemberNotificationSettings();
  const [focused, setFocused] = useState(initialFocused ?? false);
  const isAdmin = !!(userInfo?.roles && userInfo?.roles?.length > 0 && userInfo?.roles.includes(ADMIN_ROLE));

  const methods = useForm({
    defaultValues: {
      comment: initialContent ? extractTextWithImages(initialContent) : '',
      emailMe: true,
    },
    resolver: yupResolver(schema),
  });
  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = methods;
  const { emailMe, comment } = watch();

  const { mutateAsync } = usePostComment();
  const { mutateAsync: editPost } = useEditPost();

  const handleFocus = useCallback(() => {
    if (isEditorEmpty(comment)) {
      setFocused(false);
      onCancel?.();
    }
  }, [comment, onCancel]);

  useClickAway(ref, handleFocus);

  const onSubmit = async (data: any) => {
    try {
      const content = replaceImagesWithMarkdown(data.comment);

      await updateNotificationSettings({
        itemType: 'POST_COMMENT',
        contextId: tid,
        uid: userInfo.uid,
        payload: {
          enabled: data.emailMe,
        },
      });

      if (isEdit) {
        const payload = {
          uid: isAdmin ? itemUid : null,
          pid: toPid,
          title: '',
          content,
        };

        const res = await editPost(payload);

        if (res?.status?.code === 'ok') {
          reset();
          setFocused(false);
          onCancel?.();
        }
      } else {
        const payload = {
          tid,
          toPid,
          content,
        };
        analytics.onPostCommentSubmit(payload);
        const res = await mutateAsync(payload);

        if (res?.status?.code === 'ok') {
          reset();
          setFocused(false);
          onCancel?.();
        }
      }
    } catch (e) {
      // @ts-ignore
      toast.error(e.message);
    }
  };

  useEffect(() => {
    if (replyToName && ref.current && toPid) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.querySelector<HTMLInputElement>('.ql-editor')?.focus();
    }
  }, [replyToName, toPid]);

  useEffect(() => {
    if (notificationSettings) {
      setValue('emailMe', notificationSettings?.settings?.enabled);
    }
  }, [notificationSettings, setValue]);

  function getSubmitLabel() {
    if (isSubmitting) {
      return 'Processing...';
    }
    if (isEdit) {
      return 'Save';
    }
    if (isReply) {
      return 'Reply';
    }
    return 'Comment';
  }

  return (
    <FormProvider {...methods}>
      <form className={s.root} noValidate onSubmit={handleSubmit(onSubmit)} ref={ref}>
        {focused ? (
          <>
            <FormEditor autoFocus name="comment" placeholder="Comment" label={replyToName ? `Replying to ${replyToName}` : ''} />
            <label className={s.Label}>
              <div className={s.primary}>Email me when someone comments on this post.</div>
              <Checkbox.Root
                className={s.Checkbox}
                checked={emailMe}
                onCheckedChange={(v: boolean) => {
                  analytics.onPostCommentNotificationSettingsClicked({ tid, toPid, value: v });
                  setValue('emailMe', v, { shouldValidate: true, shouldDirty: true });
                }}
              >
                <Checkbox.Indicator className={s.Indicator}>
                  <CheckIcon className={s.Icon} />
                </Checkbox.Indicator>
              </Checkbox.Root>
            </label>

            <div className={s.controls}>
              <button
                type="button"
                className={s.secondaryBtn}
                onClick={() => {
                  analytics.onPostCommentCancel();
                  onCancel?.();
                  reset();
                  setFocused(false);
                }}
              >
                Cancel
              </button>
              <button type="submit" className={clsx(s.primaryBtn, s.actionable)} disabled={isSubmitting}>
                {getSubmitLabel()}
              </button>
            </div>
          </>
        ) : (
          <div className={s.inline}>
            <FormField
              name="dummy"
              placeholder="Comment"
              onClick={() => {
                analytics.onCommentInputClicked({ tid });
                setFocused(true);
              }}
            />
            <button
              className={s.primaryBtn}
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (!focused) {
                  analytics.onCommentInputClicked({ tid });
                  setFocused(true);
                }
              }}
            >
              {getSubmitLabel()}
            </button>
          </div>
        )}
      </form>
    </FormProvider>
  );
};

export default CommentsInputDesktop;

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}

function isEditorEmpty(html: string): boolean {
  const trimmed = html.trim();
  return trimmed === '<p><br></p>' || trimmed === '';
}
