'use client';

import React, { useRef, useState } from 'react';
import { Dialog } from '@base-ui-components/react/dialog';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { LabOsBadge } from '@/components/page/investors/LabOsBadge/LabOsBadge';
import { FounderReviewStateBadge } from '@/components/page/founders/FounderReviewStateBadge/FounderReviewStateBadge';
import { FounderSignalBadges } from '@/components/page/founders/FounderSignalBadges/FounderSignalBadges';
import {
  FUND_LABEL,
  REVIEW_CHANNEL_LABEL,
  PLATFORM_FEEDBACK_AREAS,
  RECORD_QUALITY_FIELDS,
} from '@/services/founders/constants';
import { founderHeadline, getFundTag } from '@/services/founders/types';
import type { FounderDetail, FounderStatus, ReviewChannel, PlvsFeatures } from '@/services/founders/types';
import s from '@/components/page/founders/FounderDrawer/FounderDrawer.module.scss';
import r from '@/components/page/founders/ReviewActionsPanel/ReviewActionsPanel.module.scss';
import { AlignmentLevel } from './AlignmentLevel';
import { mockFounders } from './mocks';
import d from './FounderDrawerMock.module.scss';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={s.section}>
      <h3 className={s.sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
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

function PlvsFeatureGrid({ features }: { features: PlvsFeatures }) {
  const rows: [string, number | undefined][] = [
    ['Domain match', features.domainMatch],
    ['Corroboration', features.corroboration],
    ['Technical depth', features.technicalDepth],
    ['Stage fit', features.stageFit],
    ['Trajectory', features.trajectory],
    ['Recency', features.recency],
  ];
  return (
    <div className={s.featureGrid}>
      {rows.map(([label, val]) =>
        val !== undefined ? (
          <div key={label} className={s.featureRow}>
            <span className={s.featureLabel}>{label}</span>
            <span className={s.featureVal}>+{val}</span>
          </div>
        ) : null,
      )}
    </div>
  );
}

// Mutation-free copy of the new channel-based ReviewActionsPanel. Approve / Reject /
// Feedback open a dialog; "Save" records to local prototype state instead of the API.
type ReviewAction = 'feedback' | 'approve' | 'reject';

function ReviewActionsPanelMock() {
  const [openAction, setOpenAction] = useState<ReviewAction | null>(null);
  const [note, setNote] = useState('');
  const [feedbackChannel, setFeedbackChannel] = useState<ReviewChannel>('record-quality');
  const [recordField, setRecordField] = useState<string>(RECORD_QUALITY_FIELDS[0]);
  const [platformArea, setPlatformArea] = useState<string>(PLATFORM_FEEDBACK_AREAS[0]);
  const [recorded, setRecorded] = useState<string | null>(null);

  const closeModal = () => setOpenAction(null);

  const submit = () => {
    if (!openAction) return;
    const label = openAction === 'approve' ? 'Approved' : openAction === 'reject' ? 'Rejected' : 'Feedback recorded';
    setRecorded(`${label} (prototype — not persisted)`);
    setNote('');
    closeModal();
    setTimeout(() => setRecorded(null), 2500);
  };

  const modalTitle =
    openAction === 'approve' ? 'Approve founder' : openAction === 'reject' ? 'Reject founder' : 'Leave feedback';

  return (
    <div className={r.wrap}>
      <div className={r.actions}>
        <button type="button" className={r.btnSecondary} onClick={() => setOpenAction('feedback')}>
          Feedback
        </button>
        <button type="button" className={r.btnApprove} onClick={() => setOpenAction('approve')}>
          Approve
        </button>
        <button type="button" className={r.btnReject} onClick={() => setOpenAction('reject')}>
          Reject
        </button>
      </div>
      {recorded && <div className={r.charCount}>✓ {recorded}</div>}

      <Dialog.Root open={openAction !== null} onOpenChange={(next) => !next && closeModal()}>
        <Dialog.Portal>
          <Dialog.Backdrop className={r.backdrop} />
          <Dialog.Popup className={r.modal}>
            <Dialog.Title className={r.modalTitle}>{modalTitle}</Dialog.Title>

            {openAction === 'feedback' && (
              <div className={r.modalFields}>
                <label className={r.fieldLabel}>
                  Feedback type
                  <select
                    className={r.select}
                    value={feedbackChannel}
                    onChange={(e) => setFeedbackChannel(e.target.value as ReviewChannel)}
                  >
                    <option value="record-quality">{REVIEW_CHANNEL_LABEL['record-quality']}</option>
                    <option value="platform">{REVIEW_CHANNEL_LABEL.platform}</option>
                  </select>
                </label>
                {feedbackChannel === 'record-quality' && (
                  <label className={r.fieldLabel}>
                    Field
                    <select className={r.select} value={recordField} onChange={(e) => setRecordField(e.target.value)}>
                      {RECORD_QUALITY_FIELDS.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {feedbackChannel === 'platform' && (
                  <label className={r.fieldLabel}>
                    Area
                    <select className={r.select} value={platformArea} onChange={(e) => setPlatformArea(e.target.value)}>
                      {PLATFORM_FEEDBACK_AREAS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}

            <label className={r.fieldLabel} htmlFor="review-note">
              Comment <span className={r.optional}>(optional)</span>
            </label>
            <textarea
              id="review-note"
              className={r.noteInput}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note for the team…"
              maxLength={500}
              rows={4}
            />
            <div className={r.charCount}>{note.length}/500</div>

            <div className={r.modalFooter}>
              <button type="button" className={r.btnSecondary} onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className={r.btnPrimary} onClick={submit}>
                Save
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

function DrawerBody({ founder, onClose }: { founder: FounderDetail; onClose: () => void }) {
  const raw = founder.rawPayload;
  const headline = founderHeadline(founder);
  const pedigree = founder.pedigree ?? raw?.pedigree;
  const review = founder.reviewState;
  const fundTags = raw?.fund_tags ?? [];
  const provenance = raw?.provenance ?? [];
  const plvsFeatures = raw?.plvs_features;
  const extIds = raw?.external_ids ?? {};
  const verificationRationale = raw?.verification_rationale ?? [];

  return (
    <div className={s.content}>
      {/* Header */}
      <div className={s.header}>
        <div className={s.headerTop}>
          <div className={s.headerWho}>
            {headline && <p className={s.headlinePrimary}>{headline}</p>}
            <h2 className={s.nameSecondary}>{founder.name}</h2>
            {pedigree && <p className={s.pedigreeLine}>{pedigree}</p>}
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close drawer">
            ✕
          </button>
        </div>
        <FounderSignalBadges founder={founder} />
        <div className={s.pillRow}>
          <FounderReviewStateBadge status={founder.reviewState.status} />
          {fundTags.map((t, i) => {
            const key = getFundTag(t);
            if (!key) return null;
            return (
              <span key={`${key}-${i}`} className={s.fundPill}>
                {FUND_LABEL[key] ?? key}
              </span>
            );
          })}
          {founder.labOsProfile && <LabOsBadge profile={founder.labOsProfile} variant="chip" />}
        </div>
      </div>

      {/* Fit summary — the decision numbers, surfaced at the top (not buried in a
          collapsed section). Alignment reuses the table's magnitude bar. */}
      <div className={d.fitSummary}>
        {founder.alignmentMax !== undefined && founder.alignmentMax !== null && (
          <div className={d.fitBarRow}>
            <span className={d.fitLabel}>Alignment</span>
            <AlignmentLevel value={founder.alignmentMax} size="lg" />
          </div>
        )}
        <div className={d.fitMetrics}>
          <div className={d.fitMetric}>
            <span className={d.fitMetricLabel}>PLVS</span>
            <span className={d.fitMetricValue}>
              {founder.plvsScore !== undefined && founder.plvsScore !== null ? (
                founder.plvsScore
              ) : (
                <span className={d.fitMuted}>—</span>
              )}
              {founder.plvsRecommendation && <span className={d.fitRecommendation}>{founder.plvsRecommendation}</span>}
            </span>
          </div>
          <div className={d.fitMetric}>
            <span className={d.fitMetricLabel}>PLN proximity</span>
            <span className={d.fitMetricValue}>
              {founder.plnProximity !== undefined && founder.plnProximity !== null ? (
                `${Math.round(founder.plnProximity * 100)}%`
              ) : (
                <span className={d.fitMuted}>—</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Profile links */}
      {(founder.github || founder.website || founder.linkedin || founder.twitter) && (
        <Section title="Links">
          <div className={s.linkRow}>
            {founder.github && (
              <a href={`https://github.com/${founder.github}`} target="_blank" rel="noopener noreferrer" className={s.link}>
                github.com/{founder.github} ↗
              </a>
            )}
            {founder.website && (
              <a href={founder.website} target="_blank" rel="noopener noreferrer" className={s.link}>
                {founder.website.replace(/^https?:\/\//, '')} ↗
              </a>
            )}
            {founder.linkedin && (
              <a href={founder.linkedin} target="_blank" rel="noopener noreferrer" className={s.link}>
                LinkedIn ↗
              </a>
            )}
            {founder.twitter && (
              <a href={`https://twitter.com/${founder.twitter}`} target="_blank" rel="noopener noreferrer" className={s.link}>
                @{founder.twitter} ↗
              </a>
            )}
          </div>
        </Section>
      )}

      {/* Bio & topics */}
      {founder.bio && (
        <Section title="Bio">
          <p className={s.bio}>{founder.bio}</p>
          {(founder.topics ?? []).length > 0 && (
            <div className={s.chipList}>
              {founder.topics!.map((t) => (
                <span key={t} className={s.chip}>
                  {t}
                </span>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Affinity-stage detail (scores) — the breakdown behind the fit summary above. */}
      <CollapsibleSection title="Affinity-stage detail" defaultOpen>
        <dl className={s.kv}>
          <dt>Alignment</dt>
          <dd>
            {founder.alignmentMax !== undefined && founder.alignmentMax !== null ? (
              `${Math.round(founder.alignmentMax * 100)}%`
            ) : (
              <span className={s.muted}>—</span>
            )}
          </dd>
          <dt>PLVS Score</dt>
          <dd>
            {founder.plvsScore !== undefined && founder.plvsScore !== null ? founder.plvsScore : <span className={s.muted}>—</span>}
            {founder.plvsRecommendation && <span className={s.recommendation}>{founder.plvsRecommendation}</span>}
          </dd>
          <dt>PLN Proximity</dt>
          <dd>
            {founder.plnProximity !== undefined && founder.plnProximity !== null ? (
              founder.plnProximity.toFixed(2)
            ) : (
              <span className={s.muted}>—</span>
            )}
          </dd>
        </dl>
        {plvsFeatures && <PlvsFeatureGrid features={plvsFeatures} />}
      </CollapsibleSection>

      {/* Sources & Provenance */}
      <CollapsibleSection title={`Sources & provenance (${provenance.length})`} defaultOpen>
        {provenance.length === 0 ? (
          <p className={s.muted}>No provenance recorded.</p>
        ) : (
          <ul className={s.sourceList}>
            {provenance.map((p, i) => (
              <li key={i} className={s.sourceItem}>
                <div className={s.sourceTop}>
                  <span className={s.sourceTag}>{p.source}</span>
                  {p.match_confidence !== undefined && <span className={s.confidence}>{Math.round(p.match_confidence * 100)}%</span>}
                </div>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className={s.sourceUrl}>
                  {p.url} ↗
                </a>
                {(p.matched_anchors ?? []).length > 0 && (
                  <div className={s.anchorRow}>
                    {p.matched_anchors!.map((a) => (
                      <span key={a} className={s.anchor}>
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CollapsibleSection>

      {/* Verification */}
      {(raw?.verification_status || verificationRationale.length > 0) && (
        <Section title="Verification">
          {raw?.verification_status && <span className={s.verificationBadge}>{raw.verification_status}</span>}
          {verificationRationale.length > 0 && (
            <ul className={s.rationaleList}>
              {verificationRationale.map((rationale, i) => (
                <li key={i}>{rationale}</li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {/* External IDs */}
      {Object.keys(extIds).length > 0 && (
        <Section title="External IDs">
          <dl className={s.kv}>
            {Object.entries(extIds).map(([k, v]) => (
              <React.Fragment key={k}>
                <dt>{k}</dt>
                <dd className={s.mono}>{v}</dd>
              </React.Fragment>
            ))}
          </dl>
        </Section>
      )}

      {/* Review notes (read-only record of a prior decision) */}
      {(review.channel || review.field || review.area || review.note || review.decided_at) && (
        <Section title="Review notes">
          <dl className={s.kv}>
            {review.channel && (
              <>
                <dt>Channel</dt>
                <dd>{REVIEW_CHANNEL_LABEL[review.channel] ?? review.channel}</dd>
              </>
            )}
            {review.field && (
              <>
                <dt>Field</dt>
                <dd>{review.field}</dd>
              </>
            )}
            {review.area && (
              <>
                <dt>Area</dt>
                <dd>{review.area}</dd>
              </>
            )}
            {review.note && (
              <>
                <dt>Note</dt>
                <dd>{review.note}</dd>
              </>
            )}
            {review.decided_at && (
              <>
                <dt>Decided</dt>
                <dd>{new Date(review.decided_at).toLocaleString()}</dd>
              </>
            )}
          </dl>
        </Section>
      )}

      {/* Review actions — pinned to the bottom so Approve is always reachable
          without scrolling past every record section. */}
      <div className={d.actionFooter}>
        <p className={d.actionFooterTitle}>Review</p>
        <ReviewActionsPanelMock />
      </div>
    </div>
  );
}

export default function FounderDrawerMock({ founderId, onClose }: { founderId: string | null; onClose: () => void }) {
  const founder = founderId ? mockFounders.find((f) => f.founderId === founderId) : undefined;

  return (
    <Drawer isOpen={!!founderId} onClose={onClose} width={720}>
      {!founder && founderId && <div className={s.loading}>Founder not found.</div>}
      {founder && <DrawerBody key={founderId} founder={founder} onClose={onClose} />}
    </Drawer>
  );
}
