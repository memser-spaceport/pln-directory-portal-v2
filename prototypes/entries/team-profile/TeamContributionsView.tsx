'use client';

import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { DetailsSection, DetailsSectionHeader } from '@/components/common/profile/DetailsSection';
import { Modal } from '@/components/common/Modal';

import { type DemoDayParticipation } from './TeamDetailsView';
import type { ContributionEvent } from './mocks';
import s from './TeamContributions.module.scss';

/** Role-tag treatment. Layout is identical in both — only the pills differ:
 *  - 'vibrant' → filled IRL gradient pills
 *  - 'muted'   → quieter tinted pills */
export type ContributionsVariant = 'vibrant' | 'muted';

interface Props {
  contributions: ContributionEvent[];
  /** When set, features the team's Demo Day participation as the leading tile. */
  demoDay?: DemoDayParticipation | null;
  variant?: ContributionsVariant;
}

// Tiles are sized 4 per row, so two rows hold 8. Anything beyond that collapses
// into a "+N" tile that opens the full list in a modal.
const MAX_TILES = 8;

/**
 * Event-primary "Contributions" block. The EVENT is primary; the role(s) the
 * team played are tags on it (Host / Sponsor / Speaker / Participant), reusing
 * the IRL gathering pill look. Demo Day, when present, leads as a featured tile.
 */
export function TeamContributionsView({ contributions, demoDay, variant = 'vibrant' }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const total = contributions.length + (demoDay ? 1 : 0);
  if (total === 0) return null;

  const muted = variant === 'muted';
  const hasDemo = !!demoDay;
  // Keep to two rows: past that, reserve the last slot for the "+N" tile.
  const eventBudget = total > MAX_TILES ? MAX_TILES - 1 - (hasDemo ? 1 : 0) : contributions.length;
  const visibleEvents = contributions.slice(0, eventBudget);
  const overflow = contributions.length - visibleEvents.length;

  return (
    <DetailsSection>
      <DetailsSectionHeader title={`Contributions (${total})`} />
      <div className={s.grid}>
        {demoDay && (
          <DemoLink demoDay={demoDay} className={`${s.tile} ${s.demoTile}`}>
            <div className={s.roleTags}>
              <span className={`${s.roleTag} ${s.roleTagDemo}`}>Participant</span>
            </div>
            <div className={s.tileMeta}>
              <span className={s.eventName}>{demoDay.title}</span>
              {demoDay.date && <span className={s.eventDate}>{demoDay.date}</span>}
            </div>
          </DemoLink>
        )}

        {visibleEvents.map((event) => (
          <EventLink key={event.uid} event={event} className={s.tile}>
            <div className={s.roleTags}>
              <RolePills roles={event.roles} muted={muted} />
            </div>
            <div className={s.tileMeta}>
              <span className={s.eventName}>{event.name}</span>
              <span className={s.eventDate}>{event.date}</span>
            </div>
          </EventLink>
        ))}

        {overflow > 0 && (
          <button
            type="button"
            className={`${s.tile} ${s.tileMore}`}
            onClick={() => setModalOpen(true)}
            aria-label={`Show all ${total} contributions`}
          >
            +{overflow}
          </button>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} className={s.modal}>
        <div className={s.modalHeader}>
          <span className={s.modalTitle}>Contributions ({total})</span>
          <button type="button" className={s.modalClose} onClick={() => setModalOpen(false)} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className={s.modalBody}>
          {demoDay && (
            <DemoLink demoDay={demoDay} className={s.modalRow}>
              <span className={s.modalTags}>
                <span className={`${s.roleTag} ${roleClass('participant', muted)}`}>Participant</span>
              </span>
              <span className={s.modalName}>{demoDay.title}</span>
              {demoDay.date && <span className={s.modalDate}>{demoDay.date}</span>}
            </DemoLink>
          )}

          {contributions.map((event) => (
            <EventLink key={event.uid} event={event} className={s.modalRow}>
              <span className={s.modalTags}>
                <RolePills roles={event.roles} muted={muted} />
              </span>
              <span className={s.modalName}>{event.name}</span>
              <span className={s.modalDate}>{event.date}</span>
            </EventLink>
          ))}
        </div>
      </Modal>
    </DetailsSection>
  );
}

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ------------------------------ shared ------------------------------ */

function RolePills({ roles, muted }: { roles: string[]; muted?: boolean }) {
  // "Participant" is implied by any active role (Host / Sponsor / Speaker) —
  // only show it when the team took part but held no active role.
  const shown = roles.filter((role) => role.toLowerCase() !== 'participant' || roles.length === 1);
  return (
    <>
      {shown.map((role) => (
        <span key={role} className={`${s.roleTag} ${roleClass(role, muted)}`}>
          {role}
        </span>
      ))}
    </>
  );
}

/** Demo Day deep-links to its page (mock points at a real demo day slug). */
function DemoLink({ demoDay, className, children }: { demoDay: DemoDayParticipation; className: string; children: ReactNode }) {
  return (
    <Link
      href={`/demoday/${demoDay.slug}`}
      className={className}
      onClick={(e) => e.stopPropagation()}
      aria-label={`Participated in ${demoDay.title} — view demo day`}
    >
      {children}
    </Link>
  );
}

/**
 * Events deep-link to their IRL gathering page, mirroring how production's
 * TeamIrlContributions builds the URL (location + type + event slug).
 */
function EventLink({ event, className, children }: { event: ContributionEvent; className: string; children: ReactNode }) {
  if (!event.slugURL) return <div className={className}>{children}</div>;

  const href = `/events/irl?location=${encodeURIComponent(event.location ?? '')}&type=past&event=${event.slugURL}`;
  return (
    <Link href={href} className={className} onClick={(e) => e.stopPropagation()} aria-label={`${event.name} — view gathering`}>
      {children}
    </Link>
  );
}

/** Map a role to its color-modifier class — vibrant gradient or muted tint. */
function roleClass(role: string, muted?: boolean): string {
  const r = role.toLowerCase();
  if (muted) {
    switch (r) {
      case 'host':
        return s.roleTagMutedHost;
      case 'sponsor':
        return s.roleTagMutedSponsor;
      case 'speaker':
        return s.roleTagMutedSpeaker;
      case 'participant':
        return s.roleTagMutedParticipant;
      default:
        return '';
    }
  }
  switch (r) {
    case 'host':
      return s.roleTagHost;
    case 'sponsor':
      return s.roleTagSponsor;
    case 'speaker':
      return s.roleTagSpeaker;
    case 'participant':
      return s.roleTagParticipant;
    default:
      return '';
  }
}
