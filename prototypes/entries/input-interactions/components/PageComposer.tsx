'use client';

import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { FormTextArea } from '@/components/form/FormTextArea';

import { DRAFT_KEYS, mockTopics } from '../mocks';
import { useTrackedFormDraft } from '../hooks/useTrackedFormDraft';
import { DraftStatus } from './DraftStatus';
import { DiscardStep } from './DiscardStep';
import s from '../styles.module.scss';

type FormValues = { title: string; topic: string; content: string };
type Draft = { title: string; topic: string; content: string };

const getDefaults = (): FormValues => ({ title: '', topic: 'general', content: '' });

interface Props {
  mode: 'today' | 'proposed';
}

/**
 * Tier 1 — the full-page composer (forum create/edit post, guides article).
 *
 * Today this is the *most* protected surface in the product and still the one
 * that loses the most work: `CreatePost` blocks in-app navigation with
 * `UnsavedChangesPrompt`, but the prompt's only outcomes are "stay" or "lose
 * everything", and a hard refresh skips it entirely.
 *
 * The proposed version inverts the framing. Once text is autosaved, leaving is
 * no longer dangerous — so the interruption stops being a warning and becomes
 * a reassurance the member can dismiss without thinking.
 */
export function PageComposer({ mode }: Props) {
  const isProposed = mode === 'proposed';
  const [isConfirming, setIsConfirming] = useState(false);
  const [leaveAttempted, setLeaveAttempted] = useState(false);
  const [published, setPublished] = useState<string | null>(null);

  const methods = useForm<FormValues>({ defaultValues: getDefaults() });
  const { register, watch, reset, handleSubmit } = methods;
  const values = watch();
  const isDirty = Boolean(values.title.trim() || values.content.trim());

  const { status, savedAt, clearDraft } = useTrackedFormDraft<FormValues, Draft>({
    storageKey: DRAFT_KEYS.pagePost,
    enabled: isProposed,
    methods,
    getDefaults,
    toDraft: (form) => ({ title: form.title, topic: form.topic, content: form.content }),
    fromDraft: (draft) => ({ ...getDefaults(), ...draft }),
    isEmpty: (draft) => !draft.title.trim() && !draft.content.trim(),
  });

  const onLeave = () => {
    if (!isDirty) return;
    if (isProposed) {
      // Nothing is at risk, so the exit is unblocked — we simply confirm the
      // draft is kept. This is the behavioural difference worth reviewing.
      setLeaveAttempted(true);
      window.setTimeout(() => setLeaveAttempted(false), 3500);
      return;
    }
    setIsConfirming(true);
  };

  const onSubmit = handleSubmit(({ title }) => {
    setPublished(title.trim() || 'Untitled post');
    clearDraft();
    reset(getDefaults());
  });

  return (
    <div className={s.pageComposer}>
      <div className={s.pageComposerHeader}>
        <h4 className={s.pageComposerTitle}>Create post</h4>
        {isProposed ? (
          <DraftStatus status={status} savedAt={savedAt} />
        ) : (
          <span className={s.toolbarNote}>Navigation warning only — no draft</span>
        )}
      </div>

      <FormProvider {...methods}>
        <div className={s.fieldStack}>
          <div>
            <label className={s.inputLabel} htmlFor="proto-post-title">
              Title
            </label>
            <input id="proto-post-title" className={s.textInput} placeholder="Enter the title" {...register('title')} />
          </div>

          <div>
            <label className={s.inputLabel} htmlFor="proto-post-topic">
              Topic
            </label>
            <select id="proto-post-topic" className={s.textInput} {...register('topic')}>
              {mockTopics.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <FormTextArea
            name="content"
            label="Body"
            placeholder="Write your post here. Use @ to mention someone."
            rows={5}
          />
        </div>
      </FormProvider>

      {leaveAttempted && (
        <p className={s.dismissHint}>Draft saved — you can leave and pick this up later from where you left off.</p>
      )}

      {published && (
        <p className={s.toolbarNote}>Published “{published}”. The draft was cleared on success, not on exit.</p>
      )}

      <div className={s.composerFooter}>
        <Button style="link" variant="neutral" size="s" onClick={onLeave}>
          Leave page
        </Button>
        <div className={s.composerActions}>
          <Button size="s" onClick={onSubmit} disabled={!isDirty}>
            Post
          </Button>
        </div>
      </div>

      <DiscardStep
        isOpen={isConfirming}
        subject="this post"
        onKeep={() => setIsConfirming(false)}
        onDiscard={() => {
          reset(getDefaults());
          setIsConfirming(false);
        }}
      />
    </div>
  );
}
