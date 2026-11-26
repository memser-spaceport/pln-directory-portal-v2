'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/common/Button';

import followPill from '../follow-shared/FollowPill.module.scss';
import { FollowToast } from '../follow-shared/FollowToast';

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

/**
 * A neutral logo placeholder: the team's initials on a tinted tile. Never a
 * person's photo.
 */
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
  share: (anchor: string | undefined, what: string) => void;
  mockShare: (network: 'linkedin' | 'x') => void;
}

/**
 * Follow a team, as in the product (TeamNews handleFollowToggle,
 * FollowTeamsScroller). The label names the team, so the reader knows what
 * they follow. Same DS button as the shared FollowPill: xxs, border, neutral.
 */
function TeamFollowPill({ team, following, onToggle }: { team: TeamRef; following: boolean; onToggle: () => void }) {
  return (
    <Button
      size="xxs"
      style="border"
      variant="neutral"
      underline={false}
      className={followPill.btn}
      aria-pressed={following}
      title={`See ${team.name} news in For You`}
      onClick={onToggle}
    >
      <svg width={12} height={12} viewBox="0 0 16 16" fill="none" aria-hidden="true">
        {following ? (
          <path d="M13.25 4.75 6.5 11.5 2.75 7.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M8 3.5v9M3.5 8h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        )}
      </svg>
      <span>{following ? `Following ${team.name}` : `Follow ${team.name}`}</span>
    </Button>
  );
}

/**
 * The story's footer: the outside sources, then what to do (follow the team,
 * share the story). Follow is the one bordered press; Share is a quiet trigger.
 * No "Request an intro": intro requests stay on team profiles, where
 * eligibility is checked.
 */
function StoryFooter({ story, api }: { story: Story; api: ActionsApi }) {
  const { team } = story;
  return (
    <div className={s.storyFoot}>
      <Sources sources={story.sources} />
      <div className={s.actions}>
        {story.actions.includes('follow') && (
          <TeamFollowPill team={team} following={api.following(team.uid)} onToggle={() => api.toggleFollow(team)} />
        )}
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

/**
 * A story in The Latest, YC style: an image, a large linked headline, one short
 * paragraph, one line of "Why it matters", one next step. The lead gets the
 * full-width image and a one-line "Yes, but". The team logo sits in the meta line.
 */
function StoryItem({ story, api }: { story: Story; api: ActionsApi }) {
  const lead = story.kind === 'lead';
  return (
    <article id={story.id} className={clsx(s.story, lead && s.storyLead)}>
      <StoryImage seed={story.id} size={lead ? 'hero' : 'side'} className={s.storyVisual} />
      <div className={s.storyMain}>
        <p className={s.storyMeta}>
          <Mark name={story.team.name} size="xs" />
          <TeamLink team={story.team} /> · <time>{story.date}</time>
        </p>
        <h3 className={clsx(s.storyTitle, lead && s.storyTitleLead)}>
          {/* The headline opens the aggregated news item in LabOS. Outside sources stay in the footer. */}
          <a className={s.storyTitleLink} href={newsHref(story.newsUid)}>
            {story.headline}
          </a>
        </h3>
        <p className={s.storyBody}>{story.paragraph}</p>
        <p className={s.why}>
          <strong className={s.whyLabel}>Why it matters:</strong> {story.whyItMatters}
        </p>
        {story.yesBut && (
          <p className={s.why}>
            <strong className={s.whyLabel}>Yes, but:</strong> {story.yesBut}
          </p>
        )}
        <a className={s.nextLink} href={newsHref(story.newsUid)}>
          {story.nextLabel}
        </a>
        <StoryFooter story={story} api={api} />
      </div>
    </article>
  );
}

function SectionHead({ id, title, sub }: { id: string; title: string; sub?: string }) {
  return (
    <header className={s.sectionHead}>
      <h2 className={s.sectionTitle} id={`${id}-title`}>
        {title}
      </h2>
      {sub && <p className={s.sectionSub}>{sub}</p>}
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
/* End-of-issue: your turn + feedback                                        */
/* ------------------------------------------------------------------------ */

/**
 * The ask, first in the footer: one field, one button. A link alone is enough;
 * the editor writes the line and checks it against a public source.
 */
function SendNews() {
  const [value, setValue] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className={s.receipt} role="status">
        <CheckGlyph /> Thanks. The editor reads every submission and checks it against a public source before it
        runs.
      </p>
    );
  }

  return (
    <div className={clsx(s.endBlock, s.askBlock)}>
      <h3 className={s.askTitle}>Send us your news</h3>
      <p className={s.endText}>
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
    </div>
  );
}

/** "No. 07" → "No. 08". */
function nextNumber() {
  const n = Number(EDITION.number.replace(/\D/g, ''));
  return `No. ${String(n + 1).padStart(2, '0')}`;
}

function Feedback() {
  const [vote, setVote] = useState<'yes' | 'no' | null>(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className={s.receipt} role="status">
        <CheckGlyph /> Thanks. Your answer shapes what goes into {nextNumber()}.
      </p>
    );
  }

  return (
    <div className={s.endBlock}>
      <h3 className={s.endTitle}>Was this issue useful?</h3>
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
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* The page                                                                  */
/* ------------------------------------------------------------------------ */

function ShareIssue({ onShare }: { onShare: () => void }) {
  const mailto = `mailto:?subject=${encodeURIComponent(`PL Network Digest ${EDITION.number}`)}&body=${encodeURIComponent(
    EDITION.subject,
  )}`;
  return (
    <div className={s.shareBox}>
      <p className={s.railTitle}>Share this issue</p>
      <div className={s.shareRow}>
        <Button size="xs" style="border" variant="neutral" onClick={onShare}>
          Copy link
        </Button>
        <a className={s.textAction} href={mailto}>
          Forward by email
        </a>
      </div>
    </div>
  );
}

/**
 * The full issue as a LabOS page, in one voice for everyone in the network.
 * YC weekly order: The Latest (short stories with a visual), team launches as
 * cards, press links; then deals, signals, forum, take and dates. The reader's
 * turn closes it.
 */
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

  const share = (anchor: string | undefined, what: string) => {
    const url = `${window.location.origin}${issueHref(anchor)}`;
    navigator.clipboard?.writeText(url).catch(() => undefined);
    flash(`${what} link copied.`);
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
    share,
    mockShare: (network) => flash(`This opens ${network === 'x' ? 'X' : 'LinkedIn'} with the story link.`),
  };

  const forum = showForum(forumAccess);
  const sections = SECTIONS.filter((sec) => (sec.id !== 'forum' || forum) && (sec.id !== 'signals' || signals));
  const anyMock = EDITION.signals.some((sig) => sig.mock);

  return (
    <div className={s.page}>
      <div className={s.pageInner}>
        <main className={s.article}>
          <header className={s.issueHead}>
            <h1 className={s.masthead}>PL Network Digest</h1>
            <p className={s.issueMeta}>
              {EDITION.number} · <time dateTime={EDITION.date}>{EDITION.dateLabel}</time> · {EDITION.readMinutes} min
              read
            </p>
          </header>

          <nav className={s.jumpRow} aria-label="In this issue">
            {sections.map((sec) => (
              <a key={sec.id} className={s.jumpLink} href={`#${sec.id}`}>
                {sec.label}
              </a>
            ))}
          </nav>

          <section id="latest" className={clsx(s.section, s.latestSection)} aria-labelledby="latest-title">
            <SectionHead id="latest" title="The Latest" />
            {EDITION.stories.map((st) => (
              <StoryItem key={st.id} story={st} api={api} />
            ))}
          </section>

          {/* YC's Launchpad: bordered cards, each opens the team page in LabOS. */}
          <section id="launches" className={s.section} aria-labelledby="launches-title">
            <SectionHead id="launches" title="New from network teams" sub="Launches and releases since No. 06." />
            <ul className={s.cards}>
              {EDITION.launches.map((l) => (
                <li key={l.id} id={l.id} className={s.card}>
                  <Mark name={l.team.name} size="s" />
                  <div className={s.cardMain}>
                    <h3 className={s.cardTitle}>
                      <a className={s.cardLink} href={teamHref(l.team.uid)}>
                        {l.team.name}
                      </a>
                      <span className={s.cardTagline}> — {l.tagline}</span>
                    </h3>
                    <p className={s.cardLine}>{l.line}</p>
                    <p className={s.cardFoot}>
                      <span className={s.badge}>{l.focus}</span>
                      <time className={s.cardDate}>{l.date}</time>
                      <a className={s.cardSource} href={l.source.href} target="_blank" rel="noreferrer">
                        {l.source.label}
                      </a>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section id="news" className={s.section} aria-labelledby="news-title">
            <SectionHead id="news" title="Network news" sub="Network teams in the press." />
            <ul className={s.press}>
              {EDITION.news.map((n) => (
                <li key={n.id} className={s.pressRow}>
                  <StoryImage seed={n.id} size="thumb" className={s.pressThumb} />
                  <div className={s.pressMain}>
                    <a className={s.pressLink} href={n.href} target="_blank" rel="noreferrer">
                      {n.headline}
                    </a>
                    <span className={s.pressMeta}>
                      {n.outlet} · <time>{n.date}</time>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section id="deals" className={s.section} aria-labelledby="deals-title">
            <SectionHead id="deals" title="Capital & deals" sub="Rounds announced by network teams." />
            <table className={s.deals}>
              <thead>
                <tr>
                  <th scope="col">Company</th>
                  <th scope="col">Round</th>
                  <th scope="col">Amount</th>
                  <th scope="col">What happened</th>
                  <th scope="col">Announced</th>
                </tr>
              </thead>
              <tbody>
                {EDITION.deals.rows.map((row) => (
                  <tr key={row.team.uid}>
                    <td data-label="Company">
                      <TeamLink team={row.team} />
                    </td>
                    <td data-label="Round" className={s.dealRound}>
                      {row.round}
                    </td>
                    <td data-label="Amount" className={s.amount}>
                      {row.amount}
                    </td>
                    <td data-label="What happened" className={s.dealWhat}>
                      <div>
                        {row.what}
                        <Sources sources={row.sources} />
                      </div>
                    </td>
                    <td data-label="Announced" className={s.dealDate}>
                      {row.announced}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={s.note}>{EDITION.deals.catchUpNote}</p>
          </section>

          {/* Optional signals block (count rows, no ads). Each row opens the LabOS page it counts. */}
          {signals && (
            <section id="signals" className={s.section} aria-labelledby="signals-title">
              <SectionHead
                id="signals"
                title="Network signals this month"
                sub={anyMock ? 'Items marked “mock” are placeholder data in this prototype.' : undefined}
              />
              <ul className={s.signals}>
                {EDITION.signals.map((sig) => (
                  <li key={sig.id} className={clsx(sig.examples && s.signalWide)}>
                    <a className={s.signal} href={sig.href}>
                      <span className={s.signalFigure}>{sig.figure}</span>
                      <span className={s.signalLabel}>
                        {sig.label}
                        {sig.mock && <span className={s.mockTag}>mock</span>}
                      </span>
                      <span className={s.signalArrow} aria-hidden="true">
                        →
                      </span>
                    </a>
                    {sig.examples && (
                      <ul className={s.roles} aria-label="Example roles">
                        {sig.examples.map((ex) => (
                          <li key={ex.label} className={s.role}>
                            <a className={s.roleLink} href={ex.href}>
                              {ex.label}
                            </a>
                            <span className={s.roleMeta}>{ex.meta}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {forum && (
            <section id="forum" className={s.section} aria-labelledby="forum-title">
              <SectionHead
                id="forum"
                title="From the forum"
                sub={`Top threads since No. 06.${EDITION.forum.mock ? ' Mock threads.' : ''}`}
              />
              <ol className={s.threads}>
                {EDITION.forum.threads.map((th, i) => (
                  <li key={th.id} className={s.thread}>
                    <span className={s.threadRank}>{i + 1}.</span>
                    <a className={s.threadTitle} href={th.href}>
                      {th.title}
                    </a>
                    <span className={s.threadReplies}>
                      {th.replies} {th.replies === 1 ? 'reply' : 'replies'}
                    </span>
                  </li>
                ))}
              </ol>
              <a className={s.calendarLink} href={EDITION.forum.href}>
                Open the forum
              </a>
            </section>
          )}

          <section id="take" className={s.section} aria-labelledby="take-title">
            <div className={s.takeBox}>
              <p className={s.kicker}>The editor’s take</p>
              <h2 className={s.takeTitle} id="take-title">
                {EDITION.take.title}
              </h2>
              {EDITION.take.paragraphs.map((para, i) => (
                <p key={i} className={s.takeBody}>
                  {para.map((seg, j) => (
                    <TakeText key={j} seg={seg} />
                  ))}
                </p>
              ))}
            </div>
          </section>

          <section id="dates" className={s.section} aria-labelledby="dates-title">
            <SectionHead id="dates" title="Where the network will be" />
            <ul className={s.events}>
              {EDITION.events.map((ev) => (
                <li key={ev.id} className={s.event}>
                  <span className={s.eventDate}>{ev.dates}</span>
                  <span>
                    <span className={s.eventTitle}>{ev.title}</span>
                    <span className={s.eventNote}>{ev.note}</span>
                  </span>
                </li>
              ))}
            </ul>
            <a className={s.calendarLink} href={EDITION.eventsHref} target="_blank" rel="noreferrer">
              Full network calendar
            </a>
          </section>

          <p className={s.mostRead}>
            <span className={s.mostReadLabel}>Most read last issue</span>
            <span>
              {EDITION.mostReadLastIssue.title}{' '}
              <span className={s.mostReadMeta}>({EDITION.mostReadLastIssue.number})</span>
              {EDITION.mostReadLastIssue.mock && <span className={s.mockTag}>mock</span>}
            </span>
          </p>

          <p className={s.explore}>
            Find more teams and discover what they build.{' '}
            <Link className={s.exploreLink} href="/teams">
              Explore all network teams in LabOS
            </Link>
          </p>

          <section className={clsx(s.section, s.endSection)} aria-label="Your turn">
            <SendNews />
            <Feedback />
            <div className={s.phoneShare}>
              <ShareIssue onShare={() => share(undefined, 'Issue')} />
            </div>
          </section>
        </main>

        <aside className={s.rail} aria-label="Issue navigation">
          <div className={s.railSticky}>
            <p className={s.railTitle}>In this issue</p>
            <ol className={s.railList}>
              {sections.map((sec) => (
                <li key={sec.id}>
                  <a className={s.railLink} href={`#${sec.id}`}>
                    {sec.label}
                  </a>
                </li>
              ))}
            </ol>
            <ShareIssue onShare={() => share(undefined, 'Issue')} />
          </div>
        </aside>
      </div>

      {toast && <FollowToast>{toast}</FollowToast>}
    </div>
  );
}
