'use client';

import { useEffect, useRef, useState } from 'react';
import { useGetPathsForTarget } from '@/services/investors/hooks/useGetPathsForTarget';
import { useSubmitCorrection } from '@/services/investors/hooks/useSubmitCorrection';
import { useInvestorsAnalytics } from '@/analytics/investors.analytics';
import { PATH_CONNECTOR_LABEL } from '@/services/investors/constants';
import type { CorrectionInput, PathConnectorType, PathCorrection, PathfinderPath } from '@/services/investors/types';
import { ProximityCodeBadge } from '../ProximityCodeBadge/ProximityCodeBadge';
import s from './WarmPathDetail.module.scss';

interface Props {
  investorId: string;
  bestProximityCode?: string | null;
  canEdit: boolean;
}

type CorrectionReason = 'caliber_too_high' | 'caliber_too_low' | 'wrong_connector' | 'path_invalid' | 'other';

const REASON_OPTIONS: { value: CorrectionReason; label: string }[] = [
  { value: 'caliber_too_high', label: 'Caliber is too high' },
  { value: 'caliber_too_low', label: 'Caliber is too low' },
  { value: 'wrong_connector', label: 'Wrong connector (the contact the path routes through)' },
  { value: 'path_invalid', label: 'This path is invalid' },
  { value: 'other', label: 'Something else' },
];

/** Connectors a corrected path can route through ('C' = cold is the absence of one). */
const CONNECTOR_CHOICES = (Object.keys(PATH_CONNECTOR_LABEL) as PathConnectorType[]).filter((c) => c !== 'C');

// Map the human-facing reason to the backend CreateCorrectionDto shape. Every
// correction made here is about one specific path, so subject_type is always
// 'path' (subject_id = PathfinderPath.id) and `field` carries what's corrected.
export function buildCorrection(
  path: PathfinderPath,
  reason: CorrectionReason,
  note: string,
  newConnector?: PathConnectorType | '',
): CorrectionInput {
  const subject = { subject_type: 'path' as const, subject_id: String(path.id) };
  switch (reason) {
    case 'caliber_too_high':
      return { ...subject, field: 'caliber', old_value: path.caliber ?? null, new_value: 'B', note };
    case 'caliber_too_low':
      return { ...subject, field: 'caliber', old_value: path.caliber ?? null, new_value: 'A', note };
    case 'wrong_connector':
      return {
        ...subject,
        field: 'connector_type',
        old_value: path.connector_type,
        new_value: newConnector || null,
        note,
      };
    case 'path_invalid':
      return { ...subject, field: 'valid', old_value: true, new_value: false, note };
    default:
      return { ...subject, field: 'note', note };
  }
}

const connectorLabel = (v: unknown): string =>
  (PATH_CONNECTOR_LABEL as Record<string, string>)[String(v)] ?? String(v ?? '—');

/** One-line human summary of a pending correction, e.g. "Caliber B → A". */
export function correctionSummary(c: PathCorrection): string {
  switch (c.field) {
    case 'caliber':
      return `Caliber ${c.old_value ?? '—'} → ${c.new_value ?? '—'}`;
    case 'connector_type':
      return `Connector ${connectorLabel(c.old_value)} → ${connectorLabel(c.new_value)}`;
    case 'valid':
      return 'Marked invalid';
    case 'note':
      return 'Note';
    default:
      return c.field;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

/**
 * Expanded warm-path detail for one target investor: the ranked path list (best
 * first), each path's proximity code + confidence + hop chain, its already-
 * submitted pending corrections (so admins don't resubmit), plus a per-path
 * feedback-loop override form (gated on investor_db.edit).
 */
export function WarmPathDetail({ investorId, bestProximityCode, canEdit }: Props) {
  const { data, isLoading } = useGetPathsForTarget(investorId, true);
  const { trackPathsViewed, trackCorrectionSubmitted } = useInvestorsAnalytics();
  const submitCorrection = useSubmitCorrection(investorId);

  const paths = data?.paths ?? [];

  const viewedRef = useRef(false);
  useEffect(() => {
    if (data && !viewedRef.current) {
      viewedRef.current = true;
      trackPathsViewed({ investorId, pathCount: data.paths.length, bestProximityCode });
    }
  }, [data, investorId, bestProximityCode, trackPathsViewed]);

  const [openPathId, setOpenPathId] = useState<number | null>(null);
  const [reason, setReason] = useState<CorrectionReason>('caliber_too_high');
  const [note, setNote] = useState('');
  const [newConnector, setNewConnector] = useState<PathConnectorType | ''>('');

  const openFormFor = (pathId: number) => {
    setOpenPathId(pathId);
    setReason('caliber_too_high');
    setNote('');
    setNewConnector('');
  };

  const onSubmit = async (path: PathfinderPath) => {
    const correction = buildCorrection(path, reason, note.trim(), newConnector);
    const ok = await submitCorrection.mutateAsync(correction);
    if (ok) {
      trackCorrectionSubmitted({
        investorId,
        pathId: path.id,
        subjectType: correction.subject_type,
        field: correction.field,
      });
      // No local "saved" flag: the mutation invalidates the paths query and the
      // refetched response carries the new pending correction for this path.
      setOpenPathId(null);
      setNote('');
      setNewConnector('');
    }
  };

  if (isLoading) return <div className={s.state}>Loading warm paths…</div>;
  if (paths.length === 0) {
    return (
      <div className={s.state}>
        No computed warm paths for this investor yet — run the pathfinder to populate paths.
      </div>
    );
  }

  return (
    <div className={s.root}>
      <ol className={s.pathList}>
        {paths.map((p) => {
          const formOpen = openPathId === p.id;
          return (
            <li key={p.id} className={s.pathItem}>
              <div className={s.pathHead}>
                <ProximityCodeBadge code={p.proximity_code} confidence={p.caliber_confidence} />
                <span className={s.rank}>{p.rank <= 1 ? 'Best path' : `Alternative #${p.rank}`}</span>
                <span className={s.warmth}>warmth {Math.round(p.score * 100)}%</span>
              </div>
              {p.hop_chain.explanation && <div className={s.explanation}>{p.hop_chain.explanation}</div>}
              {p.hop_chain.nodes.length > 0 && (
                <div className={s.chain}>
                  {p.hop_chain.nodes.map((n, i) => (
                    <span key={`${p.id}-${n.id}-${i}`} className={s.node}>
                      {i > 0 && <span className={s.arrow}>→</span>}
                      <span className={s.nodeLabel}>{n.label}</span>
                    </span>
                  ))}
                </div>
              )}

              {p.corrections.length > 0 && (
                <ul className={s.pendingList}>
                  {p.corrections.map((c) => (
                    <li key={c.id} className={s.pendingItem}>
                      <span className={s.pendingBadge}>Pending correction</span>
                      <span className={s.pendingSummary}>{correctionSummary(c)}</span>
                      {c.note && <span className={s.pendingNote}>“{c.note}”</span>}
                      <span className={s.pendingMeta}>
                        {c.actor_email ?? 'unknown'}
                        {formatDate(c.created_at) ? ` · ${formatDate(c.created_at)}` : ''} · awaiting recompute
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {canEdit && (
                <div className={s.correction}>
                  {!formOpen && (
                    <button type="button" className={s.linkBtn} onClick={() => openFormFor(p.id)}>
                      Suggest a correction
                    </button>
                  )}
                  {formOpen && (
                    <div className={s.form}>
                      <select
                        className={s.select}
                        value={reason}
                        onChange={(e) => setReason(e.target.value as CorrectionReason)}
                      >
                        {REASON_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      {reason === 'wrong_connector' && (
                        <select
                          className={s.select}
                          value={newConnector}
                          onChange={(e) => setNewConnector(e.target.value as PathConnectorType | '')}
                          aria-label="Correct connector"
                        >
                          <option value="">Correct connector…</option>
                          {CONNECTOR_CHOICES.filter((c) => c !== p.connector_type).map((c) => (
                            <option key={c} value={c}>
                              {PATH_CONNECTOR_LABEL[c]}
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        className={s.input}
                        placeholder="Add a note (optional)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <button
                        type="button"
                        className={s.btnPrimary}
                        onClick={() => onSubmit(p)}
                        disabled={submitCorrection.isPending || (reason === 'wrong_connector' && !newConnector)}
                      >
                        {submitCorrection.isPending ? 'Saving…' : 'Submit'}
                      </button>
                      <button type="button" className={s.linkBtn} onClick={() => setOpenPathId(null)}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
