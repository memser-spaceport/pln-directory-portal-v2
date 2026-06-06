'use client';

import { useEffect, useRef, useState } from 'react';
import { useGetPathsForTarget } from '@/services/investors/hooks/useGetPathsForTarget';
import { useSubmitCorrection } from '@/services/investors/hooks/useSubmitCorrection';
import { useInvestorsAnalytics } from '@/analytics/investors.analytics';
import type { CorrectionInput, PathfinderPath } from '@/services/investors/types';
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

// Map the human-facing reason to the backend CreateCorrectionDto shape. The
// correction is the persisted override that feeds the next recompute.
function buildCorrection(
  investorId: string,
  best: PathfinderPath | undefined,
  reason: CorrectionReason,
  note: string,
): CorrectionInput {
  const subjectId = best ? String(best.id) : investorId;
  switch (reason) {
    case 'caliber_too_high':
      return {
        subject_type: 'caliber',
        subject_id: subjectId,
        field: 'caliber',
        old_value: best?.caliber ?? null,
        new_value: 'B',
        note,
      };
    case 'caliber_too_low':
      return {
        subject_type: 'caliber',
        subject_id: subjectId,
        field: 'caliber',
        old_value: best?.caliber ?? null,
        new_value: 'A',
        note,
      };
    case 'wrong_connector':
      return {
        subject_type: 'connector',
        subject_id: subjectId,
        field: 'connector_type',
        old_value: best?.connector_type ?? null,
        note,
      };
    case 'path_invalid':
      return { subject_type: 'path', subject_id: subjectId, field: 'valid', old_value: true, new_value: false, note };
    default:
      return { subject_type: 'path', subject_id: subjectId, field: 'note', note };
  }
}

/**
 * Expanded warm-path detail for one target investor: the ranked path list (best
 * first), each path's proximity code + confidence + hop chain, plus the
 * feedback-loop override form (gated on investor_db.edit).
 */
export function WarmPathDetail({ investorId, bestProximityCode, canEdit }: Props) {
  const { data, isLoading } = useGetPathsForTarget(investorId, true);
  const { trackPathsViewed, trackCorrectionSubmitted } = useInvestorsAnalytics();
  const submitCorrection = useSubmitCorrection();

  const paths = data?.paths ?? [];
  const best = paths[0];

  const viewedRef = useRef(false);
  useEffect(() => {
    if (data && !viewedRef.current) {
      viewedRef.current = true;
      trackPathsViewed({ investorId, pathCount: data.paths.length, bestProximityCode });
    }
  }, [data, investorId, bestProximityCode, trackPathsViewed]);

  const [formOpen, setFormOpen] = useState(false);
  const [reason, setReason] = useState<CorrectionReason>('caliber_too_high');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const onSubmit = async () => {
    const correction = buildCorrection(investorId, best, reason, note.trim());
    const ok = await submitCorrection.mutateAsync(correction);
    if (ok) {
      trackCorrectionSubmitted({ investorId, subjectType: correction.subject_type, field: correction.field });
      setSaved(true);
      setFormOpen(false);
      setNote('');
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
        {paths.map((p) => (
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
          </li>
        ))}
      </ol>

      {canEdit && (
        <div className={s.correction}>
          {saved && <span className={s.saved}>✓ Correction submitted</span>}
          {!formOpen && !saved && (
            <button type="button" className={s.linkBtn} onClick={() => setFormOpen(true)}>
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
              <input
                className={s.input}
                placeholder="Add a note (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button type="button" className={s.btnPrimary} onClick={onSubmit} disabled={submitCorrection.isPending}>
                {submitCorrection.isPending ? 'Saving…' : 'Submit'}
              </button>
              <button type="button" className={s.linkBtn} onClick={() => setFormOpen(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
