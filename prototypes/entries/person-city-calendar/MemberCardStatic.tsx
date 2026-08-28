'use client';

/**
 * Copy-simplified production member card.
 *
 * `MemberGridView` can't be imported here: it calls `useSearchParams`, wraps a
 * dynamic Tooltip, and — the blocker — renders `parseMemberLocation(location)`,
 * which can only ever emit "City, Country". Showing a travel state needs a
 * different label, so the card is transcribed instead.
 *
 * Structure and every class come straight from
 * components/page/members/member-grid-view.tsx:38-128, and the styles are the
 * *production* module (`MemberCard.module.scss`) imported read-only — so the
 * card tracks production automatically and only the label slot differs.
 * Dropped: search-param awareness, the team-lead tooltip, the +N teams tooltip.
 */

import { getDefaultAvatar } from '@/hooks/useDefaultAvatar';
import s from '@/components/page/members/MemberCard/MemberCard.module.scss';
import type { PersonCityMember } from './mocks';
import type { Presence } from './presence';
import { PresenceLabel } from './PresenceLabel';

interface MemberCardStaticProps {
  member: PersonCityMember;
  presence: Presence;
}

export function MemberCardStatic({ member, presence }: MemberCardStaticProps) {
  const isAvailableToConnect = Boolean(member.officeHours);

  return (
    <div className={s.root}>
      <div className={s.top}>
        <div className={s.avatarWrapper}>
          <div className={`${member.teamLead ? 'gradiant-border-rounded' : ''} ${s.outerRing}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="profile" height={72} width={72} className={s.avatar} src={getDefaultAvatar(member.name)} />
            {member.teamLead && (
              <img
                loading="lazy"
                className="member-grid__profile-container__outer-section__inner-circle__lead"
                height={20}
                width={20}
                src="/icons/badge/team-lead.svg"
                alt="Team lead"
              />
            )}
          </div>
        </div>
      </div>

      <div className={s.detailsSection}>
        {isAvailableToConnect && (
          <div className={s.availableToConnectBadge}>
            <CalendarIcon /> Available to connect
          </div>
        )}
        <div className={s.content}>
          <h3 className={s.primaryText}>{member.name}</h3>
          <div className={s.positionDetails}>
            <div className={s.secondaryText}>
              <span className={s.teamName} title={member.teamName}>
                {member.teamName}{' '}
              </span>
            </div>
            <p className={s.secondaryText}>{member.role}&nbsp;</p>
          </div>

          {/* The only divergence from production: the same slot, but the label
              swaps to the travel state when the person is away. */}
          <div className={s.locationWrapper}>
            <PresenceLabel presence={presence} home={member.home} variant="card" />
          </div>

          {/* No overlap line. The card already shows the city and dates in its
              location slot, and under the lens every card is an overlap — a row
              restating that on all of them is a caption on the filter, not
              information about the person. */}
        </div>
      </div>
    </div>
  );
}

/* Transcribed from member-grid-view.tsx:170-186 (the badge's calendar glyph). */
const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13 2.5h-1.5V2a.5.5 0 0 0-1 0v.5h-5V2a.5.5 0 0 0-1 0v.5H3a1 1 0 0 0-1 1V13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3.5a1 1 0 0 0-1-1Zm0 10.5H3V6h10v7ZM13 5H3V3.5h1.5V4a.5.5 0 0 0 1 0v-.5h5V4a.5.5 0 0 0 1 0v-.5H13V5Z"
      fill="#1B4DFF"
    />
  </svg>
);
