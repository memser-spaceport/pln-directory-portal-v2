'use client';

import clsx from 'clsx';
import { useState } from 'react';

import { Button } from '@/components/common/Button';
import { Markdown } from '@/components/common/Markdown';
import type { LabosAgentTurn as Turn } from '@/services/labos-agent/hooks/useLabosAgentChat';
import { sourceRefLink } from '@/services/labos-agent/labos-agent.sources';
import type { LabosAgentDecision } from '@/types/labos-agent.types';

import { LabosAgentActionCard } from '../LabosAgentActionCard/LabosAgentActionCard';
import { LabosAgentDraftCard } from '../LabosAgentDraftCard/LabosAgentDraftCard';

import s from './LabosAgentTurn.module.scss';

interface LabosAgentTurnProps {
  turn: Turn;
  /** True while any turn is working: follow-ups and Retry wait. */
  busy: boolean;
  onFollowUp: (text: string) => void;
  onRetry: (turnId: string) => void;
  /** Confirm or Cancel on one of the turn's action cards (C2). */
  onDecide: (turnId: string, proposalId: string, decision: LabosAgentDecision) => void;
  /** S3 intro draft cards. Absent: the turn shows no draft cards. */
  onDraftEdit?: (turnId: string, draftId: string, text: string) => void;
  onDraftSend?: (turnId: string, draftId: string) => void;
  onDraftCancel?: (turnId: string, draftId: string) => void;
  /** LAB-3297: the member opened a source. `position` 1 is the first source in the list. */
  onSourceClick?: (sourceType: 'labos' | 'web', position: number) => void;
}

const domainOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

function Check() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={s.stepCheck}>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * One answer from the agent (from home-v2-b's AgentPanel turn): the steps while it works, then the streamed Markdown
 * answer, the LabOS items and web pages it used, and its follow-up questions. A hard error or a stall shows a
 * message and Retry. A finished answer shows one action card per proposed edit (S2) and one draft card per intro
 * draft (S3).
 */
export function LabosAgentTurn({
  turn,
  busy,
  onFollowUp,
  onRetry,
  onDecide,
  onDraftEdit,
  onDraftSend,
  onDraftCancel,
  onSourceClick,
}: LabosAgentTurnProps) {
  const [showSteps, setShowSteps] = useState(false);
  const working = turn.status === 'working';
  const thinking = working && !turn.content;
  const seconds = turn.endedAt ? Math.max(1, Math.round((turn.endedAt - turn.startedAt) / 1000)) : 0;
  const stepsOpen = thinking || showSteps;
  const canRetry = turn.status === 'error' || turn.status === 'stalled';

  return (
    <div className={s.agentTurn} aria-busy={working}>
      {thinking ? (
        <div className={s.workingLine} role="status">
          <span className={s.spinner} aria-hidden />
          Working
        </div>
      ) : (
        turn.steps.length > 0 && (
          <button
            type="button"
            className={s.workedToggle}
            aria-expanded={showSteps}
            onClick={() => setShowSteps((v) => !v)}
          >
            {working ? 'Working' : `Worked for ${seconds}s`} · {turn.steps.length}{' '}
            {turn.steps.length === 1 ? 'step' : 'steps'}
            <svg viewBox="0 0 16 16" fill="none" aria-hidden className={s.caret}>
              <path
                d={showSteps ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )
      )}

      {stepsOpen && turn.steps.length > 0 && (
        <ol className={s.steps}>
          {turn.steps.map((label, i) => {
            const active = thinking && i === turn.steps.length - 1;
            return (
              <li key={`${i}-${label}`} className={clsx(s.step, active && s.stepActive)}>
                {active ? <span className={s.stepSpinner} aria-hidden /> : <Check />}
                {label}
              </li>
            );
          })}
        </ol>
      )}

      {turn.content && <Markdown className={s.text}>{turn.content}</Markdown>}

      {!working && (turn.sourceRefs.length > 0 || turn.sources.length > 0) && (
        <div className={s.sources}>
          <span className={s.sourcesLabel}>Sources</span>
          <ul className={s.refs}>
            {turn.sourceRefs.map((ref, i) => {
              const { href, external } = sourceRefLink(ref);
              return (
                <li key={`ref-${i}`}>
                  <a
                    href={href}
                    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className={s.ref}
                    onClick={() => onSourceClick?.(ref.type === 'web' ? 'web' : 'labos', i + 1)}
                  >
                    <span className={s.refTitle}>{ref.title}</span>
                    <span className={s.refMeta}>{ref.type === 'news' ? 'LabOS news' : ref.type}</span>
                  </a>
                </li>
              );
            })}
            {turn.sources.map((url, j) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={s.ref}
                  onClick={() => onSourceClick?.('web', turn.sourceRefs.length + j + 1)}
                >
                  <span className={s.refTitle}>{domainOf(url)}</span>
                  <span className={s.refMeta}>Web</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {turn.status === 'done' &&
        turn.proposals.map((p) => (
          <LabosAgentActionCard
            key={p.proposalId}
            proposal={p}
            card={turn.cards[p.proposalId]}
            onDecide={(proposalId, decision) => onDecide(turn.id, proposalId, decision)}
          />
        ))}

      {turn.status === 'done' &&
        onDraftEdit &&
        onDraftSend &&
        onDraftCancel &&
        (turn.drafts ?? []).map((d) => (
          <LabosAgentDraftCard
            key={d.draftId}
            draft={d}
            card={turn.draftCards?.[d.draftId]}
            onEdit={(draftId, text) => onDraftEdit(turn.id, draftId, text)}
            onSend={(draftId) => onDraftSend(turn.id, draftId)}
            onCancel={(draftId) => onDraftCancel(turn.id, draftId)}
          />
        ))}

      {turn.status === 'error' && turn.error && (
        <p className={s.errorText} role="alert">
          {turn.error.message}
        </p>
      )}

      {canRetry && (
        <div className={s.actions}>
          <Button size="xs" style="border" variant="neutral" disabled={busy} onClick={() => onRetry(turn.id)}>
            Retry
          </Button>
        </div>
      )}

      {turn.status === 'stopped' && <p className={s.stopped}>Stopped</p>}

      {turn.status === 'done' && turn.followUpQuestions.length > 0 && (
        <div className={s.followUps}>
          {turn.followUpQuestions.map((q) => (
            <button key={q} type="button" className={s.followUp} disabled={busy} onClick={() => onFollowUp(q)}>
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
