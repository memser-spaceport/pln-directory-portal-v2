'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { resolveBestConnector, type BestConnector } from '@/services/investors/pathfinder.service';
import type { PathfinderPath } from '@/services/investors/types';
import { formatTimeAgo } from '@/utils/formatTimeAgo';
import { UsersThreeIcon } from '@/components/icons';
import s from './PathSummaryGraph.module.scss';

interface Props {
  /** Rank-1 path (resolved in the parent). null → nothing renders. */
  bestPath: PathfinderPath | null;
  investorName: string;
  /** Affinity last-email date (ISO); rendered as a relative time when present. */
  lastEmailAt?: string | null;
}

/**
 * Compact route summary atop the warm-path cards: a Protocol Labs node that
 * carries the best connector inside it → the target investor, with a quiet
 * "tie 0.62 · last email 21d ago" caption beneath. The connector is resolved
 * from the rank-1 path (see resolveBestConnector), so it always matches the
 * rank-1 card below.
 */
export function PathSummaryGraph({ bestPath, investorName, lastEmailAt }: Props) {
  if (!bestPath) return null;

  const connector = resolveBestConnector(bestPath);
  const caption = buildCaption(bestPath.score, lastEmailAt);

  return (
    <div className={s.root}>
      <div className={s.graph}>
        <div className={s.plNode}>
          <span className={s.plLabel}>Protocol Labs</span>
          {connector.kind !== 'none' && (
            <>
              <span className={s.plDivider} aria-hidden />
              <Connector connector={connector} />
            </>
          )}
        </div>
        <span className={s.arrow} aria-hidden>
          →
        </span>
        <div className={s.investorNode}>
          <span className={clsx(s.avatar, s.avatarGrey)} aria-hidden>
            <span className={s.avatarInitials}>{initials(investorName)}</span>
          </span>
          <span className={s.nodeLabel} title={investorName}>
            {investorName}
          </span>
        </div>
      </div>
      {caption && <div className={s.caption}>{caption}</div>}
    </div>
  );
}

function Connector({ connector }: { connector: Extract<BestConnector, { kind: 'contact' | 'org' }> }) {
  if (connector.kind === 'contact') {
    const { contact } = connector;
    const kind = contact.member_uid ? 'member' : 'externalPerson';
    const body = (
      <>
        <Avatar imageUrl={contact.image_url} name={contact.name} kind={kind} />
        <span className={s.nodeLabel} title={contact.name}>
          {contact.name}
        </span>
      </>
    );
    return contact.member_uid ? (
      <Link className={s.connector} href={`/members/${contact.member_uid}`} target="_blank" rel="noopener noreferrer">
        {body}
      </Link>
    ) : (
      <span className={s.connector}>{body}</span>
    );
  }

  const { org } = connector;
  const body = (
    <>
      <Avatar imageUrl={org.logo_url} name={org.name} kind="org" />
      <span className={s.nodeLabel} title={org.name}>
        {org.name}
      </span>
      <span className={s.unknownMark} aria-label="contact unknown">
        ?
      </span>
    </>
  );
  return org.team_uid ? (
    <Link className={s.connector} href={`/teams/${org.team_uid}`} target="_blank" rel="noopener noreferrer">
      {body}
    </Link>
  ) : (
    <span className={s.connector}>{body}</span>
  );
}

type AvatarKind = 'member' | 'externalPerson' | 'org';

function Avatar({ imageUrl, name, kind }: { imageUrl?: string; name: string; kind: AvatarKind }) {
  if (imageUrl) {
    return (
      <span className={s.avatar}>
        <img
          src={imageUrl}
          alt=""
          width={20}
          height={20}
          className={s.avatarImg}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <span className={s.avatarFallback} style={{ display: 'none' }} aria-hidden>
          <Glyph kind={kind} name={name} />
        </span>
      </span>
    );
  }
  return (
    <span className={clsx(s.avatar, kind === 'externalPerson' && s.avatarGrey)} aria-hidden>
      <Glyph kind={kind} name={name} />
    </span>
  );
}

function Glyph({ kind, name }: { kind: AvatarKind; name: string }) {
  if (kind === 'org') return <UsersThreeIcon width={12} height={12} />;
  if (kind === 'externalPerson') return <PersonGlyph />;
  return <span className={s.avatarInitials}>{initials(name)}</span>;
}

/** Plain person silhouette for a known contact who is not in the PL network. */
function PersonGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

/** "tie 0.62 · last email 21d ago" — segments joined so a missing side never
 *  leaves a dangling separator. tie only for a finite score in [0,1]. */
export function buildCaption(score: number, lastEmailAt?: string | null): string {
  const segments: string[] = [];
  if (Number.isFinite(score) && score >= 0 && score <= 1) segments.push(`tie ${score.toFixed(2)}`);
  const rel = formatTimeAgo(lastEmailAt);
  if (rel) segments.push(`last email ${rel}`);
  return segments.join(' · ');
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
