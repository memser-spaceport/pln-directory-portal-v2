'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';
import { FollowButton } from '@/components/ui/FollowButton';

import { FollowToast } from '../follow-shared/FollowToast';

import f from './DigestFront.module.scss';
import {
  EDITION,
  SECTIONS,
  issueHref,
  newsHref,
  showForum,
  teamHref,
  type Source,
  type Story,
  type TakeSegment,
  type TeamRef,
} from './mocks';
import s from './PlDigestIssue.module.scss';
import { StoryImage } from './StoryImage';
import { StoryShareMenu } from './StoryShareMenu';

/*
 * The LabOS issue page, redesigned on news-app patterns (Mobbin, 2026-11-17):
 * - NYT web front / Quartz: the lead owns the top of the page, a double rule
 *   under the masthead, meta in small caps.
 * - SCMP "My Daily 5": a numbered "In this issue" list beside the lead, which
 *   replaces the sticky rail and the jump-link row.
 * - Digg / Threads trending: text-left, thumbnail-right rows with hairlines.
 * - Apple News "in brief": a bold run-in team name, then one line.
 * - Fey / OKX: one big figure for a single deal instead of a one-row table.
 * Copy and story actions are pl-digest-issue's (PR #3554), unchanged.
 */

/* ------------------------------------------------------------------------ */
/* Small pieces                                                              */
/* ------------------------------------------------------------------------ */

function TeamLink({ team }: { team: TeamRef }) {
  return (
    <a className={s.teamLink} href={teamHref(team.uid)}>
      {team.name}
    </a>
  );
}

/** A neutral logo placeholder: the team's initials on a tinted tile. Never a person's photo. */
function Mark({ name, size, className }: { name: string; size: 'xs' | 's'; className?: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={clsx(s.mark, s[`mark_${size}`], className)} aria-hidden="true">
      {initials}
    </span>
  );
}

function Sources({ sources }: { sources: Source[] }) {
  return (
    <p className={s.sources}>
      <span className={s.sourcesLabel}>Sources:</span>{' '}
      {sources.map((src, i) => (
        <span key={src.href}>
          {i > 0 && ' · '}
          <a className={s.sourceLink} href={src.href} target="_blank" rel="noreferrer">
            {src.label}
          </a>
        </span>
      ))}
    </p>
  );
}

interface ActionsApi {
  following: (uid: string) => boolean;
  toggleFollow: (team: TeamRef) => void;
  mockShare: (network: 'linkedin' | 'x') => void;
}

/** Sources, then Share. Follow lives in the kicker, beside the team name. */
function StoryFooter({ story, api }: { story: Story; api: ActionsApi }) {
  const { team } = story;
  return (
    <div className={clsx(s.storyFoot, f.storyFoot)}>
      <Sources sources={story.sources} />
      <div className={s.actions}>
        {story.actions.includes('share') && (
          <StoryShareMenu
            sharePath={newsHref(story.newsUid)}
            shareText={`${story.headline} — ${team.name}`}
            ariaLabel={`Share ${story.headline}`}
            onMockShare={(network) => api.mockShare(network)}
          />
        )}
      </div>
    </div>
  );
}

function CheckGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Team mark, team name, Follow, then the date: the kicker every story wears. */
function Kicker({ story, api }: { story: Story; api: ActionsApi }) {
  const { team } = story;
  return (
    <div className={f.kicker}>
      <Mark name={team.name} size="xs" />
      <TeamLink team={team} />
      {story.actions.includes('follow') && (
        // Production's inline follow (NewsCard): blue plus + "Follow", no border.
        <FollowButton
          size="compact"
          name={team.name}
          following={api.following(team.uid)}
          onClick={() => api.toggleFollow(team)}
        />
      )}
      <span aria-hidden="true">·</span>
      <time>{story.date}</time>
    </div>
  );
}

function Why({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className={f.why}>
      <strong className={f.whyLabel}>{label}</strong> {children}
    </p>
  );
}

/** A section heading over a full-width hairline, newspaper style. */
function SectionHead({ id, title, sub }: { id: string; title: string; sub?: string }) {
  return (
    <header className={f.sectionHead}>
      <h2 className={f.sectionTitle} id={`${id}-title`}>
        {title}
      </h2>
      {sub && <p className={f.sectionSub}>{sub}</p>}
    </header>
  );
}

function TakeText({ seg }: { seg: TakeSegment }) {
  if (typeof seg === 'string') return <>{seg}</>;
  if ('ref' in seg)
    return (
      <a className={s.takeRef} href={`#${seg.ref}`}>
        {seg.text}
      </a>
    );
  return (
    <a className={s.takeRef} href={seg.href} target="_blank" rel="noreferrer">
      {seg.text}
    </a>
  );
}

/* ------------------------------------------------------------------------ */
/* Stories                                                                   */
/* ------------------------------------------------------------------------ */

/** The lead, NYT/Quartz style: big image, big headline, dek, then the two lines. */
function LeadStory({ story, api }: { story: Story; api: ActionsApi }) {
  return (
    <article id={story.id} className={f.lead}>
      <StoryImage seed={story.id} size="hero" className={f.leadImage} />
      <Kicker story={story} api={api} />
      <h2 className={f.leadTitle}>
        <a className={f.titleLink} href={newsHref(story.newsUid)}>
          {story.headline}
        </a>
      </h2>
      <p className={f.leadDek}>{story.paragraph}</p>
      <div className={f.whyBox}>
        <Why label="Why it matters">{story.whyItMatters}</Why>
        {story.yesBut && <Why label="Yes, but">{story.yesBut}</Why>}
      </div>
      <a className={s.nextLink} href={newsHref(story.newsUid)}>
        {story.nextLabel}
      </a>
      <StoryFooter story={story} api={api} />
    </article>
  );
}

/** Stories 2–4, Digg/Threads row: number, text left, image right, hairline between. */
function StoryRow({ story, n, api }: { story: Story; n: number; api: ActionsApi }) {
  return (
    <article id={story.id} className={f.row}>
      <span className={f.rowNum} aria-hidden="true">
        {n}
      </span>
      <div className={f.rowMain}>
        <Kicker story={story} api={api} />
        <h3 className={f.rowTitle}>
          <a className={f.titleLink} href={newsHref(story.newsUid)}>
            {story.headline}
          </a>
        </h3>
        <p className={f.body}>{story.paragraph}</p>
        <Why label="Why it matters">{story.whyItMatters}</Why>
        <StoryFooter story={story} api={api} />
      </div>
      <StoryImage seed={story.id} size="side" className={f.rowImage} />
    </article>
  );
}

/** SCMP "My Daily 5": numbered stories with a thumbnail, then the rest of the issue. */
function InThisIssue({ stories, sections }: { stories: Story[]; sections: { id: string; label: string }[] }) {
  return (
    <nav className={f.toc} aria-label="In this issue">
      <p className={f.tocTitle}>In this issue</p>
      <ol className={f.tocList}>
        {stories.map((st, i) => (
          <li key={st.id}>
            <a className={f.tocItem} href={`#${st.id}`}>
              <span className={f.tocNum}>{i + 1}</span>
              <span className={f.tocText}>
                <span className={f.tocTeam}>{st.team.name}</span>
                <span className={f.tocHeadline}>{st.headline}</span>
              </span>
              <StoryImage seed={st.id} size="thumb" className={f.tocThumb} />
            </a>
          </li>
        ))}
      </ol>
      <p className={f.tocAlsoTitle}>Also inside</p>
      <ul className={f.tocAlso}>
        {sections.map((sec) => (
          <li key={sec.id}>
            <a className={f.tocAlsoLink} href={`#${sec.id}`}>
              {sec.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ------------------------------------------------------------------------ */
/* End of issue: your turn + feedback                                        */
/* ------------------------------------------------------------------------ */

function nextNumber() {
  const n = Number(EDITION.number.replace(/\D/g, ''));
  return `No. ${String(n + 1).padStart(2, '0')}`;
}

function SendNews() {
  const [value, setValue] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div className={f.turnCard}>
      <h3 className={f.turnTitle}>Send us your news</h3>
      {sent ? (
        <p className={s.receipt} role="status">
          <CheckGlyph /> Thanks. The editor reads every submission and checks it against a public source before it
          runs.
        </p>
      ) : (
        <>
          <p className={f.turnText}>
            Did your team ship, raise or publish something? Paste a public link. It can run in {nextNumber()}.
          </p>
          <form
            className={s.askForm}
            onSubmit={(e) => {
              e.preventDefault();
              if (value.trim()) setSent(true);
            }}
          >
            <label className={s.srOnly} htmlFor="digest-news">
              Link to your news
            </label>
            <input
              id="digest-news"
              className={s.input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="https://… and one line, if you like"
              required
            />
            <Button size="s" style="fill" variant="primary" type="submit">
              Send
            </Button>
          </form>
        </>
      )}
    </div>
  );
}

function Feedback() {
  const [vote, setVote] = useState<'yes' | 'no' | null>(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  return (
    <div className={f.turnCard}>
      <h3 className={f.turnTitle}>Was this issue useful?</h3>
      {done ? (
        <p className={s.receipt} role="status">
          <CheckGlyph /> Thanks. Your answer shapes what goes into {nextNumber()}.
        </p>
      ) : (
        <>
          <div className={s.voteRow} role="group" aria-label="Was this issue useful?">
            {(['yes', 'no'] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={clsx(s.vote, vote === v && s.voteActive)}
                aria-pressed={vote === v}
                onClick={() => setVote(v)}
              >
                {v === 'yes' ? 'Yes' : 'Not really'}
              </button>
            ))}
          </div>
          {vote && (
            <form
              className={s.form}
              onSubmit={(e) => {
                e.preventDefault();
                setDone(true);
              }}
            >
              <label className={s.field}>
                <span className={s.fieldLabel}>
                  {vote === 'yes' ? 'What should we keep doing?' : 'What would make it worth your time?'} (optional)
                </span>
                <textarea className={s.textarea} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
              <div className={s.formRow}>
                <Button size="xs" style="fill" variant="primary" type="submit">
                  Send feedback
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* The page                                                                  */
/* ------------------------------------------------------------------------ */

export function DigestIssuePage({ forumAccess, signals }: { forumAccess: boolean; signals: boolean }) {
  const [follows, setFollows] = useState<Set<string>>(() => new Set());
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const flash = (msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  };

  const copyIssue = () => {
    const url = `${window.location.origin}${issueHref()}`;
    navigator.clipboard?.writeText(url).catch(() => undefined);
    flash('Issue link copied.');
  };

  const api: ActionsApi = {
    following: (uid) => follows.has(uid),
    toggleFollow: (team) => {
      setFollows((prev) => {
        const next = new Set(prev);
        if (next.has(team.uid)) next.delete(team.uid);
        else {
          next.add(team.uid);
          flash(`Following ${team.name}. You will see ${team.name} news in For You.`);
        }
        return next;
      });
    },
    mockShare: (network) => flash(`This opens ${network === 'x' ? 'X' : 'LinkedIn'} with the story link.`),
  };

  const forum = showForum(forumAccess);
  const sections = SECTIONS.filter(
    (sec) => sec.id !== 'latest' && (sec.id !== 'forum' || forum) && (sec.id !== 'signals' || signals),
  );
  const anyMock = EDITION.signals.some((sig) => sig.mock);
  const [lead, ...rest] = EDITION.stories;
  const deal = EDITION.deals.rows[0];
  const mailto = `mailto:?subject=${encodeURIComponent(`PL Network Digest ${EDITION.number}`)}&body=${encodeURIComponent(
    EDITION.subject,
  )}`;

  return (
    <div className={f.page}>
      <div className={f.inner}>
        {/* Masthead: name, edition line, share. Double rule under it (NYT). */}
        <header className={f.masthead}>
          <div>
            <p className={f.brand}>PL Network Digest</p>
            <p className={f.edition}>
              <span className={f.editionNo}>{EDITION.number}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={EDITION.date}>{EDITION.dateLabel}</time>
              <span aria-hidden="true">·</span>
              <span>{EDITION.readMinutes} min read</span>
            </p>
          </div>
          <div className={f.mastShare}>
            <Button size="xs" style="border" variant="neutral" onClick={copyIssue}>
              Copy link
            </Button>
            <a className={s.textAction} href={mailto}>
              Forward by email
            </a>
          </div>
        </header>

        {/* Front: the lead beside the numbered issue list. */}
        <section id="latest" className={f.front} aria-label="The Latest">
          <LeadStory story={lead} api={api} />
          <aside className={f.frontSide}>
            <InThisIssue stories={EDITION.stories} sections={sections} />
          </aside>
        </section>

        <section className={f.section} aria-labelledby="more-title">
          <SectionHead id="more" title="More of the latest" />
          {rest.map((st, i) => (
            <StoryRow key={st.id} story={st} n={i + 2} api={api} />
          ))}
        </section>

        {/* Launches as an in-brief list, deals as one big figure. */}
        <div className={f.band}>
          <section id="launches" className={f.section} aria-labelledby="launches-title">
            <SectionHead id="launches" title="New from network teams" sub="Launches and releases since No. 06." />
            <ul className={f.brief}>
              {EDITION.launches.map((l) => (
                <li key={l.id} id={l.id} className={f.briefItem}>
                  <Mark name={l.team.name} size="s" />
                  <div className={f.briefMain}>
                    <p className={f.briefLine}>
                      <a className={f.briefTeam} href={teamHref(l.team.uid)}>
                        {l.team.name}
                      </a>{' '}
                      {l.line}
                    </p>
                    <p className={f.briefMeta}>
                      <span className={s.badge}>{l.focus}</span>
                      <time>{l.date}</time>
                      <span aria-hidden="true">·</span>
                      <a className={s.sourceLink} href={l.source.href} target="_blank" rel="noreferrer">
                        {l.source.label}
                      </a>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section id="deals" className={f.section} aria-labelledby="deals-title">
            <SectionHead id="deals" title="Capital & deals" />
            {deal && (
              <div className={f.dealCard}>
                <p className={f.dealFigure}>{deal.amount}</p>
                <p className={f.dealWho}>
                  <TeamLink team={deal.team} /> · {deal.round} · {deal.announced}
                </p>
                <p className={f.body}>{deal.what}</p>
                <Sources sources={deal.sources} />
              </div>
            )}
            <p className={f.note}>{EDITION.deals.catchUpNote}</p>
          </section>
        </div>

        <section id="news" className={f.section} aria-labelledby="news-title">
          <SectionHead id="news" title="Network news" sub="Network teams in the press." />
          <ul className={f.press}>
            {EDITION.news.map((n) => (
              <li key={n.id}>
                <a className={f.pressRow} href={n.href} target="_blank" rel="noreferrer">
                  <span className={f.pressMain}>
                    <span className={f.pressOutlet}>{n.outlet}</span>
                    <span className={f.pressHeadline}>{n.headline}</span>
                    <time className={f.pressDate}>{n.date}</time>
                  </span>
                  <StoryImage seed={n.id} size="thumb" className={f.pressThumb} />
                </a>
              </li>
            ))}
          </ul>
        </section>

        {signals && (
          <section id="signals" className={f.section} aria-labelledby="signals-title">
            <SectionHead
              id="signals"
              title="Network signals this month"
              sub={anyMock ? 'Items marked “mock” are placeholder data in this prototype.' : undefined}
            />
            <ul className={f.tiles}>
              {EDITION.signals.map((sig) => (
                <li key={sig.id}>
                  <a className={f.tile} href={sig.href}>
                    <span className={f.tileFigure}>{sig.figure}</span>
                    <span className={f.tileLabel}>
                      {sig.label}
                      {sig.mock && <span className={s.mockTag}>mock</span>}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="take" className={f.section} aria-labelledby="take-title">
          <div className={clsx(f.take, f.takeGrid)}>
            <StoryImage seed="editors-take" size="side" className={f.takeImage} />
            <div className={f.takeText}>
              <p className={f.takeKicker}>The editor’s take</p>
              <h2 className={f.takeTitle} id="take-title">
                {EDITION.take.title}
              </h2>
              {EDITION.take.paragraphs.map((para, i) => (
                <p key={i} className={f.takeBody}>
                  {para.map((seg, j) => (
                    <TakeText key={j} seg={seg} />
                  ))}
                </p>
              ))}
            </div>
          </div>
        </section>

        <div className={f.band}>
          {forum && (
            <section id="forum" className={f.section} aria-labelledby="forum-title">
              <SectionHead
                id="forum"
                title="From the forum"
                sub={`Top threads since No. 06.${EDITION.forum.mock ? ' Mock threads.' : ''}`}
              />
              <ol className={f.threads}>
                {EDITION.forum.threads.map((th, i) => (
                  <li key={th.id}>
                    <a className={f.thread} href={th.href}>
                      <span className={f.threadNum}>{i + 1}</span>
                      <span className={f.threadText}>
                        <span className={f.threadTitle}>{th.title}</span>
                        <span className={f.threadMeta}>
                          {th.replies} {th.replies === 1 ? 'reply' : 'replies'}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
              <a className={s.calendarLink} href={EDITION.forum.href}>
                Open the forum
              </a>
            </section>
          )}

          <section id="dates" className={f.section} aria-labelledby="dates-title">
            <SectionHead id="dates" title="Where the network will be" />
            <ul className={f.events}>
              {EDITION.events.map((ev) => (
                <li key={ev.id} className={f.event}>
                  <span className={f.eventDate}>{ev.dates}</span>
                  <span className={f.eventText}>
                    <span className={f.eventTitle}>{ev.title}</span>
                    <span className={f.eventNote}>{ev.note}</span>
                  </span>
                </li>
              ))}
            </ul>
            <a className={s.calendarLink} href={EDITION.eventsHref} target="_blank" rel="noreferrer">
              Full network calendar
            </a>
          </section>
        </div>

        <div className={f.closer}>
          <p className={f.closerItem}>
            <span className={f.closerLabel}>Most read last issue</span>
            <span>
              {EDITION.mostReadLastIssue.title}{' '}
              <span className={f.closerMeta}>({EDITION.mostReadLastIssue.number})</span>
              {EDITION.mostReadLastIssue.mock && <span className={s.mockTag}>mock</span>}
            </span>
          </p>
          <p className={f.closerItem}>
            <span className={f.closerLabel}>Find more teams</span>
            <Link className={s.exploreLink} href="/teams">
              Explore all network teams in LabOS
            </Link>
          </p>
        </div>

        <section className={f.turn} aria-label="Your turn">
          <SendNews />
          <Feedback />
        </section>
      </div>

      {toast && <FollowToast>{toast}</FollowToast>}
    </div>
  );
}
