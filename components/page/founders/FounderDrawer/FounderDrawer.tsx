'use client';

import React, { useState } from 'react';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { useGetFounderById } from '@/services/founders/hooks/useGetFounderById';
import { LabOsBadge } from '@/components/page/investors/LabOsBadge/LabOsBadge';
import { FounderReviewStateBadge } from '../FounderReviewStateBadge/FounderReviewStateBadge';
import { ReviewActionsPanel } from '../ReviewActionsPanel/ReviewActionsPanel';
import { FUND_LABEL, REVIEW_CHANNEL_LABEL } from '@/services/founders/constants';
import { founderHeadline, getFundTag } from '@/services/founders/types';
import { FounderSignalBadges } from '../FounderSignalBadges/FounderSignalBadges';
import type { FounderDetail, PlvsFeatures } from '@/services/founders/types';
import s from './FounderDrawer.module.scss';

interface Props {
  founderId: string | null;
  onClose: () => void;
  canEdit: boolean;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={s.section}>
      <h3 className={s.sectionTitle}>{title}</h3>
      {children}
    </div>
  );
}

function CollapsibleSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
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

function DrawerBody({ founder, canEdit, onClose }: { founder: FounderDetail; canEdit: boolean; onClose: () => void }) {
  const raw = founder.rawPayload;
  const headline = founderHeadline(founder);
  const pedigree = founder.pedigree ?? raw?.pedigree;
  const review = founder.reviewState;
  const fundTags = raw?.fund_tags ?? [];
  const provenance = raw?.provenance ?? [];
  const warmIntros = raw?.warm_intro_paths ?? [];
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

      {/* Profile links */}
      {(founder.github || founder.website || founder.linkedin || founder.twitter) && (
        <Section title="Links">
          <div className={s.linkRow}>
            {founder.github && (
              <a
                href={`https://github.com/${founder.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className={s.link}
              >
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
              <a
                href={`https://twitter.com/${founder.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className={s.link}
              >
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

      <CollapsibleSection title="Affinity-stage detail">
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
            {founder.plvsScore !== undefined && founder.plvsScore !== null ? (
              founder.plvsScore
            ) : (
              <span className={s.muted}>—</span>
            )}
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

      {/* Warm intros */}
      {warmIntros.length > 0 && (
        <Section title={`Warm intros (${warmIntros.length})`}>
          <ul className={s.introList}>
            {warmIntros.map((w, i) => (
              <li key={i} className={s.introItem}>
                <span className={s.introVia}>{w.via_display}</span>
                <span className={s.introKind}>
                  {w.kind} · distance {w.distance}
                </span>
                <span className={s.introEvidence}>{w.evidence}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Sources & Provenance */}
      <CollapsibleSection title={`Sources & provenance (${provenance.length})`}>
        {provenance.length === 0 ? (
          <p className={s.muted}>No provenance recorded.</p>
        ) : (
          <ul className={s.sourceList}>
            {provenance.map((p, i) => (
              <li key={i} className={s.sourceItem}>
                <div className={s.sourceTop}>
                  <span className={s.sourceTag}>{p.source}</span>
                  {p.match_confidence !== undefined && (
                    <span className={s.confidence}>{Math.round(p.match_confidence * 100)}%</span>
                  )}
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
              {verificationRationale.map((r, i) => (
                <li key={i}>{r}</li>
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

      {canEdit && (
        <Section title="Review">
          <ReviewActionsPanel founderId={founder.founderId} currentStatus={founder.reviewState.status} />
        </Section>
      )}
    </div>
  );
}

export default function FounderDrawer({ founderId, onClose, canEdit }: Props) {
  const { data: founder, isLoading } = useGetFounderById(founderId);

  return (
    <Drawer isOpen={!!founderId} onClose={onClose} width={720}>
      {isLoading && <div className={s.loading}>Loading…</div>}
      {!isLoading && !founder && founderId && <div className={s.loading}>Founder not found.</div>}
      {founder && <DrawerBody key={founderId} founder={founder as FounderDetail} canEdit={canEdit} onClose={onClose} />}
    </Drawer>
  );
}
