import * as yup from 'yup';
import { clsx } from 'clsx';
import Image from 'next/image';
import { useClickAway } from 'react-use';
import { FormProvider, useForm } from 'react-hook-form';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { yupResolver } from '@hookform/resolvers/yup';
import { FormEditor } from '@/components/form/FormEditor';
import { FormField } from '@/components/form/FormField';
import { extractTextWithImages } from '@/utils/decode';
import { useGetMemberNotificationSettings } from '@/services/notifications/hooks/useGetMemberNotificationSettings';
import { getCookiesFromClient } from '@/utils/third-party.helper';
import { useForumAnalytics } from '@/analytics/forum.analytics';
import { Checkbox } from '@/components/common/Checkbox';
import { isEditorEmpty } from '@/utils/isEditorEmpty';
import { useSubmitComment } from '@/components/page/forum/hooks/useSubmitComment';

import { useScrollDownAndStop } from './hooks/useScrollDownAndStop';

import s from './CommentInput.module.scss';

interface Props {
  tid: number;
  toPid: number;
  replyToName?: string;
  onReset: () => void;
  isEdit?: boolean;
  initialContent?: string;
  timestamp: number;
}

const schema = yup.object().shape({
  comment: yup.string().required('Comment is required'),
  emailMe: yup.boolean(),
});

export const CommentInput = ({ tid, toPid, replyToName, onReset, isEdit, initialContent, timestamp }: Props) => {
  const analytics = useForumAnalytics();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [focused, setFocused] = useState(false);
  const { userInfo } = getCookiesFromClient();
  const { data: notificationSettings } = useGetMemberNotificationSettings(userInfo?.uid, 'POST_COMMENT', tid);
  const isScrollingDown = useScrollDownAndStop();

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
      onReset();
      setFocused(false);
    }
  }, [comment, onReset]);

  useClickAway(formRef, handleFocus);

  const onSubmit = useSubmitComment({
    tid,
    toPid,
    isEdit,
    timestamp,
    reset,
    onSubmit: onReset,
    setFocused,
  });

  useEffect(() => {
    if (notificationSettings) {
      setValue('emailMe', notificationSettings?.settings?.enabled);
    }
  }, [notificationSettings, setValue]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Scroll on initial load
    // scrollToBottom();

    const resizeListener = () => {
      scrollToBottom();
    };

    window.visualViewport?.addEventListener('resize', resizeListener);
    return () => {
      window.visualViewport?.removeEventListener('resize', resizeListener);
    };
  }, []);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    if (focused) {
      setTimeout(() => {
        form.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 250);
    }
  }, [focused]);

  return (
    <FormProvider {...methods}>
      <form
        className={clsx('input-form', s.root, {
          [s.hidden]: isScrollingDown && !replyToName && !focused,
        })}
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        ref={formRef}
      >
        {replyToName && (
          <div className={s.replying}>
            <span className={s.lbl}>
              Replying to <b className={s.accent}>{replyToName}</b>
            </span>
            {/*<button type="button" onClick={onReset}>*/}
            {/*  Cancel*/}
            {/*</button>*/}
          </div>
        )}
        <div className={s.content}>
          {focused ? (
            <FormEditor
              name="comment"
              placeholder="Comment"
              autoFocus
              onMentionInitiated={() => analytics.onMentionInitiated({ context: isEdit ? 'edit_comment' : 'create_comment' })}
              onMentionSearch={(query, resultsCount) =>
                analytics.onMentionSearch({ query, resultsCount, context: isEdit ? 'edit_comment' : 'create_comment' })
              }
              onMentionSelected={(member, query) =>
                analytics.onMentionSelected({
                  memberUid: member.uid,
                  memberName: member.name,
                  query,
                  context: isEdit ? 'edit_comment' : 'create_comment',
                })
              }
            />
          ) : (
            <FormField
              name="dummy"
              placeholder="Comment"
              onClick={() => {
                analytics.onCommentInputClicked({ tid, timeSincePostCreation: Date.now() - timestamp });
                setFocused(true);
              }}
            />
          )}
          <button
            className={s.submitBtn}
            type={focused ? 'submit' : 'button'}
            disabled={isSubmitting}
            onClick={() => {
              if (!focused) {
                analytics.onCommentInputClicked({ tid, timeSincePostCreation: Date.now() - timestamp });
                setFocused(true);
              }
            }}
          >
            {isSubmitting ? <Image src="/icons/spinner.svg" width={22} height={22} alt="Spinner" /> : <ArrowUpIcon />}
          </button>
        </div>
        {focused && (
          <div className={s.content}>
            <label className={s.Label}>
              <div className={s.primary}>Email me when someone comments on this post.</div>
              <Checkbox
                checked={!!emailMe}
                onChange={(v: boolean) => {
                  analytics.onPostCommentNotificationSettingsClicked({ tid, toPid, value: v });
                  setValue('emailMe', v, { shouldValidate: true, shouldDirty: true });
                }}
              />
            </label>
            <div className={s.submitBtn} style={{ visibility: 'hidden', height: 0 }}>
              <ArrowUpIcon />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </form>
    </FormProvider>
  );
};

const ArrowUpIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.9173 10.3546C17.8215 10.4507 17.7077 10.527 17.5823 10.5791C17.457 10.6311 17.3226 10.6579 17.1868 10.6579C17.0511 10.6579 16.9167 10.6311 16.7914 10.5791C16.666 10.527 16.5522 10.4507 16.4564 10.3546L12.0315 5.92966V18.5625C12.0315 18.836 11.9228 19.0983 11.7294 19.2917C11.536 19.4851 11.2737 19.5937 11.0002 19.5937C10.7267 19.5937 10.4644 19.4851 10.271 19.2917C10.0776 19.0983 9.96896 18.836 9.96896 18.5625V5.92966L5.54232 10.3546C5.34858 10.5483 5.08583 10.6572 4.81185 10.6572C4.53787 10.6572 4.27511 10.5483 4.08138 10.3546C3.88765 10.1609 3.77881 9.89809 3.77881 9.62411C3.77881 9.35014 3.88765 9.08738 4.08138 8.89365L10.2689 2.70615C10.3647 2.61001 10.4785 2.53372 10.6039 2.48167C10.7292 2.42962 10.8636 2.40283 10.9993 2.40283C11.1351 2.40283 11.2695 2.42962 11.3948 2.48167C11.5202 2.53372 11.634 2.61001 11.7298 2.70615L17.9173 8.89365C18.0135 8.98945 18.0897 9.10329 18.1418 9.22865C18.1938 9.354 18.2206 9.48839 18.2206 9.62411C18.2206 9.75984 18.1938 9.89423 18.1418 10.0196C18.0897 10.1449 18.0135 10.2588 17.9173 10.3546Z"
      fill="white"
    />
  </svg>
);
