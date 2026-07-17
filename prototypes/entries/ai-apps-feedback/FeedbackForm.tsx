'use client';

import { useState } from 'react';

import { Button } from '@/components/common/Button/Button';
import { CloseIcon, ChevronDownIcon, CheckIcon, SuccessCircleIcon } from '@/components/icons';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import type { AiApp } from '@/services/ai-apps/ai-apps.service';

import s from './feedback.module.scss';

const MAX = 1000;

interface Props {
  apps: AiApp[];
  /** Pre-select an app (in-app opens with its own app; picker hidden). */
  initialAppUid?: string | null;
  currentUserName: string;
  onSubmit: (appUid: string, text: string) => void;
  onClose: () => void;
}

/**
 * The give-feedback form content (header + picker + textarea + success), shell-
 * agnostic. Mounted fresh by whatever opens it (the FAB popover or the header
 * button popover), so its state initializes clean each time.
 */
export function FeedbackForm({ apps, initialAppUid, currentUserName, onSubmit, onClose }: Props) {
  const [selectedUid, setSelectedUid] = useState<string | null>(initialAppUid ?? null);
  const [text, setText] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selected = apps.find((a) => a.uid === selectedUid) ?? null;
  const canSend = Boolean(selectedUid) && text.trim().length > 0;

  // When the app is implied by context (opened from an app's page), name it in
  // the title so the scope is unmistakable even with the app hidden behind the
  // popover. Falls back to the generic label when the user must still pick.
  const title = submitted
    ? 'Feedback sent'
    : initialAppUid && selected
      ? `Feedback for ${selected.name}`
      : 'Give feedback';

  const handleSend = () => {
    if (!canSend || !selectedUid) return;
    onSubmit(selectedUid, text.trim());
    setSubmitted(true);
  };

  return (
    <>
      <div className={s.popoverHeader}>
        <h2 className={s.popoverTitle}>{title}</h2>
        <button type="button" className={s.popoverClose} onClick={onClose} aria-label="Close">
          <CloseIcon width={18} height={18} />
        </button>
      </div>

      {submitted ? (
        <div className={s.success}>
          <SuccessCircleIcon width={44} height={44} className={s.successGlyph} />
          <h3 className={s.successTitle}>Thanks — your feedback was sent</h3>
          <p className={s.successText}>
            {selected ? `${selected.member.name}, who builds ${selected.name}, ` : 'The app’s author '}
            will see it in their feedback view.
          </p>
        </div>
      ) : (
        <>
          <div className={s.popoverBody}>
            {/* When the app is implied by context, confirm it with a locked
                subject row (same avatar + name language as the picker, but not
                a control) instead of re-asking or going silent. */}
            {initialAppUid && selected ? (
              <div className={s.subject}>
                <span className={s.subjectLabel}>About</span>
                <span className={s.subjectApp}>
                  <img className={s.optionAvatar} src={getDefaultAvatar(selected.member.name)} alt="" />
                  <span className={s.optionName}>{selected.name}</span>
                </span>
              </div>
            ) : (
              <div className={s.field}>
                <label className={s.fieldLabel}>Which app is this about?</label>
                <div className={s.picker}>
                  <button
                    type="button"
                    className={`${s.pickerButton} ${pickerOpen ? s.pickerButtonOpen : ''}`}
                    onClick={() => setPickerOpen((o) => !o)}
                  >
                    {selected ? (
                      <span className={s.pickerValue}>
                        <img className={s.optionAvatar} src={getDefaultAvatar(selected.member.name)} alt="" />
                        <span className={s.optionName}>{selected.name}</span>
                      </span>
                    ) : (
                      <span className={s.pickerPlaceholder}>Select an app…</span>
                    )}
                    <ChevronDownIcon
                      width={16}
                      height={16}
                      className={`${s.pickerCaret} ${pickerOpen ? s.pickerCaretOpen : ''}`}
                    />
                  </button>

                  {pickerOpen && (
                    <div className={s.pickerMenu}>
                      {apps.map((app) => (
                        <button
                          key={app.uid}
                          type="button"
                          className={`${s.pickerOption} ${app.uid === selectedUid ? s.pickerOptionSelected : ''}`}
                          onClick={() => {
                            setSelectedUid(app.uid);
                            setPickerOpen(false);
                          }}
                        >
                          <img className={s.optionAvatar} src={getDefaultAvatar(app.member.name)} alt="" />
                          <span className={s.optionText}>
                            <span className={s.optionName}>{app.name}</span>
                            <span className={s.optionMeta}>by {app.member.name}</span>
                          </span>
                          {app.uid === selectedUid && <CheckIcon width={16} height={16} className={s.optionCheck} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Text-only feedback */}
            <div className={s.field}>
              <label className={s.fieldLabel}>Your feedback</label>
              <textarea
                className={s.textarea}
                placeholder="What worked, what didn’t, and what would make this more useful?"
                value={text}
                maxLength={MAX}
                onChange={(e) => setText(e.target.value)}
              />
              <span className={s.charCount}>
                {text.length}/{MAX}
              </span>
            </div>

            <div className={s.postingAs}>
              <img className={s.postingAsAvatar} src={getDefaultAvatar(currentUserName)} alt="" />
              <span>
                Posting as <strong>{currentUserName}</strong> · visible to the app’s author and Directory admins
              </span>
            </div>
          </div>

          <div className={s.popoverFooter}>
            <Button size="s" style="border" variant="neutral" onClick={onClose}>
              Cancel
            </Button>
            <Button size="s" disabled={!canSend} onClick={handleSend}>
              Send feedback
            </Button>
          </div>
        </>
      )}
    </>
  );
}
