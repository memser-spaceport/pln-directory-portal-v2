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

import { useState } from 'react';
import { ChatCircle, ChatsCircle, EnvelopeSimple, FileText, User, UsersThree } from '@phosphor-icons/react';

import type { AgentReply } from '../home-v2-b/agentScript';
import p from '../home-v2-b/AgentPanel.module.scss';
import type { AgentItem } from '../agent/items';
import { AgentCardsSettled, createScript, rolePrompts, VIEWERS, type Prompt, type ViewerKey } from '../agent/script';
import { TopicLabel } from '../agent/TopicLabel';
import { makeTurn, type Turn } from '../ai-search/AnswerPanel';
import type { ChatThread } from '../ai-mode/threads';

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
/** `getReading`: what else the agent reads with the next message (the items it @mentions). */
export function createThreadAgent(viewer: ViewerKey, getReading: () => AgentItem[] = () => []): ThreadAgent {
  const reply = createScript(VIEWERS[viewer], () => ({ page: THIS_PAGE, reading: [THIS_PAGE, ...getReading()] }));
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

/**
 * A past chat where the agent acted: two things it did and a question between them. History shows it like
 * any chat; the actions show as the agent's own cards, finished.
 */
export function agentHandoffThread(viewer: ViewerKey): ChatThread {
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
      if (reply) return agentTurn(q, reply, viewer, 'history');
      const turn = makeTurn(q);
      return { ...turn, shown: turn.answer, status: 'done' as const };
    }),
  };
}

/**
 * How an action shows on this page (2026-11-26: the chat is the agent; the other two alignment versions
 * were dropped):
 *   live      a request asked here: the agent's steps and confirm cards.
 *   history   a past chat, or a chat handed over from the agent's drawer: the same cards, finished.
 */
export type AgentView = 'live' | 'history';

/** A turn the agent answers. The text blocks stream like any answer; the cards land once it's done. */
export function agentTurn(question: string, reply: AgentReply, viewer: ViewerKey, view: AgentView = 'live'): Turn {
  const text = reply.blocks
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
    /* A past turn arrives finished: there is nothing to stream. */
    ...(view === 'history' ? { status: 'done' as const, shown: text } : {}),
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
}: {
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
            {`Worked for ${steps.length * 2}s`} · {steps.length} {steps.length === 1 ? 'step' : 'steps'}
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
