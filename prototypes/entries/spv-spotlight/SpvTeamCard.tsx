'use client';

import React from 'react';
import clsx from 'clsx';
import { Button } from '@/components/common/Button';
import { getDefaultAvatar, useDefaultAvatar } from '@/hooks/useDefaultAvatar';
import TeamsTagsList from '@/components/page/teams/teams-tags-list';
// PastTeamCard's own classes for the card surface, the name and the
// one-liner. The component is copy-simplified: its Follow button runs the
// useFollowTeam mutation and means nothing to a visitor on a chromeless deal
// page, so it is dropped with the news-count badge. The card opens the team
// drawer instead of linking out to /teams.
import c from '@/components/page/demo-day/DemodayCompletedView/components/CompletedDemoDayTeamsList/components/PastTeamCard.module.scss';
// The team profile's follower stack — the product's facepile — for founders.
import tp from '../team-profile/TeamProfile.module.scss';
import { ExternalIcon } from './SpvTeamDrawer';
import type { SpvTeam } from './teams';
import s from './SpvSpotlight.module.scss';

type Props = {
  team: SpvTeam;
  showMaterials: boolean;
  onOpen: () => void;
};

// Same box as the stack icon production puts on the Priority chip (14×12).
const FocusGlyph = () => (
  <svg width="14" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
    <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.25" />
    <circle cx="7" cy="7" r="2" fill="currentColor" />
  </svg>
);

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * Card anatomy from the marketplace grids on Mobbin — Base44's partner cards
 * and Fiverr's agency cards: identity on top (logo, name, one fact), the
 * description and tags in the middle, and a hairline-divided footer with the
 * people on the left and the card's one action on the right. Peerlist's
 * company cards supply the footer's left half ("Sanket and 5 others in the
 * team"). Dribbble's brief cards confirm the action belongs in that footer,
 * not indented under the text column where it sat before.
 */
export const SpvTeamCard = ({ team, showMaterials, onOpen }: Props) => {
  const { name, logoUrl, shortDescription, docSendUrl } = team;
  const defaultAvatarImage = useDefaultAvatar(name);
  const stage = team.team.fundingStage?.title;
  const founders = team.members;
  // First names: full names ellipsise beside the View materials button, and
  // the drawer's Members section carries them in full with roles.
  const firstNames = founders.map((m) => (m.name ?? '').split(' ')[0]);
  const founderLine =
    firstNames.length <= 2 ? firstNames.join(' & ') : `${firstNames[0]} and ${firstNames.length - 1} others`;

  return (
    <div
      className={clsx(c.root, s.teamCard)}
      role="button"
      tabIndex={0}
      aria-label={`Open ${name}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className={s.cardHead}>
        {/* <img> rather than next/image: the fallback is a data: URI. */}
        <img
          width={40}
          height={40}
          alt={`${name} logo`}
          src={logoUrl || defaultAvatarImage}
          className={clsx(s.cardLogo, { [c.defaultLogo]: !logoUrl })}
        />
        <div className={s.cardIdentity}>
          <div className={c.name}>{name}</div>
          {/* The one fact an investor sorts by, on the card rather than only
              in the drawer's badge row. */}
          {stage && <div className={s.cardMeta}>{stage}</div>}
        </div>
      </div>

      {/* Real one-liners run to three lines on the teams list, so clamp there. */}
      <div className={clsx(c.description, s.cardDescription)}>{shortDescription}</div>

      {/* The teams list's own tag row (TeamsTagsList, the rest in a "+N"
          tooltip), showing one tag as production does on phones — a second
          tag clips at 74px and pushes "+N" off a 3-column card. There the lead
          chip is Priority with a stack icon, and an iconed Tag gets 154px
          instead of 74px. Priority is internal and stays off an investor page,
          so the team's main focus area takes that slot and treatment, with a
          target glyph of its own — reusing the stack icon would read as
          Priority. */}
      <div className={s.cardTags}>
        <TeamsTagsList
          tags={[{ title: team.leadFocusArea, icon: <FocusGlyph /> }, ...team.cardTags]}
          noOfTagsToShow={1}
        />
      </div>

      <div className={s.cardFooter}>
        <div className={s.cardFounders}>
          <span className={tp.subAvatars} aria-hidden="true">
            {founders.slice(0, 3).map((m) => (
              <img key={m.id} className={tp.subAvatar} src={getDefaultAvatar(m.name)} alt="" />
            ))}
          </span>
          <span className={s.cardFounderNames}>{founderLine}</span>
        </div>

        {showMaterials ? (
          <a
            href={docSendUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={s.cardMaterials}
            onClick={(e) => e.stopPropagation()}
          >
            <Button size="s" style="border" variant="secondary">
              View materials <ExternalIcon />
            </Button>
          </a>
        ) : (
          // Signposts what the card does — it opens the team — without a
          // second button naming the same destination as the card itself.
          <span className={s.cardChevron} aria-hidden>
            <ChevronRight />
          </span>
        )}
      </div>
    </div>
  );
};
