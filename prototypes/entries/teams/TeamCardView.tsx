'use client';

import React from 'react';
import Image from 'next/image';
import type { ITeamNewsItem } from '@/types/team-news.types';
import { useRouter } from 'next/navigation';
import { ITag } from '@/types/teams.types';
import TeamsTagsList from '@/components/page/teams/teams-tags-list';
import { Badge } from '@/components/common/Badge';

import type { MockTeamCard } from './mocks';
import { TeamUpdatesLink } from '../news-shared/TeamUpdatesLink';
// The feed's own Follow control, so following a team looks the same on a team
// card as it does beside a team's name on a feed card.
import { FollowButton } from '../follow-shared/FollowButton';
import { TeamUpdateStrip } from '../news-shared/TeamUpdateStrip';
// The same glyph the blue badge and the inline strip lead with, so a news mark is
// the same object wherever it appears.
import { NewsIcon } from '../news-shared/icons';
// The neutral count chip wears TeamUpdateStrip's own chip class rather than a
// copy of its values, so the two can't drift apart.
import strip from '../news-shared/TeamUpdateStrip.module.scss';
import { getTeamNews, feedFocusHref, newsHref } from '../news-shared/mockTeamNews';
import { placeholderLogo } from './placeholderLogo';
// Reuse the production card styling so the prototype tracks production 1:1.
import s from '@/components/page/teams/TeamList/components/TeamGridView/TeamGridView.module.scss';
import local from './TeamsPrototype.module.scss';

/**
 * What the card says about the team's news. The switch now offers `dot` (the
 * default), `new` and `short`; `count`, `headline` and `follow` are implemented
 * but no longer offered — the question narrowed to how one count should be
 * marked, and those three answer a different one.
 *
 * In the order they used to appear:
 *  - `short` — "3 new" in the neutral chip, led by the news glyph. The noun
 *    dropped: on a grid where every chip ends in the same two words, those two
 *    words are the part carrying no information — the argument
 *    `TeamUpdatesLink`'s own `new` label already makes, tried here in grey.
 *  - `dot`   — the same "3 new", with production's unread dot in place of the
 *    glyph. The glyph says *what kind of thing* is behind the chip; the dot says
 *    *that it's unread*. Only one of those is news to a reader who has seen the
 *    grid before, and this tab is for deciding which.
 *  - `count` — "3 new posts" in the neutral chip. The count pitched as a fact,
 *    with the noun spelled out.
 *  - `new`   — "3 new" in the brand-blue badge. The same count pitched as an
 *    offer: grey states, blue asks. Worth seeing side by side, because twelve
 *    blue marks down a grid is twelve things competing for the same click.
 *
 * The chip modes open the team's news in place; the blue badge leaves for the
 * feed. Same split on the job board, which wears the same chip — so the mark a
 * reader learns on one surface behaves the way they learned it on the other.
 *  - `headline` — the latest story itself. Why you'd open the team, not how
 *    much is behind it; the only one that costs a row of card height.
 *  - `follow`   — the count paired with a Follow control on one footer row.
 *    Tests whether a card should let you act on a team as well as read it: the
 *    badge says something happened, Follow is how you keep hearing about it.
 */
export type TeamUpdatesMode = 'short' | 'dot' | 'new' | 'count' | 'headline' | 'follow';

interface Props {
  team: MockTeamCard;
  updates?: TeamUpdatesMode;
  /**
   * List this team's news in place instead of leaving for the feed — what every
   * chip mode does. The blue `new` badge is the one that leaves; the difference
   * between them is colour and destination both, and the job board's copy of
   * this chip opens the same modal.
   */
  onOpenNews?: (teamName: string, items: ITeamNewsItem[], teamLogo: string) => void;
  /** `follow` mode only. */
  following?: boolean;
  onToggleFollow?: () => void;
}

/**
 * COPY-SIMPLIFY of production `TeamGridView`.
 * Production version pulls in `useTeamAnalytics` (Zustand + posthog) and
 * `useCarousel` (embla). The carousel branch only renders when `team.asks`
 * exist (always empty here) so it's dropped; analytics is stripped. The static
 * presentational markup + production `.module.scss` are kept verbatim.
 *
 * The card carries no Follow control — browsing is for reading, and following
 * happens on the team profile. The corner it used to occupy now holds the
 * updates badge, the one thing on the card worth reacting to.
 */
export function TeamCardView({ team, updates = 'dot', onOpenNews, following = false, onToggleFollow }: Props) {
  const router = useRouter();
  // A monogram beats the shared default-profile glyph: twelve identical grey
  // avatars make the grid one repeating shape, and the logo slot is the first
  // thing the eye lands on — it should tell the cards apart, not blur them.
  const profile = team?.logo ?? placeholderLogo(team?.name);
  const news = getTeamNews(team.id, team.name ?? '');
  // Two shapes of answer, two slots. Both counts ride the card's top-right
  // corner — the slot Follow used to hold, and the one the eye already checks.
  // The headline takes the bottom row, because it can't live in a corner chip.
  const isStory = updates === 'headline';
  const isFollowRow = updates === 'follow';
  const hasTags = (team?.industryTags ?? []).length > 0;

  /**
   * Every updates click lands on the newsfeed — never a modal rendered here. What
   * happens on arrival is decided by what the mark *said*.
   *
   * A mark that COUNTS ("5 new", "5 new posts", "+4 more updates") is a claim about
   * the team, so it scrolls the feed to that team's cluster. `?focus=` scrolls
   * without filtering, and that distinction is the point: scoping the feed to one
   * team hides everything the feed exists to surface, and the reader has just
   * come from a directory of teams — showing them a filtered view of the thing
   * they left is a round trip that surfaces nothing new.
   */
  const openTeamNews = () => {
    const [latest] = news;
    if (!latest) return;
    router.push(feedFocusHref(latest));
  };

  /**
   * A mark that NAMES one story opens that story, as a modal over the full feed —
   * the same `FeedDetailModal` the feed, the profile rail and the job board all
   * use. Scrolling someone to a headline they already read and asked to open is
   * a step short of the answer.
   *
   * `newsHref` resolves to `?news=<uid>` for every team the grid badges, and the
   * modal opens on top of an unfiltered feed — so closing it leaves the reader
   * browsing rather than stranded.
   */
  const openStory = () => {
    const [latest] = news;
    if (!latest) return;
    router.push(newsHref(latest));
  };

  /**
   * The chip's answer: list the team's news right here.
   *
   * Where the blue `new` badge leaves for the feed, the chip stays on the page —
   * a count is an amount, and the reader asking how much is waiting hasn't asked
   * to be moved. The list drills to a story in place rather than stacking a
   * second overlay, the same way the team profile's archive does. The job board
   * wears this same chip and opens this same modal.
   */
  const openNewsList = () => {
    if (!news.length) return;
    // Hand over the card's own resolved mark — real logo or monogram — so the
    // modal opens wearing the same face the card you clicked was wearing.
    onOpenNews?.(team.name ?? 'This team', news, profile);
  };

  // The chip is a bare <button> inside the card's own link, so it has to win the
  // click the way TeamUpdatesLink's nested button does.
  const activate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openNewsList();
  };
  // "New" alone is meaningless out of context; the accessible name carries what
  // is new, about whom, and how much — with the visible word still leading it.
  // "Posts" names the thing behind the click; "updates" named the fact that
  // something changed, which is true of every card and so tells you nothing.
  const noun = news.length === 1 ? 'new post' : 'new posts';
  // Only `short` drops the noun on screen, and never from the accessible name:
  // "5 new" read aloud with no card around it answers nothing. Spelling it out
  // keeps the visible text a *prefix* of the spoken one (WCAG 2.5.3, Label in
  // Name), which is the same trick TeamUpdatesLink plays for its `new` label.
  // `dot` keeps the full noun: the dot already carries "unread", so the words
  // beside it are free to say what kind of thing is unread — which is the pairing
  // worth testing, rather than two marks both saying "new".
  const isChipMode = updates === 'short' || updates === 'dot' || updates === 'count';
  const chipText = updates === 'short' ? `${news.length} new` : `${news.length} ${noun}`;

  /**
   * The brand-blue badge, as it appears everywhere else a team shows up (job
   * board, profile rows). No ↗ here though: one arrow marks an exit, twelve
   * down a grid is wallpaper, and the card is already a link.
   *
   * `size="chip"` rather than the job board's `small`: on this grid the badge is
   * being compared against the neutral chip in the same corner, and `small` runs
   * 12px type in a 20px pill against the chip's 11px in an 18px one. That gap
   * reads as emphasis, which would have let size take credit for what the tabs
   * are here to ask about colour.
   */
  const newBadge = (
    <TeamUpdatesLink
      teamName={team.name ?? 'team'}
      items={news}
      size="chip"
      label="new"
      arrow={false}
      nested
      onActivate={openTeamNews}
    />
  );

  /**
   * The count in the source chip's clothes — same Badge, same `default`
   * variant, same 11px shell — riding the card's top-right corner.
   *
   * Wearing the neutral chip rather than the brand-blue badge is the point: blue
   * reads as a call to action, and twelve of them down a grid is twelve things
   * asking to be clicked. Grey states a fact and lets the card's own name stay
   * the loudest thing on it. Reusing the literal class from TeamUpdateStrip
   * rather than copying its values means the two can't drift apart.
   *
   * The glyph is what keeps it from reading as a label at rest. `.sourceChip` is
   * the *publisher* mark on a news row — a thing that states, never a thing you
   * press — so borrowing its shell borrowed its stillness too. Badge's own
   * `.root` already carries `gap: 2px` and centred items for exactly this slot,
   * and a pill with a mark in it reads as an object rather than a caption. The
   * colour layer stays neutral; only the shape gains a handle.
   *
   * `dot` swaps that glyph for production's unread dot — 5px, `#4174ff`, the
   * literal values from `NotificationItem.unreadDot`, which the DS's own Badge
   * `dotIndicator` independently agrees on at its `md` size. It's the one mark
   * in the product that already means "unread", which is exactly what the word
   * beside it claims.
   *
   * It opens the team's news in place — see `openNewsList`. The job board's copy
   * of this chip does the same, so the grey chip means one thing wherever it
   * appears and the blue badge keeps the exit to itself.
   */
  const chipMark =
    updates === 'dot' ? (
      <span className={local.countChipDot} aria-hidden="true" />
    ) : (
      <span className={local.countChipIcon}>
        <NewsIcon />
      </span>
    );

  const countChip = (
    <button
      type="button"
      className={local.pillButton}
      onClick={activate}
      // Says what the click does, which is open them here — not "read on the
      // newsfeed", which is where the blue badge goes.
      aria-label={`${news.length} ${noun} about ${team.name ?? 'this team'} — read them`}
    >
      <Badge variant="default" className={`${strip.sourceChip} ${local.countChip}`}>
        {chipMark}
        {chipText}
      </Badge>
    </button>
  );

  // What rides the corner: the same count in two registers. Nothing when a
  // bottom row has taken over — in `follow` the badge moves down to pair with
  // the control, so leaving a copy in the corner would show it twice.
  // `short`, `dot` and `count` are one chip wearing three labels, so they all
  // land here; only `new` swaps the component underneath.
  const cornerMark = updates === 'new' ? newBadge : isChipMode ? countChip : null;

  /**
   * Badge left, Follow right — the pair the `follow` mode puts across the card's
   * top band, straddling the logo the way a feed card carries a team's name and
   * its Follow control on one row.
   *
   * The badge stays neutral here on purpose: Follow is the blue thing, and two
   * brand-coloured marks on one row would compete for the same click. Reading
   * and acting are different jobs, so they take different weights.
   *
   * The Follow control is the feed's own — `size="xs" tertiary`, the same
   * compact text button that sits beside a team's name on a feed card — so
   * following a team looks identical wherever you do it.
   */
  const followPair = (
    <>
      {/* An empty span holds the left slot on newsless cards, so Follow stays
          right-aligned instead of sliding across. */}
      {news.length > 0 ? countChip : <span />}
      {/* The card is one big link, so the follow click has to stop here.
          FollowButton's own onClick fires first and this halts the bubble
          before the anchor sees it. */}
      <span
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <FollowButton
          following={following}
          onClick={() => onToggleFollow?.()}
          name={team.name ?? 'this team'}
          size="xs"
          tertiary
        />
      </span>
    </>
  );

  return (
    <div className={`${s.grid} ${local.teamCard} ${hasTags ? '' : local.teamCardNoTags}`}>
      {/* Desktop: top-right corner — the slot the Follow control used to hold.
          Outside .detailsContainer because the card root is the positioning
          context. */}
      {news.length > 0 && cornerMark && <span className={local.cornerUpdates}>{cornerMark}</span>}

      {/* Desktop: the pair rides the top band, left and right of the logo —
          outside .detailsContainer because the card root is the positioning
          context. */}
      {isFollowRow && <div className={local.followTopRow}>{followPair}</div>}

      <div className={s.profileContainer}>
        <Image
          alt="profile"
          height={72}
          width={72}
          layout="intrinsic"
          loading="eager"
          priority={true}
          src={profile}
          className={s.profileImage}
        />
      </div>
      <div className={s.detailsContainer}>
        <div className={s.teamDetail}>
          <h2 className={s.teamName}>{team?.name}</h2>
          <p className={s.teamDesc}>{team?.shortDescription}</p>
        </div>

        <div className={s.tagsDesc}>
          <TeamsTagsList tags={team?.industryTags as ITag[]} noOfTagsToShow={2} />
        </div>
        <div className={s.tagsMob}>
          <TeamsTagsList tags={team?.industryTags as ITag[]} noOfTagsToShow={1} />
        </div>

        {/* Mobile home for the corner mark: the two-up card is ~170px wide with
            a centred logo, so a corner chip would land on top of it. */}
        {news.length > 0 && cornerMark && <div className={local.updatesRow}>{cornerMark}</div>}

        {/* The card's news row. `new` puts the count here in the source chip's
            shell with no headline; `headline` and `source` put the story itself
            here via TeamUpdateStrip's `inline` variant — built for exactly this
            slot, production NewsCard type, no band, handing off to the feed like
            the badge it stands in for. One slot, so switching modes changes what
            the card says without moving anything. */}
        {/* Mobile home for the follow row: the two-up card is ~170px wide with a
            centred logo, so the top band has no room for a control either side
            of it. Below the tags is the only full-width slot mobile has. */}
        {isFollowRow && <div className={local.followRow}>{followPair}</div>}

        {news.length > 0 && isStory && (
          <div className={local.headlineRow}>
            <TeamUpdateStrip
              teamName={team.name ?? 'team'}
              items={news}
              variant="inline"
              // Two targets, two answers: the headline opens its story, the
              // "+N more" goes to the team's news in the feed.
              onActivateStory={openStory}
              onActivate={openTeamNews}
            />
          </div>
        )}
      </div>
    </div>
  );
}
