'use client';

import React, { useState } from 'react';
import clsx from 'clsx';
// PL Spotlight's single team card (TeamProfileCard, as PitchView renders it):
// the white card, and its header's logo / name / one-liner / tag chips /
// founder avatars from ProfileHeader's stylesheet. The header markup itself is
// rebuilt here (ProfileHeader's analytics hook reads the auth store).
import card from '@/components/page/demo-day/ActiveView/components/TeamsList/components/TeamProfileCard/TeamProfileCard.module.scss';
import h from '@/components/page/demo-day/FounderPendingView/components/ProfileSection/components/ProfileHeader/ProfileHeader.module.scss';
// PL Spotlight's card primary (DemoDayActionButtons' Invest in Company).
import act from '@/components/page/demo-day/DemoDayActionButtons/DemoDayActionButtons.module.scss';
import { SpvMediaCarousel } from './SpvMediaCarousel';
import type { WebsiteImage } from './netholabs';
import type { SpvTeam } from './teams';
import s from './SpvSpotlight.module.scss';

// The live directory, as the Explore landing links it.
const DIRECTORY_URL = 'https://os.pl.xyz';

type Props = {
  team: SpvTeam;
  facts: { location: string; teamSize: string };
  summary: string;
  images: WebsiteImage[];
  // The team's full About (directory HTML). Collapsed to the summary by
  // default; open from the start while a request waits for approval, when the
  // team is the only thing left to read (2026-09-29 sync: "more team detail").
  aboutHtml?: string;
  aboutOpen?: boolean;
  // The card's call to action for this viewer: SpvCardAction or SpvCardStatus.
  // Built by the page, which knows the viewer's state.
  action?: React.ReactNode;
};

/**
 * What goes in the header's action slot. SpvCardAction is the one door into
 * the data room (Request access, then View materials); SpvCardStatus is the
 * quiet line that holds the slot when there is nothing to press, and the hero
 * says the rest.
 */
export const SpvCardAction = ({
  label,
  href,
  onClick,
  note,
  secondary,
}: {
  label: string;
  // An href opens the DocSend in a new tab; otherwise it's a button.
  href?: string;
  onClick?: () => void;
  note?: React.ReactNode;
  // The second call to action (2026-10-01 standup): set up the investor
  // profile, to get the deals that fit. DemoDayActionButtons' light-brand
  // secondary beside the primary, as its card row pairs Make an Intro with
  // Invest in Company.
  secondary?: { label: string; onClick: () => void };
}) => (
  <div className={s.cardAction}>
    <div className={s.cardActionButtons}>
      {secondary && (
        <button type="button" className={clsx(act.secondaryButton, s.cardActionButton)} onClick={secondary.onClick}>
          {secondary.label}
        </button>
      )}
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(act.primaryButton, s.cardActionButton)}
        >
          {label} <ExternalIcon />
        </a>
      ) : (
        <button type="button" className={clsx(act.primaryButton, s.cardActionButton)} onClick={onClick}>
          {label} <ArrowRightIcon />
        </button>
      )}
    </div>
    {note && <p className={s.cardActionNote}>{note}</p>}
  </div>
);

export const SpvCardStatus = ({ children }: { children: React.ReactNode }) => (
  <p className={s.cardStatus}>
    <LockIcon />
    <span>{children}</span>
  </p>
);

/**
 * The one team this SPV is for, as a brief official card rather than the whole
 * directory profile. PL Spotlight's card, reorganised (references from Mobbin,
 * 2026-09-29):
 * - identity (logo, name, one-liner) stands alone at the top;
 * - Stage, Headquarters, Team size and Website are a labelled key-value strip
 *   (Linear's customer page, Wellfound's funding box) instead of a chip row;
 * - media left, reading column right (Fey's About, Wellfound's side panel):
 *   About, Focus tags, Founders, each under a small label (Attio / Pin);
 * - founders are bordered tiles (Wellfound);
 * - the carousel is the team's own website imagery, where PL Spotlight had its
 *   pitch slide and video (PL no longer hosts either).
 * The data-room action lives in the card (2026-09-29: moved out of the hero),
 * at the right of the identity header: the slot ProfileHeader gives PL
 * Spotlight's own header actions (Stats / Save / More info, `linksWrapper`),
 * drawn with PL Spotlight's card primary button. Not in TeamProfileCard's
 * bottom action row: this card is taller than a screen, and the one thing to
 * do should sit beside the team's name, above the fold. On phones it drops
 * under the identity at full width. The founder tiles are the one way into the
 * directory: each opens that person's profile in a new tab.
 */ export function SpvTeamSpotlight({ team, facts, summary, images, aboutHtml, aboutOpen = false, action }: Props) {
  const [showFull, setShowFull] = useState(aboutOpen);
  const website = team.team.website ?? '';
  const host = website.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const tags = (team.team.industryTags ?? []).map((t) => t.title);

  const factItems: { label: string; value: React.ReactNode }[] = [
    { label: 'Stage', value: team.team.fundingStage?.title ?? 'Not specified' },
    { label: 'Headquarters', value: facts.location },
    { label: 'Team size', value: `${facts.teamSize} people` },
    {
      label: 'Website',
      value: website ? (
        <a href={website} target="_blank" rel="noopener noreferrer" className={s.factLink}>
          {host}
          <ArrowUpRight />
        </a>
      ) : (
        '—'
      ),
    },
  ];

  return (
    <article className={clsx(card.profileCard, s.spotlightCard)} aria-label={team.name}>
      <header className={s.spotlightIdentity}>
        <div className={clsx(h.profileImage, s.spotlightLogo)}>
          <img src={team.logoUrl} alt={`${team.name} logo`} />
        </div>
        <div className={s.spotlightIdentityText}>
          <h3 className={clsx(h.memberName, s.spotlightName)}>{team.name}</h3>
          <p className={s.spotlightOneLiner}>{team.shortDescription}</p>
        </div>
        {action && <div className={s.spotlightActionSlot}>{action}</div>}
      </header>

      <dl className={s.factStrip}>
        {factItems.map((f) => (
          <div key={f.label} className={s.fact}>
            <dt className={s.factLabel}>{f.label}</dt>
            <dd className={s.factValue}>{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className={s.spotlightBody}>
        <SpvMediaCarousel images={images} label={`${team.name}, from its website`} sourceUrl={website} />

        <div className={s.spotlightAside}>
          <section className={s.asideBlock}>
            <h4 className={s.asideLabel}>About</h4>
            {showFull && aboutHtml ? (
              <div className={s.spotlightAboutFull} dangerouslySetInnerHTML={{ __html: aboutHtml }} />
            ) : (
              <p className={s.spotlightSummaryText}>{summary}</p>
            )}
            {aboutHtml && (
              <button
                type="button"
                className={s.aboutToggle}
                onClick={() => setShowFull((v) => !v)}
                aria-expanded={showFull}
              >
                {showFull ? 'Show less' : 'Read all'}
              </button>
            )}
          </section>

          {tags.length > 0 && (
            <section className={s.asideBlock}>
              <h4 className={s.asideLabel}>Focus</h4>
              <div className={h.tagList}>
                {tags.map((tag) => (
                  <span key={tag} className={h.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {team.members.length > 0 && (
            <section className={s.asideBlock}>
              <h4 className={s.asideLabel}>Founders</h4>
              <ul className={s.founderTiles}>
                {/* Each founder opens their directory profile in a new tab
                    (2026-09-29 review), so the deal page stays where it is. */}
                {team.members.map((m) => (
                  <li key={m.id}>
                    <a
                      className={s.founderTile}
                      href={`${DIRECTORY_URL}/members/${m.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div
                        className={clsx(h.founderAvatar, s.founderTileAvatar)}
                        style={{ backgroundImage: `url('${m.profile ?? ''}')` }}
                        role="img"
                        aria-label={m.name}
                      />
                      <div className={h.founderText}>
                        <div className={clsx(h.founderName, s.founderTileName)}>{m.name}</div>
                        <div className={h.founderRole}>{m.teams?.[0]?.role ?? 'Co-Founder'}</div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </article>
  );
}

const ArrowUpRight = () => (
  <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path
      d="M13.5 4.5L4.5 13.5M13.5 4.5H8.25M13.5 4.5V9.75"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M3 8h10M9 4l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ExternalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <path
      d="M6 3.5H3.5v9h9V10M9 3.5h3.5V7M12.5 3.5 7 9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
