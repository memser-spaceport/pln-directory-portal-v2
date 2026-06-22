'use client';

import clsx from 'clsx';
import { Fragment } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { useGetInvestorById } from '@/services/investors/hooks/useGetInvestorById';
import { useGetCoInvestorTeams } from '@/services/investors/hooks/useGetCoInvestorTeams';
import { useInvestorMutationOverlay, applyOverlayToInvestor } from '@/services/investors/store';
import type { InvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { investorsFilterParsers } from '@/app/investors/(investors-page)/searchParams';
import { INVESTOR_TYPE_LABEL, STAGE_FOCUS_LABEL } from '@/services/investors/constants';
import { ProfileSocialLink } from '@/components/page/member-details/profile-social-link';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
import { getProfileFromURL } from '@/utils/common.utils';
import { LabOsBadge } from '../LabOsBadge/LabOsBadge';
import { EngagementTierBadge } from '../EngagementTierBadge/EngagementTierBadge';
import { EmailStatusPill } from '../EmailStatusPill/EmailStatusPill';
import { SectorTagsList } from '../SectorTagsList/SectorTagsList';
import { EnrichmentNotesViewer } from '../EnrichmentNotesViewer/EnrichmentNotesViewer';
import { WarmPathDetail } from '../WarmPathDetail/WarmPathDetail';
import { AddToListMenu } from '../AddToListMenu/AddToListMenu';
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
                  {investor.title || '—'}{' '}
                  {investor.firm && (
                    <>
                      ·{' '}
                      {investor.firm_domain ? (
                        <a
                          href={`https://${investor.firm_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={s.firmLink}
                        >
                          {investor.firm} ↗
                        </a>
                      ) : (
                        investor.firm
                      )}
                    </>
                  )}
                </div>
                <div className={s.metaSub}>
                  {investor.investor_id}
                  {/* canonical_id == investor_id is the DB-wide convention for "is canonical",
                      not a duplicate — only a differing canonical id marks a merged record. */}
                  {investor.canonical_id && investor.canonical_id !== investor.investor_id && (
                    <span className={s.dupe}> · duplicate of {investor.canonical_id}</span>
                  )}
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
                <div className={clsx(s.metaSub, s.metaSubSpaced)}>
                  Last active: {investor.lab_os_profile.last_active_at}
                </div>
              )}
            </div>
          )}

          <div className={s.section}>
            <h3 className={s.sectionTitle}>Contact</h3>
            <div className={s.channelsBox}>
              {[
                investor.email && (
                  <ProfileSocialLink
                    key="email"
                    type="email"
                    handle={investor.email}
                    profile={getProfileFromURL(investor.email, 'email') || investor.email}
                    logo={getContactLogoByProvider('email')}
                    height={20}
                    width={20}
                    callback={() => {}}
                    suffix={<CopyButton text={investor.email} className={s.copyEmail} />}
                  />
                ),
                investor.linkedin_url && (
                  <ProfileSocialLink
                    key="linkedin"
                    type="linkedin"
                    handle={investor.linkedin_url}
                    profile={getProfileFromURL(investor.linkedin_url, 'linkedin') || investor.linkedin_url}
                    logo={getContactLogoByProvider('linkedin')}
                    height={20}
                    width={20}
                    callback={() => {}}
                    linkedinProfileKind="member"
                  />
                ),
                investor.firm_domain && (
                  <ProfileSocialLink
                    key="website"
                    type="website"
                    handle={investor.firm_domain}
                    profile={investor.firm_domain}
                    logo={getContactLogoByProvider('website')}
                    height={20}
                    width={20}
                    callback={() => {}}
                  />
                ),
              ]
                .filter(Boolean)
                .map((el, i) => (
                  <Fragment key={i}>
                    {i > 0 && <span className={s.channelDivider} aria-hidden />}
                    {el}
                  </Fragment>
                ))}
            </div>
          </div>

          <div className={s.section}>
            <h3 className={s.sectionTitle}>Investor profile</h3>
            {investor.enrichment?.bio && (
              <p className={s.enrichBio}>{renderCited(investor.enrichment.bio, investor.enrichment.sources)}</p>
            )}
            <dl className={s.kv}>
              <dt>Type</dt>
              <dd>{INVESTOR_TYPE_LABEL[investor.investor_type]}</dd>
              <dt>Stage focus</dt>
              <dd>{STAGE_FOCUS_LABEL[investor.stage_focus]}</dd>
              <dt>Industry / Sector</dt>
              <dd>
                <SectorTagsList tags={investor.sector_tags} max={20} />
              </dd>
              {investor.enrichment?.fund_focus && (
                <>
                  <dt>Fund focus</dt>
                  <dd>{renderCited(investor.enrichment.fund_focus, investor.enrichment.sources)}</dd>
                </>
              )}
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
                {investor.enrichment?.aum ? (
                  investor.enrichment.aum
                ) : investor.aum_range !== 'unknown' ? (
                  investor.aum_range
                ) : (
                  <span className={s.muted}>unknown</span>
                )}
              </dd>
              <dt>Geo focus</dt>
              <dd>{investor.geo_focus || <span className={s.muted}>—</span>}</dd>
              {investor.enrichment && investor.enrichment.notable_investments.length > 0 ? (
                <>
                  <dt>Notable investments</dt>
                  <dd>{investor.enrichment.notable_investments.join(', ')}</dd>
                </>
              ) : (
                <>
                  <dt>Recent deals</dt>
                  <dd>{investor.recent_deals || <span className={s.muted}>—</span>}</dd>
                </>
              )}
            </dl>
            {(investor.enrichment?.thesis || investor.fund_thesis) && (
              <p className={s.thesis}>
                <strong>Thesis:</strong>{' '}
                {investor.enrichment?.thesis
                  ? renderCited(investor.enrichment.thesis, investor.enrichment.sources)
                  : investor.fund_thesis}
              </p>
            )}
            {investor.enrichment && investor.enrichment.sources.length > 0 && (
              <div className={s.sources}>
                <div className={s.sourcesLabel}>Sources</div>
                <ol className={s.sourcesList}>
                  {investor.enrichment.sources.map((u, i) => (
                    <li key={i}>
                      <a href={u} target="_blank" rel="noopener noreferrer" className={s.link}>
                        {u} ↗
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {investor.enrichment?.enriched_via && (
              <div className={s.enrichFooter}>
                enriched via {investor.enrichment.enriched_via}
                {investor.enrichment.fetched_at ? ` · ${investor.enrichment.fetched_at}` : ''}
              </div>
            )}
          </div>

          {(investor.has_path || investor.best_proximity_code) && (
            <div className={s.section}>
              <h3 className={s.sectionTitle}>Warm paths</h3>
              <WarmPathDetail
                key={investor.investor_id} // key to remount the component which resets viewedRef and allows trackPathsViewed to fire for each investor
                investorId={investor.investor_id}
                bestProximityCode={investor.best_proximity_code}
                canEdit={access.canEdit}
              />
            </div>
          )}

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
            <h3 className={clsx(s.sectionTitle, s.sectionTitleSpaced)}>Enrichment notes</h3>
            <EnrichmentNotesViewer notes={investor.enrichment_notes} />
          </div>

          <div className={s.footer}>
            {investor.firm_domain && (
              <a
                className={clsx(s.btn, s.btnPrimary)}
                href={`https://app.affinity.co/companies/?search=${encodeURIComponent(investor.firm_domain)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Affinity ↗
              </a>
            )}
            <AddToListMenu investorId={investor.investor_id} canEdit={access.canEdit} className={s.btn} />
            <CopyButton text={investor.email} label="Copy email" className={s.btn} />
            {investor.lab_os_profile && (
              <a
                className={s.btn}
                href={`${investor.lab_os_profile.type === 'member' ? `/members/${investor.lab_os_profile.uid}` : `/teams/${investor.lab_os_profile.uid}`}?backTo=${encodeURIComponent(backTo)}`}
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

/** Render text with [1], [2]… markers turned into clickable source superscripts. */
function renderCited(text: string, sources: string[]) {
  return text.split(/(\[\d+\])/g).map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/);
    if (m) {
      const url = sources[parseInt(m[1], 10) - 1];
      if (url) {
        return (
          <sup key={i} className={s.cite}>
            <a href={url} target="_blank" rel="noopener noreferrer">
              [{m[1]}]
            </a>
          </sup>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}
