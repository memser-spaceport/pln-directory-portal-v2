'use client';

import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { FormTextArea } from '@/components/form/FormTextArea/FormTextArea';
import { InfoCircleIconOutlined, SuccessCircleIcon } from '@/components/icons';

import s from './InterestStrip.module.scss';

const COMMENT_MAX = 500;

interface InterestStripProps {
  teamName: string;
  /** Whether interest has already been signalled for this role. */
  interested: boolean;
  /** The note that went with the signal, if one did. */
  comment?: string;
  onInterested: (comment: string) => void;
  onUndo: () => void;
}

/**
 * The job aspirant's one act on a role: telling the team they are interested.
 *
 * Sits between the role's masthead and its description on the reading step,
 * for a signed-up aspirant only. An aspirant does not apply through this board
 * — the footer hands them to the team's own site — so what the profile buys
 * them here is visibility: the press marks the role, and the team is shown the
 * profile if the two match.
 *
 * Two states in one slot, traced from the Figma "Signed up — Review job" and
 * "Signed up — Clicked Interested" frames (658:10125 and 684:18216): the offer
 * with its outline button, and the green confirmation with an Undo. The undo
 * is a link in the alert rather than a second button, because taking the
 * signal back is the rarer act and should not price itself against the one
 * that gave it.
 *
 * **LAB-2713: an optional note.** The press used to send a bare signal, while
 * the team's Candidates page read as if a message came with it. Now the press
 * opens the strip into a short composer in the same slot — one optional field
 * and Send — so the signal is still one decision, and sending with the field
 * empty sends exactly what the old press did. Opened in place rather than in a
 * modal: it is a sentence added to a tap, not a second act. The confirmation
 * quotes the note back when there is one, and says nothing about it when
 * there is not.
 */
export function InterestStrip({ teamName, interested, comment, onInterested, onUndo }: InterestStripProps) {
  const [composing, setComposing] = useState(false);
  const methods = useForm<{ comment: string }>({ defaultValues: { comment: '' } });

  if (interested) {
    return (
      <div className={s.alert} role="status">
        <div className={s.alertRow}>
          <SuccessCircleIcon className={s.alertIcon} aria-hidden="true" />
          <p className={s.alertText}>The team will see it if you&apos;re a match</p>
          <button
            type="button"
            className={s.undo}
            onClick={() => {
              methods.reset({ comment: '' });
              onUndo();
            }}
          >
            Undo
          </button>
        </div>
        {comment && (
          <div className={s.sentComment}>
            <p className={s.sentLabel}>Your note to {teamName}</p>
            <p className={s.sentValue}>{comment}</p>
          </div>
        )}
      </div>
    );
  }

  if (composing) {
    const send = methods.handleSubmit(({ comment: typed }) => {
      setComposing(false);
      onInterested(typed.trim());
    });
    return (
      <FormProvider {...methods}>
        <form className={s.composer} onSubmit={send}>
          <FormTextArea
            name="comment"
            label={`Add a note for ${teamName}`}
            isOptional
            placeholder="What draws you to this role, or anything your profile doesn't say"
            rows={3}
            maxLength={COMMENT_MAX}
            showCharCount
          />
          <div className={s.composerActions}>
            <Button type="button" variant="neutral" style="border" size="m" onClick={() => setComposing(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" style="fill" size="m">
              Send interest
            </Button>
          </div>
        </form>
      </FormProvider>
    );
  }

  return (
    <div className={s.strip}>
      <div className={s.lead}>
        <span className={s.iconTile} aria-hidden="true">
          <InfoCircleIconOutlined className={s.icon} />
        </span>
        <div className={s.text}>
          <p className={s.title}>Let {teamName} know you&apos;re interested</p>
          <p className={s.sub}>We&apos;ll notify the team if you&apos;re a match and share your LabOS profile.</p>
        </div>
      </div>
      <Button variant="primary" style="border" size="xs" className={s.button} onClick={() => setComposing(true)}>
        I&apos;m interested
      </Button>
    </div>
  );
}
