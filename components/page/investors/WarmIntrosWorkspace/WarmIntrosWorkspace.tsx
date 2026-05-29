'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueryStates } from 'nuqs';
import clsx from 'clsx';
import { useGetCoInvestorTeams } from '@/services/investors/hooks/useGetCoInvestorTeams';
import { useFindWarmIntros } from '@/services/investors/hooks/useFindWarmIntros';
import { useInvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import { investorsFilterParsers } from '@/app/investors/(investors-page)/searchParams';

import {
  CHECK_SIZE_RANGES,
  INDUSTRY_SECTOR_LABEL,
  SECTOR_TAGS,
  SECTOR_TAG_LABEL,
  STAGE_FOCUSES,
  STAGE_FOCUS_LABEL,
} from '@/services/investors/constants';

import type {
  CheckSizeRange,
  SectorTag,
  StageFocus,
  WarmIntroCandidate,
  WarmIntrosParams,
} from '@/services/investors/types';
import { LabOsBadge } from '../LabOsBadge/LabOsBadge';
import { EngagementTierBadge } from '../EngagementTierBadge/EngagementTierBadge';
import { EmailStatusPill } from '../EmailStatusPill/EmailStatusPill';
import { exportInvestorsCsv } from '../utils/exportCsv';
import { ScoringMethodologyModal } from './ScoringMethodologyModal';
import s from './WarmIntrosWorkspace.module.scss';

interface Props {
  onCountChange?: (count: number) => void;
}

export function WarmIntrosWorkspace({ onCountChange }: Props) {
  const access = useInvestorsAccess();
  const [filters, setFilters] = useQueryStates(investorsFilterParsers, {
    history: 'replace',
    shallow: true,
  });

  const { data: teams } = useGetCoInvestorTeams(access.canView);

  const teamId = filters.wi_team_id;
  const team = teamId && teams ? teams.find((t) => t.team_id === teamId) : undefined;

  // Auto-fill criteria from selected team unless user has overridden them
  const effectiveStage = (filters.wi_stage || team?.raising_now || team?.pl_invested_stage) as StageFocus | '';
  const effectiveSectors: SectorTag[] = useMemo(
    () => (filters.wi_sectors.length ? (filters.wi_sectors as SectorTag[]) : (team?.sectors ?? [])),
    [filters.wi_sectors, team?.sectors],
  );
  const effectiveCheckSize = (filters.wi_check_size || '') as CheckSizeRange | '';

  const params: WarmIntrosParams = useMemo(
    () => ({
      team_id: teamId || undefined,
      stage_focus: effectiveStage || undefined,
      sector_tags: effectiveSectors.length ? effectiveSectors : undefined,
      check_size_range: effectiveCheckSize || undefined,
    }),
    [teamId, effectiveStage, effectiveSectors, effectiveCheckSize],
  );

  const enabled = access.canView && (!!teamId || effectiveSectors.length > 0);
  const { data, isLoading } = useFindWarmIntros(params, enabled);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scoringOpen, setScoringOpen] = useState(false);
  const [activeTier, setActiveTier] = useState<WarmIntroCandidate['tier']>('co_invested');

  const candidates = useMemo(() => data?.candidates ?? [], [data]);

  useEffect(() => {
    if (data) onCountChange?.(candidates.length);
  }, [candidates.length, data, onCountChange]);

  const grouped = useMemo(() => {
    const out: Record<WarmIntroCandidate['tier'], WarmIntroCandidate[]> = {
      co_invested: [],
      engaged: [],
      cold_match: [],
    };
    for (const c of candidates) out[c.tier].push(c);
    return out;
  }, [candidates]);

  // If the active tab becomes empty (results changed), fall back to the first non-empty tier.
  const TIERS = ['co_invested', 'engaged', 'cold_match'] as const;
  const displayTier: WarmIntroCandidate['tier'] =
    grouped[activeTier].length > 0 ? activeTier : (TIERS.find((t) => grouped[t].length > 0) ?? activeTier);

  const toggleSector = (sec: SectorTag) => {
    const cur = filters.wi_sectors;
    const next = cur.includes(sec) ? cur.filter((x) => x !== sec) : [...cur, sec];
    setFilters({ wi_sectors: next.length ? next : null });
  };

  const reset = () => {
    setFilters({
      wi_team_id: null,
      wi_stage: null,
      wi_sectors: null,
      wi_check_size: null,
    });
    setSelectedIds(new Set());
  };

  const exportSelectedCsv = () => {
    const rows = candidates.filter((c) => selectedIds.has(c.investor.investor_id)).map((c) => c.investor);
    if (rows.length === 0) return;
    const cols = [
      'name',
      'firm',
      'title',
      'email',
      'investor_type',
      'stage_focus',
      'sector_tags',
      'engagement_tier',
      'email_status',
    ];
    const filename = `warm-intros-${team ? team.team_name.toLowerCase().replace(/\s+/g, '-') : 'manual'}-${new Date().getTime()}.csv`;
    exportInvestorsCsv(rows, cols, filename);
  };

  return (
    <div className={s.root}>
      <section className={s.builder}>
        <header className={s.builderH}>
          <div className={s.builderTitleRow}>
            <h2 className={s.title}>Find warm investor intros</h2>
            <button
              type="button"
              className={s.howScoredLink}
              onClick={() => setScoringOpen(true)}
              aria-label="How are candidates ranked?"
            >
              How is the Fit score calculated?
            </button>
          </div>
          <p className={s.desc}>
            Use any combination of filters below to see investor intro paths sorted by Fit score.
          </p>
        </header>

        <div className={s.builderRow}>
          <div className={s.field}>
            <label className={s.label}>Portfolio team</label>
            <select
              className={s.select}
              value={teamId}
              onChange={(e) => setFilters({ wi_team_id: e.target.value || null })}
            >
              <option value="">— or set criteria manually —</option>
              {teams?.map((t) => (
                <option key={t.team_id} value={t.team_id}>
                  {t.team_name} · PL invested {STAGE_FOCUS_LABEL[t.pl_invested_stage]}
                  {t.raising_now && t.raising_now !== t.pl_invested_stage
                    ? ` · raising ${STAGE_FOCUS_LABEL[t.raising_now]}`
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <div className={s.field}>
            <label className={s.label}>Stage focus</label>
            <select
              className={s.select}
              value={effectiveStage}
              onChange={(e) => setFilters({ wi_stage: e.target.value || null })}
            >
              <option value="">Any</option>
              {STAGE_FOCUSES.filter((st) => st !== 'unknown').map((st) => (
                <option key={st} value={st}>
                  {STAGE_FOCUS_LABEL[st]}
                </option>
              ))}
            </select>
          </div>

          <div className={s.field}>
            <label className={s.label}>Check size</label>
            <select
              className={s.select}
              value={effectiveCheckSize}
              onChange={(e) => setFilters({ wi_check_size: e.target.value || null })}
            >
              <option value="">Any</option>
              {CHECK_SIZE_RANGES.filter((c) => c !== 'unknown').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className={s.actions}>
            <button className={s.btn} onClick={reset}>
              Reset
            </button>
          </div>
        </div>

        <div className={s.field} style={{ marginTop: 12 }}>
          <label className={s.label}>{INDUSTRY_SECTOR_LABEL}</label>
          <div className={s.sectorChips}>
            {SECTOR_TAGS.map((sec) => (
              <button
                key={sec}
                className={clsx(s.chip, effectiveSectors.includes(sec) && s.chipOn)}
                onClick={() => toggleSector(sec)}
              >
                {SECTOR_TAG_LABEL[sec]}
              </button>
            ))}
          </div>
        </div>

        {team && (
          <div className={s.summary}>
            <strong>Auto-pulled from {team.team_name}:</strong>
            <span>
              <span className={s.auto}>stage</span> {STAGE_FOCUS_LABEL[team.raising_now ?? team.pl_invested_stage]} ·{' '}
              <span className={s.auto}>sectors</span> {team.sectors.join(', ')} · <span className={s.auto}>geo</span>{' '}
              {team.geo}
            </span>
          </div>
        )}
      </section>

      {!enabled && (
        <div className={s.placeholder}>
          <div className={s.placeholderIcon}>⚡</div>
          <div className={s.placeholderTitle}>Pick a team or set criteria to start</div>
          <div className={s.placeholderDesc}>
            Once you select a portfolio team or pick at least one sector, candidates appear here ranked by warmth.
          </div>
        </div>
      )}

      {enabled && (
        <section className={s.results}>
          <div className={s.resultsHeader}>
            <div className={s.resultsCount}>
              {isLoading ? (
                'Searching…'
              ) : (
                <>
                  <strong>{candidates.length} candidates</strong> · ranked by warmth + sector fit
                </>
              )}
            </div>
            <div className={s.resultsActions}>
              <button type="button" className={s.howScoredLink} onClick={() => setScoringOpen(true)}>
                How is the Fit score calculated?
              </button>
              {access.canEdit && (
                <button className={s.btnPrimary} onClick={exportSelectedCsv} disabled={selectedIds.size === 0}>
                  ⤓ Export CSV ({selectedIds.size})
                </button>
              )}
            </div>
          </div>

          <div className={s.tabs}>
            {TIERS.map((tier) => {
              const count = grouped[tier].length;
              const isActive = displayTier === tier;
              return (
                <button
                  key={tier}
                  className={clsx(s.tab, isActive && s.tabActive)}
                  disabled={count === 0}
                  onClick={() => setActiveTier(tier)}
                >
                  {TIER_META[tier].label}
                  <span className={clsx(s.tabCount, isActive && s.tabCountActive)}>{count}</span>
                </button>
              );
            })}
          </div>

          {grouped[displayTier].length > 0 && (
            <TierSection
              tier={displayTier}
              candidates={grouped[displayTier]}
              selectedIds={selectedIds}
              onToggleSelected={(id) => {
                const next = new Set(selectedIds);
                next.has(id) ? next.delete(id) : next.add(id);
                setSelectedIds(next);
              }}
              onOpenInvestor={(id) => setFilters({ investorId: id })}
              canSelect={access.canEdit}
            />
          )}

          {candidates.length === 0 && !isLoading && (
            <div className={s.empty}>
              No matching candidates. Try widening the sectors or removing the check-size constraint.
            </div>
          )}
        </section>
      )}

      <ScoringMethodologyModal open={scoringOpen} onClose={() => setScoringOpen(false)} />
    </div>
  );
}

const TIER_META: Record<WarmIntroCandidate['tier'], { label: string; sub: string }> = {
  co_invested: {
    label: 'Co-invested with PL',
    sub: 'Same investor was on a PL portfolio cap table',
  },
  engaged: {
    label: 'Engaged with PL',
    sub: 'Tier 1 / 2 / 3 outreach signal, not yet co-invested',
  },
  cold_match: {
    label: 'Cold matches',
    sub: 'No path, but high sector + stage fit',
  },
};

interface TierSectionProps {
  tier: WarmIntroCandidate['tier'];
  candidates: WarmIntroCandidate[];
  selectedIds: Set<string>;
  onToggleSelected: (id: string) => void;
  onOpenInvestor: (id: string) => void;
  canSelect: boolean;
}

function TierSection({ tier, candidates, selectedIds, onToggleSelected, onOpenInvestor, canSelect }: TierSectionProps) {
  const meta = TIER_META[tier];
  return (
    <div className={s.tierSection}>
      <header className={s.tierHeader}>
        <div className={s.tierTitleWrap}>
          <span className={s.tierTitle}>
            {meta.label} <span className={s.tierCountInline}>({candidates.length})</span>
          </span>
          <span className={s.tierSub}>{meta.sub}</span>
        </div>
      </header>
      <table className={s.tierTable}>
        <thead>
          <tr>
            {canSelect && <th className={s.checkboxCol}></th>}
            <th>Investor</th>
            <th>Firm</th>
            <th>Warm path</th>
            <th>Email</th>
            <th className={s.fitCol}>Fit</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => {
            const inv = c.investor;
            const fitClass = c.fit_score >= 80 ? s.fitHi : c.fit_score >= 60 ? s.fitMi : s.fitLo;
            return (
              <tr key={inv.investor_id} className={s.candidateRow} onClick={() => onOpenInvestor(inv.investor_id)}>
                {canSelect && (
                  <td className={s.checkboxCol}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(inv.investor_id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => onToggleSelected(inv.investor_id)}
                    />
                  </td>
                )}
                <td>
                  <div className={s.candidateName}>
                    {inv.first_name} {inv.last_name}
                    <LabOsBadge profile={inv.lab_os_profile} variant="icon" />
                  </div>
                  <div className={s.candidateEmail}>{inv.email}</div>
                </td>
                <td>
                  <div className={s.candidateFirm}>{inv.firm || <span className={s.muted}>—</span>}</div>
                  {inv.title && <div className={s.candidateTitle}>{inv.title}</div>}
                </td>
                <td>
                  <div className={s.path}>{c.reason}</div>
                  {c.evidence.length > 0 && (
                    <div className={s.evRow}>
                      {c.evidence.map((e) => {
                        return (
                          <span key={e} className={s.ev}>
                            {e}
                          </span>
                        );
                      })}
                      {inv.engagement_tier !== 'T4_cold' && tier !== 'cold_match' && (
                        <EngagementTierBadge tier={inv.engagement_tier} compact />
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <EmailStatusPill status={inv.email_status} />
                </td>
                <td className={s.fitCol}>
                  <span className={clsx(s.fit, fitClass)}>{c.fit_score}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
