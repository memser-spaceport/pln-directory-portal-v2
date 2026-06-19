'use client';

import { Fragment, useState } from 'react';
import clsx from 'clsx';
import { INVESTOR_TYPE_LABEL, STAGE_FOCUS_LABEL } from '@/services/investors/constants';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { Button } from '@/components/common/Button/Button';
import { CopyButton } from '@/components/ui/CopyButton/CopyButton';
// Reuse the pl-design-system Button styling for the footer link actions (anchors
// can't use the <Button> component directly, so we borrow its classes).
import btn from '@/components/common/Button/Button.module.scss';
import { EngagementTierBadge } from '@/components/page/investors/EngagementTierBadge/EngagementTierBadge';
import { EmailStatusPill } from '@/components/page/investors/EmailStatusPill/EmailStatusPill';
import { SectorTagsList } from '@/components/page/investors/SectorTagsList/SectorTagsList';
// Reuse the Member-page contact components (icon + handle links) for the contact row.
import { ProfileSocialLink } from '@/components/page/member-details/profile-social-link';
import { getContactLogoByProvider } from '@/utils/profile/getContactLogoByProvider';
import { getProfileFromURL } from '@/utils/common.utils';
// Reuse the production drawer styling verbatim so the layout matches the original.
import s from '@/components/page/investors/InvestorDrawer/InvestorDrawer.module.scss';
import type { InvestorList } from '@/services/investors/types';
import { CheckIcon } from '@/components/icons';
import { ArrowUpRightIcon } from './ArrowUpRightIcon';
import x from './WarmIntrosImprovements.module.scss';
import type { MockInvestor } from './mocks';
import { WarmPathPanel } from './WarmPathPanel';
import { AddToListButton } from './AddToListButton';

interface Props {
  investor: MockInvestor | null;
  onClose: () => void;
  /** Full-screen sheet on mobile (otherwise a fixed-width side drawer). */
  fullScreen?: boolean;
  /** All lists (with live counts) for the add menu + membership display. */
  lists: InvestorList[];
  onAddToList: (listId: string) => void;
  onRemoveFromList: (listId: string) => void;
}

/**
 * Mocked clone of the production InvestorDrawer (same section layout + styles),
 * opened by tapping a table row — wired to mock data and the improved warm-path
 * panel + list-membership control.
 */
export function InvestorDrawerMock({
  investor,
  onClose,
  fullScreen,
  lists,
  onAddToList,
  onRemoveFromList,
}: Props) {
  const isOpen = !!investor;
  const [copied, setCopied] = useState(false);

  const copyEmail = () => {
    if (!investor?.email) return;
    navigator.clipboard.writeText(investor.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} {...(fullScreen ? { fullScreen: true } : { width: 720 })}>
      {investor && (
        <>
          <div className={`${s.header} ${x.stickyHeader}`}>
            <div className={s.headerTop}>
              <div className={s.headerWho}>
                <h2 className={s.name}>
                  {investor.first_name} {investor.last_name}
                </h2>
                <div className={s.meta}>
                  {investor.title || '—'}
                  {investor.firm && ' · '}
                  {investor.firm &&
                    (investor.firm_domain ? (
                      <a
                        href={`https://${investor.firm_domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={clsx(s.link, x.extLink)}
                      >
                        {investor.firm}
                        <ArrowUpRightIcon width={13} height={13} />
                      </a>
                    ) : (
                      investor.firm
                    ))}
                </div>
                <div className={s.metaSub}>{investor.investor_id}</div>
              </div>
              <button className={s.closeBtn} onClick={onClose} aria-label="Close drawer">
                ✕
              </button>
            </div>
            <div className={s.pillRow}>
              <EngagementTierBadge tier={investor.engagement_tier} />
              <EmailStatusPill status={investor.email_status} />
              <span className={s.sourcePill}>Source: {investor.source}</span>
            </div>
          </div>

          <div className={s.section}>
            <h3 className={s.sectionTitle}>Contact</h3>
            <div className={x.channelsBox}>
              {[
                investor.email && (
                  <span key="email" className={x.emailGroup}>
                    <ProfileSocialLink
                      type="email"
                      handle={investor.email}
                      profile={getProfileFromURL(investor.email, 'email')}
                      logo={getContactLogoByProvider('email')}
                      height={20}
                      width={20}
                      callback={() => {}}
                    />
                    <CopyButton text={investor.email} className={x.copyEmail} />
                  </span>
                ),
                investor.linkedin_url && (
                  <ProfileSocialLink
                    key="linkedin"
                    type="linkedin"
                    handle={investor.linkedin_url}
                    profile={getProfileFromURL(investor.linkedin_url, 'linkedin')}
                    logo={getContactLogoByProvider('linkedin')}
                    height={20}
                    width={20}
                    callback={() => {}}
                  />
                ),
                investor.firm_domain && (
                  <ProfileSocialLink
                    key="website"
                    type="website"
                    handle={investor.firm_domain}
                    profile={getProfileFromURL(investor.firm_domain, 'website')}
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
                    {i > 0 && <span className={x.channelDivider} aria-hidden />}
                    {el}
                  </Fragment>
                ))}
            </div>
            {investor.lab_os_profile && (
              <a
                className={clsx(s.link, x.extLink)}
                style={{ marginTop: 10, fontSize: 13 }}
                href={
                  investor.lab_os_profile.type === 'member'
                    ? `/members/${investor.lab_os_profile.uid}`
                    : `/teams/${investor.lab_os_profile.uid}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                View LabOS profile
                <ArrowUpRightIcon width={13} height={13} />
              </a>
            )}
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
            </dl>
            {investor.fund_thesis && (
              <p className={s.thesis}>
                <strong>Thesis:</strong> {investor.fund_thesis}
              </p>
            )}
          </div>

          {(investor.has_path || investor.best_proximity_code) && (
            <div className={s.section}>
              <h3 className={s.sectionTitle}>Warm paths</h3>
              <WarmPathPanel paths={investor.paths} />
            </div>
          )}

          <div className={s.section}>
            <h3 className={s.sectionTitle}>Outreach history</h3>
            <div className={s.statRow}>
              <div className={s.stat}>
                <div className={s.statN}>{investor.outreach.touches}</div>
                <div className={s.statL}>Touches</div>
              </div>
              <div className={s.stat}>
                <div className={s.statN}>{investor.outreach.opened}</div>
                <div className={s.statL}>Opened</div>
              </div>
              <div className={s.stat}>
                <div className={s.statN}>{investor.outreach.clicked}</div>
                <div className={s.statL}>Clicked</div>
              </div>
              <div className={s.stat}>
                <div className={s.statN}>{investor.outreach.registered}</div>
                <div className={s.statL}>Registered</div>
              </div>
            </div>
            <div className={s.dateRow}>
              <span>
                First sent: <strong>{investor.outreach.first_sent_date || '—'}</strong>
              </span>
              <span>
                Last sent: <strong>{investor.outreach.last_sent_date || '—'}</strong>
              </span>
            </div>
          </div>

          <div className={s.footer}>
            {investor.firm_domain && (
              <a
                className={clsx(btn.root, btn.medium, btn.fill, btn.primary)}
                href={`https://app.affinity.co/companies/?search=${encodeURIComponent(investor.firm_domain)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  Open in Affinity
                  <ArrowUpRightIcon width={15} height={15} />
                </span>
              </a>
            )}
            <AddToListButton lists={lists} memberOf={investor.list_ids} onAdd={onAddToList} onRemove={onRemoveFromList} openUp triggerStyle="ds" />
            <Button style="border" variant="neutral" onClick={copyEmail} disabled={!investor.email}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {copied ? <CheckIcon width={16} height={16} /> : <CopyIcon />}
                {copied ? 'Copied' : 'Copy email'}
              </span>
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}

// No "copy" icon in the app set yet — keep this small inline one for the footer.
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);
