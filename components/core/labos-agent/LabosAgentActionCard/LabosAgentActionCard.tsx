'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import type {
  LabosAgentCardState,
  LabosAgentChangeValue,
  LabosAgentDecision,
  LabosAgentProposal,
  LabosAgentProposalTool,
} from '@/types/labos-agent.types';
import { htmlToPlainText } from '@/utils/html';

import s from './LabosAgentActionCard.module.scss';

interface LabosAgentActionCardProps {
  proposal: LabosAgentProposal;
  /** No state: `pending`. */
  card?: LabosAgentCardState;
  onDecide: (proposalId: string, decision: LabosAgentDecision) => void;
}

const PENDING: LabosAgentCardState = { status: 'pending' };

/** The card shows about this many characters of an HTML field, then "…". */
export const HTML_VALUE_MAX = 300;

/** The fields that hold HTML, by tool (Oleg, PR #3612). The card shows them as plain text, never as markup. */
const HTML_FIELDS: Record<LabosAgentProposalTool, readonly string[]> = {
  update_my_profile: ['bio'],
  update_team: ['longDescription'],
  add_experience: ['description'],
  update_experience: ['description'],
};

export const isHtmlField = (tool: LabosAgentProposalTool, field: string) => HTML_FIELDS[tool].includes(field);

/** A change value as plain text. Empty values read "Empty". `html`: the value is HTML; strip the tags and cap it. */
export function formatChangeValue(value: LabosAgentChangeValue, html = false): string {
  if (value === null || value === '') return 'Empty';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Empty';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (html && typeof value === 'string') return htmlToPlainText(value, HTML_VALUE_MAX) || 'Empty';
  return String(value);
}

const isExpired = (expiresAt?: string) => {
  const at = expiresAt ? Date.parse(expiresAt) : NaN;
  return Number.isFinite(at) && Date.now() >= at;
};

/**
 * True after `expiresAt`. A timer flips it at the expiry time, so an open card closes without a new render. A card's
 * `expiresAt` does not change (one card per `proposalId`), so the first value holds until the timer fires.
 */
function useExpired(expiresAt?: string): boolean {
  const [expired, setExpired] = useState(() => isExpired(expiresAt));
  useEffect(() => {
    const at = expiresAt ? Date.parse(expiresAt) : NaN;
    if (expired || !Number.isFinite(at)) return;
    // setTimeout holds at most about 24.8 days. A C2 proposal lives 15 minutes.
    const timer = setTimeout(() => setExpired(true), Math.min(Math.max(at - Date.now(), 0), 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [expiresAt, expired]);
  return expired;
}

/** The result text of a card, for the one status region. Empty while the card is open. */
function resultText(card: LabosAgentCardState, expired: boolean): string {
  switch (card.status) {
    case 'done':
      return card.summary || 'Saved.';
    case 'cancelled':
      return 'Cancelled. Nothing was saved.';
    case 'forbidden':
    case 'error':
      return card.message ?? '';
    case 'pending':
      return expired ? 'This change expired. Nothing was saved. Ask the agent again.' : '';
    default:
      return '';
  }
}

/**
 * One proposed edit from the agent (LAB-3299, contract C2), from home-v2-b's proposal card: the title, each field with
 * its old and new value, then Confirm and Cancel. Nothing saves before Confirm (D2). The card is used once: after
 * done, cancel, a 403 or a final error, its buttons are gone. After `expiresAt`, a pending card has no buttons.
 *
 * a11y: the card is an `<article>` named by its title, not a landmark. One `role="status"` region stays mounted from
 * the first render and only its text changes, so screen readers announce each result. When a decision ends, focus
 * moves to the result, because the buttons that had focus are gone.
 */
export function LabosAgentActionCard({ proposal, card = PENDING, onDecide }: LabosAgentActionCardProps) {
  const expired = useExpired(proposal.expiresAt);
  const saving = card.status === 'saving';
  const open = (card.status === 'pending' && !expired) || saving;
  const id = `labos-agent-card-${proposal.proposalId}`;
  const result = resultText(card, expired);
  const resultRef = useRef<HTMLParagraphElement>(null);
  const prevStatus = useRef(card.status);

  useEffect(() => {
    if (prevStatus.current === 'saving' && card.status !== 'saving') resultRef.current?.focus();
    prevStatus.current = card.status;
  }, [card.status]);

  const resultClass =
    card.status === 'done'
      ? s.done
      : card.status === 'forbidden' || card.status === 'error'
        ? s.error
        : result
          ? s.muted
          : s.empty;

  return (
    <article className={s.card} aria-labelledby={id} aria-busy={saving}>
      <span id={id} className={s.title}>
        {proposal.title}
      </span>

      <dl className={s.changes}>
        {proposal.changes.map((c) => {
          const html = isHtmlField(proposal.tool, c.field);
          return (
            <div key={c.field} className={s.change}>
              <dt className={s.label}>{c.label}</dt>
              <dd className={s.values}>
                <span className={s.oldValue}>
                  <span className={s.srOnly}>Old value: </span>
                  {formatChangeValue(c.oldValue, html)}
                </span>
                <span className={s.arrow} aria-hidden>
                  →
                </span>
                <span className={s.newValue}>
                  <span className={s.srOnly}>New value: </span>
                  {formatChangeValue(c.newValue, html)}
                </span>
              </dd>
            </div>
          );
        })}
      </dl>

      {open && (
        <div className={s.actions}>
          <Button
            size="xs"
            style="fill"
            variant="primary"
            disabled={saving}
            onClick={() => onDecide(proposal.proposalId, 'confirm')}
          >
            {saving && card.decision === 'confirm' ? 'Saving' : 'Confirm'}
          </Button>
          <Button
            size="xs"
            style="border"
            variant="neutral"
            disabled={saving}
            onClick={() => onDecide(proposal.proposalId, 'cancel')}
          >
            {saving && card.decision === 'cancel' ? 'Cancelling' : 'Cancel'}
          </Button>
        </div>
      )}

      <p ref={resultRef} className={resultClass} role="status" tabIndex={-1}>
        {card.status === 'done' && (
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

      {card.status === 'error' && card.canRetry && (
        <div className={s.actions}>
          <Button size="xs" style="border" variant="neutral" onClick={() => onDecide(proposal.proposalId, 'confirm')}>
            Retry
          </Button>
        </div>
      )}
    </article>
  );
}
