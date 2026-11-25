'use client';

/**
 * The agent's script (mocked, no model). Forked from home-v2-agent-dock/AgentV0 and extended for the
 * "agent" entry (2026-11-17):
 *
 *   - Role-aware. What the agent offers, and what it does when asked, follows the member's permissions:
 *       portfolio founder → intros through the PL Venture team (+ everything a lead can do)
 *       team lead         → their profile, the team profile, the team's news
 *       member            → their profile and forum drafts; team changes become a suggestion to the lead
 *     Not-for-you actions are absent from the prompts (lesson 4) and, when typed, answered with the route
 *     that does exist (the lead's name, the Venture team's rule).
 *   - Feedback is one of the agent's actions, not a second tab: "this filter is broken" turns into a
 *     feedback card about the page you're on, sent to the LabOS team only on Send.
 *   - Answers about what's in context: a news story from "Ask AI", or anything @mentioned.
 */

import clsx from 'clsx';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/common/Button';
import { Checkbox } from '@/components/common/Checkbox';

import type { AgentBlock, AgentBlockContext, AgentReply } from '../home-v2-b/agentScript';
import agentCss from '../home-v2-b/AgentPanel.module.scss';
import v0 from '../home-v2-agent-dock/AgentV0.module.scss';
import { KindPills } from '../labos-feedback-button/feedback/KindPills';

import { ItemGlyph, type AgentItem } from './items';
import s from './Agent.module.scss';

/* ---------- Viewers ---------- */

export type ViewerKey = 'founder' | 'lead' | 'member';

export type Viewer = {
  key: ViewerKey;
  name: string;
  firstName: string;
  email: string;
  role: string;
  location: string;
  team: string;
  teamUid: string;
  site: string;
  /** Portfolio founder: can send requests to the PL Venture team. */
  portfolio: boolean;
  /** Team lead: edits the team profile and posts its news. */
  lead: boolean;
  /** Who leads the team, for a member's suggestions. */
  teamLead: string;
  teamChanges: Change[];
  newsDraft: { type: string; title: string; summary: string };
};

export type Change = { field: string; from: string; to: string };

const DRIFTWOOD_CHANGES: Change[] = [
  { field: 'Short description', from: 'P2P sync research', to: 'Local-first sync for apps that work offline' },
  { field: 'Industry tags', from: 'Networking', to: 'Networking, Local-first, Developer tools' },
  { field: 'Team size', from: '1–10', to: '11–50' },
];

const DRIFTWOOD_NEWS = {
  type: 'LAUNCH',
  title: 'Driftwood Labs open-sources driftsync',
  summary:
    'driftsync, the sync engine behind our local-first apps, is now open source. It merges edits from devices that were offline, with no server in the middle. Docs and examples are on GitHub.',
};

export const VIEWERS: Record<ViewerKey, Viewer> = {
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
    lead: true,
    teamLead: 'Maya Chen',
    teamChanges: [
      { field: 'Short description', from: 'GPU marketplace for researchers', to: 'Verifiable GPU compute for open AI research' },
      { field: 'Funding stage', from: 'Pre-seed', to: 'Seed' },
      { field: 'Industry tags', from: 'Compute', to: 'Compute, AI, Verifiable computing' },
      { field: 'Team size', from: '1–10', to: '11–50' },
    ],
    newsDraft: {
      type: 'LAUNCH',
      title: 'Lattice Compute’s public testnet is live',
      summary:
        'Researchers can now rent GPUs by the hour on our public testnet and get a proof with every job, so anyone can check the results. We’re looking for 10 teams to run real workloads before mainnet.',
    },
  },
  lead: {
    key: 'lead',
    name: 'Sam Okafor',
    firstName: 'Sam',
    email: 'sam@driftwoodlabs.io',
    role: 'Founder',
    location: 'Toronto, Canada',
    team: 'Driftwood Labs',
    teamUid: 'driftwood-labs',
    site: 'driftwoodlabs.io',
    portfolio: false,
    lead: true,
    teamLead: 'Sam Okafor',
    teamChanges: DRIFTWOOD_CHANGES,
    newsDraft: DRIFTWOOD_NEWS,
  },
  member: {
    key: 'member',
    name: 'Jordan Reyes',
    firstName: 'Jordan',
    email: 'jordan@driftwoodlabs.io',
    role: 'Protocol Engineer',
    location: 'Toronto, Canada',
    team: 'Driftwood Labs',
    teamUid: 'driftwood-labs',
    site: 'driftwoodlabs.io',
    portfolio: false,
    lead: false,
    teamLead: 'Sam Okafor',
    teamChanges: DRIFTWOOD_CHANGES,
    newsDraft: DRIFTWOOD_NEWS,
  },
};

/** How the review band describes each viewer. */
export const VIEWER_NOTES: Record<ViewerKey, string> = {
  founder:
    'Default. Maya Chen leads Lattice Compute, a portfolio team: intros through the PL Venture team, both profiles, team news.',
  lead: 'Sam Okafor leads Driftwood Labs (not in the portfolio): both profiles and team news, no intro requests.',
  member:
    'Jordan Reyes is a member of Driftwood Labs, not a lead: their own profile and forum posts; team changes go to Sam as a suggestion.',
};

/* ---------- Prompts ---------- */

export type Topic = 'intro' | 'team' | 'profile' | 'forum' | 'news' | 'feedback';
export type Prompt = { text: string; topic: Topic; primary?: boolean };

export const FEEDBACK_PROMPT: Prompt = { text: 'Report a problem or an idea about this page', topic: 'feedback' };

export const rolePrompts = (v: Viewer): Prompt[] => {
  const p: Prompt[] = [];
  if (v.portfolio)
    p.push({
      text: "I need intros to founders who raised a Series A this year, I'm planning a fundraise",
      topic: 'intro',
      primary: true,
    });
  if (v.lead) {
    p.push({
      text: v.portfolio ? 'Post team news: our testnet is live' : 'Post team news: we open-sourced driftsync',
      topic: 'news',
    });
    p.push({ text: `Update ${v.team}’s profile from ${v.site}`, topic: 'team' });
  }
  p.push({
    text: v.portfolio ? "Update my profile: I'm now CEO and based in Lisbon" : 'Update my profile: I moved to Lisbon',
    topic: 'profile',
  });
  if (!v.lead) {
    p.push({ text: 'Draft a forum post about our new sync library', topic: 'forum' });
    p.push({ text: `Suggest an update to ${v.team}’s profile from ${v.site}`, topic: 'team' });
  }
  return p;
};

/** What the agent offers about an item in context (Ask AI on a card, or an @mention). */
export const itemPrompts = (item: AgentItem): Prompt[] => {
  if (item.kind === 'news')
    return [
      { text: 'Summarize this story', topic: 'news' },
      { text: `Who at ${item.by} should I talk to about this?`, topic: 'team' },
      { text: 'Draft a comment on it', topic: 'news' },
    ];
  if (item.kind === 'forum')
    return [
      { text: 'Summarize this thread', topic: 'forum' },
      { text: 'Draft a reply', topic: 'forum' },
    ];
  return [{ text: `Tell me about ${item.label}`, topic: item.kind === 'member' ? 'profile' : 'team' }];
};

/** The empty state's one line: what this member can have the agent do (the permissions, said once). */
export const intro = (v: Viewer) => {
  if (v.portfolio)
    return `You lead ${v.team}, a portfolio team, so I can ask the PL Venture team for intros, update your profile and ${v.team}’s, and post its news. Nothing is sent or changed until you confirm.`;
  if (v.lead)
    return `You lead ${v.team}, so I can update your profile and ${v.team}’s, and post its news. Nothing is sent or changed until you confirm.`;
  return `I can update your profile, draft forum posts, and send ${v.teamLead} changes for ${v.team}. Nothing is sent or changed until you confirm.`;
};

export const placeholder = (v: Viewer) =>
  v.portfolio ? 'Ask, request an intro, or type @ to add context' : 'Ask, tell it what to do, or type @ to add context';

/** A past chat in the history menu; `prompt` replays through the script, already answered. */
export type Chat = { id: string; title: string; when: string; prompt: string };

export const history = (v: Viewer): Chat[] => {
  const whens = ['Today', 'Yesterday', '3 days ago', 'Last week', 'Last week'];
  const titles: Record<Topic, string> = {
    intro: 'Intros for the fundraise',
    news: `${v.team} news post`,
    team: `${v.team} profile ${v.lead ? 'update' : 'suggestion'}`,
    profile: 'My profile update',
    forum: 'Sync library forum post',
    feedback: 'Feedback on Home',
  };
  return [...rolePrompts(v), { text: 'The events filter on Home forgets my city', topic: 'feedback' as const }].map(
    (p, i) => ({ id: `${p.topic}-${i}`, title: titles[p.topic], when: whens[i] ?? 'Earlier', prompt: p.text }),
  );
};

/* ---------- The script ---------- */

export type ScriptContext = {
  /** The page the member is on (feedback is about it, whatever the chips say). */
  page: AgentItem;
  /** What the agent reads now: the chips above the composer. */
  reading: AgentItem[];
};

const URL_RE = /\b((?:https?:\/\/)?(?:[\w-]+\.)+(?:xyz|io|com|org|dev|ai|net|co|app)(?:\/[^\s]*)?)/i;
const REQUEST_RE = /\b(intros?|introduc\w*|fundrais\w*|rais(e|ing)|investors?|venture|connect me|put me in touch)\b/i;
const TIMING_RE = /\b(months?|weeks?|later|this year|next year|q[1-4]|soon)\b/i;
const ASK_TIMING_RE =
  /\b(in (the next )?\d+([-–]\d+)? (months?|weeks?)|next (month|quarter)|later this year|by q[1-4]|in q[1-4])\b/i;
const FEEDBACK_RE =
  /\b(feedback|bug|broken|doesn'?t work|does not work|isn'?t working|not working|report a problem|error|confusing|annoying|forgets?|can'?t find|missing)\b/i;
const TEAM_NEWS_RE = /\b(team news|news post|post (our |team |the )?news|share news|publish news)\b/i;
const ABOUT_ITEM_RE = /\b(summar\w*|this (story|thread|post|news|page|event|team)|tell me about|what is|what's|who at|who should|talk to|explain)\b/i;

const hostOf = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

const feedbackKind = (text: string) =>
  /\b(bug|broken|doesn'?t work|does not work|isn'?t working|not working|error|forgets?)\b/i.test(text)
    ? 'bug'
    : /\?\s*$|\bhow (do|can)\b/i.test(text)
      ? 'question'
      : 'request';

export function createScript(v: Viewer, getContext: () => ScriptContext) {
  let pendingRequest: string | null = null;
  let pendingUrl: string | null = null;
  let awaitingTeamLink = false;
  let awaitingFeedback = false;

  const teamUpdate = (url: string): AgentReply => {
    const host = hostOf(url);
    return {
      steps: [`Read ${host}`, `Read ${v.team}’s team profile`, 'Compared them field by field'],
      blocks: [
        {
          kind: 'text',
          text: v.lead
            ? `${host} says more than ${v.team}’s profile in ${v.teamChanges.length} places:`
            : `${host} says more than ${v.team}’s profile in ${v.teamChanges.length} places. Only team leads can change it, so I’ll send these to ${v.teamLead} to approve:`,
        },
        custom(() => (
          <ChangesCard
            title={`${v.team} · team profile`}
            source={host}
            changes={v.teamChanges}
            sendTo={v.lead ? undefined : v.teamLead}
            viewHref={`/teams/${v.teamUid}`}
            viewLabel="View team profile"
            doneLabel={v.lead ? `Updated ${v.team}’s team profile.` : `Sent to ${v.teamLead}. Nothing changes until they approve.`}
          />
        )),
      ],
    };
  };

  const teamNews = (): AgentReply => {
    if (!v.lead)
      return {
        steps: [`Read ${v.team}’s team profile`],
        blocks: [
          {
            kind: 'text',
            text: `${v.team}’s news is posted by its leads. I can write it up and send it to ${v.teamLead} to post:`,
          },
          custom(() => <TeamNewsCard viewer={v} sendTo={v.teamLead} />),
        ],
      };
    return {
      steps: [`Read ${v.team}’s recent news`, 'Read how launches are written up in the network'],
      blocks: [
        { kind: 'text', text: `Here’s the post for ${v.team}’s news:` },
        custom(() => <TeamNewsCard viewer={v} />),
      ],
    };
  };

  const forumDraft = (): AgentReply => ({
    steps: [`Read ${v.team}’s recent updates`, 'Read how announcements in the forum are written'],
    blocks: [
      { kind: 'text', text: 'Here’s a draft:' },
      custom(() =>
        v.portfolio ? (
          <PostDraftCard
            title="Lattice Compute’s testnet is live"
            body={
              'Our public testnet opened this week. Researchers can rent GPUs by the hour and get a proof with every job, so results can be checked by anyone.\n\nWe’re looking for 10 teams to run real workloads before mainnet. Reply here or message me if you want in.'
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

  const feedback = (text: string): AgentReply => {
    const { page } = getContext();
    return {
      steps: [`Read ${page.label}`],
      blocks: [
        { kind: 'text', text: `Here’s your feedback for the LabOS team, about ${page.label}:` },
        custom(() => <FeedbackCard viewer={v} page={page} body={text} kind={feedbackKind(text)} />),
      ],
    };
  };

  /** Questions about what's in context (Ask AI's story, an @mention). */
  const aboutItem = (text: string, item: AgentItem): AgentReply => {
    const read = [`Read ${item.label}`];
    if (/draft|comment|reply/i.test(text) && (item.kind === 'news' || item.kind === 'forum'))
      return {
        steps: [...read, 'Read the comments so far'],
        blocks: [
          { kind: 'text', text: 'Here’s a comment. It posts under your name only when you press Post.' },
          custom(() => (
            <CommentCard
              on={item.label}
              body={
                item.kind === 'news'
                  ? `Congrats to the ${item.by} team! We’re working on something close at ${v.team} and would love to compare notes. Happy to share what we learned.`
                  : `Thanks for writing this up. At ${v.team} we ran into the same thing; happy to share what worked for us.`
              }
            />
          )),
        ],
      };
    if (/who (at|should)|talk to/i.test(text))
      return {
        steps: [...read, `Read ${item.by ?? item.label}’s team profile`],
        blocks: [
          {
            kind: 'text',
            text: `Ana Reyes posted this for ${item.by ?? item.label} and lists office hours on partnerships, so she’s the one to ask. ${
              v.portfolio ? 'Want me to ask the PL Venture team for an intro?' : 'You can book their office hours from the team profile.'
            }`,
          },
          ...(v.portfolio
            ? [
                {
                  kind: 'suggest',
                  prompts: [{ text: `Request an intro to ${item.by ?? item.label}`, topic: 'intro' }],
                } as AgentBlock,
              ]
            : []),
        ],
      };
    return {
      steps: read,
      blocks: [{ kind: 'text', text: item.body ?? `${item.label}: ${item.meta}.` }],
    };
  };

  return function reply(raw: string): AgentReply {
    const text = raw.trim();
    const url = text.match(URL_RE)?.[1] ?? null;
    const { reading } = getContext();
    const items = reading.filter((r) => r.kind !== 'page');

    const openRequest = pendingRequest;
    const openLink = pendingUrl;
    const wantsLink = awaitingTeamLink;
    const wantsFeedback = awaitingFeedback;
    pendingRequest = null;
    pendingUrl = null;
    awaitingTeamLink = false;
    awaitingFeedback = false;
    if (wantsFeedback) return feedback(text);
    if (openRequest && TIMING_RE.test(text)) return ventureRequest(openRequest, text);
    if (openLink && /team|profile/i.test(text)) return teamUpdate(openLink);
    if (openLink && /forum|post|draft/i.test(text)) return forumDraft();
    if (wantsLink && url) return teamUpdate(url);

    /* Feedback, from the prompt: ask for the words first. */
    if (/^report a problem or an idea/i.test(text)) {
      awaitingFeedback = true;
      return {
        steps: [],
        blocks: [{ kind: 'text', text: 'What happened, or what would you change? I’ll attach the page you’re on.' }],
      };
    }

    if (url && text.replace(url, '').trim().length === 0) {
      pendingUrl = url;
      return {
        steps: [`Read ${hostOf(url)}`],
        blocks: [
          { kind: 'text', text: `What should I do with ${hostOf(url)}?` },
          ask([
            v.lead ? `Update ${v.team}’s team profile from it` : `Suggest ${v.team}’s profile changes from it`,
            'Draft a forum post about it',
          ]),
        ],
      };
    }

    if (/^request an intro to /i.test(text) && v.portfolio) {
      pendingRequest = text;
      return {
        steps: ['Found who makes these intros: the PL Venture team'],
        blocks: [
          { kind: 'text', text: 'I’ll ask the PL Venture team. When are you planning to raise?' },
          ask(['In the next 3 months', 'In 3–6 months', 'Later this year', 'Not raising, it’s a partnership']),
        ],
      };
    }

    if (TEAM_NEWS_RE.test(text)) return teamNews();

    const aboutTeam = /\bteam\b/i.test(text) || text.toLowerCase().includes(v.team.toLowerCase());
    if (aboutTeam && /profile|update|suggest/i.test(text) && !/talk to|my profile/i.test(text)) {
      if (url) return teamUpdate(url);
      awaitingTeamLink = true;
      return {
        steps: [`Read ${v.team}’s team profile`],
        blocks: [{ kind: 'text', text: 'Which page should I read? Paste a link to your site, a launch post or a deck.' }],
      };
    }

    if (REQUEST_RE.test(text) && !items.length) {
      if (!v.portfolio)
        return {
          steps: ['Read your team profile'],
          blocks: [
            {
              kind: 'text',
              text: `Intros through the PL Venture team are for portfolio founders, and ${v.team} isn’t in the portfolio. AI agent chat can find teams like these in the network.`,
            },
            custom(() => (
              <Link href="/prototypes/ai-mode-results" className={agentCss.moreLink}>
                Open AI agent chat
              </Link>
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

    if (FEEDBACK_RE.test(text)) return feedback(text);

    /* Something in context, and a question about it (or about "this"). The newest chip wins. */
    const named = items.find((i) => text.toLowerCase().includes(i.label.toLowerCase()));
    if (named || (items.length && ABOUT_ITEM_RE.test(text))) return aboutItem(text, named ?? items[items.length - 1]);

    if (/forum|draft|announc/i.test(text)) return forumDraft();

    if (ABOUT_ITEM_RE.test(text) && !reading.length)
      return {
        steps: [],
        blocks: [
          {
            kind: 'text',
            text: 'I’m not reading any page right now. Add one with + or type @ to point me at a story, team or member.',
          },
        ],
      };

    return {
      steps: ['Read your request'],
      blocks: [
        { kind: 'text', text: 'I can’t do that in this version yet. Here’s what I can do for you:' },
        { kind: 'suggest', prompts: rolePrompts(v) as never },
      ],
    };
  };
}

const custom = (render: (ctx: AgentBlockContext) => ReactNode): AgentBlock => ({ kind: 'custom', render });
const ask = (options: string[]): AgentBlock => custom((ctx) => <AskOptions options={options} ctx={ctx} />);

/* ---------- Cards ---------- */

function AskOptions({ options, ctx }: { options: string[]; ctx: AgentBlockContext }) {
  const [answered, setAnswered] = useState(false);
  if (answered) return null;
  return (
    <ol className={v0.options}>
      {options.map((o, i) => (
        <li key={o}>
          <button
            type="button"
            className={clsx(agentCss.followUp, v0.option)}
            disabled={ctx.busy}
            onClick={() => {
              setAnswered(true);
              ctx.send(o);
            }}
          >
            <span className={v0.optionNum}>{i + 1}</span>
            {o}
          </button>
        </li>
      ))}
    </ol>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden className={agentCss.stepCheck}>
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Receipt({ children, onUndo }: { children: ReactNode; onUndo?: () => void }) {
  return (
    <div className={agentCss.receipt}>
      <Check />
      <span>{children}</span>
      {onUndo && (
        <button type="button" className={agentCss.undo} onClick={onUndo}>
          Undo
        </button>
      )}
    </div>
  );
}

function RequestCard({ viewer, body }: { viewer: Viewer; body: string }) {
  const [text, setText] = useState(body);
  const [state, setState] = useState<'draft' | 'sent' | 'dismissed'>('draft');

  if (state === 'dismissed') return <p className={v0.muted}>Not sent.</p>;
  if (state === 'sent')
    return (
      <div className={v0.card}>
        <p className={v0.receiptTitle}>
          <Check />
          Sent to the PL Venture team
        </p>
        <blockquote className={v0.quote}>{text}</blockquote>
        <p className={v0.note}>They’ll reply to {viewer.email}.</p>
      </div>
    );

  return (
    <div className={v0.card}>
      <div className={v0.cardHead}>
        <span className={v0.label}>To</span>
        <span className={v0.recipient}>PL Venture team</span>
      </div>
      <textarea className={v0.field} value={text} rows={6} aria-label="Your request" onChange={(e) => setText(e.target.value)} />
      <p className={v0.note}>
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

/** Field-by-field changes, each ticked. A lead applies them; a member sends them to the lead (`sendTo`). */
function ChangesCard({
  title,
  source,
  changes,
  sendTo,
  viewHref,
  viewLabel,
  doneLabel,
}: {
  title: string;
  source?: string;
  changes: Change[];
  sendTo?: string;
  viewHref: string;
  viewLabel: string;
  doneLabel: string;
}) {
  const [picked, setPicked] = useState<Set<number>>(() => new Set(changes.map((_, i) => i)));
  const [state, setState] = useState<'draft' | 'applied' | 'dismissed'>('draft');
  const n = picked.size;

  if (state === 'dismissed') return <p className={v0.muted}>{sendTo ? 'Not sent.' : 'Nothing changed.'}</p>;
  if (state === 'applied')
    return (
      <Receipt onUndo={sendTo ? undefined : () => setState('draft')}>
        {doneLabel}{' '}
        {!sendTo && (
          <a href={viewHref} className={v0.inlineLink}>
            {viewLabel}
          </a>
        )}
      </Receipt>
    );

  const count = n === changes.length && n > 1 ? `all ${n}` : `${n} ${n === 1 ? 'change' : 'changes'}`;
  return (
    <div className={v0.card}>
      <div className={v0.cardHead}>
        {sendTo && <span className={v0.label}>To</span>}
        <span className={v0.recipient}>{sendTo ? `${sendTo}, team lead` : title}</span>
        {source && <span className={v0.source}>From {source}</span>}
      </div>
      <ul className={v0.changes}>
        {changes.map((c, i) => {
          const id = `change-${title}-${i}`;
          return (
            <li key={c.field} className={clsx(v0.change, !picked.has(i) && v0.changeOff)}>
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
              <div className={v0.changeText}>
                <span id={id} className={v0.label}>
                  {c.field}
                </span>
                <span className={v0.from}>{c.from}</span>
                <span className={v0.to}>{c.to}</span>
              </div>
            </li>
          );
        })}
      </ul>
      <div className={agentCss.actions}>
        <Button size="xs" style="fill" variant="primary" disabled={n === 0} onClick={() => setState('applied')}>
          {sendTo ? `Send ${count} to ${sendTo.split(' ')[0]}` : `Apply ${count}`}
        </Button>
        <Button size="xs" style="border" variant="neutral" onClick={() => setState('dismissed')}>
          Not now
        </Button>
      </div>
    </div>
  );
}

function PostDraftCard({ title: initialTitle, body: initialBody }: { title: string; body: string }) {
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [state, setState] = useState<'draft' | 'posted' | 'dismissed'>('draft');

  if (state === 'dismissed') return <p className={v0.muted}>Not posted.</p>;
  if (state === 'posted')
    return (
      <Receipt>
        Posted “{title}” to the forum.{' '}
        <a href="/forum" className={v0.inlineLink}>
          View post
        </a>
      </Receipt>
    );

  return (
    <div className={v0.card}>
      <input className={clsx(v0.field, v0.titleField)} value={title} aria-label="Title" onChange={(e) => setTitle(e.target.value)} />
      <textarea className={v0.field} value={body} rows={7} aria-label="Post" onChange={(e) => setBody(e.target.value)} />
      <div className={agentCss.actions}>
        <Button size="xs" style="fill" variant="primary" disabled={!title.trim() || !body.trim()} onClick={() => setState('posted')}>
          Post to forum
        </Button>
        <Button size="xs" style="border" variant="neutral" onClick={() => setState('dismissed')}>
          Not now
        </Button>
      </div>
    </div>
  );
}

/* Team news types, in the Post news modal's vocabulary (production's event types). */
const NEWS_TYPES = [
  { label: 'Launch', value: 'LAUNCH' },
  { label: 'Funding', value: 'FUNDING' },
  { label: 'Milestone', value: 'MILESTONE' },
  { label: 'Announcement', value: 'ANNOUNCEMENT' },
];

/** A team news post. A lead posts it; a member sends it to the lead (`sendTo`). */
function TeamNewsCard({ viewer, sendTo }: { viewer: Viewer; sendTo?: string }) {
  const [type, setType] = useState(viewer.newsDraft.type);
  const [title, setTitle] = useState(viewer.newsDraft.title);
  const [summary, setSummary] = useState(viewer.newsDraft.summary);
  const [state, setState] = useState<'draft' | 'done' | 'dismissed'>('draft');

  if (state === 'dismissed') return <p className={v0.muted}>{sendTo ? 'Not sent.' : 'Not posted.'}</p>;
  if (state === 'done')
    return sendTo ? (
      <Receipt>
        Sent to {sendTo}. It goes up on {viewer.team}’s news when they post it.
      </Receipt>
    ) : (
      <Receipt onUndo={() => setState('draft')}>
        Posted to {viewer.team}’s news. It shows on Home and the team profile.{' '}
        <a href={`/teams/${viewer.teamUid}`} className={v0.inlineLink}>
          View
        </a>
      </Receipt>
    );

  return (
    <div className={v0.card}>
      <div className={v0.cardHead}>
        <span className={v0.label}>{sendTo ? 'To' : 'Post as'}</span>
        <span className={v0.recipient}>{sendTo ? `${sendTo}, team lead` : viewer.team}</span>
      </div>
      <div className={s.pillsRow}>
        <KindPills options={NEWS_TYPES} value={type} onChange={(o) => setType(o.value)} aria-labelledby={undefined} />
      </div>
      <input className={clsx(v0.field, v0.titleField)} value={title} aria-label="Headline" onChange={(e) => setTitle(e.target.value)} />
      <textarea className={v0.field} value={summary} rows={5} aria-label="Summary" onChange={(e) => setSummary(e.target.value)} />
      <div className={agentCss.actions}>
        <Button size="xs" style="fill" variant="primary" disabled={!title.trim()} onClick={() => setState('done')}>
          {sendTo ? `Send to ${sendTo.split(' ')[0]}` : `Post to ${viewer.team} news`}
        </Button>
        <Button size="xs" style="border" variant="neutral" onClick={() => setState('dismissed')}>
          Not now
        </Button>
      </div>
    </div>
  );
}

const FEEDBACK_KINDS = [
  { label: 'Bug', value: 'bug' },
  { label: 'Request', value: 'request' },
  { label: 'Question', value: 'question' },
];

/**
 * Feedback, as an agent action: the LabOS feedback form's essentials (Kind pills, the note, the page it's
 * about, a screenshot) on one card, filled from what the member typed. Goes only on Send.
 */
function FeedbackCard({ viewer, page, body, kind: initialKind }: { viewer: Viewer; page: AgentItem; body: string; kind: string }) {
  const [kind, setKind] = useState(initialKind);
  const [text, setText] = useState(body);
  const [shot, setShot] = useState(true);
  const [state, setState] = useState<'draft' | 'sent' | 'dismissed'>('draft');

  if (state === 'dismissed') return <p className={v0.muted}>Not sent.</p>;
  if (state === 'sent')
    return (
      <Receipt>
        Sent to the LabOS team as a {FEEDBACK_KINDS.find((k) => k.value === kind)?.label.toLowerCase()} about {page.label}. Replies
        go to {viewer.email}.
      </Receipt>
    );

  return (
    <div className={v0.card}>
      <div className={v0.cardHead}>
        <span className={v0.label}>To</span>
        <span className={v0.recipient}>LabOS team</span>
      </div>
      <div className={s.pillsRow}>
        <KindPills options={FEEDBACK_KINDS} value={kind} onChange={(o) => setKind(o.value)} />
      </div>
      <textarea className={v0.field} value={text} rows={4} aria-label="Your feedback" onChange={(e) => setText(e.target.value)} />
      <div className={s.attached}>
        <span className={s.attachedPage}>
          <ItemGlyph item={page} />
          {page.label}
          <span className={s.attachedPath}>{page.path}</span>
        </span>
        <label className={s.attachedShot}>
          <Checkbox checked={shot} onChange={(on) => setShot(on)} aria-label="Include a screenshot of this page" />
          Include a screenshot of this page
        </label>
      </div>
      <div className={agentCss.actions}>
        <Button size="xs" style="fill" variant="primary" disabled={!text.trim()} onClick={() => setState('sent')}>
          Send feedback
        </Button>
        <Button size="xs" style="border" variant="neutral" onClick={() => setState('dismissed')}>
          Not now
        </Button>
      </div>
    </div>
  );
}

function CommentCard({ on, body }: { on: string; body: string }) {
  const [text, setText] = useState(body);
  const [state, setState] = useState<'draft' | 'posted' | 'dismissed'>('draft');
  if (state === 'dismissed') return <p className={v0.muted}>Not posted.</p>;
  if (state === 'posted') return <Receipt>Commented on “{on}”.</Receipt>;
  return (
    <div className={v0.card}>
      <textarea className={v0.field} value={text} rows={4} aria-label="Comment" onChange={(e) => setText(e.target.value)} />
      <div className={agentCss.actions}>
        <Button size="xs" style="fill" variant="primary" disabled={!text.trim()} onClick={() => setState('posted')}>
          Post comment
        </Button>
        <Button size="xs" style="border" variant="neutral" onClick={() => setState('dismissed')}>
          Not now
        </Button>
      </div>
    </div>
  );
}
