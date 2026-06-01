'use client';

import React, { useState } from 'react';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { useGetFounderById } from '@/services/founders/hooks/useGetFounderById';
import { LabOsBadge } from '@/components/page/investors/LabOsBadge/LabOsBadge';
import { FounderReviewStateBadge } from '../FounderReviewStateBadge/FounderReviewStateBadge';
import { ReviewActionsPanel } from '../ReviewActionsPanel/ReviewActionsPanel';
import { FUND_LABEL } from '@/services/founders/constants';
import { getFundTag } from '@/services/founders/types';
import s from './FounderDrawer.module.scss';

interface Props {
  founderId: string | null;
  onClose: () => void;
  canEdit: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={s.section}>
      <button className={s.collapsibleBtn} onClick={() => setOpen((o) => !o)} type="button">
        <h3 className={s.sectionTitle}>{title}</h3>
        <span className={s.chevron}>{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className={s.collapsibleBody}>{children}</div>}
    </div>
  );
}

export default function FounderDrawer({ founderId, onClose, canEdit }: Props) {
  const isOpen = !!founderId;
  const { data: founder, isLoading } = useGetFounderById(founderId);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width={720}>
      {isLoading && <div className={s.loading}>Loading…</div>}
      {!isLoading && !founder && founderId && (
        <div className={s.loading}>Founder not found.</div>
      )}
      {founder && (
        <div className={s.content}>
          {/* Header */}
          <div className={s.header}>
            <div className={s.headerTop}>
              <div className={s.headerWho}>
                <h2 className={s.name}>{founder.name}</h2>
                {founder.whyNow && <p className={s.whyNow}>{founder.whyNow}</p>}
              </div>
              <button className={s.closeBtn} onClick={onClose} aria-label="Close drawer">✕</button>
            </div>
            <div className={s.pillRow}>
              <FounderReviewStateBadge status={founder.reviewState.status} />
              {(founder.rawPayload?.fund_tags ?? []).map((t, i) => {
                const key = getFundTag(t);
                return <span key={`${key}-${i}`} className={s.fundPill}>{FUND_LABEL[key] ?? key}</span>;
              })}
              {founder.labOsProfile && (
                <LabOsBadge profile={founder.labOsProfile as never} variant="chip" />
              )}
            </div>
          </div>

          {/* Fund Tags & Scores */}
          <div className={s.section}>
            <h3 className={s.sectionTitle}>Scores</h3>
            <dl className={s.kv}>
              <dt>Alignment</dt>
              <dd>{founder.alignmentMax !== undefined && founder.alignmentMax !== null ? founder.alignmentMax.toFixed(2) : <span className={s.muted}>Not measured</span>}</dd>
              <dt>PLVS Score</dt>
              <dd>{founder.plvsScore !== undefined && founder.plvsScore !== null ? founder.plvsScore.toFixed(2) : <span className={s.muted}>Not measured</span>}</dd>
            </dl>
          </div>

          {/* Sources & Provenance */}
          <CollapsibleSection title="Sources & Provenance">
            {(founder.rawPayload?.provenance ?? []).length === 0 ? (
              <p className={s.muted}>No sources recorded.</p>
            ) : (
              <ul className={s.sourceList}>
                {(founder.rawPayload.provenance ?? []).map((src, i) => (
                  <li key={i} className={s.sourceItem}>
                    <span className={s.sourceName}>
                      {src.url ? (
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className={s.link}>
                          {src.name} ↗
                        </a>
                      ) : src.name}
                    </span>
                    {src.confidence !== undefined && (
                      <span className={s.confidence}>{Math.round(src.confidence * 100)}% confidence</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleSection>

          {/* Quality / Evidence */}
          {founder.rawPayload?.quality && (
            <div className={s.section}>
              <h3 className={s.sectionTitle}>Quality & Evidence</h3>
              <dl className={s.kv}>
                {founder.rawPayload.quality.signal_strength !== undefined && (
                  <>
                    <dt>Signal strength</dt>
                    <dd>{founder.rawPayload.quality.signal_strength.toFixed(2)}</dd>
                  </>
                )}
                {founder.rawPayload.quality.evidence_count !== undefined && (
                  <>
                    <dt>Evidence count</dt>
                    <dd>{founder.rawPayload.quality.evidence_count}</dd>
                  </>
                )}
              </dl>
              {founder.rawPayload.quality.thin_evidence && (
                <span className={s.warningBadge}>⚠ Thin evidence</span>
              )}
            </div>
          )}

          {/* Network & Intent */}
          {founder.rawPayload?.network && (
            <div className={s.section}>
              <h3 className={s.sectionTitle}>Network & Intent</h3>
              {(founder.rawPayload.network.warm_intros ?? []).length > 0 && (
                <>
                  <p className={s.subLabel}>Warm intros</p>
                  <ul className={s.chipList}>
                    {founder.rawPayload.network.warm_intros!.map((intro, i) => (
                      <li key={i} className={s.chip}>{intro}</li>
                    ))}
                  </ul>
                </>
              )}
              {(founder.rawPayload.network.intent_signals ?? []).length > 0 && (
                <>
                  <p className={s.subLabel}>Intent signals</p>
                  <ul className={s.chipList}>
                    {founder.rawPayload.network.intent_signals!.map((sig, i) => (
                      <li key={i} className={s.chip}>{sig}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {/* Reputation Flags */}
          {(founder.rawPayload?.reputation?.flags ?? []).length > 0 && (
            <div className={s.section}>
              <h3 className={s.sectionTitle}>Reputation Flags</h3>
              <ul className={s.chipList}>
                {founder.rawPayload.reputation!.flags!.map((flag, i) => (
                  <li key={i} className={s.warningChip}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* IC Framework */}
          {founder.rawPayload?.ic_framework && Object.keys(founder.rawPayload.ic_framework).length > 0 && (
            <CollapsibleSection title="IC Framework">
              <dl className={s.kv}>
                {Object.entries(founder.rawPayload.ic_framework).map(([k, v]) => (
                  <React.Fragment key={k}>
                    <dt>{k}</dt>
                    <dd>{String(v)}</dd>
                  </React.Fragment>
                ))}
              </dl>
            </CollapsibleSection>
          )}

          {/* Review Actions */}
          {canEdit && (
            <div className={s.section}>
              <h3 className={s.sectionTitle}>Review</h3>
              <ReviewActionsPanel founderId={founder.founderId} currentStatus={founder.reviewState.status} />
            </div>
          )}
        </div>
      )}
    </Drawer>
  );
}

