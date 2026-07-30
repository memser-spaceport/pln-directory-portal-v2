'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { FormProvider, useForm } from 'react-hook-form';
import { useClickAway } from 'react-use';

import { Button } from '@/components/common/Button';
import { FormTextArea } from '@/components/form/FormTextArea';
import { readFormDraft } from '@/utils/formDraftStorage';

import { DRAFT_KEYS, mockComments, mockPost } from '../mocks';
import { useTrackedFormDraft } from '../hooks/useTrackedFormDraft';
import { DraftStatus } from './DraftStatus';
import { DiscardStep } from './DiscardStep';
import s from '../styles.module.scss';

type FormValues = { comment: string };
type Draft = { comment: string };

const getDefaults = (): FormValues => ({ comment: '' });

interface Props {
  mode: 'today' | 'proposed';
}

/**
 * Tier 1 — the inline composer (forum comment / reply, guides comment).
 *
 * Today's `CommentInput` already gets outside-click half-right: `useClickAway`
 * only collapses when `isEditorEmpty(comment)`, so typed text survives a stray
 * click. What it has no answer for is leaving the page — which is exactly what
 * the "Simulate reload" control above this demo exercises.
 */
export function InlineComposer({ mode }: Props) {
  const isProposed = mode === 'proposed';
  const formRef = useRef<HTMLDivElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [posted, setPosted] = useState<string[]>([]);

  const methods = useForm<FormValues>({ defaultValues: getDefaults() });
  const { watch, reset, handleSubmit } = methods;
  const comment = watch('comment');
  const isDirty = comment.trim().length > 0;

  const { status, savedAt, clearDraft } = useTrackedFormDraft<FormValues, Draft>({
    storageKey: DRAFT_KEYS.inlineComment,
    // In "today" mode the draft layer is simply absent — that IS the current
    // behaviour, so the demo doesn't need to fake a broken version of it.
    enabled: isProposed && focused,
    methods,
    getDefaults,
    toDraft: (form) => ({ comment: form.comment }),
    fromDraft: (draft) => ({ comment: draft.comment }),
    isEmpty: (draft) => !draft.comment.trim(),
  });

  const [isConfirming, setIsConfirming] = useState(false);

  // A saved draft the member can't see is worse than no draft at all: the
  // composer would sit collapsed and look empty. So a pending draft re-opens
  // the composer on mount. Done in an effect, not a lazy initialiser, because
  // prototype routes server-render and localStorage doesn't exist there.
  useEffect(() => {
    if (!isProposed) return;
    const draft = readFormDraft<Draft>(DRAFT_KEYS.inlineComment);
    if (draft?.comment?.trim()) setFocused(true);
  }, [isProposed]);

  // Both modes keep text on outside click; only the empty composer collapses.
  const handleClickAway = useCallback(() => {
    if (!isDirty) setFocused(false);
  }, [isDirty]);

  useClickAway(formRef as React.RefObject<HTMLElement>, handleClickAway);

  const onCancel = () => {
    if (!isDirty) {
      setFocused(false);
      return;
    }
    if (!isProposed) {
      // Today: Cancel is silently destructive.
      reset(getDefaults());
      setFocused(false);
      return;
    }
    setIsConfirming(true);
  };

  const onSubmit = handleSubmit(({ comment: body }) => {
    setPosted((current) => [...current, body.trim()]);
    clearDraft();
    reset(getDefaults());
    setFocused(false);
  });

  return (
    <div className={s.thread}>
      <div>
        <h4 className={s.threadTitle}>{mockPost.title}</h4>
        <p className={s.threadMeta}>
          {mockPost.author} · {mockPost.authorRole} · {mockPost.replies} replies
        </p>
      </div>

      {mockComments.map((c) => (
        <div key={c.id} className={s.comment}>
          <span className={s.commentAuthor}>{c.author}</span>
          <p className={s.commentBody}>{c.body}</p>
          <span className={s.commentWhen}>{c.when}</span>
        </div>
      ))}

      {posted.map((body, i) => (
        <div key={`posted-${i}`} className={s.comment}>
          <span className={s.commentAuthor}>You</span>
          <p className={s.commentBody}>{body}</p>
          <span className={s.commentWhen}>just now</span>
        </div>
      ))}

      <div ref={formRef} className={clsx(s.composer, focused && s.composerFocused)}>
        {focused ? (
          <FormProvider {...methods}>
            <FormTextArea name="comment" placeholder="Write your comment here. Use @ to mention someone." rows={3} />
            <div className={s.composerFooter}>
              {isProposed ? (
                <DraftStatus status={status} savedAt={savedAt} />
              ) : (
                <span className={s.toolbarNote}>No draft — leaving the page loses this.</span>
              )}
              <div className={s.composerActions}>
                <Button style="border" variant="neutral" size="s" onClick={onCancel}>
                  Cancel
                </Button>
                <Button size="s" onClick={onSubmit} disabled={!isDirty}>
                  Comment
                </Button>
              </div>
            </div>
          </FormProvider>
        ) : (
          <button type="button" className={s.composerCollapsed} onClick={() => setFocused(true)}>
            Write your comment here. Use @ to mention someone.
          </button>
        )}
      </div>

      <DiscardStep
        isOpen={isConfirming}
        subject="your comment"
        onKeep={() => setIsConfirming(false)}
        onDiscard={() => {
          clearDraft();
          reset(getDefaults());
          setIsConfirming(false);
          setFocused(false);
        }}
      />
    </div>
  );
}
