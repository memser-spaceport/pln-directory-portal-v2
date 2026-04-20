'use client';

import * as yup from 'yup';
import { useClickAway } from 'react-use';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormProvider, useForm } from 'react-hook-form';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { FormEditor } from '@/components/form/FormEditor';
import { FormField } from '@/components/form/FormField';
import { Checkbox } from '@/components/common/Checkbox';
import { isEditorEmpty } from '@/utils/isEditorEmpty';
import { useFounderGuidesAnalytics } from '@/analytics/founder-guides.analytics';
import { useAddGuideComment } from '@/services/guide-comments/hooks/useAddGuideComment';
import { useReplyToGuideComment } from '@/services/guide-comments/hooks/useReplyToGuideComment';
import { useEditGuideComment } from '@/services/guide-comments/hooks/useEditGuideComment';
import type { IUserInfo } from '@/types/shared.types';

import s from './GuideCommentInput.module.scss';

interface Props {
  articleUid: string;
  userInfo: IUserInfo;
  parentUid?: string;
  replyToName?: string;
  commentUid?: string;
  isEdit?: boolean;
  initialContent?: string;
  initialFocused?: boolean;
  onCancel?: () => void;
  onCommentAdded?: () => void;
}

const schema = yup.object().shape({
  comment: yup.string().required('Comment is required'),
  emailMe: yup.boolean(),
});

export const GuideCommentInput = (props: Props) => {
  const { articleUid, parentUid, replyToName, commentUid, isEdit, initialContent, initialFocused, onCancel, onCommentAdded } = props;

  const ref = useRef<HTMLFormElement | null>(null);
  const [focused, setFocused] = useState(initialFocused ?? false);

  const analytics = useFounderGuidesAnalytics();
  const addComment = useAddGuideComment();
  const replyToComment = useReplyToGuideComment();
  const editComment = useEditGuideComment();

  const methods = useForm({
    defaultValues: {
      comment: initialContent ?? '',
      emailMe: false,
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

  const handleClickAway = useCallback(() => {
    if (isEditorEmpty(comment)) {
      setFocused(false);
      onCancel?.();
    }
  }, [comment, onCancel]);

  useClickAway(ref, handleClickAway);

  useEffect(() => {
    if (replyToName && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.querySelector<HTMLInputElement>('.ql-editor')?.focus();
    }
  }, [replyToName]);

  const onSubmit = async (values: { comment: string; emailMe?: boolean }) => {
    try {
      if (isEdit && commentUid) {
        await editComment.mutateAsync({ articleUid, commentUid, content: values.comment });
        analytics.trackCommentEditSubmitted({ articleUid, commentUid });
      } else if (parentUid) {
        await replyToComment.mutateAsync({ articleUid, parentUid, content: values.comment });
        analytics.trackCommentReplySubmitted({ articleUid, parentUid });
      } else {
        await addComment.mutateAsync({ articleUid, content: values.comment });
        analytics.trackCommentSubmitted({ articleUid });
        onCommentAdded?.();
      }
      reset({ comment: '', emailMe: values.emailMe });
      setFocused(false);
      onCancel?.();
    } catch {
      // error is handled in mutation onError (toast)
    }
  };

  function getSubmitLabel() {
    if (isSubmitting) return 'Processing...';
    if (isEdit) return 'Save';
    if (parentUid) return 'Reply';
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
              placeholder="Have questions or comments  — add here."
              label={replyToName ? `Replying to ${replyToName}` : ''}
            />
            {/*<label className={s.label}>*/}
            {/*  <span className={s.labelText}>Email me when someone comments on this guide.</span>*/}
            {/*  <Checkbox*/}
            {/*    checked={!!emailMe}*/}
            {/*    onChange={(v) => setValue('emailMe', v, { shouldValidate: true, shouldDirty: true })}*/}
            {/*  />*/}
            {/*</label>*/}
            <div className={s.controls}>
              <button
                type="button"
                className={s.secondaryBtn}
                onClick={() => {
                  reset();
                  setFocused(false);
                  onCancel?.();
                }}
              >
                Cancel
              </button>
              <button type="submit" className={s.primaryBtn} disabled={isSubmitting}>
                {getSubmitLabel()}
              </button>
            </div>
          </>
        ) : (
          <div className={s.inline}>
            <FormField
              name="dummy"
              placeholder="Write your comment here. Use @ to mention someone."
              onClick={() => setFocused(true)}
            />
            {/*<button className={s.primaryBtn} type="button" onClick={() => setFocused(true)}>*/}
            {/*  Comment*/}
            {/*</button>*/}
          </div>
        )}
      </form>
    </FormProvider>
  );
};
