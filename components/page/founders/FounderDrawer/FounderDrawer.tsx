'use client';

import React, { useRef, useState } from 'react';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { useGetFounderById } from '@/services/founders/hooks/useGetFounderById';
import { LabOsBadge } from '@/components/page/investors/LabOsBadge/LabOsBadge';
import { FounderReviewStateBadge } from '../FounderReviewStateBadge/FounderReviewStateBadge';
import { ReviewActionsPanel } from '../ReviewActionsPanel/ReviewActionsPanel';
import { FUND_LABEL } from '@/services/founders/constants';
import { getFundTag } from '@/services/founders/types';
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

export function FounderScoringModal({ open, onClose, triggerRef }: {
  open: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  if (!open) return null;

  const handleClose = () => {
    onClose();
    triggerRef.current?.focus();
  };

  return (
    <Drawer isOpen={open} onClose={handleClose} width={520} noBlur>
      <div
        className={s.scoringBody}
        id="founder-scoring-panel"
        aria-labelledby="founder-scoring-title"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            handleClose();
          }
        }}
      >
        <header className={s.scoringHeader}>
          <h2 id="founder-scoring-title" className={s.scoringTitle}>Score methodology</h2>
          <button type="button" className={s.scoringClose} onClick={handleClose} aria-label="Close">✕</button>
        </header>

        <section className={s.scoringSection}>
          <h3 className={s.scoringH3}>Alignment Score</h3>
          <p className={s.scoringLead}>
            A 0–100% confidence score showing how strongly this founder matches the thesis of their
            best-matched fund (PLVS, Neuro Tech, or Crypto). The classifier reads the founder&apos;s bio,
            extracted topics, and signal keywords against each fund&apos;s thesis vocabulary. Alignment
            shows the highest confidence across all fund tags assigned to this person.
          </p>
          <div className={s.scoringNote}>
            Alignment is not PLN proximity. PLN proximity (shown as a badge) measures graph-distance
            to the Protocol Labs network — these are separate signals.
          </div>
        </section>

        <section className={s.scoringSection}>
          <h3 className={s.scoringH3}>PLVS Score</h3>
          <p className={s.scoringLead}>
            A deterministic, weight-pinned 0–100 investment score computed only for founders tagged
            to the PLVS fund. Same inputs always produce the same score — no model drift, fully
            auditable. Each component contributes up to its cap; caps sum to 100.
          </p>
          <table className={s.scoringTable}>
            <thead>
              <tr>
                <th>Component</th>
                <th className={s.scoringRight}>Max pts</th>
                <th>What it measures</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Domain Match</td>
                <td className={s.scoringRight}>30</td>
                <td>Overlap with PLVS thesis vocabulary (agent, llm-infra, ai-native, etc.). The single biggest driver.</td>
              </tr>
              <tr>
                <td>Technical Depth</td>
                <td className={s.scoringRight}>20</td>
                <td>Engineering-rigor proxies: GitHub followers, stargazers, h-index, repo count</td>
              </tr>
              <tr>
                <td>Stage Fit</td>
                <td className={s.scoringRight}>15</td>
                <td>Intent ladder — just-shipped / stealth-launching scores highest; default (no signal) scores lowest</td>
              </tr>
              <tr>
                <td>Corroboration</td>
                <td className={s.scoringRight}>15</td>
                <td>Distinct sources that independently surfaced this founder — more sources, more trust</td>
              </tr>
              <tr>
                <td>Recency</td>
                <td className={s.scoringRight}>10</td>
                <td>Exponential decay, 24-month half-life. Academic-to-founder paths remain scorable longer.</td>
              </tr>
              <tr>
                <td>Trajectory</td>
                <td className={s.scoringRight}>10</td>
                <td>Growth velocity in followers, commits, and citations</td>
              </tr>
            </tbody>
          </table>
          <div className={s.scoringNote}>
            Network signals — PLN proximity and PL alignment — are not part of this score. They
            appear as separate badges on the founder card and act as tie-breakers only.
          </div>
        </section>
      </div>
    </Drawer>
  );
}

function DrawerBody({ founder, canEdit, onClose }: { founder: FounderDetail; canEdit: boolean; onClose: () => void }) {
  const [scoringOpen, setScoringOpen] = useState(false);
  const scoringTriggerRef = useRef<HTMLButtonElement>(null);

  const raw = founder.rawPayload;
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
            <h2 className={s.name}>{founder.name}</h2>
            {founder.whyNow && <p className={s.whyNow}>{founder.whyNow}</p>}
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close drawer">✕</button>
        </div>
        <div className={s.pillRow}>
          <FounderReviewStateBadge status={founder.reviewState.status} />
          {fundTags.map((t, i) => {
            const key = getFundTag(t);
            if (!key) return null;
            return <span key={`${key}-${i}`} className={s.fundPill}>{FUND_LABEL[key] ?? key}</span>;
          })}
          {founder.labOsProfile && <LabOsBadge profile={founder.labOsProfile} variant="chip" />}
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
              {founder.topics!.map((t) => <span key={t} className={s.chip}>{t}</span>)}
            </div>
          )}
        </Section>
      )}

      {/* Scores */}
      <div className={s.section}>
        <div className={s.sectionHeaderRow}>
          <h3 className={s.sectionTitle}>Scores</h3>
          <button
            ref={scoringTriggerRef}
            type="button"
            className={s.howScoredLink}
            onClick={() => setScoringOpen(true)}
            aria-expanded={scoringOpen}
            aria-controls="founder-scoring-panel"
          >
            How are scores calculated?
          </button>
        </div>
        <dl className={s.kv}>
          <dt>Alignment</dt>
          <dd>{founder.alignmentMax !== undefined && founder.alignmentMax !== null
            ? `${Math.round(founder.alignmentMax * 100)}%`
            : <span className={s.muted}>—</span>}
          </dd>
          <dt>PLVS Score</dt>
          <dd>
            {founder.plvsScore !== undefined && founder.plvsScore !== null ? founder.plvsScore : <span className={s.muted}>—</span>}
            {founder.plvsRecommendation && <span className={s.recommendation}>{founder.plvsRecommendation}</span>}
          </dd>
          <dt>PLN Proximity</dt>
          <dd>{founder.plnProximity !== undefined && founder.plnProximity !== null
            ? founder.plnProximity.toFixed(2)
            : <span className={s.muted}>—</span>}
          </dd>
        </dl>
        {plvsFeatures && <PlvsFeatureGrid features={plvsFeatures} />}
      </div>

      {/* Warm intros */}
      {warmIntros.length > 0 && (
        <Section title={`Warm intros (${warmIntros.length})`}>
          <ul className={s.introList}>
            {warmIntros.map((w, i) => (
              <li key={i} className={s.introItem}>
                <span className={s.introVia}>{w.via_display}</span>
                <span className={s.introKind}>{w.kind} · distance {w.distance}</span>
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
                    {p.matched_anchors!.map((a) => <span key={a} className={s.anchor}>{a}</span>)}
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
          {raw?.verification_status && (
            <span className={s.verificationBadge}>{raw.verification_status}</span>
          )}
          {verificationRationale.length > 0 && (
            <ul className={s.rationaleList}>
              {verificationRationale.map((r, i) => <li key={i}>{r}</li>)}
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

      {/* Review Actions */}
      {canEdit && (
        <Section title="Review">
          <ReviewActionsPanel
            founderId={founder.founderId}
            currentStatus={founder.reviewState.status}
            currentFeedback={founder.reviewState.feedback}
            currentNote={founder.reviewState.note}
          />
        </Section>
      )}

      <FounderScoringModal
        open={scoringOpen}
        onClose={() => setScoringOpen(false)}
        triggerRef={scoringTriggerRef}
      />
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
