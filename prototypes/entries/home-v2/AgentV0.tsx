'use client';

/**
 * LabOS Agent V0 (2026-11-05), on homepage-redesign-v0's signed-in Home.
 *
 * The panel, its steps, streaming and composer are home-v2-b's AgentPanel (imported, not forked); this file
 * is only V0's script and the three cards it acts through. Scope from the V0 notes:
 *   - Primary: a portfolio founder sends a request to the PL Venture team ("I need an intro to X type of
 *     team, I'm planning a fundraise"). The agent asks the one thing the team needs that the profile can't
 *     say (when), then hands back an editable request (Delphi's in-thread card) that goes only on Send.
 *   - Update my profile, and update the team profile from a dropped URL: the agent reads, then lists each
 *     field it would change, old → new, ticked; nothing changes until Apply. A bare link gets a question
 *     first (Whop / AirOps ask in-thread rather than guess).
 *   - Draft and create a forum post: an editable draft that posts on Post to forum.
 * Not for investors: no use case yet, so a member who isn't a portfolio founder gets no request prompt, and
 * typing one gets a plain answer about who it's for (lesson 4: "not for you" is absent, not greyed).
 *
 * Everything is mocked: replies are scripted, Apply and Send only flip the card to its receipt.
 */

import clsx from 'clsx';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';

import type { AgentBlock, AgentBlockContext, AgentReply } from '../home-v2-b/agentScript';
import agentCss from '../home-v2-b/AgentPanel.module.scss';

import s from './AgentV0.module.scss';

/* ---------- Viewers ---------- */

export type AgentViewer = {
  key: 'founder' | 'member';
  name: string;
  firstName: string;
  email: string;
  role: string;
  location: string;
  team: string;
  teamUid: string;
  site: string;
  /** A portfolio founder can send requests to the PL Venture team. */
  portfolio: boolean;
  /** What the team's site says that its profile doesn't (the URL-drop diff). */
  teamChanges: Change[];
};

export type Change = { field: string; from: string; to: string };

export const AGENT_VIEWERS: Record<AgentViewer['key'], AgentViewer> = {
  founder: {
    key: 'founder',
    name: 'Maya Chen',
    firstName: 'Maya',
    email: 'maya@latticecompute.xyz',
    role: 'Co-founder & CTO',
    location: 'Berlin, Germany',
    team: 'Lattice Compute',
    teamUid: 'lattice-compute',
    site: 'latticecompute.xyz',
    portfolio: true,
    teamChanges: [
      { field: 'Short description', from: 'GPU marketplace for researchers', to: 'Verifiable GPU compute for open AI research' },
      { field: 'Funding stage', from: 'Pre-seed', to: 'Seed' },
      { field: 'Industry tags', from: 'Compute', to: 'Compute, AI, Verifiable computing' },
      { field: 'Team size', from: '1–10', to: '11–50' },
    ],
  },
  member: {
    key: 'member',
    name: 'Sam Okafor',
    firstName: 'Sam',
    email: 'sam@driftwoodlabs.io',
    role: 'Protocol Engineer',
    location: 'Toronto, Canada',
    team: 'Driftwood Labs',
    teamUid: 'driftwood-labs',
    site: 'driftwoodlabs.io',
    portfolio: false,
    teamChanges: [
      { field: 'Short description', from: 'P2P sync research', to: 'Local-first sync for apps that work offline' },
      { field: 'Industry tags', from: 'Networking', to: 'Networking, Local-first, Developer tools' },
      { field: 'Team size', from: '1–10', to: '11–50' },
    ],
  },
};

export const agentPrompts = (v: AgentViewer) => [
  ...(v.portfolio ? ["I need intros to founders who raised a Series A this year, I'm planning a fundraise"] : []),
  `Update our team profile from ${v.site}`,
  v.portfolio ? "Update my profile: I'm now CEO and based in Lisbon" : 'Update my profile: I moved to Lisbon',
  v.portfolio ? 'Draft a forum post announcing our testnet' : 'Draft a forum post about our new sync library',
];

export const agentIntro = (v: AgentViewer) =>
  v.portfolio
    ? 'I can send requests to the PL Venture team, update your profile and your team’s, and draft forum posts.'
    : 'I can update your profile and your team’s, and draft forum posts.';

/* ---------- The script ---------- */

const URL_RE = /\b((?:https?:\/\/)?(?:[\w-]+\.)+(?:xyz|io|com|org|dev|ai|net|co|app)(?:\/[^\s]*)?)/i;
const REQUEST_RE = /\b(intros?|introduc\w*|fundrais\w*|rais(e|ing)|investors?|venture|connect me|put me in touch)\b/i;
/* An answer to "when are you raising?". No "now": "I'm now CEO" is a profile change, not a raise date. */
const TIMING_RE = /\b(months?|weeks?|later|this year|next year|q[1-4]|soon)\b/i;
/* A raise date already inside the ask, phrased as one ("raised a Series A this year" is not). */
const ASK_TIMING_RE =
  /\b(in (the next )?\d+([-–]\d+)? (months?|weeks?)|next (month|quarter)|later this year|by q[1-4]|in q[1-4])\b/i;

const hostOf = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

/**
 * One script per viewer. It keeps what an open question is waiting for (the ask behind "when are you
 * raising?", the link behind "what should I do with it?"), so the answer can come from an option or typed.
 */
export function createAgentV0Script(v: AgentViewer) {
  let pendingRequest: string | null = null;
  let pendingUrl: string | null = null;
  let awaitingTeamLink = false;

  const teamUpdate = (url: string): AgentReply => {
    const host = hostOf(url);
    return {
      steps: [`Read ${host}`, `Read ${v.team}’s team profile`, 'Compared them field by field'],
      blocks: [
        {
          kind: 'text',
          text: `${host} says more than ${v.team}’s profile in ${v.teamChanges.length} places:`,
        },
        custom(() => (
          <ChangesCard
            title={`${v.team} · team profile`}
            source={host}
            changes={v.teamChanges}
            viewHref={`/teams/${v.teamUid}`}
            viewLabel="View team profile"
            doneLabel={`Updated ${v.team}’s team profile.`}
          />
        )),
      ],
    };
  };

  const forumDraft = (about?: string): AgentReply => ({
    steps: [`Read ${v.team}’s recent updates`, 'Read how announcements in the forum are written'],
    blocks: [
      { kind: 'text', text: 'Here’s a draft:' },
      custom(() =>
        v.portfolio ? (
          <PostDraftCard
            title={about ? `What’s new at ${v.team}` : 'Lattice Compute’s testnet is live'}
            body={
              about
                ? `We just refreshed ${about}: verifiable GPU compute for open AI research, now with per-job proofs.\n\nIf your team trains models in the open, we’d love to hear what you’d run on it.`
                : 'Our public testnet opened this week. Researchers can rent GPUs by the hour and get a proof with every job, so results can be checked by anyone.\n\nWe’re looking for 10 teams to run real workloads before mainnet. Reply here or message me if you want in.'
            }
          />
        ) : (
          <PostDraftCard
            title={`${v.team} open-sourced its sync library`}
            body={
              'We released driftsync, the sync engine behind our local-first apps. It merges edits from devices that were offline, with no server in the middle.\n\nDocs and examples are on GitHub. Feedback from teams building offline-first apps is very welcome.'
            }
          />
        ),
      ),
    ],
  });

  const ventureRequest = (ask: string, timing: string): AgentReply => {
    /* The option's words, mid-sentence ("in the next 3 months"); a date typed into the ask stays in the ask. */
    const when = timing ? ` ${timing.charAt(0).toLowerCase()}${timing.slice(1)}` : '';
    const body = /series a/i.test(ask)
      ? `${v.team} is planning its next round${when}. We’d like intros to founders in the network who raised a Series A this year, ideally compute or infrastructure teams, to hear how they ran the process and which funds led.`
      : `${v.team} is planning a fundraise${when}. ${ask.trim().replace(/\.?$/, '.')}`;
    return {
      steps: ['Wrote the request'],
      blocks: [
        { kind: 'text', text: 'Here’s the request for the PL Venture team:' },
        custom(() => <RequestCard viewer={v} body={body} />),
      ],
    };
  };

  return function reply(raw: string): AgentReply {
    const text = raw.trim();
    const url = text.match(URL_RE)?.[1] ?? null;

    /* Answers to an open question come first; anything else drops the question. */
    const openRequest = pendingRequest;
    const openLink = pendingUrl;
    const wantsLink = awaitingTeamLink;
    pendingRequest = null;
    pendingUrl = null;
    awaitingTeamLink = false;
    if (openRequest && TIMING_RE.test(text)) return ventureRequest(openRequest, text);
    if (openLink && /team|profile/i.test(text)) return teamUpdate(openLink);
    if (openLink && /forum|post|draft/i.test(text)) return forumDraft(hostOf(openLink));
    if (wantsLink && url) return teamUpdate(url);

    /* A bare link: ask what it's for rather than guess. */
    if (url && text.replace(url, '').trim().length === 0) {
      pendingUrl = url;
      return {
        steps: [`Read ${hostOf(url)}`],
        blocks: [
          { kind: 'text', text: `What should I do with ${hostOf(url)}?` },
          ask([`Update ${v.team}’s team profile from it`, 'Draft a forum post about it']),
        ],
      };
    }

    if (REQUEST_RE.test(text)) {
      if (!v.portfolio)
        return {
          steps: ['Read your team profile'],
          blocks: [
            {
              kind: 'text',
              text: `Requests to the PL Venture team are open to portfolio founders, and ${v.team} isn’t in the portfolio yet. AI Search can find teams like these in the network.`,
            },
            custom(() => (
              <a href="/prototypes/ai-mode-results" className={agentCss.moreLink}>
                Open AI Search
              </a>
            )),
          ],
        };
      if (!ASK_TIMING_RE.test(text)) {
        pendingRequest = text;
        return {
          steps: [`Read your profile and ${v.team}’s`, 'Found who makes these intros: the PL Venture team'],
          blocks: [
            {
              kind: 'text',
              text: 'I’ll send this to the PL Venture team. They make portfolio intros themselves. When are you planning to raise?',
            },
            ask(['In the next 3 months', 'In 3–6 months', 'Later this year']),
          ],
        };
      }
      return ventureRequest(text, '');
    }

    if (/team/i.test(text) && /profile|update/i.test(text)) {
      if (url) return teamUpdate(url);
      awaitingTeamLink = true;
      return {
        steps: [`Read ${v.team}’s team profile`],
        blocks: [
          {
            kind: 'text',
            text: 'Which page should I read? Paste a link to your site, a launch post or a deck.',
          },
        ],
      };
    }

    if (/my profile|i moved|i'?m now|i am now/i.test(text)) {
      const changes: Change[] = [];
      if (/\bceo\b/i.test(text)) changes.push({ field: 'Role', from: v.role, to: 'CEO' });
      if (/lisbon/i.test(text)) changes.push({ field: 'Location', from: v.location, to: 'Lisbon, Portugal' });
      if (!changes.length)
        return {
          steps: ['Read your profile'],
          blocks: [{ kind: 'text', text: 'What should change? For example your role, location, skills or bio.' }],
        };
      return {
        steps: ['Read your profile'],
        blocks: [
          {
            kind: 'text',
            text: changes.length === 1 ? 'One field changes on your profile:' : `${changes.length} fields change on your profile:`,
          },
          custom(() => (
            <ChangesCard
              title={`${v.name} · your profile`}
              changes={changes}
              viewHref="/members"
              viewLabel="View profile"
              doneLabel="Updated your profile."
            />
          )),
        ],
      };
    }

    if (/forum|post|draft|announc/i.test(text)) return forumDraft(url ? hostOf(url) : undefined);

    return {
      steps: ['Read your request'],
      blocks: [
        { kind: 'text', text: 'I can’t do that in this version yet. Here’s what I can do:' },
        { kind: 'suggest', prompts: agentPrompts(v) },
      ],
    };
  };
}

const custom = (render: (ctx: AgentBlockContext) => ReactNode): AgentBlock => ({ kind: 'custom', render });
const ask = (options: string[]): AgentBlock => custom((ctx) => <AskOptions options={options} ctx={ctx} />);

/* ---------- Cards ---------- */

/** A question the agent is stopped on: numbered answers (Whop), one press each. Gone once answered. */
function AskOptions({ options, ctx }: { options: string[]; ctx: AgentBlockContext }) {
  const [answered, setAnswered] = useState(false);
  if (answered) return null;
  return (
    <ol className={s.options}>
      {options.map((o, i) => (
        <li key={o}>
          <button
            type="button"
            className={clsx(agentCss.followUp, s.option)}
            disabled={ctx.busy}
            onClick={() => {
              setAnswered(true);
              ctx.send(o);
            }}
          >
            <span className={s.optionNum}>{i + 1}</span>
            {o}
          </button>
        </li>
      ))}
    </ol>
  );
}

/**
 * The founder's request for the PL Venture team. Editable in place; what travels with it and where the
 * reply goes are the two facts the card can't otherwise show (home-ai-ask's TeamRequest copy).
 */
function RequestCard({ viewer, body }: { viewer: AgentViewer; body: string }) {
  const [text, setText] = useState(body);
  const [state, setState] = useState<'draft' | 'sent' | 'dismissed'>('draft');

  if (state === 'dismissed') return <p className={s.muted}>Not sent.</p>;
  if (state === 'sent')
    return (
      <div className={s.card}>
        <p className={s.receiptTitle}>
          <Check />
          Sent to the PL Venture team
        </p>
        <blockquote className={s.quote}>{text}</blockquote>
        <p className={s.note}>They’ll reply to {viewer.email}.</p>
      </div>
    );

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <span className={s.label}>To</span>
        <span className={s.recipient}>PL Venture team</span>
      </div>
      <textarea
        className={s.field}
        value={text}
        rows={6}
        aria-label="Your request"
        onChange={(e) => setText(e.target.value)}
      />
      <p className={s.note}>
        Sent with your profile and {viewer.team}’s. They’ll reply to {viewer.email}.
      </p>
      <div className={agentCss.actions}>
        <Button size="xs" style="fill" variant="primary" disabled={!text.trim()} onClick={() => setState('sent')}>
          Send to PL Venture team
        </Button>
        <Button size="xs" style="border" variant="neutral" onClick={() => setState('dismissed')}>
          Not now
        </Button>
      </div>
    </div>
  );
}

/** Field-by-field changes the agent proposes, each one ticked; Apply names how many it will change. */
function ChangesCard({
  title,
  source,
  changes,
  viewHref,
  viewLabel,
  doneLabel,
}: {
  title: string;
  source?: string;
  changes: Change[];
  viewHref: string;
  viewLabel: string;
  doneLabel: string;
}) {
  const [picked, setPicked] = useState<Set<number>>(() => new Set(changes.map((_, i) => i)));
  const [state, setState] = useState<'draft' | 'applied' | 'dismissed'>('draft');
  const n = picked.size;

  if (state === 'dismissed') return <p className={s.muted}>Nothing changed.</p>;
  if (state === 'applied')
    return (
      <div className={agentCss.receipt}>
        <Check />
        <span>
          {doneLabel}{' '}
          <a href={viewHref} className={s.inlineLink}>
            {viewLabel}
          </a>
        </span>
        <button type="button" className={agentCss.undo} onClick={() => setState('draft')}>
          Undo
        </button>
      </div>
    );

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <span className={s.recipient}>{title}</span>
        {source && <span className={s.source}>From {source}</span>}
      </div>
      <ul className={s.changes}>
        {changes.map((c, i) => {
          const id = `change-${title}-${i}`;
          return (
            <li key={c.field} className={clsx(s.change, !picked.has(i) && s.changeOff)}>
              <Checkbox
                checked={picked.has(i)}
                aria-labelledby={id}
                onChange={(on) =>
                  setPicked((prev) => {
                    const next = new Set(prev);
                    if (on) next.add(i);
                    else next.delete(i);
                    return next;
                  })
                }
              />
              <div className={s.changeText}>
                <span id={id} className={s.label}>
                  {c.field}
                </span>
                <span className={s.from}>{c.from}</span>
                <span className={s.to}>{c.to}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className={agentCss.actions}>
        <Button size="xs" style="fill" variant="primary" disabled={n === 0} onClick={() => setState('applied')}>
          {n === changes.length && n > 1 ? `Apply all ${n}` : `Apply ${n} ${n === 1 ? 'change' : 'changes'}`}
        </Button>
        <Button size="xs" style="border" variant="neutral" onClick={() => setState('dismissed')}>
          Not now
        </Button>
      </div>
    </div>
  );
}

/** A forum post the member can edit before it goes up. */
function PostDraftCard({ title: initialTitle, body: initialBody }: { title: string; body: string }) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [state, setState] = useState<'draft' | 'posted' | 'dismissed'>('draft');

  if (state === 'dismissed') return <p className={s.muted}>Not posted.</p>;
  if (state === 'posted')
    return (
      <div className={agentCss.receipt}>
        <Check />
        <span>
          Posted “{title}” to the forum.{' '}
          <a href="/forum" className={s.inlineLink}>
            View post
          </a>
        </span>
      </div>
    );

  return (
    <div className={s.card}>
      <input className={clsx(s.field, s.titleField)} value={title} aria-label="Title" onChange={(e) => setTitle(e.target.value)} />
      <textarea className={s.field} value={body} rows={7} aria-label="Post" onChange={(e) => setBody(e.target.value)} />
      <div className={agentCss.actions}>
        <Button
          size="xs"
          style="fill"
          variant="primary"
          disabled={!title.trim() || !body.trim()}
          onClick={() => setState('posted')}
        >
          Post to forum
        </Button>
        <Button size="xs" style="border" variant="neutral" onClick={() => setState('dismissed')}>
          Not now
        </Button>
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={agentCss.stepCheck}>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
