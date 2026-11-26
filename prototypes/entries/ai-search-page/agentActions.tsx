'use client';

/**
 * AI agent chat as the agent, expanded (2026-11-25, "make it possible to do things in the chat the same way
 * as in the agent"). The page keeps answering questions about the network the way it always has. When a
 * message is a request the agent can act on (update my profile, request an intro, post team news, draft a
 * forum post, report a problem), the page answers with the agent's own reply instead: the same steps, the
 * same confirm cards, nothing sent or changed until the member confirms. One script, two surfaces.
 *
 * The agent's script (`agent/script.tsx`) is imported, not forked, so the two can't drift. Each thread gets
 * its own script instance, because the script remembers a half-asked request ("When are you planning to
 * raise?") between turns.
 */

import clsx from 'clsx';
import { createContext, useContext, useState } from 'react';
import { ChatCircle, ChatsCircle, EnvelopeSimple, FileText, User, UsersThree } from '@phosphor-icons/react';

import { Badge } from '@/components/common/Badge';
import { SearchIcon } from '@/components/icons';
import tabs from '@/components/page/ai-apps/components/FeedbackTabs/FeedbackTabs.module.scss';
import { AgentGlyph } from '../home-v2-agent-dock/AgentCorner';
import { Button } from '@/components/common/Button';
import { CheckIcon } from '@/components/icons';

import type { AgentReply } from '../home-v2-b/agentScript';
import p from '../home-v2-b/AgentPanel.module.scss';
import type { AgentItem } from '../agent/items';
import { AgentCardsSettled, AgentUndoOverride, createScript, rolePrompts, VIEWERS, type Prompt, type ViewerKey } from '../agent/script';
import { TopicLabel } from '../agent/TopicLabel';
import { makeTurn, type Turn } from '../ai-search/AnswerPanel';
import type { ChatThread } from '../ai-mode/threads';

import s from './agentActions.module.scss';

/** What feedback is "about" here, and what the script reads: this page. */
const THIS_PAGE: AgentItem = { id: 'page-ai-agent-chat', kind: 'page', label: 'AI agent chat', meta: 'Page' };

/** The script's "I can't do that" reply: not an action, so the page answers the question itself. */
const isFallback = (reply: AgentReply) =>
  reply.blocks.some((b) => b.kind === 'text' && b.text.startsWith('I can’t do that'));

/** The non-portfolio intro reply sends the member to AI agent chat, which is where they already are. */
const pointsHere = (reply: AgentReply) =>
  reply.blocks.some((b) => b.kind === 'text' && b.text.includes('AI agent chat can find teams like these'));

export type ThreadAgent = (question: string) => AgentReply | null;

/** One per thread. Returns the agent's reply when the message is something to do, otherwise null. */
export function createThreadAgent(viewer: ViewerKey): ThreadAgent {
  const reply = createScript(VIEWERS[viewer], () => ({ page: THIS_PAGE, reading: [THIS_PAGE] }));
  return (question) => {
    const r = reply(question);
    if (isFallback(r)) return null;
    if (pointsHere(r))
      return {
        steps: r.steps,
        blocks: [
          {
            kind: 'text',
            text: `Intros through the PL Venture team are for portfolio founders, and ${VIEWERS[viewer].team} isn’t in the portfolio. Ask me which teams work on this, and I’ll find them in the network.`,
          },
        ],
      };
    return r;
  };
}

/* Ids start from the clock, not 1, so a dev hot reload (which re-runs this module) can't reuse an id
   a turn on screen already has. */
let nextAgentTurnId = Date.now();

/** What the agent did, in one line, for a receipt. Read off the request, as the agent's own done-lines say it. */
export function receiptSummary(question: string, viewer: ViewerKey): string {
  const v = VIEWERS[viewer];
  if (/my profile|i moved|i'?m now/i.test(question)) {
    const parts = [/\bceo\b/i.test(question) && 'role CEO', /lisbon/i.test(question) && 'location Lisbon, Portugal'].filter(Boolean);
    return parts.length ? `Updated your profile: ${parts.join(', ')}` : 'Updated your profile';
  }
  if (/team news|news post|post (our |team |the )?news/i.test(question))
    return v.lead ? `Posted to ${v.team}’s news` : `Sent ${v.team}’s news to ${v.teamLead} to post`;
  if (/intro|fundrais|investor|venture/i.test(question)) return 'Sent your intro request to the PL Venture team';
  if (/team|profile/i.test(question))
    return v.lead ? `Updated ${v.team}’s team profile` : `Sent ${v.team}’s profile changes to ${v.teamLead} to approve`;
  if (/forum|draft|announc/i.test(question)) return 'Posted your draft to the forum';
  return 'Sent your feedback to the LabOS team';
}

/**
 * A chat brought over from the agent, for version 1's review: two things the agent did and a question
 * between them. History shows it like any chat; the actions read as receipts.
 */
export function agentHandoffThread(viewer: ViewerKey, view: 'receipt' | 'history' = 'receipt'): ChatThread {
  const agent = createThreadAgent(viewer);
  const v = VIEWERS[viewer];
  const questions = [
    v.portfolio ? "Update my profile: I'm now CEO and based in Lisbon" : 'Update my profile: I moved to Lisbon',
    'Which teams work on decentralized storage?',
    v.portfolio
      ? "I need intros to founders who raised a Series A this year, I'm planning a fundraise in the next 3 months"
      : v.lead
        ? 'Post team news: we open-sourced driftsync'
        : 'Draft a forum post about our new sync library',
  ];
  return {
    /* Clock-based for the same reason: never the id of a chat already in History. */
    id: Date.now() + Math.floor(Math.random() * 1000),
    createdAt: new Date(),
    scope: null,
    title: 'Lisbon move and next steps',
    turns: questions.map((q) => {
      const reply = agent(q);
      if (reply) return agentTurn(q, reply, viewer, view);
      const turn = makeTurn(q);
      return { ...turn, shown: turn.answer, status: 'done' as const };
    }),
  };
}

/**
 * How an action shows on this page:
 *   live      version 2: the chat is the agent. Its steps and confirm cards, here.
 *   receipt   an action the agent already took, brought over by its hand-off. A "Done in the agent" card,
 *             never run again (both versions).
 *   elsewhere version 1: the chat only reads. A new request points to the agent, which can do it.
 *   history   version 2, a past chat: the agent's own steps and cards, in their finished state.
 *   switch    version 3, Search mode: a request that needs the agent. One press asks the agent instead.
 */
export type AgentView = 'live' | 'receipt' | 'elsewhere' | 'history' | 'switch';

const SWITCH_TEXT = 'This needs the agent: Search only answers questions.';

const ELSEWHERE_TEXT =
  'AI agent chat can’t make changes yet. The agent can: open it and ask the same thing.';

/** Set by the page when the agent's floating button is on it: open its drawer here, not a new tab. */
export const OpenAgentContext = createContext<(() => void) | null>(null);

/** The agent, opened on this member's role (the agent prototype). */
export const agentHref = (viewer: ViewerKey) =>
  `/prototypes/agent?state=signed-in&agent=open${viewer === 'founder' ? '' : `&viewer=${viewer}`}`;

/** A turn the agent answers. The text blocks stream like any answer; the cards land once it's done. */
export function agentTurn(question: string, reply: AgentReply, viewer: ViewerKey, view: AgentView = 'live'): Turn {
  const text =
    view === 'elsewhere'
      ? ELSEWHERE_TEXT
      : view === 'switch'
        ? SWITCH_TEXT
        : reply.blocks
            .filter((b): b is { kind: 'text'; text: string } => b.kind === 'text')
            .map((b) => b.text)
            .join(' ');
  return {
    id: nextAgentTurnId++,
    question,
    shown: '',
    status: 'thinking',
    feedback: 'none',
    answer: text,
    sources: [],
    sql: [],
    followUpQuestions: [],
    agent: reply,
    agentView: view,
    agentViewer: viewer,
    agentSummary: view === 'receipt' ? receiptSummary(question, viewer) : undefined,
    /* A receipt arrives finished: there is nothing to stream. */
    ...(view === 'receipt' || view === 'history' ? { status: 'done' as const, shown: text } : {}),
  } as Turn;
}

/** The card for an action, by how this page treats it. */
export function AgentTurnView(props: {
  reply: AgentReply;
  question?: string;
  summary?: string;
  view: AgentView;
  viewer: ViewerKey;
  streaming: boolean;
  shown: string;
  onSend: (text: string) => void;
  busy: boolean;
}) {
  const openAgent = useContext(OpenAgentContext);
  /* Version 1 (2026-11-25, "use the same style … just undo will lead you to the agent"): the agent's own
     finished cards, as version 2 shows them. The step line says where it happened; Undo opens the agent,
     because only the agent can change it. */
  if (props.view === 'receipt')
    return (
      <AgentCardsSettled.Provider value>
        <AgentUndoOverride.Provider value={openAgent ?? (() => window.open(agentHref(props.viewer), '_blank', 'noopener'))}>
          <AgentReplyView {...props} workedLabel="Done in the agent" />
        </AgentUndoOverride.Provider>
      </AgentCardsSettled.Provider>
    );
  if (props.view === 'switch')
    return (
      <div className={s.elsewhere}>
        <p className={p.text}>{props.streaming ? props.shown : SWITCH_TEXT}</p>
        {!props.streaming && (
          <div>
            <Button
              style="border"
              variant="neutral"
              size="s"
              disabled={props.busy}
              onClick={() => props.onSend(`@agent ${props.question ?? ''}`)}
            >
              <span className={s.btnGlyph}>
                <AgentGlyph />
              </span>
              Ask the agent
            </Button>
          </div>
        )}
      </div>
    );
  if (props.view === 'elsewhere')
    return (
      <div className={s.elsewhere}>
        <p className={p.text}>{props.streaming ? props.shown : ELSEWHERE_TEXT}</p>
        {!props.streaming && (
          <div>
            <Button
              style="border"
              variant="neutral"
              size="s"
              onClick={() => (openAgent ? openAgent() : window.open(agentHref(props.viewer), '_blank', 'noopener'))}
            >
              Open the agent
            </Button>
          </div>
        )}
      </div>
    );
  if (props.view === 'history')
    return (
      <AgentCardsSettled.Provider value>
        <AgentReplyView {...props} />
      </AgentCardsSettled.Provider>
    );
  return <AgentReplyView {...props} />;
}

/** The agent's reply, drawn as the agent draws it (home-v2-b's AgentPanel classes), inside the answer card. */
export function AgentReplyView({
  reply,
  streaming,
  shown,
  onSend,
  busy,
  workedLabel,
}: {
  workedLabel?: string;
  reply: AgentReply;
  streaming: boolean;
  shown: string;
  onSend: (text: string) => void;
  busy: boolean;
}) {
  const [stepsOpen, setStepsOpen] = useState(false);
  const steps = reply.steps;

  return (
    <div className={p.agentTurn}>
      {steps.length > 0 && (
        <>
          <button
            type="button"
            className={p.workedToggle}
            onClick={() => setStepsOpen((v) => !v)}
            aria-expanded={stepsOpen}
          >
            {workedLabel ?? `Worked for ${steps.length * 2}s`} · {steps.length} {steps.length === 1 ? 'step' : 'steps'}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d={stepsOpen ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'}
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {stepsOpen && (
            <ol className={p.steps}>
              {steps.map((label) => (
                <li key={label} className={p.step}>
                  {label}
                </li>
              ))}
            </ol>
          )}
        </>
      )}

      {/* While it streams, only the words; the cards land with the last word, as in the agent. */}
      {streaming ? (
        <p className={p.text}>{shown}</p>
      ) : (
        reply.blocks.map((b, i) => {
          if (b.kind === 'text')
            return (
              <p key={i} className={p.text}>
                {b.text}
              </p>
            );
          if (b.kind === 'custom') return <div key={i}>{b.render({ send: onSend, busy })}</div>;
          if (b.kind === 'suggest')
            return (
              <div key={i} className={p.followUps}>
                {(b.prompts as unknown as Prompt[]).map((q) => (
                  <button key={q.text} type="button" className={p.followUp} onClick={() => onSend(q.text)}>
                    <TopicLabel topic={q.topic} />
                    {q.text}
                  </button>
                ))}
              </div>
            );
          return null;
        })
      )}
    </div>
  );
}

/** One glyph per kind of request, the agent's topic marks without their words. */
const TOPIC_GLYPH: Record<Prompt['topic'], typeof User> = {
  intro: EnvelopeSimple,
  news: FileText,
  team: UsersThree,
  profile: User,
  forum: ChatsCircle,
  feedback: ChatCircle,
};

/**
 * The new chat's "Make a request" column: what this member can have it do, the agent's own prompts, as
 * compact rows (Notion AI's and ClickUp Brain's home lists). Three, so the column sits beside "Try asking"
 * inside the first screen.
 */
export function ActionPrompts({
  viewer,
  onPick,
  rowClass,
  glyphClass,
}: {
  viewer: ViewerKey;
  onPick: (text: string) => void;
  rowClass: string;
  glyphClass: string;
}) {
  return (
    <>
      {rolePrompts(VIEWERS[viewer])
        .slice(0, 3)
        .map((q) => {
          const Glyph = TOPIC_GLYPH[q.topic];
          return (
            <li key={q.text}>
              <button type="button" className={rowClass} onClick={() => onPick(q.text)}>
                <Glyph weight="regular" className={glyphClass} aria-hidden />
                <span>{q.text}</span>
              </button>
            </li>
          );
        })}
    </>
  );
}

/* ---------- Version 3: Search | Agent ---------- */

export type ChatMode = 'search' | 'agent';

/** "@agent …" (or "@labos …") sends one message to the agent, whatever the switch says. */
export function readMention(text: string): { agent: boolean; text: string } {
  const m = text.match(/^\s*@(agent|labos)\b[\s,:]*/i);
  return m ? { agent: true, text: text.slice(m[0].length).trim() } : { agent: false, text };
}

/**
 * The composer's mode switch (version 3, the manager's middle path): one chat, two modes. Search answers
 * questions; Agent can also make changes. Production's segmented tabs (the agent's own Agent | Feedback
 * switch wears them), small, at the field's bottom-left opposite the send.
 */
export function ModeSwitch({ mode, onChange }: { mode: ChatMode; onChange: (mode: ChatMode) => void }) {
  return (
    <div className={clsx(tabs.root, s.modeSwitch)} role="radiogroup" aria-label="Search or agent">
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'search'}
        className={clsx(tabs.tab, s.modeTab, mode === 'search' && tabs.active)}
        onClick={() => onChange('search')}
        title="Search: answers questions about the network"
      >
        <SearchIcon width={14} height={14} />
        Search
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'agent'}
        className={clsx(tabs.tab, s.modeTab, mode === 'agent' && tabs.active)}
        onClick={() => onChange('agent')}
        title="Agent: answers, and makes changes after you confirm"
      >
        <AgentGlyph />
        Agent
      </button>
    </div>
  );
}
