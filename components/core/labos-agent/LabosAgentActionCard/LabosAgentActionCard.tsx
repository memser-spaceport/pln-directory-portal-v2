'use client';

import { Button } from '@/components/common/Button';
import type {
  LabosAgentCardState,
  LabosAgentChangeValue,
  LabosAgentDecision,
  LabosAgentProposal,
} from '@/types/labos-agent.types';

import s from './LabosAgentActionCard.module.scss';

interface LabosAgentActionCardProps {
  proposal: LabosAgentProposal;
  /** No state: `pending`. */
  card?: LabosAgentCardState;
  onDecide: (proposalId: string, decision: LabosAgentDecision) => void;
}

const PENDING: LabosAgentCardState = { status: 'pending' };

/** A change value as plain text. Empty values read "Empty". */
export function formatChangeValue(value: LabosAgentChangeValue): string {
  if (value === null || value === '') return 'Empty';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Empty';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

/**
 * One proposed edit from the agent (LAB-3299, contract C2), from home-v2-b's proposal card: the title, each field with
 * its old and new value, then Confirm and Cancel. Nothing saves before Confirm (D2). The card is used once: after
 * done, cancel, a 403 or a final error, its buttons are gone.
 */
export function LabosAgentActionCard({ proposal, card = PENDING, onDecide }: LabosAgentActionCardProps) {
  const saving = card.status === 'saving';
  const open = card.status === 'pending' || saving;
  const id = `labos-agent-card-${proposal.proposalId}`;

  return (
    <section className={s.card} aria-labelledby={id} aria-busy={saving}>
      <span id={id} className={s.title}>
        {proposal.title}
      </span>

      <dl className={s.changes}>
        {proposal.changes.map((c) => (
          <div key={c.field} className={s.change}>
            <dt className={s.label}>{c.label}</dt>
            <dd className={s.values}>
              <span className={s.oldValue}>
                <span className={s.srOnly}>Old value: </span>
                {formatChangeValue(c.oldValue)}
              </span>
              <span className={s.arrow} aria-hidden>
                →
              </span>
              <span className={s.newValue}>
                <span className={s.srOnly}>New value: </span>
                {formatChangeValue(c.newValue)}
              </span>
            </dd>
          </div>
        ))}
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

      {card.status === 'done' && (
        <p className={s.done} role="status">
          <svg viewBox="0 0 16 16" fill="none" aria-hidden className={s.check}>
            <path
              d="M3.5 8.5l3 3 6-7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {card.summary || 'Saved.'}
        </p>
      )}

      {card.status === 'cancelled' && (
        <p className={s.muted} role="status">
          Cancelled. Nothing was saved.
        </p>
      )}

      {(card.status === 'forbidden' || card.status === 'error') && (
        <>
          <p className={s.error} role="alert">
            {card.message}
          </p>
          {card.status === 'error' && card.canRetry && (
            <div className={s.actions}>
              <Button
                size="xs"
                style="border"
                variant="neutral"
                onClick={() => onDecide(proposal.proposalId, 'confirm')}
              >
                Retry
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
