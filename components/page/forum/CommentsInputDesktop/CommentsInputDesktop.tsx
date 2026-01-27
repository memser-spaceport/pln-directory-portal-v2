import * as yup from 'yup';
import { clsx } from 'clsx';
import { useClickAway } from 'react-use';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { FormEditor } from '@/components/form/FormEditor';
import { extractTextWithImages } from '@/utils/decode';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { useGetMemberNotificationSettings } from '@/services/notifications/hooks/useGetMemberNotificationSettings';
import { FormField } from '@/components/form/FormField';
import { useForumAnalytics } from '@/analytics/forum.analytics';
import { Checkbox } from '@/components/common/Checkbox';
import { isEditorEmpty } from '@/utils/isEditorEmpty';
import { useSubmitComment } from '@/components/page/forum/hooks/useSubmitComment';

import s from './CommentsInputDesktop.module.scss';

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
  timestamp: number;
}

const schema = yup.object().shape({
  comment: yup.string().required('Comment is required'),
  emailMe: yup.boolean(),
});

export const CommentsInputDesktop = (props: Props) => {
  const { tid, toPid, itemUid, replyToName, onCancel, isReply, initialFocused, isEdit, initialContent, timestamp } =
    props;

  const analytics = useForumAnalytics();
  const ref = useRef<HTMLFormElement | null>(null);
  const { userInfo } = getCookiesFromClient();
  const { data: notificationSettings } = useGetMemberNotificationSettings(userInfo?.uid, 'POST_COMMENT', tid);
  const [focused, setFocused] = useState(initialFocused ?? false);

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

  const handleFocus = useCallback(() => {
    if (isEditorEmpty(comment)) {
      setFocused(false);
      onCancel?.();
    }
  }, [comment, onCancel]);

  useClickAway(ref, handleFocus);

  const onSubmit = useSubmitComment({
    tid,
    toPid,
    isEdit,
    itemUid,
    timestamp,
    reset,
    onSubmit: onCancel,
    setFocused,
  });

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
            <FormEditor
              autoFocus
              name="comment"
              placeholder="Comment"
              label={replyToName ? `Replying to ${replyToName}` : ''}
              onMentionInitiated={() =>
                analytics.onMentionInitiated({
                  context: isEdit ? 'edit_comment' : isReply ? 'reply_comment' : 'create_comment',
                })
              }
              onMentionSearch={(query, resultsCount) =>
                analytics.onMentionSearch({
                  query,
                  resultsCount,
                  context: isEdit ? 'edit_comment' : isReply ? 'reply_comment' : 'create_comment',
                })
              }
              onMentionSelected={(member, query) =>
                analytics.onMentionSelected({
                  memberUid: member.uid,
                  memberName: member.name,
                  query,
                  context: isEdit ? 'edit_comment' : isReply ? 'reply_comment' : 'create_comment',
                })
              }
            />
            <label className={s.Label}>
              <div className={s.primary}>Email me when someone comments on this post.</div>
              <Checkbox
                checked={!!emailMe}
                onChange={(v) => {
                  analytics.onPostCommentNotificationSettingsClicked({ tid, toPid, value: v });
                  setValue('emailMe', v, { shouldValidate: true, shouldDirty: true });
                }}
              />
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
                analytics.onCommentInputClicked({ tid, timeSincePostCreation: Date.now() - timestamp });
                setFocused(true);
              }}
            />
            <button
              className={s.primaryBtn}
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (!focused) {
                  analytics.onCommentInputClicked({ tid, timeSincePostCreation: Date.now() - timestamp });
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
