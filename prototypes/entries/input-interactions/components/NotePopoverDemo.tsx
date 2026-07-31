'use client';

import { useCallback, useRef, useState } from 'react';
import clsx from 'clsx';
import { FormProvider, useForm } from 'react-hook-form';
import { useClickAway } from 'react-use';

import { Button } from '@/components/common/Button';
import { FormTextArea } from '@/components/form/FormTextArea';

import { DRAFT_KEYS } from '../mocks';
import { useTrackedFormDraft } from '../hooks/useTrackedFormDraft';
import { DraftStatus } from './DraftStatus';
import { DiscardStep } from './DiscardStep';
import s from '../styles.module.scss';

type FormValues = { note: string };
type Draft = { note: string };

const getDefaults = (): FormValues => ({ note: '' });

interface Props {
  mode: 'today' | 'proposed';
}

/**
 * Tier 2 — the anchored popover (Gantry decline reason / pin note, Asks).
 *
 * Popovers are where dismiss-on-outside-click is most defensible: they're
 * lightweight, and people expect them to be. That expectation is exactly the
 * trap — the same gesture that harmlessly closes an empty popover destroys a
 * three-sentence decline reason.
 *
 * The resolution isn't to make popovers behave like modals. It's to make the
 * dismissal conditional on content: empty closes on click-away as always,
 * dirty holds and nudges. Weight follows stakes, not component type.
 */
export function NotePopoverDemo({ mode }: Props) {
  const isProposed = mode === 'proposed';
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const methods = useForm<FormValues>({ defaultValues: getDefaults() });
  const { watch, reset, handleSubmit } = methods;
  const note = watch('note');
  const isDirty = note.trim().length > 0;

  const { status, savedAt, clearDraft } = useTrackedFormDraft<FormValues, Draft>({
    storageKey: DRAFT_KEYS.notePopover,
    enabled: isProposed && isOpen,
    methods,
    getDefaults,
    toDraft: (form) => ({ note: form.note }),
    fromDraft: (draft) => ({ note: draft.note }),
    isEmpty: (draft) => !draft.note.trim(),
  });

  const handleClickAway = useCallback(() => {
    if (!isOpen) return;

    if (!isProposed) {
      // Today: click-away closes regardless, and the note is gone.
      reset(getDefaults());
      setIsOpen(false);
      return;
    }

    if (!isDirty) {
      setIsOpen(false);
      return;
    }

    setNudge(true);
    window.setTimeout(() => setNudge(false), 600);
  }, [isOpen, isProposed, isDirty, reset]);

  useClickAway(anchorRef as React.RefObject<HTMLElement>, handleClickAway);

  const onCancel = () => {
    if (!isDirty) {
      setIsOpen(false);
      return;
    }
    if (!isProposed) {
      reset(getDefaults());
      setIsOpen(false);
      return;
    }
    setIsConfirming(true);
  };

  const onSubmit = handleSubmit(({ note: body }) => {
    setSaved(body.trim());
    clearDraft();
    reset(getDefaults());
    setIsOpen(false);
  });

  return (
    <>
      <div className={s.toolbar}>
        <div className={s.popoverAnchor} ref={anchorRef}>
          <Button style="border" variant="neutral" size="s" onClick={() => setIsOpen((v) => !v)}>
            Add a note
          </Button>

          {isOpen && (
            <div className={clsx(s.popover, nudge && s.modalNudge)} role="dialog" aria-label="Add a note">
              <h4 className={s.popoverTitle}>Why are you declining this?</h4>
              <FormProvider {...methods}>
                <FormTextArea name="note" placeholder="Add context for the requester…" rows={4} />
              </FormProvider>
              <div className={s.popoverFooter}>
                {isProposed ? (
                  <DraftStatus status={status} savedAt={savedAt} />
                ) : (
                  <span className={s.toolbarNote}>Click away to lose it</span>
                )}
                <div className={s.composerActions}>
                  <Button style="border" variant="neutral" size="xs" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button size="xs" onClick={onSubmit} disabled={!isDirty}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <span className={s.toolbarNote}>
          {isProposed
            ? 'Empty still closes on click-away. Type first and it holds.'
            : 'Click-away closes it either way.'}
        </span>
      </div>

      {saved && <p className={s.toolbarNote}>Saved note: “{saved}”</p>}

      <DiscardStep
        isOpen={isConfirming}
        subject="this note"
        onKeep={() => setIsConfirming(false)}
        onDiscard={() => {
          clearDraft();
          reset(getDefaults());
          setIsConfirming(false);
          setIsOpen(false);
        }}
      />
    </>
  );
}
