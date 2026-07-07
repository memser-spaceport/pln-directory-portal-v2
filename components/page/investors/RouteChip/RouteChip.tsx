'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { PathHopNode } from '@/services/investors/types';
import s from './RouteChip.module.scss';

interface Props {
  node: PathHopNode;
  /** Optional logo URL for portfolio_org variant — resolved from coInvestedTeams. */
  teamLogoUrl?: string;
}

export function RouteChip({ node, teamLogoUrl }: Props) {
  if (node.type === 'person') {
    if ('member_uid' in node && node.member_uid) {
      // pl_member — PL network person with a directory profile
      return (
        <Link href={`/members/${node.member_uid}`} className={s.chip} target="_blank" rel="noopener noreferrer">
          <span className={s.avatarWrap}>
            <MemberAvatar name={node.label} />
          </span>
          <span className={s.chipLabel}>{node.label}</span>
          <span className={s.arrowIcon} aria-hidden>↗</span>
        </Link>
      );
    }
    // external_person — known person not in PL network
    return (
      <span className={s.chip}>
        <span className={s.avatarWrap}>
          <span className={s.avatarGrey} aria-hidden>
            <PersonIcon />
          </span>
        </span>
        <span className={s.chipLabel}>{node.label}</span>
      </span>
    );
  }

  // org variants
  if ('team_uid' in node && node.team_uid) {
    // portfolio_org — PL portfolio team
    return (
      <Link href={`/teams/${node.team_uid}`} className={s.chip} target="_blank" rel="noopener noreferrer">
        <span className={s.avatarWrap}>
          <OrgAvatar name={node.label} logoUrl={teamLogoUrl} />
        </span>
        <span className={s.chipLabel}>{node.label}</span>
        <span className={s.arrowIcon} aria-hidden>↗</span>
        <span className={s.unknownMark} aria-label="contact unknown">
          ?
        </span>
      </Link>
    );
  }

  // vc_org — external VC/firm, person unknown
  return (
    <span className={s.chip}>
      <span className={s.avatarWrap}>
        <OrgAvatar name={node.label} logoUrl={undefined} />
      </span>
      <span className={s.chipLabel}>{node.label}</span>
      <span className={s.unknownMark} aria-label="contact unknown">
        ?
      </span>
    </span>
  );
}

function MemberAvatar({ name }: { name: string }) {
  return (
    <span className={s.avatar}>
      <span className={s.avatarInitials} aria-hidden>
        {initials(name)}
      </span>
    </span>
  );
}

function OrgAvatar({ name, logoUrl }: { name: string; logoUrl?: string }) {
  if (logoUrl) {
    return (
      <span className={s.avatar}>
        <Image
          src={logoUrl}
          alt={name}
          width={20}
          height={20}
          className={s.avatarImg}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <span className={s.avatarInitials} style={{ display: 'none' }} aria-hidden>
          {initials(name)}
        </span>
      </span>
    );
  }
  return (
    <span className={s.avatar}>
      <span className={s.avatarInitials} aria-hidden>
        {initials(name)}
      </span>
    </span>
  );
}

function PersonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}
