'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { INVESTOR_TYPE_LABEL, STAGE_FOCUS_LABEL, EMAIL_STATUS_LABEL } from '@/services/investors/constants';
import { Drawer } from '@/components/common/Drawer/Drawer';
import { Button } from '@/components/common/Button/Button';
import { CopyButton } from '@/components/ui/CopyButton/CopyButton';
// Reuse the pl-design-system Button styling for the footer link actions (anchors
// can't use the <Button> component directly, so we borrow its classes).
import btn from '@/components/common/Button/Button.module.scss';
import { EngagementTierBadge } from '@/components/page/investors/EngagementTierBadge/EngagementTierBadge';
// Reuse the production LabOsBadge pill styling, but render a real profile thumbnail
// instead of the component's colored initials (it can't take an image).
import labOs from '@/components/page/investors/LabOsBadge/LabOsBadge.module.scss';
import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
// Reuse the production drawer styling verbatim so the layout matches the original.
import s from '@/components/page/investors/InvestorDrawer/InvestorDrawer.module.scss';
import type { InvestorList, LabOsProfileRef } from '@/services/investors/types';
import { CheckIcon } from '@/components/icons';
import { ArrowUpRightIcon } from './ArrowUpRightIcon';
import x from './WarmIntrosImprovements.module.scss';
import type { MockInvestor, TeamLink } from './mocks';
import { WarmPathPanel, CompactChannels } from './WarmPathPanel';
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
        // Own scroll container with a stable scrollbar gutter so opening the warm-path
        // "Contact details" (which grows the content past the viewport) doesn't make a
        // scrollbar appear and shift the content sideways.
        <div className={x.drawerScroll}>
          <div className={`${s.header} ${x.stickyHeader}`}>
            <div className={s.headerTop}>
              <InvestorIdentity investor={investor} />
              <button className={s.closeBtn} onClick={onClose} aria-label="Close drawer">
                ✕
              </button>
            </div>
            <div className={s.pillRow}>
              {investor.lp_stage && <span className={x.metaChip}>{investor.lp_stage}</span>}
              <EngagementTierBadge tier={investor.engagement_tier} />
              {/* Email status neutralised to grey (matches the other meta chips). */}
              <span className={x.metaChip} title={`Email ${EMAIL_STATUS_LABEL[investor.email_status]}`}>
                {EMAIL_STATUS_LABEL[investor.email_status]}
              </span>
              <span className={x.metaChip}>Source: {investor.source}</span>
            </div>
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
                {investor.sector_tags.length > 0 ? (
                  <span className={x.metaChips}>
                    {investor.sector_tags.map((t) => (
                      <span key={t} className={x.metaChip}>
                        {t}
                      </span>
                    ))}
                  </span>
                ) : (
                  '—'
                )}
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
              <dt>Relationship owner</dt>
              {/* Internal PL staff — not a LabOS member, so plain name (no link). */}
              <dd>{investor.relationship_owner ? investor.relationship_owner.name : <span className={s.muted}>—</span>}</dd>
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
              <WarmPathPanel paths={investor.paths} investor={investor} />
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
              {investor.last_contact && (
                <span>
                  Last contact: <strong>{investor.last_contact}</strong>
                </span>
              )}
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
        </div>
      )}
    </Drawer>
  );
}

// Investor affiliations on the meta line — mirrors the founder/connector team
// pattern: team(s) as inline links with a "+N more" expander. Falls back to the
// single firm when no teams are set.
function InvestorAffiliations({ investor }: { investor: MockInvestor }) {
  const teams = investor.teams ?? [];
  const [expanded, setExpanded] = useState(false);

  if (teams.length === 0) {
    if (!investor.firm) return null;
    return (
      <>
        {' · '}
        {investor.firm_domain ? (
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
        )}
      </>
    );
  }

  const extra = teams.length - 1;
  const shown = expanded ? teams : teams.slice(0, 1);
  return (
    <>
      {' · '}
      {shown.map((t, i) => (
        <Fragment key={t.teamUid ?? t.name}>
          {i > 0 && (
            <span className={x.teamDivider} aria-hidden>
              ·
            </span>
          )}
          <TeamInline team={t} />
        </Fragment>
      ))}
      {extra > 0 && (
        <button type="button" className={x.teamMoreBtn} onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'Show less' : `+${extra} more`}
        </button>
      )}
    </>
  );
}

// A team rendered as an inline text link (no logo) with a small grey ↗.
export function TeamInline({ team }: { team: TeamLink }) {
  if (!team.teamUid) return <span className={x.teamInline}>{team.name}</span>;
  return (
    <a
      className={x.teamInline}
      href={`/teams/${team.teamUid}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
    >
      {team.name}
      <span className={x.teamInlineArrow} aria-hidden>
        <ArrowUpRightIcon width={11} height={11} />
      </span>
    </a>
  );
}

// The drawer's identity block: name with the contact channels right next to it
// (LinkedIn / website icons, then the email as an icon + copy button — never the
// full address). Extra emails sit behind "+N", revealed as a list below.
function InvestorIdentity({ investor }: { investor: MockInvestor }) {
  const emails = investor.emails ?? (investor.email ? [investor.email] : []);
  const [showAll, setShowAll] = useState(false);
  const extra = emails.length - 1;
  const primary = emails[0];

  // Close the extra-emails popover on click outside (mirrors AddToListButton).
  const popRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!showAll) return;
    const onDown = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setShowAll(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [showAll]);

  return (
    <div className={s.headerWho}>
      <div className={x.nameLine}>
        <h2 className={s.name}>
          {investor.first_name} {investor.last_name}
        </h2>
        <CompactChannels
          icons={[
            ...(investor.linkedin_url ? [{ type: 'linkedin', handle: investor.linkedin_url }] : []),
            ...(investor.firm_domain ? [{ type: 'website', handle: investor.firm_domain }] : []),
          ]}
          email={primary}
          trailing={
            extra > 0 ? (
              <span className={x.emailPopWrap} ref={popRef}>
                <button type="button" className={x.teamMoreBtn} onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
                  {`+${extra} email${extra === 1 ? '' : 's'}`}
                </button>
                {showAll && (
                  <div className={x.emailPop}>
                    {emails.slice(1).map((em) => (
                      <span key={em} className={x.emailRow}>
                        <span className={x.emailAddr}>{em}</span>
                        <CopyButton text={em} className={x.copyEmail} />
                      </span>
                    ))}
                  </div>
                )}
              </span>
            ) : undefined
          }
        />
        {/* In LabOS sits with the contact details (next to the name), not in the
            status pill row. Uses the profile thumbnail. */}
        <InLabOsPill profile={investor.lab_os_profile ?? null} />
      </div>
      <div className={s.meta}>
        {investor.title || '—'}
        <InvestorAffiliations investor={investor} />
      </div>
      <div className={s.metaSub}>{investor.investor_id}</div>
    </div>
  );
}

// "In LabOS" pill — reuses the production LabOsBadge pill styling, but with the
// member's generated profile thumbnail instead of the colored initials.
export function InLabOsPill({ profile }: { profile: LabOsProfileRef | null }) {
  if (!profile) return null;
  const href = profile.type === 'member' ? `/members/${profile.uid}` : `/teams/${profile.uid}`;
  return (
    <a
      className={labOs.pill}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={`View ${profile.name}'s LabOS profile`}
      onClick={(e) => e.stopPropagation()}
    >
      <img className={labOs.pillAvatar} src={getDefaultAvatar(profile.name)} alt="" style={{ objectFit: 'cover' }} />
      <span className={labOs.pillName}>In LabOS</span>
      <span className={labOs.pillArrow} aria-hidden>
        ↗
      </span>
    </a>
  );
}

// No "copy" icon in the app set yet — keep this small inline one for the footer.
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);
