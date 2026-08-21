'use client';

import clsx from 'clsx';

import type { ITeamNewsItem } from '@/types/team-news.types';

import { EVENT_TYPE_LABEL } from '../newsfeed-v0/eventMeta';
import type { ForumPost } from '../newsfeed-v0/mocks';
import type { HiringSignal, TopStory } from './mocks';
import local from './Newsfeed.module.scss';

const WEEK_FORMAT: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };

const EVENT_CLASS: Record<ITeamNewsItem['eventType'], string> = {
  FUNDING: 'eFunding',
  LAUNCH: 'eLaunch',
  PARTNERSHIP: 'ePartnership',
  ANNOUNCEMENT: 'eAnnouncement',
  MILESTONE: 'eMilestone',
  OTHER: 'eAnnouncement',
  HIRING: 'eAnnouncement',
  DEALS: 'eAnnouncement',
};

interface EmailDigestProps {
  topStoryItem: ITeamNewsItem;
  top: TopStory;
  attribution: string;
  isAi: boolean;
  /** Everything else worth a line this week, already ranked. */
  items: ITeamNewsItem[];
  hiring: HiringSignal[];
  forumPosts: ForumPost[];
}

/**
 * The Monday email — and the cheapest way to test whether this feed is worth
 * building.
 *
 * The reasoning: a Top Story is an *editorial* bet, not a UI one. The open
 * question isn't whether a hero card looks good, it's whether anyone can pick a
 * story worth someone's week. Email answers that with no UI risk, is measurable
 * in a way an in-page hero is not (open rate, and click-through on the top story
 * versus everything under it), and reaches investors where they already are.
 *
 * It also probes the *other* problem for free: a human curating this every
 * Monday will immediately hit "the best story this week isn't in the feed" — and
 * that running list of misses is exactly the evidence the sourcing fix needs.
 * That is why this prototype's top story is a story today's feed cannot show.
 *
 * The delivery channel already exists: `ForumDigestSettings` carries
 * `forumDigestEnabled`, `forumDigestFrequency: 1 | 7` and `forumDigestNewsEnabled`,
 * with subscribers today. This changes what goes in it, not how it's sent.
 */
export function EmailDigest({ topStoryItem, top, attribution, isAi, items, hiring, forumPosts }: EmailDigestProps) {
  const weekOf = new Date(top.weekOf).toLocaleDateString('en-US', WEEK_FORMAT);
  // Most inbox clients cut the subject around 60 characters, so it's written to
  // that budget rather than derived from the headline and truncated into it.
  const SUBJECT_BUDGET = 60;
  const overBudget = top.subject.length > SUBJECT_BUDGET;

  return (
    <div className={local.emailStage}>
      {/* Client chrome, so this reads as an email rather than a page. The subject
          line is a real design decision here — it's the only thing most people
          will ever see of this. */}
      <div className={local.clientBar}>
        <div className={local.clientRow}>
          <span className={local.clientLabel}>From</span>
          <span className={local.clientValue}>Protocol Labs Network &lt;digest@protocol.ai&gt;</span>
        </div>
        <div className={local.clientRow}>
          <span className={local.clientLabel}>Subject</span>
          <span className={clsx(local.clientValue, local.clientSubject)}>
            {top.subject}
            <span className={clsx(local.charCount, overBudget && local.charCountOver)}>
              {top.subject.length}/{SUBJECT_BUDGET}
            </span>
          </span>
        </div>
        <div className={local.clientRow}>
          <span className={local.clientLabel}>Preview</span>
          <span className={local.clientValue}>{top.why.split('.')[0]}.</span>
        </div>
      </div>

      <div className={local.email}>
        <header className={local.emailHead}>
          <p className={local.masthead}>Protocol Labs Network</p>
          <p className={local.emailWeek}>Weekly digest · Week of {weekOf}</p>
        </header>

        {/* ---- Top story ---- */}
        <section className={local.emailTop}>
          <p className={local.emailKicker}>Top story</p>
          <h1 className={local.emailTopTitle}>{topStoryItem.title}</h1>
          {topStoryItem.summary && <p className={local.emailTopSummary}>{topStoryItem.summary}</p>}

          <div className={local.emailWhy}>
            <p className={local.emailWhyLabel}>Why this made the top</p>
            <p className={local.emailWhyText}>{top.why}</p>
            <p className={local.emailWhyBy}>
              {attribution}
              {isAi && ' · ranked by funding size, network proximity, coverage, and discussion'}
            </p>
          </div>

          <a className={local.emailCta} href={topStoryItem.sourceUrl} target="_blank" rel="noopener noreferrer">
            Read the story →
          </a>
          <p className={local.emailSourceLine}>
            {topStoryItem.teamName} · {topStoryItem.sourceDomain}
          </p>
        </section>

        {/* ---- Everything else, one line each ---- */}
        <section className={local.emailSection}>
          <h2 className={local.emailSectionTitle}>Also this week</h2>
          <ul className={local.emailList}>
            {items.map((item) => (
              <li key={item.uid} className={local.emailItem}>
                <span className={clsx(local.emailChip, local[EVENT_CLASS[item.eventType]])}>
                  {EVENT_TYPE_LABEL[item.eventType]}
                </span>
                <a className={local.emailItemLink} href={item.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {item.title}
                </a>
                <span className={local.emailItemTeam}>{item.teamName}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---- Hiring, as the traction signal it is ---- */}
        <section className={local.emailSection}>
          <h2 className={local.emailSectionTitle}>Who started hiring</h2>
          <ul className={local.emailList}>
            {hiring.map((h) => (
              <li key={h.uid} className={local.emailHiringItem}>
                <a className={local.emailItemLink} href={`/jobs?team=${h.teamUid}`}>
                  {h.teamName} — {h.totalRoles} open {h.totalRoles === 1 ? 'role' : 'roles'}
                </a>
                <span className={local.emailItemTeam}>{h.trend}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* ---- Discussion ---- */}
        <section className={local.emailSection}>
          <h2 className={local.emailSectionTitle}>From the forum</h2>
          <ul className={local.emailList}>
            {forumPosts.map((post) => (
              <li key={post.uid} className={local.emailHiringItem}>
                <a className={local.emailItemLink} href="/forum">
                  {post.title}
                </a>
                <span className={local.emailItemTeam}>
                  {post.author} · {post.views} views
                </span>
              </li>
            ))}
          </ul>
        </section>

        <footer className={local.emailFoot}>
          <p>
            You&apos;re getting this because you subscribed to the network digest. It arrives every Monday at 9am in
            your timezone.
          </p>
          <p>
            <a href="/settings/email-preferences">Choose what&apos;s in your digest</a> ·{' '}
            <a href="/settings/email-preferences">Unsubscribe</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
