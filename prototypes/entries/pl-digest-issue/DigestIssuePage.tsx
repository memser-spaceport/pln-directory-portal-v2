'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import { Button } from '@/components/common/Button';

import { FollowPill } from '../follow-shared/FollowPill';
import { FollowToast } from '../follow-shared/FollowToast';
import { useRequestIntro } from '../intro-shared/useRequestIntro';

import {
  EDITION,
  SECTIONS,
  issueHref,
  teamHref,
  type Group,
  type SectionKey,
  type Source,
  type Story,
  type TakeSegment,
  type TeamRef,
} from './mocks';
import s from './PlDigestIssue.module.scss';

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

/** A body paragraph with the team's first mention as the team-page link (the lead's case). */
function withTeamLink(text: string, team: TeamRef): ReactNode {
  const at = text.indexOf(team.name);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <TeamLink team={team} />
      {text.slice(at + team.name.length)}
    </>
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

const COHORT_LABEL = { founders: 'For founders', investors: 'For investors' } as const;

interface ActionsApi {
  following: (uid: string) => boolean;
  toggleFollow: (team: TeamRef) => void;
  introRequested: (uid: string) => boolean;
  requestIntro: (team: TeamRef) => void;
  share: (anchor: string, what: string) => void;
}

/**
 * The story's footer: what to read next (sources) and what to do (follow the
 * team, ask the PL team for an intro, pass the story on). Follow is the one
 * bordered press; intro and share are quiet text actions so a page of eight
 * stories does not become a wall of buttons.
 */
function StoryFooter({ story, api }: { story: Story; api: ActionsApi }) {
  const { team } = story;
  const requested = api.introRequested(team.uid);
  return (
    <div className={s.storyFoot}>
      <Sources sources={story.sources} />
      <div className={s.actions}>
        {story.actions.includes('follow') && (
          <FollowPill
            following={api.following(team.uid)}
            onToggle={() => api.toggleFollow(team)}
            name={team.name}
            size="xxs"
          />
        )}
        {story.actions.includes('intro') &&
          (requested ? (
            <span className={s.sent} role="status" title="Your request is with the PL team">
              <CheckGlyph /> Intro requested
            </span>
          ) : (
            <button type="button" className={s.textAction} onClick={() => api.requestIntro(team)}>
              Request an intro
            </button>
          ))}
        {story.actions.includes('share') && (
          <button type="button" className={s.textAction} onClick={() => api.share(story.id, 'Story')}>
            Copy link
          </button>
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

function Takeaways({ story }: { story: Story }) {
  if (!story.takeaways.length) return null;
  return (
    <dl className={clsx(s.takeaways, story.section === 'lead' && s.takeawaysLead)}>
      {story.takeaways.map((t) => (
        <div key={t.label} className={s.takeaway}>
          <dt className={s.takeawayLabel}>
            {t.label}
            {t.cohort && <span className={s.cohortTag}>{COHORT_LABEL[t.cohort]}</span>}
          </dt>
          <dd className={s.takeawayText}>{t.text}</dd>
        </div>
      ))}
    </dl>
  );
}

function StoryItem({ story, api }: { story: Story; api: ActionsApi }) {
  return (
    <article id={story.id} className={s.story}>
      <p className={s.storyDate}>
        <time>{story.date}</time>
      </p>
      <div className={s.storyMain}>
        <h4 className={s.storyTitle}>
          <TeamLink team={story.team} />
          {story.headlineRest}
        </h4>
        {story.body.map((p) => (
          <p key={p.slice(0, 24)} className={s.storyBody}>
            {p}
          </p>
        ))}
        <Takeaways story={story} />
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

function storiesIn(section: SectionKey, group: Group) {
  return EDITION.stories.filter((st) => st.section === section && st.group === group);
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

function YourTurn() {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState('');
  const [line, setLine] = useState('');
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className={s.receipt} role="status">
        <CheckGlyph /> Thanks. The editor reads every submission and checks it against a public source before it runs.
      </p>
    );
  }

  return (
    <div className={s.endBlock}>
      <h3 className={s.endTitle}>Did your team ship something?</h3>
      <p className={s.endText}>
        Send one line and a public link. Launches, rounds, research and open roles all count.
      </p>
      {!open ? (
        <Button size="xs" style="border" variant="neutral" onClick={() => setOpen(true)}>
          Submit news for No. 08
        </Button>
      ) : (
        <form
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            if (line.trim() && link.trim()) setSent(true);
          }}
        >
          <label className={s.field}>
            <span className={s.fieldLabel}>What happened</span>
            <input
              className={s.input}
              value={line}
              onChange={(e) => setLine(e.target.value)}
              placeholder="Our team launched…"
              required
            />
          </label>
          <label className={s.field}>
            <span className={s.fieldLabel}>Public link</span>
            <input
              className={s.input}
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://"
              required
            />
          </label>
          <div className={s.formRow}>
            <Button size="xs" style="fill" variant="primary" type="submit">
              Send to the editor
            </Button>
            <button type="button" className={s.textAction} onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Feedback() {
  const [vote, setVote] = useState<'yes' | 'no' | null>(null);
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className={s.receipt} role="status">
        <CheckGlyph /> Thanks. Your answer shapes what goes into No. 08.
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
 * The full issue as a LabOS page: one edition, one column, each story once.
 * Shared sections (lead, deals, take, dates) frame two cohort sections, so a
 * founder and an investor read the same page and each finds their part by
 * heading, not by a separate view.
 */
export function DigestIssuePage() {
  const intro = useRequestIntro();
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
          flash(`Following ${team.name}. Their updates show in your feed.`);
        }
        return next;
      });
    },
    introRequested: intro.requested,
    requestIntro: (team) => intro.request({ uid: team.uid, name: team.name, kind: 'team' }),
    share,
  };

  const lead = EDITION.stories.find((st) => st.section === 'lead')!;

  return (
    <div className={s.page}>
      <div className={s.pageInner}>
        <main className={s.article}>
          <header className={s.issueHead}>
            <p className={s.masthead}>PL Network Digest</p>
            <p className={s.issueMeta}>
              {EDITION.number} · <time dateTime={EDITION.date}>{EDITION.dateLabel}</time> · {EDITION.readMinutes} min
              read
            </p>
          </header>

          <nav className={s.jumpRow} aria-label="In this issue">
            {SECTIONS.map((sec) => (
              <a key={sec.id} className={s.jumpLink} href={`#${sec.id}`}>
                {sec.label}
              </a>
            ))}
          </nav>

          {/* The lead: shared, with one takeaway per reader. */}
          <section id="lead" className={clsx(s.section, s.leadSection)} aria-labelledby="lead-title">
            <p className={s.kicker}>The lead · {lead.date}</p>
            <h1 className={s.leadTitle} id="lead-title">
              {lead.headline}
            </h1>
            {lead.body.map((p, i) => (
              <p key={p.slice(0, 24)} className={s.leadBody}>
                {i === 0 ? withTeamLink(p, lead.team) : p}
              </p>
            ))}
            <Takeaways story={lead} />
            <StoryFooter story={lead} api={api} />
          </section>

          {/* Capital: one dated table for the whole network. */}
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

          <section id="founders" className={s.section} aria-labelledby="founders-title">
            <SectionHead id="founders" title="For founders" sub="Changes that touch your stack, and wins across the network." />
            {(['Heads-up', 'Wins'] as const).map((g) => (
              <div key={g} className={s.group}>
                <h3 className={s.groupTitle}>{g}</h3>
                {storiesIn('founders', g).map((st) => (
                  <StoryItem key={st.id} story={st} api={api} />
                ))}
              </div>
            ))}
          </section>

          <section id="investors" className={s.section} aria-labelledby="investors-title">
            <SectionHead id="investors" title="For investors" sub="Moves that change where value can sit." />
            <div className={s.group}>
              <h3 className={s.groupTitle}>Signals</h3>
              {storiesIn('investors', 'Signals').map((st) => (
                <StoryItem key={st.id} story={st} api={api} />
              ))}
            </div>
          </section>

          {/* The take comes after the items it cites; every claim links back to one. */}
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

          <section className={clsx(s.section, s.endSection)} aria-label="Your turn">
            <div className={s.phoneShare}>
              <ShareIssue onShare={() => share(undefined, 'Issue')} />
            </div>
            <YourTurn />
            <Feedback />
          </section>
        </main>

        <aside className={s.rail} aria-label="Issue navigation">
          <div className={s.railSticky}>
            <p className={s.railTitle}>In this issue</p>
            <ol className={s.railList}>
              {SECTIONS.map((sec) => (
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

      {intro.layer}
      {toast && <FollowToast>{toast}</FollowToast>}
    </div>
  );
}
