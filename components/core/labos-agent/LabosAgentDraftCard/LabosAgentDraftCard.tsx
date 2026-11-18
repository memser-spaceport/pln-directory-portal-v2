'use client';

import { useEffect, useRef } from 'react';

import { Button } from '@/components/common/Button';
import { DRAFT_SENT_MESSAGE } from '@/services/labos-agent/labos-agent.drafts';
import type { LabosAgentDraft, LabosAgentDraftCardState } from '@/types/labos-agent.types';

import s from './LabosAgentDraftCard.module.scss';

interface LabosAgentDraftCardProps {
  draft: LabosAgentDraft;
  /** No state: `open` with the draft text. */
  card?: LabosAgentDraftCardState;
  onEdit: (draftId: string, text: string) => void;
  onSend: (draftId: string) => void;
  onCancel: (draftId: string) => void;
}

const SHORT_TEXT = 'Add a bit more detail so we can find the right person.';

function resultText(card: LabosAgentDraftCardState): string {
  switch (card.status) {
    case 'sent':
      return DRAFT_SENT_MESSAGE;
    case 'cancelled':
      return 'Cancelled. Nothing was sent.';
    case 'forbidden':
    case 'error':
      return card.message ?? '';
    default:
      return '';
  }
}

/**
 * One intro draft from the agent (LAB-3300, contract 8.2). The member edits the text and presses Send. Send calls the
 * existing intro API (C3); the agent never sends. Send is off below `minLength`, and the field stops at `maxLength`.
 * After a 200 or Cancel, the card is closed. After an error, the edited text stays.
 *
 * a11y (as the S2 action card): an `<article>` named by its title. One `role="status"` region stays mounted from the
 * first render and only its text changes. When a send ends or the member cancels, focus moves to that region.
 */
export function LabosAgentDraftCard({ draft, card, onEdit, onSend, onCancel }: LabosAgentDraftCardProps) {
  const state: LabosAgentDraftCardState = card ?? { status: 'open', text: draft.text };
  const sending = state.status === 'sending';
  const closed = state.status === 'sent' || state.status === 'cancelled';
  const editable = state.status === 'open' || state.status === 'error';
  const trimmed = state.text.trim().length;
  const tooShort = trimmed < draft.minLength;
  const canSend = editable && !tooShort && trimmed <= draft.maxLength;
  const id = `labos-agent-draft-${draft.draftId}`;
  const fieldId = `${id}-text`;
  const result = resultText(state);
  const resultRef = useRef<HTMLParagraphElement>(null);
  const prevStatus = useRef(state.status);

  useEffect(() => {
    const prev = prevStatus.current;
    if ((prev === 'sending' && state.status !== 'sending') || (prev !== 'cancelled' && state.status === 'cancelled')) {
      resultRef.current?.focus();
    }
    prevStatus.current = state.status;
  }, [state.status]);

  const resultClass =
    state.status === 'sent'
      ? s.done
      : state.status === 'forbidden' || state.status === 'error'
        ? s.error
        : result
          ? s.muted
          : s.empty;

  return (
    <article className={s.card} aria-labelledby={id} aria-busy={sending}>
      <span id={id} className={s.title}>
        Intro request to {draft.target.name}
      </span>

      {!closed && (
        <>
          <label className={s.label} htmlFor={fieldId}>
            Your request. Edit it before you send.
          </label>
          <textarea
            id={fieldId}
            className={s.text}
            value={state.text}
            rows={6}
            minLength={draft.minLength}
            maxLength={draft.maxLength}
            readOnly={!editable}
            disabled={sending}
            aria-describedby={`${id}-count${tooShort ? ` ${id}-short` : ''}`}
            onChange={(e) => onEdit(draft.draftId, e.target.value)}
          />
          <p id={`${id}-count`} className={s.count}>
            {state.text.length}/{draft.maxLength}
          </p>
          {editable && tooShort && (
            <p id={`${id}-short`} className={s.hint}>
              {SHORT_TEXT}
            </p>
          )}
          <div className={s.actions}>
            {state.status !== 'forbidden' && (
              <Button
                size="xs"
                style="fill"
                variant="primary"
                disabled={!canSend}
                onClick={() => onSend(draft.draftId)}
              >
                {sending ? 'Sending' : 'Send'}
              </Button>
            )}
            <Button
              size="xs"
              style="border"
              variant="neutral"
              disabled={sending}
              onClick={() => onCancel(draft.draftId)}
            >
              Cancel
            </Button>
          </div>
        </>
      )}

      <p ref={resultRef} className={resultClass} role="status" tabIndex={-1}>
        {state.status === 'sent' && (
          <svg viewBox="0 0 16 16" fill="none" aria-hidden className={s.check}>
            <path
              d="M3.5 8.5l3 3 6-7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {result}
      </p>
    </article>
  );
}
