'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';

// The Monday digest's email shell, imported rather than rebuilt: stage, client
// chrome with the subject counter, white card, sections and footer.
import digest from '../newsfeed/Newsfeed.module.scss';

import {
  EDITION,
  EMAIL_FIRST_NAME,
  EMAIL_FROM,
  EMAIL_TO,
  issueHref,
  showForum,
  teamHref,
  type Story,
} from './mocks';
import s from './PlDigestIssue.module.scss';
import { StoryImage } from './StoryImage';

/** Same 60-character budget the other email previews count against. */
const SUBJECT_BUDGET = 60;

/** The first two sentences of a story paragraph, for a teaser. */
function teaser(story: Story) {
  // Split only at a full stop followed by a space and a capital, so "v0.14.3" stays whole.
  return story.paragraph.split(/(?<=\.)\s+(?=[A-Z])/).slice(0, 2).join(' ');
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

type MoreRow = { chip: string; title: string; meta: string; anchor: string };

/** What else is in the full issue. The forum line shows only with forum access. */
function moreRows(forumAccess: boolean): MoreRow[] {
  const { news, deals, take } = EDITION;
  const threads = EDITION.forum.threads;
  const rows: MoreRow[] = [
    {
      chip: 'News',
      title: `${news.length} network teams in the press`,
      meta: news
        .slice(0, 3)
        .map((n) => n.outlet)
        .join(', ')
        .concat(news.length > 3 ? ' and more' : ''),
      anchor: 'news',
    },
    {
      chip: 'Deals',
      title: `${deals.rows[0].team.name}: ${deals.rows[0].round}, ${deals.rows[0].amount}`,
      meta: `Announced ${deals.rows[0].announced}`,
      anchor: 'deals',
    },
  ];
  if (showForum(forumAccess)) {
    rows.push({
      chip: 'Forum',
      title: `${threads.length} top forum threads since No. 06`,
      meta: `${threads.reduce((n, t) => n + t.replies, 0)} replies`,
      anchor: 'forum',
    });
  }
  rows.push({ chip: 'Opinion', title: take.title, meta: 'The editor’s take', anchor: 'take' });
  return rows;
}

export type EmailVariant = 'editorial' | 'signal';

/** The inbox chrome and the white card, shared by both variants. */
function EmailShell({ children }: { children: ReactNode }) {
  const subjectLength = EDITION.subject.length;
  return (
    <div className={clsx(digest.emailPage, s.emailPage)}>
      <div className={clsx(digest.emailWrap, s.emailWrap)}>
        <div className={digest.emailStage}>
          <div className={digest.clientBar}>
            <div className={digest.clientRow}>
              <span className={digest.clientLabel}>From</span>
              <span className={digest.clientValue}>{EMAIL_FROM}</span>
            </div>
            <div className={digest.clientRow}>
              <span className={digest.clientLabel}>To</span>
              <span className={digest.clientValue}>{EMAIL_TO}</span>
            </div>
            <div className={digest.clientRow}>
              <span className={digest.clientLabel}>Subject</span>
              <span className={clsx(digest.clientValue, digest.clientSubject)}>
                {EDITION.subject}
                <span className={clsx(digest.charCount, subjectLength > SUBJECT_BUDGET && digest.charCountOver)}>
                  {subjectLength}/{SUBJECT_BUDGET}
                </span>
              </span>
            </div>
            <div className={digest.clientRow}>
              <span className={digest.clientLabel}>Preview</span>
              <span className={digest.clientValue}>{EDITION.preheader}</span>
            </div>
          </div>

          <div className={digest.email}>{children}</div>
        </div>
      </div>
    </div>
  );
}

/** "Also in the full issue", then the news ask and the footer. Shared by both variants. */
function EmailEnd({ forumAccess, href }: { forumAccess: boolean; href: (anchor?: string) => string }) {
  return (
    <>
      <div className={digest.emailSection}>
        <h2 className={s.emailBlockTitle}>Also in the full issue</h2>
        <ul className={digest.emailList}>
          {moreRows(forumAccess).map((row) => (
            <li key={row.anchor} className={digest.emailItem}>
              <span className={clsx(digest.emailChip, s.emailChip)}>{row.chip}</span>
              <a className={clsx(digest.emailItemLink, s.emailItemStrong)} href={href(row.anchor)}>
                {row.title}
              </a>
              <span className={clsx(digest.emailItemTeam, s.emailMeta)}>{row.meta}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={digest.emailFoot}>
        <p className={s.emailAsk}>
          <strong>Send us your news.</strong> Did your team ship, raise or publish something? Reply with a public
          link, and it can run in the next issue.
        </p>
        <p>
          <a href="#news-preferences">Update news preferences</a>
        </p>
        <p>
          <a href="#preferences">Manage preferences</a> · <a href="#weekly">Switch to weekly</a> ·{' '}
          <a href="#unsubscribe">Unsubscribe</a>
        </p>
        <p className={s.emailFootNote}>You received this email because you are a member of the Protocol Labs network.</p>
      </div>
    </>
  );
}

/**
 * Variant A, "Editorial" (Tech Brew / YC feel): a greeting, then stories with
 * an image on alternate sides, each with a linked headline, a two-sentence
 * teaser, one "Why it matters" line and "Read the story". The button follows
 * the stories; team launch cards and network signals come after.
 */
function EditorialEmail({ forumAccess }: { forumAccess: boolean }) {
  const href = (anchor?: string) => issueHref(anchor, forumAccess);
  return (
    <EmailShell>
      <div className={s.emailBrand}>
        <img
          className={s.emailLogo}
          src="/images/email/digest-logo-protocol-labs.png"
          alt="Protocol Labs"
          width={160}
          height={30}
        />
        <p className={s.emailIssue}>
          PL Network Digest · {EDITION.number} · {EDITION.dateLabel}
        </p>
      </div>

      <div className={s.emailHello}>
        <p className={s.emailGreeting}>Hi {EMAIL_FIRST_NAME},</p>
        <p className={s.emailIntro}>Here is what network teams shipped, raised and published since No. 06.</p>
      </div>

      <ul className={s.emailStories}>
        {EDITION.stories.map((st, i) => (
          <li key={st.id} className={clsx(s.emailStory, i % 2 === 1 && s.emailStoryFlip)}>
            <a className={s.emailStoryImage} href={href(st.id)} tabIndex={-1} aria-hidden="true">
              <StoryImage seed={st.id} size="side" />
            </a>
            <div className={s.emailStoryMain}>
              <p className={s.emailStoryMeta}>
                {i === 0 ? 'The lead · ' : ''}
                {st.team.name} · {st.date}
              </p>
              <h2 className={s.emailStoryTitle}>
                <a href={href(st.id)}>{st.headline}</a>
              </h2>
              <p className={s.emailStoryText}>{teaser(st)}</p>
              <p className={s.emailStoryWhy}>
                <strong>Why it matters:</strong> {st.whyItMatters}
              </p>
              <a className={s.emailItemStrong} href={href(st.id)}>
                Read the story
              </a>
            </div>
          </li>
        ))}
      </ul>

      <div className={s.emailCtaRow}>
        <a className={clsx(digest.emailCta, s.emailCtaStrong)} href={href()}>
          Read the full issue
        </a>
        <p className={s.emailCtaNote}>{EDITION.readMinutes} min read on LabOS</p>
      </div>

      <div className={digest.emailSection}>
        <h2 className={s.emailBlockTitle}>New from network teams</h2>
        <ul className={s.emailCards}>
          {EDITION.launches.map((l) => (
            <li key={l.id}>
              <a className={s.emailCard} href={teamHref(l.team.uid)}>
                <span className={clsx(s.mark, s.mark_s)} aria-hidden="true">
                  {initials(l.team.name)}
                </span>
                <span className={s.emailCardText}>
                  <span className={s.emailCardTitle}>
                    {l.team.name} <span className={s.cardTagline}>— {l.tagline}</span>
                  </span>
                  <span className={s.emailCardLine}>{l.line}</span>
                  <span className={s.badge}>{l.focus}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className={digest.emailSection}>
        <h2 className={s.emailBlockTitle}>Network signals</h2>
        <ul className={s.emailSignals}>
          {EDITION.signals.map((sig) => (
            <li key={sig.id}>
              <a className={s.emailSignal} href={sig.href}>
                <span className={s.signalFigure}>{sig.figure}</span>
                <span className={s.signalLabel}>
                  {sig.label}
                  {sig.mock && <span className={s.mockTag}>mock</span>}
                </span>
                <span className={s.signalArrow} aria-hidden="true">
                  →
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <EmailEnd forumAccess={forumAccess} href={href} />
    </EmailShell>
  );
}

/**
 * Variant B, "Signal-first" (Specter feel): the week in numbers on top, the
 * button in the first screen, then a dense list of linked headlines with one
 * "Why it matters" line each, team launches as compact rows and open roles.
 * Many small entry points instead of a long read.
 */
function SignalEmail({ forumAccess }: { forumAccess: boolean }) {
  const href = (anchor?: string) => issueHref(anchor, forumAccess);
  const jobs = EDITION.signals.find((sig) => sig.id === 'jobs');
  return (
    <EmailShell>
      <div className={s.sigHead}>
        <img className={s.sigLogo} src="/images/email/digest-logo-protocol-labs.png" alt="Protocol Labs" width={120} height={23} />
        <p className={s.sigIssue}>
          PL Network Digest · {EDITION.number} · {EDITION.dateLabel}
        </p>
      </div>

      <div className={s.sigTop}>
        <p className={s.emailGreeting}>Hi {EMAIL_FIRST_NAME}, here is the network this week.</p>
        <ul className={s.sigTiles}>
          {EDITION.signals.map((sig) => (
            <li key={sig.id}>
              <a className={s.sigTile} href={sig.href}>
                <span className={s.sigFigure}>{sig.figure}</span>
                <span className={s.sigLabel}>{sig.label}</span>
                {sig.mock && <span className={s.mockTag}>mock</span>}
              </a>
            </li>
          ))}
        </ul>
        <a className={clsx(digest.emailCta, s.emailCtaStrong, s.sigCta)} href={href()}>
          Read the full issue
        </a>
      </div>

      <div className={digest.emailSection}>
        <h2 className={s.emailBlockTitle}>Top stories</h2>
        <ol className={s.sigStories}>
          {EDITION.stories.map((st) => (
            <li key={st.id} className={s.sigStory}>
              <div className={s.sigStoryMain}>
                <p className={s.emailStoryMeta}>
                  {st.team.name} · {st.date}
                </p>
                <h3 className={s.sigStoryTitle}>
                  <a href={href(st.id)}>{st.headline}</a>
                </h3>
                <p className={s.emailStoryWhy}>
                  <strong>Why it matters:</strong> {st.whyItMatters}
                </p>
              </div>
              <a className={s.sigThumb} href={href(st.id)} tabIndex={-1} aria-hidden="true">
                <StoryImage seed={st.id} size="side" />
              </a>
            </li>
          ))}
        </ol>
      </div>

      <div className={digest.emailSection}>
        <h2 className={s.emailBlockTitle}>New from network teams</h2>
        <ul className={s.sigRows}>
          {EDITION.launches.map((l) => (
            <li key={l.id}>
              <a className={s.sigRow} href={teamHref(l.team.uid)}>
                <span className={clsx(s.mark, s.mark_s)} aria-hidden="true">
                  {initials(l.team.name)}
                </span>
                <span className={s.sigRowText}>
                  <span className={s.emailCardTitle}>
                    {l.team.name} <span className={s.cardTagline}>— {l.tagline}</span>
                  </span>
                  <span className={s.emailCardLine}>{l.line}</span>
                </span>
                <span className={s.badge}>{l.focus}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {jobs?.examples && (
        <div className={digest.emailSection}>
          <h2 className={s.emailBlockTitle}>
            Open roles in the network <span className={s.mockTag}>mock</span>
          </h2>
          <ul className={s.sigRows}>
            {jobs.examples.map((ex) => (
              <li key={ex.label}>
                <a className={s.sigRole} href={ex.href}>
                  <span className={s.emailCardTitle}>{ex.label}</span>
                  <span className={s.emailCardLine}>{ex.meta}</span>
                </a>
              </li>
            ))}
          </ul>
          <a className={s.emailItemStrong} href={jobs.href}>
            See all {jobs.figure} roles
          </a>
        </div>
      )}

      <EmailEnd forumAccess={forumAccess} href={href} />
    </EmailShell>
  );
}

/**
 * The teaser email. Dana's baseline for the 11 Nov send was 14 of 26 opened and
 * 0 clicked. Both variants keep the fixes: a real button for "Read the full
 * issue", a linked headline on every story, one "Why it matters" line, more
 * than stories (launches, signals) and the news ask.
 */
export function DigestEmail({ forumAccess, variant }: { forumAccess: boolean; variant: EmailVariant }) {
  return variant === 'signal' ? <SignalEmail forumAccess={forumAccess} /> : <EditorialEmail forumAccess={forumAccess} />;
}
