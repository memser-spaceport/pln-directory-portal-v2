'use client';

import { useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { useGetInvestorById } from '@/services/investors/hooks/useGetInvestorById';
import { useGetCoInvestorTeams } from '@/services/investors/hooks/useGetCoInvestorTeams';
import { useInvestorMutationOverlay, applyOverlayToInvestor } from '@/services/investors/store';
import type { InvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { investorsFilterParsers } from '@/app/investors/(investors-page)/searchParams';
import { INVESTOR_TYPE_LABEL, STAGE_FOCUS_LABEL } from '@/services/investors/constants';
import { LabOsBadge } from '../LabOsBadge/LabOsBadge';
import { EngagementTierBadge } from '../EngagementTierBadge/EngagementTierBadge';
import { EmailStatusPill } from '../EmailStatusPill/EmailStatusPill';
import { SectorTagsList } from '../SectorTagsList/SectorTagsList';
import { EnrichmentNotesViewer } from '../EnrichmentNotesViewer/EnrichmentNotesViewer';
import { CopyButton } from '@/components/ui/CopyButton';
import s from './InvestorDrawer.module.scss';

interface Props {
  access: InvestorsAccess;
}

export function InvestorDrawer({ access }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useQueryStates(investorsFilterParsers, {
    history: 'replace',
    shallow: true,
  });
  const investorId = filters.investorId || null;

  const backTo = `${pathname}?${searchParams.toString()}`;

  const { data: rawInvestor, isLoading } = useGetInvestorById(investorId);
  const { data: teams } = useGetCoInvestorTeams(!!investorId);

  // Hydrate with mutation overlay (tags etc.)
  const overrides = useInvestorMutationOverlay((s) => s.overrides);
  const investor = rawInvestor ? applyOverlayToInvestor(rawInvestor, overrides) : null;

  const onClose = () => setFilters({ investorId: null });
  const isOpen = !!investorId;

  const teamLookup = teams ? new Map(teams.map((t) => [t.team_id, t])) : null;
  const coInvestedTeams =
    investor && teamLookup ? investor.co_invested_team_ids.map((id) => teamLookup.get(id)).filter((t) => !!t) : [];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width={720}>
      {isLoading && <div className={s.loading}>Loading…</div>}
      {!isLoading && !investor && investorId && <div className={s.loading}>Investor not found.</div>}
      {investor && (
        <>
          <div className={s.header}>
            <div className={s.headerTop}>
              <div className={s.headerWho}>
                <h2 className={s.name}>
                  {investor.first_name} {investor.last_name}
                </h2>
                <div className={s.meta}>
                  {investor.title || '—'} {investor.firm && `· ${investor.firm}`}
                </div>
                <div className={s.metaSub}>
                  {investor.investor_id}
                  {investor.canonical_id && <span className={s.dupe}> · duplicate of {investor.canonical_id}</span>}
                </div>
              </div>
              <button className={s.closeBtn} onClick={onClose} aria-label="Close drawer">
                ✕
              </button>
            </div>
            <div className={s.pillRow}>
              <EngagementTierBadge tier={investor.engagement_tier} />
              <EmailStatusPill status={investor.email_status} />
              <span className={s.sourcePill}>Source: {investor.source}</span>
              {investor.lab_os_profile && <LabOsBadge profile={investor.lab_os_profile} variant="chip" />}
            </div>
          </div>

          {investor.lab_os_profile && (
            <div className={s.section}>
              <h3 className={s.sectionTitle}>LabOS profile</h3>
              <LabOsBadge profile={investor.lab_os_profile} variant="full" />
              {investor.lab_os_profile.last_active_at && (
                <div className={s.metaSub} style={{ marginTop: 8 }}>
                  Last active: {investor.lab_os_profile.last_active_at}
                </div>
              )}
            </div>
          )}

          <div className={s.section}>
            <h3 className={s.sectionTitle}>Contact</h3>
            <dl className={s.kv}>
              <dt>Email</dt>
              <dd>
                <span>{investor.email || '—'}</span>
                {investor.email && <CopyButton text={investor.email} />}
              </dd>
              <dt>LinkedIn</dt>
              <dd>
                {investor.linkedin_url ? (
                  <a href={investor.linkedin_url} target="_blank" rel="noopener noreferrer" className={s.link}>
                    {investor.linkedin_url.replace('https://www.linkedin.com/in/', 'linkedin.com/in/')} ↗
                  </a>
                ) : (
                  <span className={s.muted}>—</span>
                )}
              </dd>
              <dt>Firm domain</dt>
              <dd>
                {investor.firm_domain ? (
                  <a
                    href={`https://${investor.firm_domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={s.link}
                  >
                    {investor.firm_domain} ↗
                  </a>
                ) : (
                  <span className={s.muted}>—</span>
                )}
              </dd>
            </dl>
          </div>

          <div className={s.section}>
            <h3 className={s.sectionTitle}>Investor profile</h3>
            <dl className={s.kv}>
              <dt>Type</dt>
              <dd>{INVESTOR_TYPE_LABEL[investor.investor_type]}</dd>
              <dt>Stage focus</dt>
              <dd>{STAGE_FOCUS_LABEL[investor.stage_focus]}</dd>
              <dt>Industry / Sector</dt>
              <dd>
                <SectorTagsList tags={investor.sector_tags} max={20} />
              </dd>
              <dt>Check size</dt>
              <dd>
                {investor.check_size_range !== 'unknown' ? (
                  investor.check_size_range
                ) : (
                  <span className={s.muted}>unknown</span>
                )}
              </dd>
              <dt>AUM</dt>
              <dd>
                {investor.aum_range !== 'unknown' ? investor.aum_range : <span className={s.muted}>unknown</span>}
              </dd>
              <dt>Geo focus</dt>
              <dd>{investor.geo_focus || <span className={s.muted}>—</span>}</dd>
              <dt>Recent deals</dt>
              <dd>{investor.recent_deals || <span className={s.muted}>—</span>}</dd>
            </dl>
            {investor.fund_thesis && (
              <p className={s.thesis}>
                <strong>Thesis:</strong> {investor.fund_thesis}
              </p>
            )}
          </div>

          <div className={s.section}>
            <h3 className={s.sectionTitle}>Outreach history</h3>
            <div className={s.statRow}>
              <div className={s.stat}>
                <div className={s.statN}>{investor.outreach_touches}</div>
                <div className={s.statL}>Touches</div>
              </div>
              <div className={s.stat}>
                <div className={s.statN}>{investor.opened}</div>
                <div className={s.statL}>Opened</div>
              </div>
              <div className={s.stat}>
                <div className={s.statN}>{investor.clicked}</div>
                <div className={s.statL}>Clicked</div>
              </div>
              <div className={s.stat}>
                <div className={s.statN}>{investor.registered}</div>
                <div className={s.statL}>Registered</div>
              </div>
            </div>
            <div className={s.dateRow}>
              <span>
                First sent: <strong>{investor.first_sent_date || '—'}</strong>
              </span>
              <span>
                Last sent: <strong>{investor.last_sent_date || '—'}</strong>
              </span>
            </div>
            {investor.outreach_campaigns && (
              <div className={s.campaigns}>
                {investor.outreach_campaigns.split(',').map((c) => (
                  <span key={c} className={s.campaign}>
                    {c.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          {coInvestedTeams.length > 0 && (
            <div className={s.section}>
              <h3 className={s.sectionTitle}>
                Co-invested with PL <span className={s.count}>{coInvestedTeams.length}</span>
              </h3>
              <ul className={s.coTeams}>
                {coInvestedTeams.map((t) => {
                  if (!t) return null;
                  const edge = t.co_investors.find((c) => c.investor_id === investor.investor_id);
                  return (
                    <li key={t.team_id}>
                      <div className={s.teamName}>{t.team_name}</div>
                      <div className={s.teamMeta}>
                        PL invested {t.pl_invested_at} ({STAGE_FOCUS_LABEL[t.pl_invested_stage]})
                        {edge?.deal_date && ` · this investor: ${edge.deal_date}`}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className={s.section}>
            <h3 className={s.sectionTitle}>Pipeline meta</h3>
            <dl className={s.kv}>
              <dt>Enrichment status</dt>
              <dd>
                {investor.enrichment_status}
                {investor.enrichment_date && ` · ${investor.enrichment_date}`}
              </dd>
              <dt>Last attempt</dt>
              <dd>{investor.last_enrichment_attempt || <span className={s.muted}>—</span>}</dd>
              <dt>Source</dt>
              <dd>{investor.source}</dd>
              <dt>Dedupe key</dt>
              <dd className={s.mono}>{investor.dedupe_key}</dd>
            </dl>
            <h3 className={s.sectionTitle} style={{ marginTop: 16 }}>
              Enrichment notes
            </h3>
            <EnrichmentNotesViewer notes={investor.enrichment_notes} />
          </div>

          <div className={s.footer}>
            <CopyButton text={investor.email} label="Copy email" className={s.btn} />
            {investor.firm_domain && (
              <a
                className={s.btn}
                href={`https://app.affinity.co/companies/?search=${encodeURIComponent(investor.firm_domain)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                ↗ Open in Affinity
              </a>
            )}
            {investor.lab_os_profile && (
              <a
                className={s.btn}
                href={
                  `${investor.lab_os_profile.type === 'member' ? `/members/${investor.lab_os_profile.uid}` : `/teams/${investor.lab_os_profile.uid}`}?backTo=${encodeURIComponent(backTo)}`
                }
              >
                👤 View in LabOS
              </a>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}

