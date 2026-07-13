'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQueryStates } from 'nuqs';
import { Popover } from '@base-ui-components/react/popover';
import { useGetInvestorById } from '@/services/investors/hooks/useGetInvestorById';
import { useGetCoInvestorTeams } from '@/services/investors/hooks/useGetCoInvestorTeams';
import { useInvestorMutationOverlay, applyOverlayToInvestor } from '@/services/investors/store';
import type { InvestorsAccess } from '@/services/rbac/hooks/useInvestorsAccess';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { investorsFilterParsers } from '@/app/investors/(investors-page)/searchParams';
import { useInvestorsAnalytics, type InvestorDrawerSource } from '@/analytics/investors.analytics';
import { INVESTOR_TYPE_LABEL, STAGE_FOCUS_LABEL } from '@/services/investors/constants';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
import { isSafeUrl } from '@/utils/url';
import { LabOsBadge } from '../LabOsBadge/LabOsBadge';
import { EngagementTierBadge } from '../EngagementTierBadge/EngagementTierBadge';
import { EmailStatusPill } from '../EmailStatusPill/EmailStatusPill';
import { SectorTagsList } from '../SectorTagsList/SectorTagsList';
import { EnrichmentNotesViewer } from '../EnrichmentNotesViewer/EnrichmentNotesViewer';
import { WarmPathDetail } from '../WarmPathDetail/WarmPathDetail';
import { AddToListMenu } from '../AddToListMenu/AddToListMenu';
import { CopyButton } from '@/components/ui/CopyButton';
import { Tooltip } from '@/components/core/tooltip/tooltip';
import s from './InvestorDrawer.module.scss';

interface Props {
  access: InvestorsAccess;
}

function EmailPicker({
  email,
  additionalEmails,
  hideIcon = false,
}: {
  email: string;
  additionalEmails: string[];
  hideIcon?: boolean;
}) {
  return (
    <>
      {!hideIcon && (
        <>
          <a href={`mailto:${email}`} className={s.contactIcon} title={email}>
            <Image src={getContactLogoByProvider('email')} alt="Email" width={20} height={20} />
          </a>
          <CopyButton text={email} className={s.contactIconCopy} />
        </>
      )}
      {additionalEmails.length > 0 && (
        <Popover.Root>
          <Popover.Trigger type="button" className={s.emailMoreBtn}>
            {`+${additionalEmails.length} email${additionalEmails.length === 1 ? '' : 's'}`}
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner align="start" sideOffset={4}>
              <Popover.Popup className={s.emailPop}>
                {additionalEmails.map((em) => (
                  <span key={em} className={s.emailRow}>
                    <span className={s.emailAddr}>{em}</span>
                    <CopyButton text={em} className={s.contactIconCopy} />
                  </span>
                ))}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      )}
    </>
  );
}

export function InvestorDrawer({ access }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const analytics = useInvestorsAnalytics();
  const openedAtRef = useRef<number | null>(null);
  const trackedOpenIdRef = useRef<string | null>(null);

  const [filters, setFilters] = useQueryStates(investorsFilterParsers, {
    history: 'replace',
    shallow: true,
  });
  const investorId = filters.investorId || null;

  const backTo = `${pathname}?${searchParams.toString()}`;

  const { data: rawInvestor, isLoading } = useGetInvestorById(investorId);
  const { data: teams } = useGetCoInvestorTeams(!!investorId);

  const overrides = useInvestorMutationOverlay((s) => s.overrides);
  const investor = rawInvestor ? applyOverlayToInvestor(rawInvestor, overrides) : null;

  const drawerSource: InvestorDrawerSource =
    filters.mode === 'warm-intros' ? 'warm-intros-table' : 'all-investors-table';

  const onClose = () => {
    if (investorId && openedAtRef.current !== null) {
      analytics.trackDrawerClosed({
        investorId,
        timeOpenMs: Date.now() - openedAtRef.current,
      });
    }
    openedAtRef.current = null;
    trackedOpenIdRef.current = null;
    setFilters({ investorId: null });
  };
  const isOpen = !!investorId;

  useEffect(() => {
    if (!investor || !investorId || trackedOpenIdRef.current === investorId) return;
    trackedOpenIdRef.current = investorId;
    openedAtRef.current = Date.now();
    analytics.trackDrawerOpened({
      investorId,
      source: drawerSource,
      hasPath: investor.has_path,
      bestProximityCode: investor.best_proximity_code,
    });
  }, [investor, investorId, drawerSource, analytics]);

  const teamLookup = useMemo(() => (teams ? new Map(teams.map((t) => [t.team_id, t])) : null), [teams]);

  const coInvestedTeams = useMemo(
    () =>
      investor && teamLookup
        ? investor.co_invested_team_ids
            .map((id) => teamLookup.get(id))
            .filter((t): t is NonNullable<typeof t> => t !== undefined)
        : [],
    [investor, teamLookup],
  );

  const campaigns = useMemo(
    () => investor?.outreach_campaigns?.split(',').map((c) => c.trim()) ?? [],
    [investor?.outreach_campaigns],
  );

  const hasOutreachHistory =
    investor &&
    (investor.outreach_touches > 0 ||
      investor.opened > 0 ||
      investor.clicked > 0 ||
      investor.registered > 0 ||
      !!investor.first_sent_date ||
      !!investor.last_sent_date ||
      !!investor.outreach_campaigns);

  const hasSocialLinks = !!(investor?.email || investor?.linkedin_url || investor?.firm_domain);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} width={720}>
      {isLoading && (
        <div className={s.loading} role="status">
          Loading…
        </div>
      )}
      {!isLoading && !investor && investorId && <div className={s.loading}>Investor not found.</div>}
      {investor && (
        <>
          <div className={s.header}>
            <button type="button" className={s.backBtn} onClick={onClose} aria-label="Close">
              ← Back
            </button>
          </div>

          <div className={s.content}>
            {/* Profile card */}
            <div className={s.section}>
              <div className={s.headerTop}>
                <div className={s.headerWho}>
                  <div className={s.nameRow}>
                    <h2 id="investor-drawer-title" className={s.name}>
                      {investor.first_name} {investor.last_name}
                    </h2>
                    {investor.lab_os_profile && <LabOsBadge profile={investor.lab_os_profile} variant="chip" />}
                  </div>
                  <div className={s.meta}>
                    {investor.firm && (
                      <>
                        {investor.firm_domain && isSafeUrl(`https://${investor.firm_domain}`) ? (
                          <a
                            href={`https://${investor.firm_domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={s.firmLink}
                          >
                            {investor.firm} ↗
                          </a>
                        ) : (
                          <span>{investor.firm}</span>
                        )}
                        <span className={s.metaVDivider} aria-hidden="true" />
                      </>
                    )}
                    <span>{investor.title || '—'}</span>
                  </div>
                  {investor.canonical_id && investor.canonical_id !== investor.investor_id && (
                    <div className={s.metaSub}>
                      <span className={s.dupe}>Duplicate of {investor.canonical_id}</span>
                    </div>
                  )}
                  <div className={s.pillRow}>
                    {investor.engagement_tier && <EngagementTierBadge tier={investor.engagement_tier} />}
                    {/*<EmailStatusPill status={investor.email_status} />*/}
                    {/*<span className={s.sourcePill}>Source: {investor.source}</span>*/}
                  </div>
                </div>
                <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Close drawer">
                  ✕
                </button>
              </div>

              {hasSocialLinks && (
                <div className={s.channelsBox}>
                  {investor.email && (
                    <div className={s.socialEmailGroup}>
                      <Image src={getContactLogoByProvider('email')} alt="" aria-hidden="true" width={20} height={20} />
                      <a
                        href={`mailto:${investor.email}`}
                        className={s.socialEmailAddr}
                        onClick={() =>
                          analytics.trackDrawerChannelClicked({
                            investorId: investor.investor_id,
                            channel: 'email',
                          })
                        }
                      >
                        {investor.email}
                      </a>
                      <CopyButton
                        text={investor.email}
                        className={s.contactIconCopy}
                        onCopy={() => analytics.trackDrawerCopyEmailClicked({ investorId: investor.investor_id })}
                      />
                      {(investor.additional_emails ?? []).length > 0 && (
                        <EmailPicker
                          email={investor.email}
                          additionalEmails={investor.additional_emails ?? []}
                          hideIcon
                        />
                      )}
                    </div>
                  )}
                  {(investor.linkedin_url || investor.firm_domain) && investor.email && (
                    <span className={s.channelDivider} />
                  )}
                  {investor.linkedin_url && isSafeUrl(investor.linkedin_url) && (
                    <Tooltip
                      asChild
                      trigger={
                        <a
                          href={investor.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={s.contactIcon}
                          onClick={() =>
                            analytics.trackDrawerChannelClicked({
                              investorId: investor.investor_id,
                              channel: 'linkedin',
                            })
                          }
                        >
                          <Image src={getContactLogoByProvider('linkedin')} alt="LinkedIn" width={20} height={20} />
                        </a>
                      }
                      content="LinkedIn"
                    />
                  )}
                  {investor.firm_domain && isSafeUrl(`https://${investor.firm_domain}`) && (
                    <Tooltip
                      asChild
                      trigger={
                        <a
                          href={`https://${investor.firm_domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={s.contactIcon}
                          onClick={() =>
                            analytics.trackDrawerChannelClicked({
                              investorId: investor.investor_id,
                              channel: 'website',
                            })
                          }
                        >
                          <Image src={getContactLogoByProvider('website')} alt="Website" width={20} height={20} />
                        </a>
                      }
                      content={investor.firm_domain}
                    />
                  )}
                </div>
              )}
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
            </div>

            {(investor.has_path || investor.best_proximity_code) && (
              <div className={s.section}>
                <h3 className={s.sectionTitle}>Path</h3>
                <WarmPathDetail
                  key={investor.investor_id} // remount per investor to reset viewedRef and re-fire trackPathsViewed
                  investorId={investor.investor_id}
                  bestProximityCode={investor.best_proximity_code}
                  canEdit={access.canEdit}
                  investorName={`${investor.first_name} ${investor.last_name}`.trim()}
                  lastEmailAt={investor.last_email_date}
                />
              </div>
            )}

            {hasOutreachHistory && (
              <div className={clsx(s.section, s.sectionOutreach)}>
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
                  <span>
                    Last contact: <strong>{investor.last_contact || '—'}</strong>
                  </span>
                </div>
                {campaigns.length > 0 && (
                  <div className={s.campaigns}>
                    {campaigns.map((c) => (
                      <span key={c} className={s.campaign}>
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {coInvestedTeams.length > 0 && (
              <div className={s.section}>
                <h3 className={s.sectionTitle}>
                  Co-invested with PL <span className={s.count}>{coInvestedTeams.length}</span>
                </h3>
                <ul className={s.coTeams}>
                  {coInvestedTeams.map((t) => {
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
            </div>

            <div className={s.section}>
              <h3 className={clsx(s.sectionTitle, s.sectionTitleSpaced)}>Enrichment notes</h3>
              <EnrichmentNotesViewer notes={investor.enrichment_notes} />
            </div>
          </div>

          <div className={s.footer}>
            {investor.firm_domain && isSafeUrl(`https://${investor.firm_domain}`) && (
              <a
                className={clsx(s.btn, s.btnPrimary)}
                href={`https://app.affinity.co/companies/?search=${encodeURIComponent(investor.firm_domain)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => analytics.trackDrawerOpenInAffinityClicked({ investorId: investor.investor_id })}
              >
                Open in Affinity ↗
              </a>
            )}
            <AddToListMenu investorId={investor.investor_id} canEdit={access.canEdit} className={s.btn} />
            {investor.email && (
              <CopyButton
                text={investor.email}
                label="Copy email"
                className={s.btn}
                onCopy={() => analytics.trackDrawerCopyEmailClicked({ investorId: investor.investor_id })}
              />
            )}
            {investor.lab_os_profile && (
              <a
                className={s.btn}
                href={`${investor.lab_os_profile.type === 'member' ? `/members/${investor.lab_os_profile.uid}` : `/teams/${investor.lab_os_profile.uid}`}?backTo=${encodeURIComponent(backTo)}`}
                onClick={() =>
                  analytics.trackDrawerViewInLabOsClicked({
                    investorId: investor.investor_id,
                    profileType: investor.lab_os_profile!.type,
                  })
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

/** Render text with [1], [2]… markers turned into clickable source superscripts. */
function renderCited(text: string, sources: string[]) {
  return text.split(/(\[\d+\])/g).map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/);
    if (m) {
      const url = sources[parseInt(m[1], 10) - 1];
      if (url && isSafeUrl(url)) {
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
