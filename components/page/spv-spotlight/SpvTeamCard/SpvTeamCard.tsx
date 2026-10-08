'use client';

import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { SpvTeamWebsiteSource } from '@/analytics/spv-spotlight.analytics';
import type { SpvMedia, SpvTeam } from '@/services/spv-spotlight/types';
import { sanitizeSpvHtml } from '@/utils/html/sanitizeSpvHtml';
import { ArrowRightIcon, ArrowUpRightIcon, ExternalIcon, LockIcon } from '../icons';
import { SpvMediaCarousel } from '../SpvMediaCarousel/SpvMediaCarousel';
import s from './SpvTeamCard.module.scss';

type Props = {
  team: SpvTeam;
  media: SpvMedia[];
  /** Start with the full About open (a pending request, when the team is the only thing left to read). */
  aboutOpen?: boolean;
  /** The header's action slot: SpvCardAction or SpvCardStatus, chosen by the page. */
  action?: React.ReactNode;
  onFounderClicked?: (memberUid: string) => void;
  onWebsiteClicked?: (source: SpvTeamWebsiteSource) => void;
};

/**
 * The data-room door: Request access, then Access data room. An `href` opens in
 * a new tab (the DocSend); otherwise it's a button. With a note, the note wraps
 * to the button's width so button, date and terms read as one column.
 *
 * `stretch` spreads the link over its nearest positioned ancestor (the data room
 * band), so the whole band is one link: one tab stop, one click, one event.
 */
export const SpvCardAction = ({
  label,
  href,
  onClick,
  note,
  stretch = false,
}: {
  label: string;
  href?: string;
  onClick?: () => void;
  note?: React.ReactNode;
  stretch?: boolean;
}) => (
  <div className={clsx(s.cardAction, note && s.cardActionWithNote)}>
    {href ? (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(s.cardActionButton, stretch && s.cardActionButtonStretch)}
        onClick={onClick}
      >
        {label} <ExternalIcon />
      </a>
    ) : (
      <button type="button" className={s.cardActionButton} onClick={onClick}>
        {label} <ArrowRightIcon />
      </button>
    )}
    {note && <p className={s.cardActionNote}>{note}</p>}
  </div>
);

/** The open data room's note: the close date (when the admin set one) and where the terms are. */
export const SpvDataRoomNote = ({ closesLabel }: { closesLabel: string | null }) => (
  <>
    {closesLabel && <span className={s.cardActionDeadline}>Closes {closesLabel}</span>}
    <span className={s.cardActionTerms}>Allocation, minimum check and SPV terms are inside.</span>
  </>
);

/** The quiet line that holds the slot when there's nothing to press. */
export const SpvCardStatus = ({ children }: { children: React.ReactNode }) => (
  <p className={s.cardStatus}>
    <LockIcon />
    <span>{children}</span>
  </p>
);

/**
 * The one team this SPV is for: PL Spotlight's single team card, reorganised.
 * Identity (logo, name, one-liner) with the action slot at its right; a
 * labelled facts strip; the team's website images where the pitch deck and
 * video were; About, Focus and Founders beside them. Founder tiles open the
 * founder's directory profile in a new tab, so the page stays where it is.
 */
export function SpvTeamCard({ team, media, aboutOpen = false, action, onFounderClicked, onWebsiteClicked }: Props) {
  const [showFull, setShowFull] = useState(aboutOpen);
  const aboutHtml = useMemo(() => sanitizeSpvHtml(team.longDescription), [team.longDescription]);
  const rawWebsite = team.website?.trim() ?? '';
  // Directory websites are free text ("www.netholabs.com"); without a scheme the
  // href would resolve as a path on this site.
  const website = rawWebsite && !/^https?:\/\//i.test(rawWebsite) ? `https://${rawWebsite}` : rawWebsite;
  const host = rawWebsite.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  const summary = team.summary?.trim() || team.shortDescription;

  const facts: { label: string; value: React.ReactNode }[] = [
    { label: 'Stage', value: team.fundingStage || 'Not specified' },
    { label: 'Headquarters', value: team.location || '—' },
    { label: 'Team size', value: team.teamSize ? `${team.teamSize} people` : '—' },
    {
      label: 'Website',
      value: website ? (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className={s.factLink}
          onClick={() => onWebsiteClicked?.('fact-strip')}
        >
          {host}
          <ArrowUpRightIcon />
        </a>
      ) : (
        '—'
      ),
    },
  ];

  return (
    <article className={s.card} aria-label={team.name}>
      <header className={s.identity}>
        <div className={s.logo}>{team.logoUrl && <img src={team.logoUrl} alt={`${team.name} logo`} />}</div>
        <div className={s.identityText}>
          <h2 className={s.name}>{team.name}</h2>
          <p className={s.oneLiner}>{keepTailTogether(team.shortDescription)}</p>
        </div>
        {action && <div className={s.actionSlot}>{action}</div>}
      </header>

      <dl className={s.factStrip}>
        {facts.map((f) => (
          <div key={f.label} className={s.fact}>
            <dt className={s.factLabel}>{f.label}</dt>
            <dd className={s.factValue}>{f.value}</dd>
          </div>
        ))}
      </dl>

      <div className={s.body}>
        {media.length > 0 && (
          <SpvMediaCarousel
            images={media}
            label={`${team.name}, from its website`}
            sourceUrl={website}
            onSourceClicked={() => onWebsiteClicked?.('carousel')}
          />
        )}

        <div className={s.aside}>
          <section className={s.asideBlock}>
            <h3 className={s.asideLabel}>About</h3>
            {showFull && aboutHtml ? (
              <div className={s.aboutFull} dangerouslySetInnerHTML={{ __html: aboutHtml }} />
            ) : (
              <p className={s.summary}>{summary}</p>
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

          {team.tags.length > 0 && (
            <section className={s.asideBlock}>
              <h3 className={s.asideLabel}>Focus</h3>
              <ul className={s.tagList}>
                {team.tags.map((tag) => (
                  <li key={tag} className={s.tag}>
                    {tag}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {team.founders.length > 0 && (
            <section className={s.asideBlock}>
              <h3 className={s.asideLabel}>Founders</h3>
              <ul className={s.founders}>
                {team.founders.map((f) => (
                  <li key={f.uid}>
                    <a
                      className={s.founder}
                      href={`/members/${f.uid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => onFounderClicked?.(f.uid)}
                    >
                      <div
                        className={s.founderAvatar}
                        style={f.imageUrl ? { backgroundImage: `url('${f.imageUrl}')` } : undefined}
                        aria-hidden
                      />
                      <div className={s.founderText}>
                        <div className={s.founderName}>{f.name}</div>
                        {f.role && <div className={s.founderRole}>{f.role}</div>}
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

/** The page's primary button look, for doors outside the card (the locked hero). */
// Keeps the one-liner's last three words on one line, so it never ends on a
// lone word. From 960px up only (.noWrap; narrower, the column can't take any
// tail), and only for a tail that fits that column (~400px at 960px):
// `nowrap` switches off `overflow-wrap`.
const TAIL_WORDS = 3;
const MAX_TAIL_LENGTH = 40;

function keepTailTogether(text: string): React.ReactNode {
  const words = text.trim().split(/\s+/);
  if (words.length <= TAIL_WORDS + 1) return text;
  const tail = words.slice(-TAIL_WORDS).join(' ');
  if (tail.length > MAX_TAIL_LENGTH) return text;
  return (
    <>
      {words.slice(0, -TAIL_WORDS).join(' ')} <span className={s.noWrap}>{tail}</span>
    </>
  );
}

export const spvPrimaryButtonClassName = s.cardActionButton;
